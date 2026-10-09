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
    // التطبيق يولّد الرمز بترميز base64 "آمن للروابط" (- و _ بدل + و /)
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
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


// ============================================================
// ===== نظام الدرجات وملف الطالب وتقرير ولي الأمر =====
// ============================================================
export const TOPIC_TITLES = ["أسلوب العلم", "حل المشكلات بطريقة علمية", "المحاليل والذائبية (المادة النقية والمخاليط)", "المركبات الجزيئية (الروابط التساهمية والأيونية)", "الذائبية", "المحاليل (التشبع والتركيز)", "المحاليل الحمضية", "المحاليل القاعدية", "الرقم الهيدروجيني PH", "المادة وحالاتها", "الحرارة وتحولات المادة", "التغيرات بين الحالات الصلبة والسائلة والغازية", "سلوك الموائع (الضغط)", "التغير في ضغط الغاز", "الطفو والانغمار", "مبدأ باسكال", "الطاقة", "تحولات الطاقة", "توليد الطاقة الكهربائية", "الدم والدورة الدموية", "الجهاز الدوري والجهاز اللمفي", "المناعة والمرض", "الجهاز الهضمي والتغذية", "المواد الغذائية", "جهاز التنفس", "جهاز الإخراج", "المرض عبر التاريخ"];

// رقم الطالب: يوحّد الأرقام العربية (١٨ -> 18) ويحذف المسافات والأصفار البادئة
export function normalizeNumber(raw) {
  if (raw === null || raw === undefined) return "";
  const s = arabicIndicToWestern(String(raw)).replace(/\s+/g, "");
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  return s;
}

// مفتاح سجل الطالب: الفصل الموحّد + رقمه (مثال: 2-6_18)
export function recKey(cls, number) {
  const c = canonicalizeClass(cls || "").replace(/\//g, "-");
  return c + "_" + normalizeNumber(number);
}

// رمز ولي الأمر: 6 خانات بحروف وأرقام غير ملتبسة
export function generatePin() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint32Array(6);
  (globalThis.crypto || window.crypto).getRandomValues(arr);
  return Array.from(arr, n => alphabet[n % alphabet.length]).join("");
}

export const DEFAULT_GRADING = {
  testMax: 10,        // درجة الاختبار
  hwMax: 10,          // درجة الواجبات
  partMax: 10,        // درجة المشاركة
  taskMax: 20,        // درجة الأداء المهامي
  scoredTopics: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // المواضيع المحسوبة بالدرجات
  topicPoints: {},    // تعديل يدوي لدرجة كل موضوع (اختياري)
  currentTask: { title: "", autoFullOnSubmit: true },
  showBehaviorToParents: true
};

export function normalizeGrading(g) {
  const d = JSON.parse(JSON.stringify(DEFAULT_GRADING));
  const out = Object.assign(d, g || {});
  out.currentTask = Object.assign({ title: "", autoFullOnSubmit: true }, (g && g.currentTask) || {});
  out.topicPoints = (g && g.topicPoints) || {};
  out.scoredTopics = ((g && g.scoredTopics) || DEFAULT_GRADING.scoredTopics).map(Number).sort((a, b) => a - b);
  return out;
}

const r1 = n => Math.round(n * 100) / 100;

// درجة موضوع في الاختبار: التعديل اليدوي إن وُجد، وإلا توزيع متساوٍ
export function topicTestPoints(grading, i) {
  const custom = grading.topicPoints[i];
  if (custom !== undefined && custom !== null && custom !== "") return Number(custom) || 0;
  const n = grading.scoredTopics.length;
  return n ? r1(grading.testMax / n) : 0;
}

// يحسب تقرير الطالب كاملاً
// mastered/attempted: مصفوفات أرقام مواضيع  |  record: سجل المعلم  |  taskDelivered: هل سلّم المهمة
export function computeReport({ grading, mastered, attempted, record, taskDelivered }) {
  const g = normalizeGrading(grading);
  const M = new Set((mastered || []).map(Number));
  const A = new Set((attempted || []).map(Number));
  const rec = record || {};
  const n = g.scoredTopics.length;
  const hwShare = n ? r1(g.hwMax / n) : 0;

  let testScore = 0, hwScore = 0, masteredCount = 0;
  const topics = g.scoredTopics.map(i => {
    const pts = topicTestPoints(g, i);
    let status = "none";
    if (M.has(i)) status = "mastered";
    else if (A.has(i)) status = "attempted";
    if (status === "mastered") { testScore += pts; hwScore += hwShare; masteredCount++; }
    return { i, title: TOPIC_TITLES[i] || ("موضوع " + i), status, testPts: pts, hwPts: hwShare };
  });
  testScore = Math.min(r1(testScore), g.testMax);
  hwScore = Math.min(r1(hwScore), g.hwMax);

  const part = (rec.participation === undefined || rec.participation === null || rec.participation === "")
    ? null : Math.min(Number(rec.participation) || 0, g.partMax);

  let task = null, taskStatus = "لم يسلم";
  if (rec.taskScore !== undefined && rec.taskScore !== null && rec.taskScore !== "") {
    task = Math.min(Number(rec.taskScore) || 0, g.taskMax);
    taskStatus = "تم التقييم";
  } else if (taskDelivered) {
    taskStatus = "تم التسليم";
    if (g.currentTask.autoFullOnSubmit) task = g.taskMax;
  }

  const total = r1(testScore + hwScore + (part || 0) + (task || 0));
  const max = g.testMax + g.hwMax + g.partMax + g.taskMax;
  return {
    topics, masteredCount, requiredCount: n,
    scores: { testScore, testMax: g.testMax, hwScore, hwMax: g.hwMax, part, partMax: g.partMax, task, taskMax: g.taskMax, taskStatus, total, max }
  };
}
