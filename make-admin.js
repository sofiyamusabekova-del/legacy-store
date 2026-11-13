// Создаёт хэш пароля администратора и секрет сессии для .env
// Запуск:  node make-admin.js "ваш-пароль"
const crypto = require("crypto");
const { hashPassword } = require("./api/_auth");

const password = process.argv[2];
if (!password || password.length < 8) {
  console.log('Укажите пароль не короче 8 символов: node make-admin.js "ваш-пароль"');
  process.exit(1);
}
console.log("\nСкопируйте эти строки в .env (и в переменные окружения на хостинге):\n");
console.log("ADMIN_LOGIN=admin");
console.log("ADMIN_PASSWORD_HASH=" + hashPassword(password));
console.log("SESSION_SECRET=" + crypto.randomBytes(32).toString("hex"));
console.log("\nПароль в .env не хранится, только его хэш. После изменения .env перезапустите сервер.");
