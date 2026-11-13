// Авторизация администратора: пароль (scrypt-хэш), подписанная сессия в httpOnly-cookie, защита от перебора.
// Переменные окружения: ADMIN_LOGIN, ADMIN_PASSWORD_HASH (получить: node make-admin.js "пароль"), SESSION_SECRET.
const crypto = require("crypto");

const COOKIE = "legacy_admin";
const TTL = 8 * 3600 * 1000; // сессия живёт 8 часов
const MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000;

let devSecret = null;
const secret = () => process.env.SESSION_SECRET || (devSecret ??= crypto.randomBytes(32).toString("hex"));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function checkPassword(password, stored) {
  const [alg, salt, hash] = String(stored).split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = crypto.scryptSync(password, salt, 64), b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Локальная разработка без настроенного пароля: временная учётная запись (на Vercel её нет).
const DEV = { login: "admin", password: "legacy-admin" };
let devHash = null;
function credentials() {
  if (process.env.ADMIN_PASSWORD_HASH) return { login: process.env.ADMIN_LOGIN || "admin", hash: process.env.ADMIN_PASSWORD_HASH, dev: false };
  if (process.env.VERCEL) return null;
  return { login: DEV.login, hash: (devHash ??= hashPassword(DEV.password)), dev: true };
}

const sign = payload => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${crypto.createHmac("sha256", secret()).update(body).digest("base64url")}`;
};

function verify(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const good = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map(c => c.trim().split(/=(.*)/s).slice(0, 2)).filter(p => p[0]));
}

const session = req => verify(parseCookies(req)[COOKIE]);

function cookieHeader(req, token, maxAge) {
  const secure = String(req.headers["x-forwarded-proto"] || "").includes("https") || process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

const fails = new Map();
const ipOf = req => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();

async function login(req, loginName, password) {
  const ip = ipOf(req), rec = fails.get(ip) || { n: 0, until: 0 };
  if (rec.until > Date.now()) return { ok: false, error: "locked", retryIn: Math.ceil((rec.until - Date.now()) / 60000) };
  const cred = credentials();
  const ok = cred && String(loginName) === cred.login && checkPassword(String(password), cred.hash);
  if (!ok) {
    rec.n += 1;
    if (rec.n >= MAX_FAILS) { rec.until = Date.now() + LOCK_MS; rec.n = 0; }
    fails.set(ip, rec);
    await new Promise(r => setTimeout(r, 500)); // замедляем перебор
    return { ok: false, error: cred ? "bad_credentials" : "not_configured" };
  }
  fails.delete(ip);
  return { ok: true, dev: cred.dev, token: sign({ u: cred.login, exp: Date.now() + TTL }) };
}

module.exports = { hashPassword, login, session, cookieHeader, COOKIE, credentials, DEV };
