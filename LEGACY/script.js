
const RATE = 12600;
const products = [
 {id:"blazer-noir",name:"Blazer Noir",cat:"Blazers",price:120,img:"https://images.squarespace-cdn.com/content/v1/66d0facdcef9941096017acb/6ecf51ec-5168-4c6c-b2ef-7c33091e7b60/mango%2Bstraight%2Bsuit%2Bjacket%2Bwith%2Blapel%2Bpockets%2Bzara%2Bblazer%2Bkhaite%2Bblazer%2Bthe%2Brow%2Bblazer%2Bluminary%2Bmothers%2Bcapsule%2Bwardrobe%2Bideas%2B2026%2Balice%2Bcodford%2Bstyle%2Bpicks.png",desc:"A sharp pinstripe blazer with a relaxed shoulder and refined tailoring. Designed for effortless city dressing."},
 {id:"wide-denim",name:"Wide Denim",cat:"Denim",price:80,img:"https://static.lvrcdn.com/content/uploads/2025/03/diary/slider-2-jeans-gamba-larga.jpg?impolicy=bocontent&imwidth=1500",desc:"Dark wide-leg denim with a generous silhouette and structured fall. A modern everyday essential."},
 {id:"minimal-top",name:"Minimal Top",cat:"Tops",price:45,img:"https://i.pinimg.com/originals/97/14/4f/97144f5db73c5dff2f1c3f28ea356517.jpg",desc:"A clean black fitted top with a soft neckline. Minimal, versatile and made for layering."},
 {id:"legacy-suit",name:"Legacy Suit",cat:"Suits",price:190,img:"images/legacy-editorial-01.jpg",desc:"A monochrome tailored set inspired by classic menswear and contemporary proportions."},
 {id:"urban-set",name:"Urban Set",cat:"Sets",price:150,img:"images/legacy-editorial-02.jpg",desc:"A relaxed black city uniform combining understated tailoring with an easy street silhouette."},
 {id:"evening-bag",name:"Evening Bag",cat:"Accessories",price:95,img:"images/evening-bag-final.jpg",desc:"A compact black shoulder bag with a sculptural silhouette and polished hardware."}
];
let currency = localStorage.getItem("legacyCurrency") || "USD";
let cart = JSON.parse(localStorage.getItem("legacyCart") || "[]");

function money(v){return currency==="USD" ? "$"+v.toFixed(0) : new Intl.NumberFormat("ru-RU").format(v*RATE)+" сум";}
function setCurrency(){
 document.querySelectorAll("#currencyToggle").forEach(b=>b.textContent=currency==="USD"?"USD / UZS":"UZS / USD");
 document.querySelectorAll("[data-price]").forEach(el=>el.textContent=money(Number(el.dataset.price)));
}
function save(){localStorage.setItem("legacyCart",JSON.stringify(cart));renderCount();}
function renderCount(){let n=cart.reduce((s,x)=>s+x.qty,0);document.querySelectorAll("#cartCount").forEach(x=>x.textContent=n);}
function toast(msg){let t=document.querySelector(".toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function addToCart(id){let x=cart.find(i=>i.id===id);x?x.qty++:cart.push({id,qty:1});save();toast("Added to bag");}
function productCard(p){return `<article class="product-card" data-cat="${p.cat}" onclick="location.href='product.html?id=${p.id}'"><span class="badge">${p.cat}</span><img class="product-img" src="${p.img}" alt="${p.name}"><div class="product-info"><div><h3>${p.name}</h3><p>${p.desc.slice(0,58)}…</p></div><span class="price" data-price="${p.price}">${money(p.price)}</span></div></article>`}
function renderProducts(target, limit=99){
 let el=document.querySelector(target); if(!el)return;
 el.innerHTML=products.slice(0,limit).map(productCard).join("");setCurrency();
}
function initProduct(){
 let id=new URLSearchParams(location.search).get("id")||"blazer-noir";let p=products.find(x=>x.id===id)||products[0];
 let el=document.querySelector("#productDetail"); if(!el)return;
 el.innerHTML=`<div><img src="${p.img}" alt="${p.name}"></div><div class="detail-copy"><div class="eyebrow">${p.cat}</div><h1>${p.name}</h1><p>${p.desc}</p><div class="big-price" data-price="${p.price}">${money(p.price)}</div><div class="eyebrow">Select size</div><div class="sizes">${["XS","S","M","L","XL"].map((s,i)=>`<button class="size ${i===2?"active":""}">${s}</button>`).join("")}</div><button class="btn dark wide" onclick="addToCart('${p.id}')">Add to bag</button></div>`;setCurrency();
}
function initCatalog(){
 renderProducts("#catalogGrid");
 document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
   document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
   let cat=btn.dataset.cat;document.querySelectorAll("#catalogGrid .product-card").forEach(c=>c.style.display=(cat==="All"||c.dataset.cat===cat)?"":"none");
 }));
}
function initCart(){
 let el=document.querySelector("#cartList");if(!el)return;
 if(!cart.length){el.innerHTML='<div class="empty">Your bag is empty.<br><a href="catalog.html" class="btn" style="margin-top:20px">Explore collection</a></div>';document.querySelector("#cartTotal").textContent="";return}
 el.innerHTML=cart.map(item=>{let p=products.find(x=>x.id===item.id);return `<div class="cart-row"><img src="${p.img}" alt="${p.name}"><div><h3>${p.name}</h3><p>${p.cat}</p></div><div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button><span>${item.qty}</span><button onclick="changeQty('${p.id}',1)">+</button></div><strong data-price="${p.price*item.qty}">${money(p.price*item.qty)}</strong><button class="remove" onclick="removeItem('${p.id}')" style="border:0;background:none;cursor:pointer">Remove</button></div>`}).join("");
 let total=cart.reduce((s,x)=>s+(products.find(p=>p.id===x.id).price*x.qty),0);document.querySelector("#cartTotal").dataset.price=total;setCurrency();
}
function changeQty(id,d){let x=cart.find(i=>i.id===id);x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);save();initCart()}
function removeItem(id){cart=cart.filter(i=>i.id!==id);save();initCart()}
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll("#currencyToggle").forEach(b=>b.addEventListener("click",()=>{currency=currency==="USD"?"UZS":"USD";localStorage.setItem("legacyCurrency",currency);setCurrency();if(document.querySelector("#cartList"))initCart()}));
 document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".nav").classList.toggle("open"));
 renderCount();setCurrency();renderProducts("#featuredGrid",6);initCatalog();initProduct();initCart();
 document.querySelector("#contactForm")?.addEventListener("submit",e=>{e.preventDefault();toast("Thank you — we will contact you soon.");e.target.reset()});
});
