// Данные магазина. Это запасные (исходные) данные: если сервер доступен, витрина при загрузке подменяет их
// актуальными из базы через applyCatalog() (см. конец файла и js/api.js).
export let RATE = 12600; // 1 USD = 12 600 сум (на сервере меняется в настройках)
export const LANGS = ["ru", "en", "uz"];
export const DEFAULT_LANG = "ru";

// Все товары. Витрина показывает только те, у которых нет `draft: true` (см. ниже).
// Все фото лежат в папке images/ (загружены владельцем магазина).
const catalog = [
  {
    id: "blazer-noir", cat: "Blazers", price: 85,
    img: "images/blazer-noir.webp", pos: "center 20%",
    name: { ru: "Блейзер Noir", en: "Blazer Noir", uz: "Blazer Noir" },
    desc: {
      ru: "Строгий блейзер в тонкую полоску со свободной линией плеча и выверенным кроем. Создан для непринуждённого городского стиля.",
      en: "A sharp pinstripe blazer with a relaxed shoulder and refined tailoring. Designed for effortless city dressing.",
      uz: "Erkin yelka chizig'i va puxta tikuvga ega nafis chiziqli blazer. Shahar uchun beozor uslubda yaratilgan."
    }
  },
  {
    id: "legacy-suit", cat: "Sets", price: 135,
    img: "images/legacy-editorial-01.jpg",
    name: { ru: "Костюм Legacy", en: "Legacy Suit", uz: "Legacy kostyumi" },
    desc: {
      ru: "Монохромный костюмный комплект, вдохновлённый классической мужской модой и современными пропорциями.",
      en: "A monochrome tailored set inspired by classic menswear and contemporary proportions.",
      uz: "Klassik erkaklar modasi va zamonaviy proporsiyalardan ilhomlangan monoxrom kostyum to'plami."
    }
  },
  {
    id: "urban-set", cat: "Sets", price: 105,
    img: "images/legacy-editorial-02.jpg",
    name: { ru: "Городской комплект", en: "Urban Set", uz: "Shahar to'plami" },
    desc: {
      ru: "Свободный чёрный городской комплект: сдержанный крой и лёгкий уличный силуэт.",
      en: "A relaxed black city uniform combining understated tailoring with an easy street silhouette.",
      uz: "Erkin qora shahar to'plami: sodda tikuv va yengil ko'cha silueti uyg'unligi."
    }
  },
  {
    id: "evening-bag", cat: "Accessories", price: 65,
    img: "images/evening-bag-final.jpg",
    name: { ru: "Вечерняя сумка", en: "Evening Bag", uz: "Kechki sumka" },
    desc: {
      ru: "Компактная чёрная сумка на плечо со скульптурным силуэтом и полированной фурнитурой.",
      en: "A compact black shoulder bag with a sculptural silhouette and polished hardware.",
      uz: "Haykalsimon siluetli va sayqallangan furniturali ixcham qora yelka sumkasi."
    }
  },
  {
    id: "admiral-set", cat: "Sets", price: 145, img: "images/admiral-set.jpg", pos: "center 20%",
    name: { ru: "Комплект Admiral", en: "Admiral Set", uz: "Admiral to'plami" },
    desc: {
      ru: "Укороченный двубортный жакет с серебристыми военными пуговицами и фактурными манжетами в паре с широкими потёртыми джинсами с панелями на коленях. Строгий верх и свободный низ.",
      en: "A cropped double-breasted jacket with silver military buttons and pleated cuffs, paired with wide washed denim with paneled knees. Structured on top, relaxed below.",
      uz: "Kumush rangli harbiy tugmalar va burmali manjetli qisqa ikki qatorli jaket hamda tizzasida panelli keng yuvilgan jinsi. Tepasi qat'iy, pastki qismi erkin."
    }
  },
  {
    id: "ivory-off-shoulder-knit", cat: "Knitwear", price: 45, img: "images/ivory-off-shoulder-knit.jpg", fit: "contain",
    name: { ru: "Трикотаж Ivory с открытым плечом", en: "Ivory Off-Shoulder Knit", uz: "Ivory ochiq yelkali trikotaj" },
    desc: {
      ru: "Мягкий трикотаж цвета слоновой кости с асимметричным вырезом на одно плечо и свободными спущенными рукавами. Тёплый, лёгкий и непринуждённо женственный.",
      en: "A soft ivory knit with an asymmetric off-the-shoulder neckline and relaxed dropped sleeves. Warm, light and effortlessly feminine.",
      uz: "Bir yelkasi ochiq assimetrik yoqali, erkin tushgan yengli yumshoq fil suyagi rangidagi trikotaj. Issiq, yengil va beozor nafis."
    }
  },
  {
    id: "clasp-bomber", cat: "Outerwear", price: 100, img: "images/clasp-bomber.jpg",
    name: { ru: "Бомбер с застёжками", en: "Clasp Bomber", uz: "Qisqichli bomber" },
    desc: {
      ru: "Короткий чёрный бомбер из шерстяной смеси с классическим воротником и полированными металлическими застёжками поверх молнии. Утилитарная деталь и чистый силуэт.",
      en: "A short black wool-blend bomber with a classic collar and polished metal clasps over the zip. A utilitarian detail with a clean outline.",
      uz: "Klassik yoqali, zamok ustidan sayqallangan metall qisqichli qisqa qora jun aralash bomber. Utilitar detal va toza siluet."
    }
  },
  {
    id: "knit-platform-boots", cat: "Shoes", price: 90, img: "images/knit-platform-boots.jpg",
    name: { ru: "Сапоги на платформе с вязаным голенищем", en: "Knit Platform Boots", uz: "Trikotaj qo'njli platforma etigi" },
    desc: {
      ru: "Чёрные сапоги на платформе со скульптурным устойчивым каблуком и ребристым вязаным голенищем, которое красиво собирается складками. Смелый архитектурный акцент для монохромного образа.",
      en: "Black platform boots with a sculptural block heel and a ribbed knit shaft that folds and slouches. A bold, architectural finish for a monochrome look.",
      uz: "Haykalsimon ustun poshnali va burmalanuvchi qovurg'ali trikotaj qo'njli qora platforma etigi. Monoxrom obrazga jasur arxitektura urg'usi."
    }
  },
  {
    id: "pinstripe-blazer", cat: "Blazers", price: 110, img: "images/pinstripe-blazer.jpg",
    name: { ru: "Структурный блейзер в полоску", en: "Structured Pinstripe Blazer", uz: "Tuzilmali chiziqli blazer" },
    desc: {
      ru: "Двубортный блейзер в тонкую полоску с подчёркнутыми плечами и приталенным силуэтом. Чёткий крой, который лучше всего смотрится поверх белоснежной рубашки.",
      en: "A double-breasted pinstripe blazer with strong shoulders and a nipped waist. Sharp tailoring that reads best layered over a crisp white shirt.",
      uz: "Kuchli yelkali va belda tortilgan ikki qatorli chiziqli blazer. Oq ko'ylak ustidan eng yaxshi ko'rinadigan aniq tikuv."
    }
  },
  {
    id: "foldover-boots", cat: "Shoes", price: 85, img: "images/foldover-boots.jpg",
    name: { ru: "Сапоги с отворотом", en: "Fold-Over Boots", uz: "Buklama qo'njli etik" },
    desc: {
      ru: "Чёрные сапоги до колена с отворотом, острым носом и ремешком с золотистым замком. Гладкий силуэт и боковая молния для удобства.",
      en: "Knee-high black boots with a fold-over shaft, a pointed toe and a gold turn-lock strap. A sleek silhouette with a side zip for easy wear.",
      uz: "Tizzagacha qora etik: buklama qo'nj, o'tkir burun va tilla rangli qulfli tasma. Silliq siluet va qulay yon zamok."
    }
  },
  {
    id: "parade-set", cat: "Sets", price: 155, img: "images/parade-set.jpg", pos: "center 30%",
    name: { ru: "Комплект Parade", en: "Parade Set", uz: "Parade to'plami" },
    desc: {
      ru: "Приталенный жакет на молнии с военной тесьмой и серебристыми пуговицами, из-под манжет выглядывает кружево. В комплекте расклешённые брюки с высокой посадкой. Романтично и строго одновременно.",
      en: "A fitted zip jacket with military braiding and silver buttons, lace cuffs peeking out, worn with high-rise flared trousers. Romantic and severe at once.",
      uz: "Harbiy to'qimali tasma va kumush tugmali, yengidan to'r ko'rinib turgan bichimli zamokli jaket, baland belli kengaygan shim bilan. Ham romantik, ham qat'iy."
    }
  },
  {
    id: "indigo-denim-set", cat: "Denim", price: 140, img: "images/indigo-denim-set.jpg", pos: "center 20%",
    name: { ru: "Деним-комплект Indigo", en: "Indigo Denim Set", uz: "Indigo jinsi to'plami" },
    desc: {
      ru: "Тёмный индиго-деним: асимметричная куртка со стойкой и контрастной строчкой в комплекте с широкими джинсами с изогнутыми швами.",
      en: "Raw dark indigo denim: an asymmetric jacket with a stand collar and contrast topstitching, matched with wide curved-seam jeans.",
      uz: "To'q indigo jinsi: tik yoqali va kontrast tikuvli assimetrik kurtka hamda egri chokli keng jinsi."
    }
  },
  {
    id: "cape-flare-set", cat: "Sets", price: 120, img: "images/cape-flare-set.jpg", pos: "center 25%",
    name: { ru: "Комплект Cape & Flare", en: "Cape & Flare Set", uz: "Cape & Flare to'plami" },
    desc: {
      ru: "Чёрный драпированный топ-накидка с присборенной талией и кружевной отделкой и расклешённые брюки с низкой посадкой. Вытянутая линия от плеча до подола.",
      en: "A draped black cape top with a ruched waist and lace trim, worn with low-slung flared trousers. One long line from shoulder to hem.",
      uz: "Belida burmalari va to'r bezagi bor qora drapirovkali pelerina-top hamda past belli kengaygan shim. Yelkadan etakkacha cho'zilgan chiziq."
    }
  },
  {
    id: "washed-zip-hoodie", cat: "Outerwear", price: 65, img: "images/washed-zip-hoodie.jpg",
    name: { ru: "Худи на молнии Washed", en: "Washed Zip Hoodie", uz: "Washed zamokli xudi" },
    desc: {
      ru: "Объёмное худи на молнии цвета выбеленного графита с плотной фактурой, тональной вышивкой и подкладкой капюшона с принтом флага.",
      en: "A boxy washed-grey zip hoodie with a heavy hand feel, tonal embroidered graphic and a flag-print lining inside the hood.",
      uz: "Zich to'qimali, yuvilgan kulrang, ohangdosh kashtali va kapyushon ichida bayroq bosma astarli keng zamokli xudi."
    }
  },
  {
    id: "pleated-wide-trousers", cat: "Trousers", price: 65, img: "images/pleated-wide-trousers.jpg",
    name: { ru: "Оверсайз-брюки со складками", en: "Oversized Pleated Trousers", uz: "Burmali oversayz shim" },
    desc: {
      ru: "Сверхширокие серые брюки с глубокими складками, шнурками и открытой резинкой на поясе. Объём ложится тяжёлыми скульптурными складками.",
      en: "Extra-wide grey trousers with deep front pleats, drawstring ties and an exposed elastic waistband. Volume that falls in heavy, sculptural folds.",
      uz: "Chuqur burmali, bog'ichli va ochiq rezinkali belbog'li juda keng kulrang shim. Hajm og'ir, haykalsimon burmalar bo'lib tushadi."
    }
  },
  {
    id: "grill-graphic-tee", cat: "Tops", price: 30, img: "images/grill-graphic-tee.jpg", fit: "contain",
    name: { ru: "Футболка с принтом Grill", en: "Grill Graphic Tee", uz: "Grill bosmali futbolka" },
    desc: {
      ru: "Бокси-футболка выбеленного чёрного цвета с крупным монохромным принтом. Плотный хлопок, эффект потёртости, свободная посадка.",
      en: "A boxy washed-black tee with an oversized monochrome print. Heavy cotton, faded wash, made to be worn loose.",
      uz: "Yirik monoxrom bosmali yuvilgan qora keng futbolka. Zich paxta, eskirgan effekt, erkin kiyish uchun."
    }
  },
  {
    id: "grey-foldover-knit", cat: "Knitwear", price: 50, img: "images/grey-foldover-knit.jpg",
    name: { ru: "Серый трикотаж с объёмным воротом", en: "Fold-Over Knit Grey", uz: "Buklama yoqali kulrang trikotaj" },
    desc: {
      ru: "Графитовый трикотаж с глубоким отворотом горловины, спущенным с плеч. Мягкая фактура, уют и слегка укороченная длина.",
      en: "A charcoal knit with a deep fold-over neckline that sits off the shoulders. Brushed, cosy, with a gently cropped body.",
      uz: "Yelkadan tushadigan chuqur buklama yoqali grafit rangli trikotaj. Yumshoq to'qima, qulaylik va biroz qisqa uzunlik."
    }
  },

  /* ---- Новые товары по фото владельца ---- */
  {
    id: "pinstripe-buckle-skirt", cat: "Skirts", price: 40, img: "images/0f97d4d8fa771fab9f374d96b39c2b60.jpg", fit: "contain",
    name: { ru: "Мини-юбка в полоску с ремешками", en: "Pinstripe Buckle Mini Skirt", uz: "Chiziqli tasmali mini yubka" },
    desc: {
      ru: "Чёрная плиссированная мини-юбка в тонкую белую полоску с широким поясом и двумя ремешками с серебристыми пряжками сбоку. Дерзкая школьная классика с характером.",
      en: "A black pleated mini skirt in a fine white pinstripe with a wide waistband and two side straps with silver buckles. Schoolgirl tailoring with an edge.",
      uz: "Ingichka oq chiziqli, keng belbog'li va yon tomonida kumush tokali ikkita tasmali qora burmali mini yubka. Xarakterli maktab klassikasi."
    }
  },
  {
    id: "pointed-stiletto-boots", cat: "Shoes", price: 100, img: "images/52a3ff21c04bb65ad906c9f4d2cc36af.jpg", fit: "contain",
    name: { ru: "Ботильоны на шпильке с острым носом", en: "Pointed Stiletto Boots", uz: "O'tkir burunli shpilkali botilonlar" },
    desc: {
      ru: "Чёрные ботильоны из гладкой кожи с вытянутым острым носком, тонкой шпилькой и боковой молнией. Графичная линия, которая удлиняет ногу.",
      en: "Black ankle boots in smooth leather with an elongated pointed toe, a slim stiletto heel and a side zip. A graphic line that lengthens the leg.",
      uz: "Silliq charmdan tikilgan, cho'zilgan o'tkir burunli, ingichka shpilkali va yon zamokli qora botilonlar. Oyoqni cho'zadigan grafik chiziq."
    }
  },
  {
    id: "cropped-biker-jacket", cat: "Outerwear", price: 105, img: "images/6b81afc2643a4b21a01c3d9d7f342dee.jpg", fit: "contain",
    name: { ru: "Укороченная косуха", en: "Cropped Biker Jacket", uz: "Qisqa biker kurtka" },
    desc: {
      ru: "Приталенная укороченная косуха из гладкой чёрной эко-кожи со стойкой на кнопках, молнией по центру и двумя карманами на молниях. Чёткий силуэт и острый характер.",
      en: "A fitted, cropped biker jacket in smooth black faux leather with a snap-tab stand collar, a centre zip and two zipped chest pockets. A sharp line with real attitude.",
      uz: "Silliq qora eko-teridan tikilgan, tugmali tik yoqali, markaziy zamokli va ikkita zamokli ko'krak cho'ntakli bichimli qisqa biker kurtka. Aniq siluet va o'tkir xarakter."
    }
  },
  {
    id: "mohair-midi-skirt", cat: "Skirts", price: 55, img: "images/8770ad1b2b737e2a6df4cf2d3f4b1b5e.jpg", pos: "center 45%",
    name: { ru: "Мохеровая юбка миди", en: "Mohair Midi Skirt", uz: "Moher midi yubka" },
    desc: {
      ru: "Тёплая юбка миди молочного цвета из пушистого мохера в рубчик с мягко подвёрнутым поясом. Красиво смотрится с чёрным ремнём и высокими сапогами.",
      en: "A warm milk-white midi skirt in fuzzy ribbed mohair with a softly folded waistband. Looks best with a black belt and tall boots.",
      uz: "Mayin qovurg'ali tukli moherdan tikilgan, belbog'i yumshoq buklangan iliq sutrang midi yubka. Qora kamar va baland etik bilan ayniqsa chiroyli."
    }
  },
  {
    id: "grey-belted-wool-coat", cat: "Outerwear", price: 160, img: "images/9406d5e742951f52184618b23df68c9f.jpg", pos: "center 30%",
    name: { ru: "Серое пальто с поясом", en: "Grey Belted Wool Coat", uz: "Belbog'li kulrang palto" },
    desc: {
      ru: "Длинное серое пальто из мягкой шерсти с высокой стойкой, рукавами реглан и поясом. Свободный объём и тёплая фактура для холодных дней.",
      en: "A long grey coat in soft brushed wool with a high stand collar, raglan sleeves and a tie belt. Relaxed volume and a warm texture for cold days.",
      uz: "Baland tik yoqali, reglan yengli va belbog'li yumshoq jundan tikilgan uzun kulrang palto. Sovuq kunlar uchun erkin hajm va iliq to'qima."
    }
  },
  {
    id: "glossy-hobo-bag", cat: "Accessories", price: 50, img: "images/b1a07acfa6977097303695c1dbf1eb18.jpg", fit: "contain",
    name: { ru: "Глянцевая сумка-хобо", en: "Glossy Hobo Bag", uz: "Yaltiroq xobo sumka" },
    desc: {
      ru: "Мягкая чёрная сумка-хобо с глянцевым покрытием и одной округлой ручкой. Компактная форма, которая помещается под мышкой.",
      en: "A soft black hobo bag with a glossy finish and a single rounded handle. A compact shape that tucks right under the arm.",
      uz: "Yaltiroq qoplamali va bitta yumaloq tutqichli yumshoq qora xobo sumka. Qo'ltiq ostiga qulay joylashadigan ixcham shakl."
    }
  },
  {
    id: "raw-indigo-wide-jeans", cat: "Denim", price: 60, img: "images/b1c19c219a80a87a00676dfb31fac9e7.jpg", pos: "center 30%",
    name: { ru: "Широкие джинсы Raw Indigo", en: "Raw Indigo Wide Jeans", uz: "Raw Indigo keng jinsi" },
    desc: {
      ru: "Джинсы из тёмного необработанного индиго с низкой посадкой, широкой штаниной и контрастной светлой строчкой. Падают свободно до самого пола.",
      en: "Low-rise jeans in dark raw indigo with a wide leg and contrast pale topstitching. They fall loose all the way to the floor.",
      uz: "To'q xom indigodan tikilgan past belli, keng oyoqli va kontrast och tikuvli jinsi. Polgacha erkin tushadi."
    }
  },
  {
    id: "belted-cocoon-jacket", cat: "Outerwear", price: 140, img: "images/b5d3ec59637316eecebd0b1eeb5e07dd.jpg", pos: "center 35%",
    name: { ru: "Куртка-кокон с поясом", en: "Belted Cocoon Jacket", uz: "Belbog'li kokon kurtka" },
    desc: {
      ru: "Короткая чёрная шерстяная куртка с высоким воротом, объёмными рукавами и поясом на талии. Клетчатая подкладка выглядывает из карманов и подола.",
      en: "A short black wool jacket with a high collar, balloon sleeves and a belted waist. A checked lining peeks out from the pockets and hem.",
      uz: "Baland yoqali, hajmli yengli va belida belbog'i bor qisqa qora jun kurtka. Katak astar cho'ntak va etakdan ko'rinib turadi."
    }
  },
  {
    id: "white-lace-top", cat: "Tops", price: 30, img: "images/c41370b9a3034dbcbe6243bfdd6b4654.jpg", fit: "contain",
    name: { ru: "Белый топ с кружевом", en: "White Lace Top", uz: "To'rli oq top" },
    desc: {
      ru: "Приталенный белый топ с квадратным вырезом, расклешёнными рукавами и кружевной отделкой по горловине и подолу. Нежный и женственный.",
      en: "A fitted white top with a square neckline, flared sleeves and lace trim at the neckline and hem. Delicate and feminine.",
      uz: "To'rtburchak yoqali, kengaygan yengli, yoqasi va etagi to'r bilan bezatilgan bichimli oq top. Nafis va ayolona."
    }
  },
  {
    id: "black-lace-top", cat: "Tops", price: 30, img: "images/ce71add8af54290fa0e94fb861abb117.jpg", fit: "contain",
    name: { ru: "Чёрный топ с кружевом", en: "Black Lace Top", uz: "To'rli qora top" },
    desc: {
      ru: "Облегающий чёрный топ в рубчик с квадратным вырезом, длинными рукавами и тонкой кружевной каймой. Основа для многослойных образов.",
      en: "A close-fitting black ribbed top with a square neckline, long sleeves and a fine lace edge. A base for layered looks.",
      uz: "To'rtburchak yoqali, uzun yengli va ingichka to'r hoshiyali qovurg'ali qora ensiz top. Qatlamli obrazlar uchun asos."
    }
  },
  {
    id: "military-zip-jacket", cat: "Blazers", price: 135, img: "images/d42a4ca4f64a20dac579a2f8d4d2647f.jpg", fit: "contain",
    name: { ru: "Жакет в военном стиле", en: "Military Zip Jacket", uz: "Harbiy uslubdagi jaket" },
    desc: {
      ru: "Приталенный чёрный жакет с высокой стойкой, погонами, накладными карманами с клапанами и потайной молнией. Строгие плечи и узкая талия.",
      en: "A fitted black jacket with a high stand collar, epaulettes, flap patch pockets and a concealed zip. Strong shoulders and a narrow waist.",
      uz: "Baland tik yoqali, pogonli, qopqoqli ustki cho'ntakli va yashirin zamokli bichimli qora jaket. Kuchli yelkalar va ingichka bel."
    }
  },
  {
    id: "long-handle-flap-bag", cat: "Accessories", price: 85, img: "images/d7ee7675d829e60eee8a662536155801.jpg", fit: "contain",
    name: { ru: "Сумка с длинными ручками", en: "Long-Handle Flap Bag", uz: "Uzun tutqichli qopqoqli sumka" },
    desc: {
      ru: "Структурная чёрная кожаная сумка с клапаном, прошитой кромкой и двумя длинными округлыми ручками. Строгая форма на каждый день.",
      en: "A structured black leather bag with a flap, stitched edge and two long rounded handles. A clean everyday shape.",
      uz: "Qopqoqli, tikilgan chetli va ikkita uzun yumaloq tutqichli tuzilmali qora charm sumka. Har kun uchun aniq shakl."
    }
  },
  {
    id: "fur-collar-bomber", cat: "Outerwear", price: 180, img: "images/db8953f2c239baf3499302d6637f0da7.jpg", fit: "contain",
    name: { ru: "Бомбер с меховым воротником", en: "Fur-Collar Bomber", uz: "Mo'ynali yoqali bomber" },
    desc: {
      ru: "Оверсайз-бомбер цвета мокко с пышным меховым воротником, кожаными накладками на плечах, асимметричной молнией и ремешком на резинке по подолу.",
      en: "An oversized mocha bomber with a plush fur collar, leather shoulder tabs, an asymmetric zip and a buckled strap at the elasticated hem.",
      uz: "Mo'ynali yirik yoqali, yelkasida charm nakladkali, assimetrik zamokli va etagida tasmali rezinkasi bor mokko rangidagi hajmli bomber."
    }
  },
  {
    id: "washed-leather-racer", cat: "Outerwear", price: 135, img: "images/dc3030669b5900347ee2c55f1f898c90.jpg", pos: "center 25%",
    name: { ru: "Кожаная куртка Washed Racer", en: "Washed Leather Racer Jacket", uz: "Washed Racer charm kurtka" },
    desc: {
      ru: "Укороченная куртка из состаренной кожи с эффектом потёртости, стойкой на кнопке и молнией по центру. Винтажный характер и приталенный крой.",
      en: "A cropped jacket in distressed leather with a worn-in finish, a snap stand collar and a centre zip. Vintage character, fitted cut.",
      uz: "Eskirgan effektli teridan tikilgan, tugmali tik yoqali va markaziy zamokli qisqa kurtka. Vintaj xarakter va bichimli kesim."
    }
  },
  {
    id: "fur-lapel-bomber-set", cat: "Sets", price: 195, img: "images/df58b96a68eb7807d1e652177e0fa35d.jpg", pos: "center 40%",
    name: { ru: "Комплект с бомбером и мехом", en: "Fur-Lapel Bomber Set", uz: "Mo'ynali bomber to'plami" },
    desc: {
      ru: "Объёмный чёрный бомбер с широкими меховыми лацканами и свободные широкие брюки цвета тауп. Тёплый комплект с богатой фактурой.",
      en: "An oversized black bomber with wide fur lapels and loose wide-leg trousers in taupe. A warm set with rich texture.",
      uz: "Keng mo'ynali yoqali hajmli qora bomber va taupe rangidagi erkin keng shim. Boy to'qimali iliq to'plam."
    }
  },
  {
    id: "double-strap-baguette-bag", cat: "Accessories", price: 45, img: "images/f8f6a0a3b7116541c79eb1b74325015b.jpg", fit: "contain",
    name: { ru: "Сумка-багет с двойной ручкой", en: "Double-Strap Baguette Bag", uz: "Qo'sh tutqichli baget sumka" },
    desc: {
      ru: "Узкая чёрная сумка-багет с двумя тонкими ручками и маленьким ремешком с пряжкой. Лёгкая форма на плечо.",
      en: "A slim black baguette bag with two thin straps and a small buckled belt detail. A light shape for the shoulder.",
      uz: "Ikkita ingichka tutqichli va kichik tokali tasmali tor qora baget sumka. Yelkaga mos yengil shakl."
    }
  },
  {
    id: "mohair-maxi-skirt", cat: "Skirts", price: 65, img: "images/f9625d63b23fdf2ab935df3ba33303a1.jpg", pos: "center 55%",
    name: { ru: "Мохеровая юбка макси", en: "Mohair Maxi Skirt", uz: "Moher maksi yubka" },
    desc: {
      ru: "Длинная юбка-русалка из пушистого мохера в рубчик с низкой посадкой и тёмным кожаным ремнём. Вытянутый силуэт до самого пола.",
      en: "A long ribbed mohair mermaid skirt with a low waist and a dark leather belt. A lengthened silhouette that reaches the floor.",
      uz: "Past belli va to'q charm kamarli, qovurg'ali tukli moherdan tikilgan uzun baliqsimon yubka. Polgacha cho'zilgan siluet."
    }
  },
  {
    id: "double-breasted-leather-jacket", cat: "Outerwear", price: 175, img: "images/fe94e81082dbb50dbafd8c34dccdfdda.jpg", pos: "center 40%",
    name: { ru: "Двубортная кожаная куртка", en: "Double-Breasted Leather Jacket", uz: "Ikki qatorli charm kurtka" },
    desc: {
      ru: "Приталенная двубортная куртка из мягкой чёрной кожи с воротником-стойкой и рядами серебристых пуговиц. Военная строгость и точная посадка.",
      en: "A fitted double-breasted jacket in soft black leather with a stand collar and rows of silver buttons. Military severity and a precise fit.",
      uz: "Tik yoqali va kumush tugmalar qatorli yumshoq qora charmdan tikilgan bichimli ikki qatorli kurtka. Harbiy qat'iylik va aniq o'tirish."
    }
  },
  {
    id: "ivory-vneck-flare-top", cat: "Tops", price: 35, img: "images/ivory-vneck-flare-top.jpg", pos: "center 30%",
    name: { ru: "Топ Ivory с V-вырезом", en: "Ivory V-Neck Flare Top", uz: "Ivory V-yoqali kengaygan top" },
    desc: {
      ru: "Приталенный топ цвета слоновой кости с глубоким V-вырезом и широкими расклешёнными рукавами со спущенной линией плеча. Мягкий трикотаж и женственный силуэт.",
      en: "A fitted ivory top with a deep V-neck and wide flared sleeves on a dropped shoulder. Soft jersey and a feminine silhouette.",
      uz: "Chuqur V-yoqali, tushgan yelkali va keng kengaygan yengli bichimli fil suyagi rangidagi top. Yumshoq trikotaj va ayolona siluet."
    }
  },
  {
    id: "black-scarf-knit-top", cat: "Knitwear", price: 50, img: "images/black-scarf-knit-top.jpg", fit: "contain",
    name: { ru: "Чёрный джемпер с шарфом", en: "Black Scarf-Neck Knit", uz: "Sharfli qora jemper" },
    desc: {
      ru: "Чёрный трикотажный джемпер с открытым плечом, рукавами «летучая мышь» и широкими манжетами. Тонкий шарф-петля вокруг шеи спускается вдоль груди.",
      en: "A black knit jumper with an off-the-shoulder neckline, batwing sleeves and ribbed cuffs. A slim scarf loop wraps the neck and falls down the chest.",
      uz: "Ochiq yelkali, ko'rshapalak yengli va qovurg'ali manjetli qora trikotaj jemper. Bo'yniga o'raladigan ingichka sharf ko'krak bo'ylab tushadi."
    }
  },
  {
    id: "lace-corset-satin-skirt", cat: "Skirts", price: 65, img: "images/lace-corset-satin-skirt.jpg", fit: "contain",
    name: { ru: "Атласная юбка с кружевным корсетом", en: "Lace Corset Satin Skirt", uz: "To'r korsetli atlas yubka" },
    desc: {
      ru: "Длинная чёрная атласная юбка прямого кроя с драпировкой на бёдрах и кружевным корсетным поясом. Сдержанная линия и романтичная деталь.",
      en: "A long black satin maxi skirt with draping at the hip and a lace corset waistband. A restrained line with a romantic detail.",
      uz: "Sonida drapirovkali va to'r korsetli belbog'li uzun qora atlas yubka. Vazmin chiziq va romantik detal."
    }
  },
  {
    id: "patent-slingback-heels", cat: "Shoes", price: 75, img: "images/patent-slingback-heels.jpg", fit: "contain",
    name: { ru: "Лакированные туфли со спинкой-ремешком", en: "Patent Slingback Heels", uz: "Laklangan slingbek tuflilar" },
    desc: {
      ru: "Чёрные лакированные туфли-лодочки с острым носом, открытой пяткой с ремешком и тонким каблуком средней высоты. Зеркальный блеск и чистая линия.",
      en: "Black patent pointed-toe slingbacks with an open heel strap and a slim mid-height heel. Mirror shine and a clean line.",
      uz: "O'tkir burunli, ochiq tovonli tasmali va o'rtacha ingichka poshnali qora laklangan tuflilar. Oynadek yaltiroqlik va aniq chiziq."
    }
  },
  {
    id: "military-denim-jacket", cat: "Outerwear", price: 105, img: "images/military-denim-jacket.jpg", fit: "contain",
    name: { ru: "Джинсовая куртка в военном стиле", en: "Military Denim Jacket", uz: "Harbiy uslubdagi jinsi kurtka" },
    desc: {
      ru: "Укороченная куртка из выбеленного чёрного денима с воротником-стойкой, погонами и рядами тесьмы с металлическими пуговицами. Парадный стиль в уличном исполнении.",
      en: "A cropped jacket in washed black denim with a stand collar, epaulettes and rows of braiding with metal buttons. Parade-ground dress in a street cut.",
      uz: "Yuvilgan qora jinsidan tikilgan, tik yoqali, pogonli va metall tugmali tasma qatorlari bor qisqa kurtka. Ko'cha uslubidagi tantanali libos."
    }
  },
  {
    id: "military-button-jeans", cat: "Denim", price: 70, img: "images/military-button-jeans.jpg", pos: "center 40%",
    name: { ru: "Джинсы Military", en: "Military Jeans", uz: "Military jinsi" },
    desc: {
      ru: "Выбеленные графитовые джинсы с низкой посадкой и широкой штаниной. Ряды тесьмы с металлическими пуговицами на передних карманах отсылают к парадной форме.",
      en: "Washed graphite jeans with a low rise and a wide leg. Rows of braiding with metal buttons on the front pockets nod to parade uniform.",
      uz: "Past belli va keng oyoqli yuvilgan grafit rangli jinsi. Old cho'ntaklardagi metall tugmali tasma qatorlari tantanali formani eslatadi."
    }
  },
  {
    id: "faded-grey-wide-jeans", cat: "Denim", price: 55, img: "images/faded-grey-wide-jeans.jpg", pos: "center 40%",
    name: { ru: "Выбеленные серые джинсы", en: "Faded Grey Wide Jeans", uz: "Yuvilgan kulrang keng jinsi" },
    desc: {
      ru: "Свободные джинсы с низкой посадкой в серой выбеленной стирке с лёгкими потёртостями. Широкая прямая штанина падает до самой земли.",
      en: "Relaxed low-rise jeans in a faded grey wash with soft whiskering. A wide straight leg that falls all the way to the ground.",
      uz: "Past belli, yengil eskirish izli kulrang yuvilgan erkin jinsi. Keng to'g'ri oyoq yergacha tushadi."
    }
  },
  {
    id: "dry-indigo-ultra-wide-jeans", cat: "Denim", price: 70, img: "images/dry-indigo-ultra-wide-jeans.jpg", fit: "contain",
    name: { ru: "Ультраширокие джинсы Dry Indigo", en: "Dry Indigo Ultra-Wide Jeans", uz: "Dry Indigo juda keng jinsi" },
    desc: {
      ru: "Плотный необработанный индиго-деним с высокой посадкой и сильно расширенной штаниной, контрастная оранжевая строчка. Чистая линия и структурный объём.",
      en: "Heavy dry indigo denim with a high rise and a dramatically wide leg, finished with orange contrast stitching. A clean line with structured volume.",
      uz: "Baland belli va juda keng oyoqli, to'q sariq kontrast tikuvli zich xom indigo jinsi. Toza chiziq va tuzilmali hajm."
    }
  }
];

// Порядок категорий в фильтре каталога (пустые категории скрываются автоматически)
export const CATEGORIES = ["Blazers", "Outerwear", "Dresses", "Tops", "Knitwear", "Denim", "Trousers", "Skirts", "Sets", "Shoes", "Accessories"];

/* ---------- Коллекции ---------- */
// cover — id товара, чьё фото используется как обложка коллекции.
export const COLLECTIONS = [
  {
    id: "essentials", cover: "ivory-vneck-flare-top",
    name: { ru: "Essentials", en: "Essentials", uz: "Essentials" },
    desc: {
      ru: "Базовые вещи на каждый день: топы, трикотаж, прямые брюки и джинсы. Спокойные цвета и чистые линии, на которых строится весь гардероб.",
      en: "Everyday foundations: tops, knitwear, clean trousers and denim. Quiet colours and clean lines that the whole wardrobe is built on.",
      uz: "Har kungi bazaviy kiyimlar: toplar, trikotaj, to'g'ri shimlar va jinsi. Butun garderob tayanadigan sokin ranglar va toza chiziqlar."
    }
  },
  {
    id: "tailoring", cover: "pinstripe-blazer",
    name: { ru: "Tailoring", en: "Tailoring", uz: "Tailoring" },
    desc: {
      ru: "Строгий крой: блейзеры, жакеты в военном стиле, костюмные комплекты. Подчёркнутые плечи, узкая талия, выверенные детали.",
      en: "Sharp tailoring: blazers, military-cut jackets and suit sets. Strong shoulders, narrow waists and considered details.",
      uz: "Qat'iy tikuv: blazerlar, harbiy uslubdagi jaketlar va kostyum to'plamlari. Kuchli yelkalar, ingichka bel va puxta detallar."
    }
  },
  {
    id: "urban", cover: "washed-leather-racer",
    name: { ru: "Urban", en: "Urban", uz: "Urban" },
    desc: {
      ru: "Городской streetwear: косухи, бомберы, деним и худи. Свободные силуэты, потёртые фактуры и уличный характер.",
      en: "City streetwear: biker jackets, bombers, denim and hoodies. Relaxed silhouettes, worn textures and street attitude.",
      uz: "Shahar streetwear'i: biker kurtkalar, bomberlar, jinsi va xudilar. Erkin siluetlar, eskirgan to'qimalar va ko'cha xarakteri."
    }
  },
  {
    id: "evening", cover: "mohair-maxi-skirt",
    name: { ru: "Evening", en: "Evening", uz: "Evening" },
    desc: {
      ru: "Вечерний выход: атлас, кружево, шпильки и компактные сумки. Романтика, спрятанная в чёрном.",
      en: "After-dark dressing: satin, lace, stilettos and compact bags. Romance tucked into black.",
      uz: "Kechki chiqish: atlas, to'r, shpilkalar va ixcham sumkalar. Qora rangga yashiringan romantika."
    }
  },
  {
    id: "winter", cover: "grey-belted-wool-coat",
    name: { ru: "Capsule FW", en: "Capsule FW", uz: "Capsule FW" },
    desc: {
      ru: "Капсула на холодный сезон: шерстяные пальто, куртки с мехом и мохер. Тёплые фактуры и объёмные силуэты.",
      en: "A cold-season capsule: wool coats, fur-trimmed jackets and mohair. Warm textures and generous silhouettes.",
      uz: "Sovuq fasl kapsulasi: jun paltolar, mo'ynali kurtkalar va moher. Iliq to'qimalar va hajmli siluetlar."
    }
  }
];

/* ---------- Мета-данные товаров ---------- */
// c — коллекция, col — цвета, pop — «Хит», stock — остаток на складе,
// sales / views — стартовые счётчики (просмотры дальше растут в localStorage).
const META = {
  "blazer-noir":                    { c: "tailoring",  col: ["black", "grey"],     pop: 1, stock: 8,  sales: 34, views: 820 },
  "legacy-suit":                    { c: "tailoring",  col: ["black", "white"],    stock: 6,  sales: 9,  views: 240 },
  "urban-set":                      { c: "urban",      col: ["black"],             stock: 7,  sales: 11, views: 260 },
  "evening-bag":                    { c: "evening",    col: ["black"],             pop: 1, stock: 12, sales: 26, views: 610 },
  "admiral-set":                    { c: "tailoring",  col: ["black", "indigo"],   stock: 4,  sales: 7,  views: 190 },
  "ivory-off-shoulder-knit":        { c: "essentials", col: ["ivory"],             stock: 9,  sales: 12, views: 280 },
  "clasp-bomber":                   { c: "urban",      col: ["black"],             stock: 5,  sales: 14, views: 330 },
  "knit-platform-boots":            { c: "urban",      col: ["black"],             stock: 3,  sales: 10, views: 300 },
  "pinstripe-blazer":               { c: "tailoring",  col: ["black", "white"],    stock: 6,  sales: 15, views: 370 },
  "foldover-boots":                 { c: "evening",    col: ["black"],             stock: 8,  sales: 13, views: 310 },
  "parade-set":                     { c: "tailoring",  col: ["black"],             stock: 3,  sales: 6,  views: 210 },
  "indigo-denim-set":               { c: "urban",      col: ["indigo"],            stock: 5,  sales: 8,  views: 230 },
  "cape-flare-set":                 { c: "evening",    col: ["black"],             stock: 4,  sales: 5,  views: 170 },
  "washed-zip-hoodie":              { c: "urban",      col: ["grey"],              stock: 14, sales: 18, views: 350 },
  "pleated-wide-trousers":          { c: "essentials", col: ["grey"],              stock: 10, sales: 8,  views: 190 },
  "grill-graphic-tee":              { c: "urban",      col: ["black"],             stock: 20, sales: 16, views: 280 },
  "grey-foldover-knit":             { c: "essentials", col: ["grey"],              stock: 9,  sales: 7,  views: 170 },
  "pinstripe-buckle-skirt":         { c: "urban",      col: ["black", "white"],    stock: 8,  sales: 12, views: 290 },
  "pointed-stiletto-boots":         { c: "evening",    col: ["black"],             pop: 1, stock: 7,  sales: 22, views: 540 },
  "cropped-biker-jacket":           { c: "urban",      col: ["black"],             pop: 1, stock: 6,  sales: 29, views: 700 },
  "mohair-midi-skirt":              { c: "winter",     col: ["ivory"],             stock: 5,  sales: 6,  views: 200 },
  "grey-belted-wool-coat":          { c: "winter",     col: ["grey"],              pop: 1, stock: 4,  sales: 21, views: 560 },
  "glossy-hobo-bag":                { c: "essentials", col: ["black"],             pop: 1, stock: 15, sales: 24, views: 480 },
  "raw-indigo-wide-jeans":          { c: "essentials", col: ["indigo"],            pop: 1, stock: 11, sales: 27, views: 520 },
  "belted-cocoon-jacket":           { c: "winter",     col: ["black"],             stock: 2,  sales: 9,  views: 260 },
  "white-lace-top":                 { c: "essentials", col: ["white"],             stock: 12, sales: 11, views: 240 },
  "black-lace-top":                 { c: "essentials", col: ["black"],             pop: 1, stock: 14, sales: 25, views: 470 },
  "military-zip-jacket":            { c: "tailoring",  col: ["black"],             stock: 5,  sales: 8,  views: 250 },
  "long-handle-flap-bag":           { c: "evening",    col: ["black"],             stock: 9,  sales: 10, views: 270 },
  "fur-collar-bomber":              { c: "winter",     col: ["brown"],             pop: 1, stock: 3,  sales: 19, views: 640 },
  "washed-leather-racer":           { c: "urban",      col: ["brown", "grey"],     stock: 5,  sales: 13, views: 380 },
  "fur-lapel-bomber-set":           { c: "winter",     col: ["black", "taupe"],    stock: 2,  sales: 7,  views: 340 },
  "double-strap-baguette-bag":      { c: "evening",    col: ["black"],             stock: 13, sales: 12, views: 300 },
  "mohair-maxi-skirt":              { c: "winter",     col: ["ivory"],             stock: 6,  sales: 9,  views: 320 },
  "double-breasted-leather-jacket": { c: "tailoring",  col: ["black"],             pop: 1, stock: 4,  sales: 23, views: 590 },
  "ivory-vneck-flare-top":          { c: "essentials", col: ["ivory"],             stock: 10, sales: 6,  views: 150 },
  "black-scarf-knit-top":           { c: "essentials", col: ["black"],             stock: 8,  sales: 5,  views: 140 },
  "lace-corset-satin-skirt":        { c: "evening",    col: ["black"],             stock: 7,  sales: 4,  views: 160 },
  "patent-slingback-heels":         { c: "evening",    col: ["black"],             stock: 9,  sales: 3,  views: 120 },
  "military-denim-jacket":          { c: "urban",      col: ["black"],             stock: 6,  sales: 2,  views: 110 },
  "military-button-jeans":          { c: "urban",      col: ["black", "grey"],     stock: 8,  sales: 2,  views: 100 },
  "faded-grey-wide-jeans":          { c: "essentials", col: ["grey"],              stock: 10, sales: 2,  views: 90 },
  "dry-indigo-ultra-wide-jeans":    { c: "essentials", col: ["indigo"],            stock: 7,  sales: 1,  views: 80 }
};

const SIZES = {
  Shoes: ["36", "37", "38", "39", "40"],
  Accessories: ["ONE"],
  default: ["XS", "S", "M", "L", "XL"]
};

// Дата добавления: порядок в каталоге = порядок появления, шаг 2 дня, последний товар — «сегодня» (9.11.2026).
const LAST_ADDED = Date.UTC(2026, 10, 9);
const addedFor = i => new Date(LAST_ADDED - (catalog.length - 1 - i) * 2 * 864e5).toISOString().slice(0, 10);

export const allProducts = catalog.map((p, i) => {
  const m = META[p.id] ?? {};
  return {
    collection: m.c ?? "essentials",
    colors: m.col ?? [],
    popular: Boolean(m.pop),
    stock: m.stock ?? 10,
    sales: m.sales ?? 0,
    views: m.views ?? 0,
    sizes: SIZES[p.cat] ?? SIZES.default,
    added: addedFor(i),
    ...p
  };
});
export const products = allProducts.filter(p => !p.draft);

/* ---------- Промокоды, доставка, оплата ---------- */
// percent — скидка в процентах, shipping — бесплатная доставка, min — минимальная сумма заказа (USD).
export const PROMOS = {
  LEGACY10: { type: "percent", value: 10 },
  WELCOME15: { type: "percent", value: 15, min: 100 },
  FREESHIP: { type: "shipping" }
};

// Способы доставки. price — стоимость в USD, названия и сроки лежат в i18n (delivery.<id>).
export const DELIVERY = [
  { id: "pickup", price: 0 },
  { id: "courier", price: 4 },
  { id: "regions", price: 8 }
];

export let FREE_SHIPPING_FROM = 150; // USD: от этой суммы (после скидки) доставка бесплатна
export const PAYMENTS = ["cash", "card"]; // способы оплаты; «stripe» добавляется, когда он настроен на сервере

export let CONTACTS = { phone: "", email: "legacy@studio.com", telegram: "", instagram: "" };
export let STRIPE_ENABLED = false;
export let CATALOG_VERSION = 0; // растёт при каждом обновлении каталога (по нему сбрасываются кэши)

// Подменяет данные витрины данными с сервера (массивы меняются на месте, чтобы все модули видели новое содержимое)
export function applyCatalog(c) {
  RATE = c.settings.rate;
  FREE_SHIPPING_FROM = c.settings.freeShippingFrom;
  CONTACTS = c.settings.contacts;
  STRIPE_ENABLED = Boolean(c.settings.stripeEnabled);
  CATEGORIES.splice(0, CATEGORIES.length, ...c.categories.map(x => x.id));
  COLLECTIONS.splice(0, COLLECTIONS.length, ...c.collections);
  DELIVERY.splice(0, DELIVERY.length, ...c.delivery.map(({ id, price }) => ({ id, price })));
  const list = c.products.map(p => ({ colors: [], popular: false, sales: 0, views: 0, ...p }));
  allProducts.splice(0, allProducts.length, ...list);
  products.splice(0, products.length, ...list);
  CATALOG_VERSION += 1;
}
