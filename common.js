// ============================================================
// إعدادات Firebase الخاصة بمشروعك
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyCx6sM4KaYXCXABxE9ieio_QhPDX-SP6xg",
  authDomain: "manhaj-science1.firebaseapp.com",
  projectId: "manhaj-science1",
  storageBucket: "manhaj-science1.firebasestorage.app",
  messagingSenderId: "275504808566",
  appId: "1:275504808566:web:16d3951b587e2727c9d557"
};

// ============================================================
// فك رمز الإنجاز (يدعم الصيغة القديمة والصيغة v3 الجديدة)
// الصيغة القديمة:  اسم|فصل|توقيت|صحيح|إجمالي|دقائق|          (base64).checksum
// الصيغة v3:       v3|اسم|فصل|رقم_الطالب|توقيت|صحيح|إجمالي|دقائق|[أبواب متقنة]  (base64).checksum
// ============================================================
export function decodeCode(raw) {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\s+/g, "");
  // بعض الأجهزة تولّد رمزًا بدون لاحقة التحقق (.xxxxxx) — نقبله وما نعتبره
  // رمزًا تالفًا، لأن التحقق (checksum) مجرد تلميح إضافي وليس شرطًا لفك الرمز
  const dotIdx = trimmed.lastIndexOf(".");
  const payload = dotIdx === -1 ? trimmed : trimmed.slice(0, dotIdx);
  const checksum = dotIdx === -1 ? "" : trimmed.slice(dotIdx + 1);

  let decodedText;
  try {
    let b64 = payload;
    while (b64.length % 4 !== 0) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    decodedText = new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    return null;
  }

  const parts = decodedText.split("|");
  if (parts.length < 5) return null;

  if (parts[0] === "v3") {
    return {
      version: "v3",
      name: parts[1] || "",
      cls: parts[2] || "",
      studentNumber: parts[3] || "",
      timestamp: parts[4] || "",
      correct: parseInt(parts[5] || "0", 10) || 0,
      total: parseInt(parts[6] || "0", 10) || 0,
      minutes: parseInt(parts[7] || "0", 10) || 0,
      mastered: parts[8] ? parts[8].split(",").filter(Boolean) : [],
      checksum,
      raw: trimmed
    };
  }

  // الصيغة القديمة: name|class|timestamp|correct|total|minutes|
  return {
    version: "v1",
    name: parts[0] || "",
    cls: parts[1] || "",
    studentNumber: "",
    timestamp: parts[2] || "",
    correct: parseInt(parts[3] || "0", 10) || 0,
    total: parseInt(parts[4] || "0", 10) || 0,
    minutes: parseInt(parts[5] || "0", 10) || 0,
    mastered: [],
    checksum,
    raw: trimmed
  };
}

// يحوّل التوقيت YYYYMMDDHHmm إلى صيغة مقروءة
export function formatTimestamp(ts) {
  if (!ts || ts.length < 12) return ts || "—";
  const y = ts.slice(0, 4), mo = ts.slice(4, 6), d = ts.slice(6, 8);
  const h = ts.slice(8, 10), mi = ts.slice(10, 12);
  return `${y}/${mo}/${d} ${h}:${mi}`;
}

// ============================================================
// توحيد صيغة الفصل المكتوب يدويًا (أرقام عربية/كلمات/فواصل مختلفة)
// إلى صيغة واحدة قياسية، حتى يتجمّع كل طلاب نفس الفصل تحت مسمى واحد
// أمثلة تتوحّد لنفس الناتج: "2/6"، "2 6"، "2-6"، "2 / 6"  →  "2/6"
//                           "٥" أو "خمسة"                 →  "5"
// ملاحظة: الترتيب كما كُتب لا يُقلب (2/4 يبقى مختلفًا عن 4/2) تفاديًا لدمج
// فصلين مختلفين فعليًا بالغلط؛ فقط اختلاف الفاصل/الأرقام العربية/الكلمات يُوحَّد
// ============================================================
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const AR_NUMBER_WORDS = {
  "صفر": "0",
  "واحد": "1", "أول": "1", "الأول": "1",
  "اثنان": "2", "اثنين": "2", "ثاني": "2", "الثاني": "2",
  "ثلاثة": "3", "ثلاث": "3", "ثالث": "3", "الثالث": "3",
  "أربعة": "4", "اربعة": "4", "أربع": "4", "اربع": "4", "رابع": "4", "الرابع": "4",
  "خمسة": "5", "خمس": "5", "خامس": "5", "الخامس": "5",
  "ستة": "6", "ست": "6", "سادس": "6", "السادس": "6",
  "سبعة": "7", "سبع": "7", "سابع": "7", "السابع": "7",
  "ثمانية": "8", "ثماني": "8", "تمانية": "8", "ثامن": "8", "الثامن": "8",
  "تسعة": "9", "تسع": "9", "تاسع": "9", "التاسع": "9",
  "عشرة": "10", "عشر": "10", "عاشر": "10", "العاشر": "10"
};

function arabicIndicToWestern(s) {
  return s.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));
}

// صيغة "ه" العامية بدل "ة" شائعة جدًا (سته، ثلاثه، خمسه...) — نضيفها تلقائيًا
Object.keys(AR_NUMBER_WORDS).forEach(w => {
  if (w.endsWith("ة")) AR_NUMBER_WORDS[w.slice(0, -1) + "ه"] = AR_NUMBER_WORDS[w];
});

function normalizeClassToken(tok) {
  const t = tok.trim();
  if (!t) return "";
  if (AR_NUMBER_WORDS[t]) return AR_NUMBER_WORDS[t];
  // وحّد أشكال الألف (أ/إ/آ) لحرف الشعبة حتى يتطابق "أ" المكتوبة بأي شكل
  return t.replace(/^[أإآ]$/u, "ا");
}

// هذا التطبيق خاص بصف واحد ثابت (الثاني متوسط) — فكل الطلاب "صفهم" نفس الرقم،
// والرقم/الحرف المختلف هو رقم الشعبة الحقيقي. هذا يحل مشكلة الترتيب المعكوس:
// إذا كتب الطالب "2/6" أو "6/2" نعرف مسبقًا أن "2" هو الصف الثابت، فنعيد ترتيبها
// دائمًا بنفس الشكل القياسي "2/6" بغض النظر عن ترتيب الكتابة.
const FIXED_GRADE = "2";

export function canonicalizeClass(raw) {
  if (!raw) return "";
  let s = arabicIndicToWestern(String(raw).trim());
  if (!s) return "";
  // كل الفواصل المحتملة (- أو فاصلة أو مسافات) تتحول لـ "/" واحد موحّد
  s = s.replace(/[\u060C\-]+/g, "/");
  s = s.replace(/\s*\/\s*/g, "/");
  s = s.replace(/\s+/g, "/");
  s = s.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  const parts = s.split("/").map(normalizeClassToken).filter(Boolean);

  if (parts.length === 1) {
    // رقم/حرف واحد بس = رقم الشعبة؛ الصف الثابت يُضاف تلقائيًا
    return parts[0] === FIXED_GRADE ? parts[0] : FIXED_GRADE + "/" + parts[0];
  }

  if (parts.length === 2) {
    const [a, b] = parts;
    if (a === FIXED_GRADE && b !== FIXED_GRADE) return FIXED_GRADE + "/" + b;
    if (b === FIXED_GRADE && a !== FIXED_GRADE) return FIXED_GRADE + "/" + a;
    // ما فيه "2" واضح بالطرفين (حالة نادرة) — رتّبها كما كُتبت بدون تخمين
    return parts.join("/");
  }

  return parts.join("/");
}

// هوية فريدة للطالب: رقم الطالب إن وجد، وإلا الاسم + الفصل
export function studentKey(decoded, fallbackClass) {
  const cls = canonicalizeClass(decoded.cls || fallbackClass || "");
  if (decoded.studentNumber) return `${cls}#${decoded.studentNumber}`;
  return `${cls}#${decoded.name}`;
}
