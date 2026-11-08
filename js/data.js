// Данные магазина. Позже (фаза 9) будут приходить из бэкенда.
export const RATE = 12600; // 1 USD = 12 600 сум
export const LANGS = ["ru", "en", "uz"];
export const DEFAULT_LANG = "ru";

// Все товары. Витрина показывает только те, у которых нет `draft: true` (см. ниже).
const catalog = [
  {
    id: "blazer-noir", cat: "Blazers", price: 120,
    img: "https://images.squarespace-cdn.com/content/v1/66d0facdcef9941096017acb/6ecf51ec-5168-4c6c-b2ef-7c33091e7b60/mango%2Bstraight%2Bsuit%2Bjacket%2Bwith%2Blapel%2Bpockets%2Bzara%2Bblazer%2Bkhaite%2Bblazer%2Bthe%2Brow%2Bblazer%2Bluminary%2Bmothers%2Bcapsule%2Bwardrobe%2Bideas%2B2026%2Balice%2Bcodford%2Bstyle%2Bpicks.png",
    name: { ru: "Блейзер Noir", en: "Blazer Noir", uz: "Blazer Noir" },
    desc: {
      ru: "Строгий блейзер в тонкую полоску со свободной линией плеча и выверенным кроем. Создан для непринуждённого городского стиля.",
      en: "A sharp pinstripe blazer with a relaxed shoulder and refined tailoring. Designed for effortless city dressing.",
      uz: "Erkin yelka chizig'i va puxta tikuvga ega nafis chiziqli blazer. Shahar uchun beozor uslubda yaratilgan."
    }
  },
  {
    id: "wide-denim", cat: "Denim", price: 80,
    img: "https://static.lvrcdn.com/content/uploads/2025/03/diary/slider-2-jeans-gamba-larga.jpg?impolicy=bocontent&imwidth=1500",
    name: { ru: "Широкий деним", en: "Wide Denim", uz: "Keng jinsi" },
    desc: {
      ru: "Тёмные джинсы с широкой штаниной, свободным силуэтом и чёткой посадкой. Современная базовая вещь на каждый день.",
      en: "Dark wide-leg denim with a generous silhouette and structured fall. A modern everyday essential.",
      uz: "Keng oyoqli to'q jinsi: erkin siluet va aniq tushish. Har kungi zamonaviy bazaviy kiyim."
    }
  },
  {
    id: "minimal-top", cat: "Tops", price: 45,
    img: "https://i.pinimg.com/originals/97/14/4f/97144f5db73c5dff2f1c3f28ea356517.jpg",
    name: { ru: "Минималистичный топ", en: "Minimal Top", uz: "Minimal top" },
    desc: {
      ru: "Чистый чёрный приталенный топ с мягкой горловиной. Минималистичный, универсальный, создан для многослойных образов.",
      en: "A clean black fitted top with a soft neckline. Minimal, versatile and made for layering.",
      uz: "Yumshoq yoqali toza qora ensiz top. Minimalistik, ko'p qirrali va qatlamli obrazlar uchun mos."
    }
  },
  {
    id: "legacy-suit", cat: "Suits", price: 190,
    img: "images/legacy-editorial-01.jpg",
    name: { ru: "Костюм Legacy", en: "Legacy Suit", uz: "Legacy kostyumi" },
    desc: {
      ru: "Монохромный костюмный комплект, вдохновлённый классической мужской модой и современными пропорциями.",
      en: "A monochrome tailored set inspired by classic menswear and contemporary proportions.",
      uz: "Klassik erkaklar modasi va zamonaviy proporsiyalardan ilhomlangan monoxrom kostyum to'plami."
    }
  },
  {
    id: "urban-set", cat: "Sets", price: 150,
    img: "images/legacy-editorial-02.jpg",
    name: { ru: "Городской комплект", en: "Urban Set", uz: "Shahar to'plami" },
    desc: {
      ru: "Свободный чёрный городской комплект: сдержанный крой и лёгкий уличный силуэт.",
      en: "A relaxed black city uniform combining understated tailoring with an easy street silhouette.",
      uz: "Erkin qora shahar to'plami: sodda tikuv va yengil ko'cha silueti uyg'unligi."
    }
  },
  {
    id: "evening-bag", cat: "Accessories", price: 95,
    img: "images/evening-bag-final.jpg",
    name: { ru: "Вечерняя сумка", en: "Evening Bag", uz: "Kechki sumka" },
    desc: {
      ru: "Компактная чёрная сумка на плечо со скульптурным силуэтом и полированной фурнитурой.",
      en: "A compact black shoulder bag with a sculptural silhouette and polished hardware.",
      uz: "Haykalsimon siluetli va sayqallangan furniturali ixcham qora yelka sumkasi."
    }
  },
  {
    id: "admiral-set", cat: "Sets", price: 210, img: "images/admiral-set.jpg", pos: "center 20%",
    name: { ru: "Комплект Admiral", en: "Admiral Set", uz: "Admiral to'plami" },
    desc: {
      ru: "Укороченный двубортный жакет с серебристыми военными пуговицами и фактурными манжетами в паре с широкими потёртыми джинсами с панелями на коленях. Строгий верх и свободный низ.",
      en: "A cropped double-breasted jacket with silver military buttons and pleated cuffs, paired with wide washed denim with paneled knees. Structured on top, relaxed below.",
      uz: "Kumush rangli harbiy tugmalar va burmali manjetli qisqa ikki qatorli jaket hamda tizzasida panelli keng yuvilgan jinsi. Tepasi qat'iy, pastki qismi erkin."
    }
  },
  {
    id: "ivory-off-shoulder-knit", cat: "Knitwear", price: 65, img: "images/ivory-off-shoulder-knit.jpg", fit: "contain",
    name: { ru: "Трикотаж Ivory с открытым плечом", en: "Ivory Off-Shoulder Knit", uz: "Ivory ochiq yelkali trikotaj" },
    desc: {
      ru: "Мягкий трикотаж цвета слоновой кости с асимметричным вырезом на одно плечо и свободными спущенными рукавами. Тёплый, лёгкий и непринуждённо женственный.",
      en: "A soft ivory knit with an asymmetric off-the-shoulder neckline and relaxed dropped sleeves. Warm, light and effortlessly feminine.",
      uz: "Bir yelkasi ochiq assimetrik yoqali, erkin tushgan yengli yumshoq fil suyagi rangidagi trikotaj. Issiq, yengil va beozor nafis."
    }
  },
  {
    id: "clasp-bomber", cat: "Outerwear", price: 140, img: "images/clasp-bomber.jpg",
    name: { ru: "Бомбер с застёжками", en: "Clasp Bomber", uz: "Qisqichli bomber" },
    desc: {
      ru: "Короткий чёрный бомбер из шерстяной смеси с классическим воротником и полированными металлическими застёжками поверх молнии. Утилитарная деталь и чистый силуэт.",
      en: "A short black wool-blend bomber with a classic collar and polished metal clasps over the zip. A utilitarian detail with a clean outline.",
      uz: "Klassik yoqali, zamok ustidan sayqallangan metall qisqichli qisqa qora jun aralash bomber. Utilitar detal va toza siluet."
    }
  },
  {
    id: "knit-platform-boots", cat: "Shoes", price: 130, img: "images/knit-platform-boots.jpg",
    name: { ru: "Сапоги на платформе с вязаным голенищем", en: "Knit Platform Boots", uz: "Trikotaj qo'njli platforma etigi" },
    desc: {
      ru: "Чёрные сапоги на платформе со скульптурным устойчивым каблуком и ребристым вязаным голенищем, которое красиво собирается складками. Смелый архитектурный акцент для монохромного образа.",
      en: "Black platform boots with a sculptural block heel and a ribbed knit shaft that folds and slouches. A bold, architectural finish for a monochrome look.",
      uz: "Haykalsimon ustun poshnali va burmalanuvchi qovurg'ali trikotaj qo'njli qora platforma etigi. Monoxrom obrazga jasur arxitektura urg'usi."
    }
  },
  {
    id: "pinstripe-blazer", cat: "Blazers", price: 160, img: "images/pinstripe-blazer.jpg",
    name: { ru: "Структурный блейзер в полоску", en: "Structured Pinstripe Blazer", uz: "Tuzilmali chiziqli blazer" },
    desc: {
      ru: "Двубортный блейзер в тонкую полоску с подчёркнутыми плечами и приталенным силуэтом. Чёткий крой, который лучше всего смотрится поверх белоснежной рубашки.",
      en: "A double-breasted pinstripe blazer with strong shoulders and a nipped waist. Sharp tailoring that reads best layered over a crisp white shirt.",
      uz: "Kuchli yelkali va belda tortilgan ikki qatorli chiziqli blazer. Oq ko'ylak ustidan eng yaxshi ko'rinadigan aniq tikuv."
    }
  },
  {
    id: "foldover-boots", cat: "Shoes", price: 120, img: "images/foldover-boots.jpg",
    name: { ru: "Сапоги с отворотом", en: "Fold-Over Boots", uz: "Buklama qo'njli etik" },
    desc: {
      ru: "Чёрные сапоги до колена с отворотом, острым носом и ремешком с золотистым замком. Гладкий силуэт и боковая молния для удобства.",
      en: "Knee-high black boots with a fold-over shaft, a pointed toe and a gold turn-lock strap. A sleek silhouette with a side zip for easy wear.",
      uz: "Tizzagacha qora etik: buklama qo'nj, o'tkir burun va tilla rangli qulfli tasma. Silliq siluet va qulay yon zamok."
    }
  },
  {
    id: "parade-set", cat: "Sets", price: 220, img: "images/parade-set.jpg", pos: "center 30%",
    name: { ru: "Комплект Parade", en: "Parade Set", uz: "Parade to'plami" },
    desc: {
      ru: "Приталенный жакет на молнии с военной тесьмой и серебристыми пуговицами, из-под манжет выглядывает кружево. В комплекте расклешённые брюки с высокой посадкой. Романтично и строго одновременно.",
      en: "A fitted zip jacket with military braiding and silver buttons, lace cuffs peeking out, worn with high-rise flared trousers. Romantic and severe at once.",
      uz: "Harbiy to'qimali tasma va kumush tugmali, yengidan to'r ko'rinib turgan bichimli zamokli jaket, baland belli kengaygan shim bilan. Ham romantik, ham qat'iy."
    }
  },
  {
    id: "indigo-denim-set", cat: "Denim", price: 200, img: "images/indigo-denim-set.jpg", pos: "center 20%",
    name: { ru: "Деним-комплект Indigo", en: "Indigo Denim Set", uz: "Indigo jinsi to'plami" },
    desc: {
      ru: "Тёмный индиго-деним: асимметричная куртка со стойкой и контрастной строчкой в комплекте с широкими джинсами с изогнутыми швами.",
      en: "Raw dark indigo denim: an asymmetric jacket with a stand collar and contrast topstitching, matched with wide curved-seam jeans.",
      uz: "To'q indigo jinsi: tik yoqali va kontrast tikuvli assimetrik kurtka hamda egri chokli keng jinsi."
    }
  },
  {
    id: "cape-flare-set", cat: "Sets", price: 170, img: "images/cape-flare-set.jpg", pos: "center 25%",
    name: { ru: "Комплект Cape & Flare", en: "Cape & Flare Set", uz: "Cape & Flare to'plami" },
    desc: {
      ru: "Чёрный драпированный топ-накидка с присборенной талией и кружевной отделкой и расклешённые брюки с низкой посадкой. Вытянутая линия от плеча до подола.",
      en: "A draped black cape top with a ruched waist and lace trim, worn with low-slung flared trousers. One long line from shoulder to hem.",
      uz: "Belida burmalari va to'r bezagi bor qora drapirovkali pelerina-top hamda past belli kengaygan shim. Yelkadan etakkacha cho'zilgan chiziq."
    }
  },
  {
    id: "washed-zip-hoodie", cat: "Outerwear", price: 95, img: "images/washed-zip-hoodie.jpg",
    name: { ru: "Худи на молнии Washed", en: "Washed Zip Hoodie", uz: "Washed zamokli xudi" },
    desc: {
      ru: "Объёмное худи на молнии цвета выбеленного графита с плотной фактурой, тональной вышивкой и подкладкой капюшона с принтом флага.",
      en: "A boxy washed-grey zip hoodie with a heavy hand feel, tonal embroidered graphic and a flag-print lining inside the hood.",
      uz: "Zich to'qimali, yuvilgan kulrang, ohangdosh kashtali va kapyushon ichida bayroq bosma astarli keng zamokli xudi."
    }
  },
  {
    id: "pleated-wide-trousers", cat: "Trousers", price: 90, img: "images/pleated-wide-trousers.jpg",
    name: { ru: "Оверсайз-брюки со складками", en: "Oversized Pleated Trousers", uz: "Burmali oversayz shim" },
    desc: {
      ru: "Сверхширокие серые брюки с глубокими складками, шнурками и открытой резинкой на поясе. Объём ложится тяжёлыми скульптурными складками.",
      en: "Extra-wide grey trousers with deep front pleats, drawstring ties and an exposed elastic waistband. Volume that falls in heavy, sculptural folds.",
      uz: "Chuqur burmali, bog'ichli va ochiq rezinkali belbog'li juda keng kulrang shim. Hajm og'ir, haykalsimon burmalar bo'lib tushadi."
    }
  },
  {
    id: "grill-graphic-tee", cat: "Tops", price: 40, img: "images/grill-graphic-tee.jpg", fit: "contain",
    name: { ru: "Футболка с принтом Grill", en: "Grill Graphic Tee", uz: "Grill bosmali futbolka" },
    desc: {
      ru: "Бокси-футболка выбеленного чёрного цвета с крупным монохромным принтом. Плотный хлопок, эффект потёртости, свободная посадка.",
      en: "A boxy washed-black tee with an oversized monochrome print. Heavy cotton, faded wash, made to be worn loose.",
      uz: "Yirik monoxrom bosmali yuvilgan qora keng futbolka. Zich paxta, eskirgan effekt, erkin kiyish uchun."
    }
  },
  {
    id: "grey-foldover-knit", cat: "Knitwear", price: 70, img: "images/grey-foldover-knit.jpg",
    name: { ru: "Серый трикотаж с объёмным воротом", en: "Fold-Over Knit Grey", uz: "Buklama yoqali kulrang trikotaj" },
    desc: {
      ru: "Графитовый трикотаж с глубоким отворотом горловины, спущенным с плеч. Мягкая фактура, уют и слегка укороченная длина.",
      en: "A charcoal knit with a deep fold-over neckline that sits off the shoulders. Brushed, cosy, with a gently cropped body.",
      uz: "Yelkadan tushadigan chuqur buklama yoqali grafit rangli trikotaj. Yumshoq to'qima, qulaylik va biroz qisqa uzunlik."
    }
  },

  /* ---- Черновики: товары готовы, ждут фото. Положи фото в images/<id>.jpg и удали строку draft ---- */
  {
    id: "cropped-biker-jacket", cat: "Outerwear", price: 180, img: "images/cropped-biker-jacket.jpg", draft: true,
    name: { ru: "Укороченная косуха", en: "Cropped Biker Jacket", uz: "Qisqa biker kurtka" },
    desc: {
      ru: "Укороченная чёрная косуха оверсайз с воротником, который застёгивается в стойку. Мягкая структура и острый характер.",
      en: "A cropped black biker jacket with an oversized shape and a collar that fastens into a funnel neck. Soft structure, sharp attitude.",
      uz: "Yoqasi tik bo'lib yopiladigan, hajmli qisqa qora biker kurtka. Yumshoq tuzilma, o'tkir xarakter."
    }
  },
  {
    id: "double-breasted-coat", cat: "Outerwear", price: 210, img: "images/double-breasted-coat.jpg", draft: true,
    name: { ru: "Двубортное пальто", en: "Double-Breasted Coat", uz: "Ikki qatorli palto" },
    desc: {
      ru: "Двубортное пальто оверсайз из шерстяной смеси с лацканами и пуговицами на манжетах. Чистая линия, под которую подходит любой слой.",
      en: "An oversized double-breasted coat in a wool blend with notched lapels and buttoned cuffs. A clean line that carries any layer beneath.",
      uz: "Jun aralash matodan, yoqali va manjetida tugmali hajmli ikki qatorli palto. Ostiga har qanday qatlam mos keladigan toza chiziq."
    }
  },
  {
    id: "maxi-wool-coat", cat: "Outerwear", price: 240, img: "images/maxi-wool-coat.jpg", draft: true,
    name: { ru: "Длинное пальто Maxi", en: "Maxi Wool Coat", uz: "Maxi jun palto" },
    desc: {
      ru: "Длинное чёрное пальто из шерсти с начёсом, широкими лацканами и прямым свободным кроем. Почти до щиколотки.",
      en: "A longline brushed-wool coat in black with wide lapels and a straight, relaxed fit. Falls almost to the ankle.",
      uz: "Keng yoqali, to'g'ri va erkin bichimli, cho'zilgan qora tukli jun palto. To'pig'iga yetadigan uzunlik."
    }
  },
  {
    id: "handmade-coat", cat: "Outerwear", price: 230, img: "images/handmade-coat.jpg", draft: true,
    name: { ru: "Пальто Handmade", en: "Handmade Oversized Coat", uz: "Handmade hajmli palto" },
    desc: {
      ru: "Объёмное шерстяное пальто с эффектом ручной работы, лацканами, боковыми карманами и разрезом сзади. Создано, чтобы драпироваться, а не облегать.",
      en: "An oversized wool coat with a hand-finished feel, lapels, side pockets and a vented back hem. Cut to drape, not to fit.",
      uz: "Qo'lda bitilgandek ko'rinadigan, yoqali, yon cho'ntakli va orqasida yoriqli hajmli jun palto. Qo'ndirish uchun emas, burmalanib tushish uchun."
    }
  },
  {
    id: "satin-slip-dress", cat: "Dresses", price: 85, img: "images/satin-slip-dress.jpg", draft: true,
    name: { ru: "Атласное платье-комбинация", en: "Satin Slip Dress", uz: "Atlas ko'ylak-kombinatsiya" },
    desc: {
      ru: "Чёрное атласное платье-комбинация миди с круглым вырезом, боковыми разрезами и косым кроем. Носится самостоятельно или поверх тонкого трикотажа.",
      en: "A black satin midi slip with a scoop neckline, side slits and a bias fall. Worn alone or over a fine knit.",
      uz: "Yumaloq yoqali, yon yoriqli va qiyshiq bichimli qora atlas midi ko'ylak. Yolg'iz yoki yupqa trikotaj ustidan kiyiladi."
    }
  },
  {
    id: "folded-shopper", cat: "Accessories", price: 110, img: "images/folded-shopper.jpg", draft: true,
    name: { ru: "Сумка-шоппер Folded", en: "Folded Shopper", uz: "Folded shopper sumka" },
    desc: {
      ru: "Минималистичный чёрный кожаный шоппер с чистой складчатой формой, регулируемым ремнём и магнитной застёжкой.",
      en: "A minimal black leather shopper with a clean folded shape, an adjustable shoulder strap and a magnetic closure.",
      uz: "Toza buklangan shaklli, sozlanadigan tasmali va magnitli qopqoqli minimalistik qora charm shopper."
    }
  },
  {
    id: "chain-shoulder-bag", cat: "Accessories", price: 80, img: "images/chain-shoulder-bag.jpg", draft: true,
    name: { ru: "Сумка на цепочке", en: "Chain Shoulder Bag", uz: "Zanjirli yelka sumkasi" },
    desc: {
      ru: "Компактная чёрная сумка на плечо с цепочкой. Достаточно маленькая для вечера и достаточно прочная на каждый день.",
      en: "A compact black shoulder bag on a chain strap. Small enough for the evening, sturdy enough for the day.",
      uz: "Zanjirli tasmali ixcham qora yelka sumkasi. Kechga yetarlicha kichik, kunduzga yetarlicha mustahkam."
    }
  },
  {
    id: "patent-shoulder-bag", cat: "Accessories", price: 75, img: "images/patent-shoulder-bag.jpg", draft: true,
    name: { ru: "Лакированная сумка", en: "Patent Shoulder Bag", uz: "Laklangan yelka sumkasi" },
    desc: {
      ru: "Глянцевая чёрная лакированная сумка простой лаконичной формы. Зеркальная поверхность — весь акцент.",
      en: "A glossy black patent shoulder bag with a sleek, simple shape. The mirror finish is the whole statement.",
      uz: "Oddiy va ixcham shaklli yaltiroq qora laklangan yelka sumkasi. Oynasimon sirt — butun urg'u."
    }
  },
  {
    id: "black-flared-trousers", cat: "Trousers", price: 75, img: "images/black-flared-trousers.jpg", draft: true,
    name: { ru: "Брюки-клёш", en: "Flared Trousers", uz: "Kengaygan shim" },
    desc: {
      ru: "Чёрные классические брюки с высокой посадкой и длинным клёшем от колена. Удлиняют ногу и сочетаются со всей коллекцией.",
      en: "Black tailored trousers with a high waist and a long flare from the knee. They lengthen the leg and pair with the whole collection.",
      uz: "Baland belli, tizzadan uzun kengayadigan qora klassik shim. Oyoqni cho'zadi va kolleksiyaning barcha buyumlari bilan uyg'unlashadi."
    }
  },
  {
    id: "pinstripe-trousers", cat: "Trousers", price: 85, img: "images/pinstripe-trousers.jpg", draft: true,
    name: { ru: "Брюки в тонкую полоску", en: "Pinstripe Trousers", uz: "Chiziqli shim" },
    desc: {
      ru: "Широкие брюки в тонкую полоску, скроенные в пару к нашему полосатому блейзеру. Носите как костюм или разделяйте комплект.",
      en: "Wide-leg trousers in a fine pinstripe, cut to match our pinstripe blazer. Wear as a suit or break the set apart.",
      uz: "Chiziqli blazerimizga juft qilib tikilgan ingichka chiziqli keng shim. Kostyum sifatida yoki alohida kiying."
    }
  },
  {
    id: "white-poplin-shirt", cat: "Tops", price: 55, img: "images/white-poplin-shirt.jpg", draft: true,
    name: { ru: "Белая рубашка оверсайз", en: "Crisp White Shirt", uz: "Oq oversayz ko'ylak" },
    desc: {
      ru: "Белая рубашка оверсайз из поплина с жёстким воротником и удлинённым подолом. Самый чёткий слой под чёрный блейзер.",
      en: "An oversized white poplin shirt with a stiff collar and a long shirttail hem. The sharpest layer under a black blazer.",
      uz: "Qattiq yoqali va cho'zilgan etakli oq poplin oversayz ko'ylak. Qora blazer ostidagi eng aniq qatlam."
    }
  },
  {
    id: "fine-knit-turtleneck", cat: "Knitwear", price: 50, img: "images/fine-knit-turtleneck.jpg", draft: true,
    name: { ru: "Тонкая водолазка", en: "Fine Knit Turtleneck", uz: "Yupqa vodolazka" },
    desc: {
      ru: "Чёрная водолазка тонкой вязки, плотно прилегающая к телу. Спокойная основа для любого многослойного образа.",
      en: "A fine-gauge black turtleneck that sits close to the body. The quiet base for every layered look.",
      uz: "Tanaga yopishib turadigan yupqa to'qimali qora vodolazka. Har qanday qatlamli obrazning sokin asosi."
    }
  },
  {
    id: "lace-trim-top", cat: "Tops", price: 45, img: "images/lace-trim-top.jpg", draft: true,
    name: { ru: "Топ с кружевом", en: "Lace Trim Top", uz: "To'rli top" },
    desc: {
      ru: "Приталенный чёрный топ с нежной кружевной отделкой. Мягкая романтика рядом с нашим строгим кроем.",
      en: "A fitted black top finished with delicate lace trim. Soft romance set against our harder tailoring.",
      uz: "Nafis to'r bezakli bichimli qora top. Qat'iy tikuvimiz yonida yumshoq romantika."
    }
  },
  {
    id: "slit-pencil-skirt", cat: "Skirts", price: 70, img: "images/slit-pencil-skirt.jpg", draft: true,
    name: { ru: "Юбка-карандаш с разрезом", en: "Slit Pencil Skirt", uz: "Yoriqli qalam yubka" },
    desc: {
      ru: "Чёрная юбка-карандаш из шерстяной смеси с разрезом сзади. Чёткая, узкая, создана в пару к блейзерам.",
      en: "A black wool-blend pencil skirt with a back slit. Sharp, narrow and made to sit under the blazers.",
      uz: "Orqasida yoriqli, jun aralash qora qalam yubka. Aniq, tor va blazerlar bilan juft qilib yaratilgan."
    }
  },
  {
    id: "black-trench", cat: "Outerwear", price: 170, img: "images/black-trench.jpg", draft: true,
    name: { ru: "Чёрный тренч", en: "Black Trench", uz: "Qora trench" },
    desc: {
      ru: "Чёрный тренч с поясом, выраженным плечом и длинной линией. Классика в тёмном исполнении.",
      en: "A belted black trench with a strong shoulder and a long line. A classic, darkened.",
      uz: "Belbog'li, kuchli yelkali va uzun chiziqli qora trench. Qorong'u ko'rinishdagi klassika."
    }
  },
  {
    id: "leather-gloves", cat: "Accessories", price: 35, img: "images/leather-gloves.jpg", draft: true,
    name: { ru: "Кожаные перчатки", en: "Leather Gloves", uz: "Charm qo'lqoplar" },
    desc: {
      ru: "Длинные чёрные кожаные перчатки, которые завершают образ с пальто или блейзером. Тонкие, мягкие, сдержанно драматичные.",
      en: "Long black leather gloves that finish a coat or a blazer. Slim, soft, quietly dramatic.",
      uz: "Palto yoki blazer obrazini yakunlaydigan uzun qora charm qo'lqoplar. Nozik, yumshoq va vazmin dramatik."
    }
  },
  {
    id: "statement-belt", cat: "Accessories", price: 40, img: "images/statement-belt.jpg", draft: true,
    name: { ru: "Ремень с серебряной пряжкой", en: "Statement Belt", uz: "Kumush tokali kamar" },
    desc: {
      ru: "Чёрный кожаный ремень с выразительной серебристой пряжкой. Подчёркивает талию пальто, рубашки или широких брюк.",
      en: "A black leather belt with a bold silver buckle. Cinches a coat, a shirt or a pair of wide trousers.",
      uz: "Ifodali kumush tokali qora charm kamar. Palto, ko'ylak yoki keng shimning belini ajratib turadi."
    }
  },
  {
    id: "slim-sunglasses", cat: "Accessories", price: 55, img: "images/slim-sunglasses.jpg", draft: true,
    name: { ru: "Узкие тёмные очки", en: "Slim Sunglasses", uz: "Tor qora ko'zoynak" },
    desc: {
      ru: "Узкие чёрные солнцезащитные очки с широкой обволакивающей формой. Финальная деталь, на которую опирается вся коллекция.",
      en: "Narrow black sunglasses with a wide, wraparound feel. The finishing detail the whole collection leans on.",
      uz: "Keng, o'rab turuvchi shaklli tor qora quyosh ko'zoynagi. Butun kolleksiya tayanadigan yakuniy detal."
    }
  }
];

// Порядок категорий в фильтре каталога
export const CATEGORIES = ["Blazers", "Outerwear", "Dresses", "Tops", "Knitwear", "Denim", "Trousers", "Skirts", "Suits", "Sets", "Shoes", "Accessories"];

export const allProducts = catalog;
export const products = catalog.filter(p => !p.draft);
