/* ملف إنجاز المعلم — وحدة ثابتة داخل التطبيق الرئيسي (بدون خادم)
   - البيانات في Firebase Firestore (للمعلم فقط عبر قواعد الحماية)
   - تُحمَّل هذه الوحدة عند فتح #portfolio فقط، فلا يحمّلها الطلاب
   تعتمد على دوال التطبيق: app, esc, render, getTeacherDb, adminLogin, adminLogout, ADMIN_EMAIL */
(function () {
  "use strict";

  // ---------------- المعايير الـ 11 لتقييم الأداء الوظيفي ----------------
  var STANDARDS = [
    { id: 1, title: "أداء الواجبات الوظيفية", weight: 10, examples: ["التقيد بالدوام الرسمي", "تأدية الحصص وفق الجدول", "الإشراف والمناوبة", "إعداد ومتابعة الدروس"],
      required: ["سجل الدوام", "سجل المناوبة والإشراف", "سجل الانتظار", "خطة توزيع المنهج"],
      keywords: ["دوام", "حضور", "غياب", "مناوبة", "إشراف", "انتظار", "جدول", "حصص", "دراسي"] },
    { id: 2, title: "التفاعل مع المجتمع", weight: 10, examples: ["مجتمعات التعلم المهنية", "تبادل الزيارات", "الدروس التطبيقية", "حضور الدورات"],
      required: ["سجل مجتمعات التعلم", "سجل تبادل الزيارات", "تقرير درس تطبيقي", "شهادات الدورات"],
      keywords: ["مجتمع", "تعلم", "مهني", "زيارة", "تبادل", "درس", "تطبيقي", "دورة", "ورشة", "تدريب"] },
    { id: 3, title: "التفاعل مع أولياء الأمور", weight: 10, examples: ["التواصل الفعال مع أولياء الأمور", "تزويدهم بمستويات الطلاب", "تفعيل الخطة الأسبوعية"],
      required: ["صور الجمعية العمومية", "تقرير اجتماع ولي الأمر", "الخطة الأسبوعية للمدرسة"],
      keywords: ["ولي", "أمر", "أولياء", "تواصل", "اجتماع", "جمعية", "عمومية", "مستوى", "طالب"] },
    { id: 4, title: "التنويع في استراتيجيات التدريس", weight: 10, examples: ["استخدام استراتيجيات متنوعة", "مراعاة الفروق الفردية"],
      required: ["تقرير تطبيق استراتيجية", "ملف إنجاز المعلم"],
      keywords: ["استراتيجية", "تدريس", "تنويع", "فروق", "فردية", "تعلم", "نشط", "تفاعلي", "تعاوني"] },
    { id: 5, title: "تحسين نتائج المتعلمين", weight: 10, examples: ["معالجة الفاقد التعليمي", "الخطط العلاجية", "الخطط الإثرائية", "تكريم المتميزين"],
      required: ["الاختبار القبلي والبعدي", "كشف متابعة الطلاب"],
      keywords: ["فاقد", "تعليمي", "علاجي", "إثرائي", "تحسين", "نتائج", "متميز", "ضعيف", "تكريم"] },
    { id: 6, title: "إعداد وتنفيذ خطة التعلم", weight: 10, examples: ["توزيع المنهج", "إعداد الدروس", "إعداد الواجبات والاختبارات"],
      required: ["خطة توزيع المنهج", "نموذج إعداد الدروس", "نماذج الواجبات والاختبارات"],
      keywords: ["منهج", "توزيع", "درس", "إعداد", "تحضير", "واجب", "اختبار", "خطة", "تعلم"] },
    { id: 7, title: "توظيف تقنيات ووسائل التعلم", weight: 10, examples: ["دمج التقنية في التعليم", "التنويع في الوسائل التعليمية"],
      required: ["صور الوسائل التعليمية", "تقرير برنامج تقني"],
      keywords: ["تقنية", "وسيلة", "تعليمية", "رقمي", "إلكتروني", "برنامج", "تطبيق", "حاسب", "جنيالي", "كانفا"] },
    { id: 8, title: "تهيئة البيئة التعليمية", weight: 5, examples: ["مراعاة حاجات الطلاب", "التهيئة النفسية", "التحفيز المادي والمعنوي"],
      required: ["تقرير تصنيف الطلاب حسب أنماط التعلم", "نماذج التحفيز"],
      keywords: ["بيئة", "تعليمية", "صفية", "تحفيز", "تهيئة", "نفسية", "أنماط", "تعلم", "حاجات"] },
    { id: 9, title: "الإدارة الصفية", weight: 5, examples: ["ضبط سلوك الطلاب", "متابعة الحضور والغياب", "مراعاة الفروق الفردية"],
      required: ["كشف المتابعة", "تطبيق إدارة الصف"],
      keywords: ["إدارة", "صف", "صفية", "سلوك", "ضبط", "حضور", "غياب", "تأخر", "انضباط"] },
    { id: 10, title: "تحليل نتائج المتعلمين", weight: 10, examples: ["تحليل نتائج الاختبارات", "تصنيف الطلاب", "تحديد نقاط القوة والضعف"],
      required: ["تقرير تحليل النتائج", "سجل معالجة الفاقد التعليمي"],
      keywords: ["تحليل", "نتائج", "اختبار", "تصنيف", "قوة", "ضعف", "مستوى", "تشخيص", "بيانات"] },
    { id: 11, title: "تنوع أساليب التقويم", weight: 10, examples: ["الاختبارات الورقية والإلكترونية", "المشاريع الطلابية", "المهام الأدائية", "ملفات إنجاز الطلاب"],
      required: ["نماذج اختبارات", "ملفات إنجاز الطلاب", "المهام الأدائية", "مشاريع الطلاب"],
      keywords: ["تقويم", "اختبار", "مشروع", "مهمة", "أدائي", "ملف", "إنجاز", "تقييم", "قياس"] }
  ];

  // ---------------- ذراع الشواهد: التصنيفات الثمانية ----------------
  var CATEGORIES = [
    { id: "executive-reports", label: "تقارير تنفيذية", icon: "📊", kw: ["تقرير", "تنفيذي", "إنجاز", "أداء", "متابعة", "سير", "نتائج", "إحصائية", "ختامي", "شهري", "أسبوعي", "يومي", "دوري", "تحليلي"] },
    { id: "initiatives-programs", label: "مبادرات وبرامج", icon: "🚀", kw: ["مبادرة", "برنامج", "مشروع", "فعالية", "حملة", "نشاط", "تطوعي", "مجتمعي", "تربوي", "ابتكار", "إبداع", "ريادة", "قيادة"] },
    { id: "plans", label: "خطط", icon: "🗂️", kw: ["خطة", "تخطيط", "استراتيجية", "جدول", "توزيع", "منهج", "علاجية", "إثرائية", "تحسين", "تطوير", "سنوية", "فصلية"] },
    { id: "analysis-assessment", label: "تحليل وتقويم", icon: "📈", kw: ["تحليل", "تقويم", "تقييم", "قياس", "نتائج", "مستوى", "أنماط", "فروق", "فردية", "تشخيص", "بيانات"] },
    { id: "activities-worksheets", label: "أنشطة وأوراق عمل", icon: "📝", kw: ["نشاط", "ورقة", "عمل", "تدريب", "تمرين", "مهمة", "واجب", "صفي", "لاصفي", "تطبيق", "عملي", "تفاعلي"] },
    { id: "tests", label: "اختبارات", icon: "🧪", kw: ["اختبار", "امتحان", "تحصيلي", "تشخيصي", "قبلي", "بعدي", "فصلي", "نهائي", "قصير"] },
    { id: "field-photos", label: "صور ميدانية", icon: "📷", kw: ["صورة", "صور", "ميداني", "توثيق", "فوتوغرافي", "لقطة", "مشهد", "حدث", "زيارة", "رحلة"] },
    { id: "certificates-honors", label: "شهادات وتكريمات", icon: "🏅", kw: ["شهادة", "تكريم", "جائزة", "تقدير", "شكر", "تميز", "مشاركة", "حضور", "دورة", "ورشة", "اعتماد"] }
  ];

  var MAX_FILE = 600 * 1024;   // حد الملف المخزّن داخل قاعدة البيانات (الصور تُضغط تلقائيًا)

  var PF = { items: [], profile: {}, cv: {}, tab: "overview", fStd: 0, fCat: "", q: "", editing: null, loaded: false, loading: false, msg: "", msgOk: true, workspaceModule: "evidence-arm", workspaceEditing: null, workspaceQ: "" };

  function catOf(id) { for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i]; return null; }
  function stdOf(id) { for (var i = 0; i < STANDARDS.length; i++) if (STANDARDS[i].id === id) return STANDARDS[i]; return null; }
  function $(id) { return document.getElementById(id); }
  function db() { return getTeacherDb(); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function isAdmin() {
    var u = window.firebase && firebase.auth && firebase.auth().currentUser;
    return !!(u && u.email === ADMIN_EMAIL);
  }
  function say(t, ok) { PF.msg = t; PF.msgOk = ok !== false; var el = $("pf-msg"); if (el) { el.textContent = t; el.style.color = PF.msgOk ? "#0e8f5f" : "#e11d48"; } }

  // ---------------- التصنيف الذكي (مأخوذ من محرك التصنيف الأصلي) ----------------
  function suggest(title, desc) {
    var text = ((title || "") + " " + (desc || "")).toLowerCase();
    var bestCat = "", bestScore = 0;
    CATEGORIES.forEach(function (c) {
      var s = 0; c.kw.forEach(function (k) { if (text.indexOf(k) >= 0) s++; });
      if (s > bestScore) { bestScore = s; bestCat = c.id; }
    });
    var stds = [];
    STANDARDS.forEach(function (st) {
      var score = 0;
      st.keywords.forEach(function (k) { if (text.indexOf(k) >= 0) score += 10; });
      st.required.forEach(function (e) { e.toLowerCase().split(" ").forEach(function (w) { if (w.length > 2 && text.indexOf(w) >= 0) score += 5; }); });
      if (score >= 20) stds.push({ id: st.id, score: Math.min(100, score) });
    });
    stds.sort(function (a, b) { return b.score - a.score; });
    return { category: bestCat, standards: stds.slice(0, 3).map(function (s) { return s.id; }) };
  }

  // ---------------- التحميل والحفظ ----------------
  function load() {
    var d = db(); if (!d) { say("تعذّر الاتصال بالخدمة.", false); return Promise.resolve(); }
    PF.loading = true;
    return Promise.all([
      d.collection("portfolio_items").get(),
      d.collection("portfolio_meta").doc("profile").get(),
      d.collection("portfolio_meta").doc("cv").get()
    ]).then(function (r) {
      PF.cv = r[2].exists ? r[2].data() : {};
      PF.items = r[0].docs.map(function (x) { var o = x.data(); o.id = x.id; return o; })
        .sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
      PF.profile = r[1].exists ? r[1].data() : {};
      PF.loaded = true; PF.loading = false;
    }).catch(function (e) {
      console.error(e); PF.loading = false;
      say("تعذّر تحميل الملف. تأكد من نشر قواعد Firestore الجديدة وتسجيل الدخول.", false);
    });
  }

  function readFile(file) {
    return new Promise(function (res, rej) {
      if (/^image\//.test(file.type)) {
        var fr = new FileReader();
        fr.onload = function () {
          var img = new Image();
          img.onload = function () {
            var s = Math.min(1, 1400 / Math.max(img.width, img.height));
            var c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            var q = 0.85, out = c.toDataURL("image/jpeg", q);
            while (out.length > 800000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
            res({ data: out, type: "image/jpeg", name: file.name.replace(/\.\w+$/, "") + ".jpg" });
          };
          img.onerror = function () { rej(new Error("تعذّر قراءة الصورة")); };
          img.src = fr.result;
        };
        fr.onerror = rej; fr.readAsDataURL(file);
      } else {
        if (file.size > MAX_FILE) { rej(new Error("الملف أكبر من 600 كيلوبايت. ارفعه على Google Drive وضع الرابط بدلاً منه.")); return; }
        var f2 = new FileReader();
        f2.onload = function () { res({ data: f2.result, type: file.type || "application/octet-stream", name: file.name }); };
        f2.onerror = rej; f2.readAsDataURL(file);
      }
    });
  }

  function collectForm() {
    var stds = []; STANDARDS.forEach(function (s) { var el = $("pf-s" + s.id); if (el && el.checked) stds.push(s.id); });
    return {
      title: $("pf-title").value.trim(), description: $("pf-desc").value.trim(),
      category: $("pf-cat").value, standards: stds, date: $("pf-date").value || today(),
      url: $("pf-url").value.trim()
    };
  }

  function saveItem() {
    var d = db(); var f = collectForm();
    if (!f.title) { say("اكتب عنوان الشاهد.", false); return; }
    if (!f.category) { say("اختر تصنيف الشاهد.", false); return; }
    if (!f.standards.length) { say("اختر معيارًا واحدًا على الأقل.", false); return; }
    if (f.url && !/^https?:\/\//i.test(f.url)) { say("الرابط لازم يبدأ بـ https://", false); return; }
    var fileInput = $("pf-file"), file = fileInput && fileInput.files && fileInput.files[0];
    var btn = $("pf-save"); btn.disabled = true; say("جارٍ الحفظ…", true);
    var editing = PF.editing ? PF.items.filter(function (x) { return x.id === PF.editing; })[0] : null;

    var prep = file ? readFile(file) : Promise.resolve(null);
    prep.then(function (fd) {
      var doc = {
        title: f.title, description: f.description, category: f.category, standards: f.standards, date: f.date,
        url: f.url, hasFile: !!(fd || (editing && editing.hasFile)),
        fileName: fd ? fd.name : (editing ? editing.fileName || "" : ""),
        fileType: fd ? fd.type : (editing ? editing.fileType || "" : ""),
        updatedAt: Date.now()
      };
      var col = d.collection("portfolio_items");
      var ref = editing ? col.doc(editing.id) : col.doc();
      doc.createdAt = editing ? (editing.createdAt || Date.now()) : Date.now();
      return ref.set(doc).then(function () {
        if (fd) return d.collection("portfolio_files").doc(ref.id).set({ data: fd.data, name: fd.name, type: fd.type });
      }).then(function () {
        doc.id = ref.id;
        if (editing) PF.items = PF.items.map(function (x) { return x.id === ref.id ? doc : x; }); else PF.items.unshift(doc);
        PF.items.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
        PF.editing = null; PF.tab = "evidence"; PF.msg = "✅ تم حفظ الشاهد."; PF.msgOk = true; draw();
      });
    }).catch(function (e) {
      console.error(e); btn.disabled = false; say(e && e.message ? e.message : "تعذّر الحفظ.", false);
    });
  }

  function delItem(id) {
    if (!confirm("حذف هذا الشاهد نهائيًا؟")) return;
    var d = db(); var it = PF.items.filter(function (x) { return x.id === id; })[0];
    var jobs = [d.collection("portfolio_items").doc(id).delete()];
    if (it && it.hasFile) jobs.push(d.collection("portfolio_files").doc(id).delete());
    Promise.all(jobs).then(function () {
      PF.items = PF.items.filter(function (x) { return x.id !== id; }); PF.msg = "تم الحذف."; PF.msgOk = true; draw();
    }).catch(function (e) { console.error(e); say("تعذّر الحذف.", false); });
  }

  function openFile(id) {
    db().collection("portfolio_files").doc(id).get().then(function (s) {
      if (!s.exists) { say("الملف غير موجود.", false); return; }
      var f = s.data(), a = document.createElement("a");
      a.href = f.data; a.download = f.name || "evidence"; if (/^image\//.test(f.type) || /pdf/.test(f.type)) a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove();
    }).catch(function () { say("تعذّر فتح الملف.", false); });
  }

  function saveProfile() {
    var p = { name: $("pf-p-name").value.trim(), school: $("pf-p-school").value.trim(), year: $("pf-p-year").value.trim(), subject: $("pf-p-subject").value.trim(), principal: $("pf-p-principal").value.trim() };
    db().collection("portfolio_meta").doc("profile").set(p).then(function () { PF.profile = p; say("✅ تم حفظ البيانات.", true); })
      .catch(function () { say("تعذّر الحفظ.", false); });
  }

  // ---------------- السيرة الذاتية ----------------
  var CVROWS = {
    experiences: [["from", "من تاريخ", "date"], ["to", "إلى تاريخ", "date"], ["desc", "الجهة / وصف الخبرة", "text"]],
    courses: [["name", "اسم الدورة", "text"], ["provider", "الجهة المقدمة", "text"], ["hours", "الساعات", "number"], ["date", "تاريخ الإنهاء", "date"]],
    certs: [["name", "اسم الشهادة", "text"], ["authority", "الجهة المانحة", "text"], ["date", "تاريخ الحصول", "date"]]
  };
  var CVFIELDS = [["name", "الاسم"], ["specialization", "التخصص"], ["subject", "المادة / الصف"], ["degree", "الدرجة العلمية"], ["degreeField", "مجال الدرجة"],
    ["email", "البريد الإلكتروني"], ["phone", "رقم الهاتف"], ["address", "العنوان"]];

  function collectCV() {
    var cv = { experiences: [], courses: [], certs: [] };
    CVFIELDS.forEach(function (f) { var el = $("cv-" + f[0]); cv[f[0]] = el ? el.value.trim() : (PF.cv[f[0]] || ""); });
    ["skills", "hobbies"].forEach(function (k) { var el = $("cv-" + k); cv[k] = el ? el.value.trim() : (PF.cv[k] || ""); });
    Object.keys(CVROWS).forEach(function (g) {
      var n = (PF.cv[g] || []).length;
      for (var i = 0; i < n; i++) {
        var row = {}, any = false;
        CVROWS[g].forEach(function (c) { var el = $("cv-" + g + "-" + i + "-" + c[0]); row[c[0]] = el ? el.value.trim() : ""; if (row[c[0]]) any = true; });
        cv[g].push(row);
      }
    });
    cv.evidenceId = PF.cv.evidenceId || "";
    return cv;
  }
  function cvRow(g) { PF.cv = collectCV(); PF.cv[g].push({}); draw(); }
  function cvDel(g, i) { PF.cv = collectCV(); PF.cv[g].splice(i, 1); draw(); }
  function saveCV() {
    var cv = collectCV();
    ["experiences", "courses", "certs"].forEach(function (g) { cv[g] = cv[g].filter(function (r) { return Object.keys(r).some(function (k) { return r[k]; }); }); });
    var hours = cv.courses.reduce(function (a, r) { return a + (Number(r.hours) || 0); }, 0);
    var ev = { title: "السيرة الذاتية والدورات التدريبية", description: "عدد الدورات " + cv.courses.length + " — إجمالي الساعات " + hours + " — الشهادات المهنية " + cv.certs.length,
      category: "certificates-honors", standards: [2], date: today() };
    var p = cv.evidenceId ? updateEvidence(cv.evidenceId, ev).then(function () { return cv.evidenceId; }) : addEvidence(ev);
    p.then(function (eid) {
      cv.evidenceId = eid; cv.updatedAt = Date.now();
      return db().collection("portfolio_meta").doc("cv").set(cv).then(function () { PF.cv = cv; PF.msg = "✅ تم حفظ السيرة الذاتية وتسجيلها شاهدًا (المعيار 2)."; PF.msgOk = true; draw(); });
    }).catch(function (e) { console.error(e); say("تعذّر الحفظ.", false); });
  }
  function printCV() {
    var cv = collectCV(), li = function (a) { return a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); };
    var lines = function (t) { return li(String(t || "").split("\n").filter(function (x) { return x.trim(); })); };
    var tbl = function (g, heads) {
      var rows = cv[g].filter(function (r) { return Object.keys(r).some(function (k) { return r[k]; }); }); if (!rows.length) return "<p class='none'>—</p>";
      return "<table><thead><tr>" + heads.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.map(function (r) { return "<tr>" + CVROWS[g].map(function (c) { return "<td>" + esc(r[c[0]] || "") + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
    };
    var hours = cv.courses.reduce(function (a, r) { return a + (Number(r.hours) || 0); }, 0);
    var html = "<!DOCTYPE html><html lang='ar' dir='rtl'><head><meta charset='utf-8'><title>السيرة الذاتية</title><style>@page{size:A4;margin:14mm}" +
      "body{font-family:Tahoma,Arial,sans-serif;font-size:13px;color:#111;line-height:1.8}h1{text-align:center;font-size:21px;margin:0}.sub{text-align:center;color:#444;margin-bottom:12px}" +
      "h2{font-size:14.5px;border-bottom:2px solid #0f6e6b;color:#0a4e4c;margin:16px 0 6px;padding-bottom:2px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #666;padding:4px 8px;text-align:right}th{background:#e8f1f0}" +
      "ul{margin:0;padding-right:18px}.none{color:#888}.contact{text-align:center;font-size:12px;color:#333}</style></head><body>" +
      "<h1>" + esc(cv.name || "السيرة الذاتية") + "</h1><div class='sub'>" + esc([cv.specialization, cv.subject].filter(Boolean).join(" — ")) + "</div>" +
      "<div class='contact'>" + esc([cv.email, cv.phone, cv.address].filter(Boolean).join("  |  ")) + "</div>" +
      (cv.degree ? "<h2>المؤهل العلمي</h2><p>" + esc(cv.degree) + (cv.degreeField ? " — " + esc(cv.degreeField) : "") + "</p>" : "") +
      "<h2>الخبرات التعليمية</h2>" + tbl("experiences", ["من", "إلى", "الجهة / الوصف"]) +
      "<h2>الدورات التدريبية (إجمالي الساعات: " + hours + ")</h2>" + tbl("courses", ["الدورة", "الجهة", "الساعات", "التاريخ"]) +
      "<h2>الشهادات المهنية</h2>" + tbl("certs", ["الشهادة", "الجهة المانحة", "التاريخ"]) +
      (cv.skills ? "<h2>المهارات</h2><ul>" + lines(cv.skills) + "</ul>" : "") + (cv.hobbies ? "<h2>الهوايات</h2><ul>" + lines(cv.hobbies) + "</ul>" : "") + "</body></html>";
    var w = window.open("", "_blank");
    if (!w) { say("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة.", false); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 400);
  }
  function viewCV() {
    var cv = PF.cv || {}, inp = 'class="w-full border rounded-xl px-3 py-2 bg-transparent text-sm" style="border-color:var(--line)"';
    var head = '<div class="card p-4 mb-3"><h2 class="font-extrabold mb-3">👤 البيانات الشخصية</h2><div class="grid md:grid-cols-2 gap-3">' +
      CVFIELDS.map(function (f) { return '<div><label class="text-xs font-bold">' + f[1] + '</label><input id="cv-' + f[0] + '" ' + inp + ' value="' + esc(cv[f[0]] || (f[0] === "name" ? (PF.profile || {}).name || "" : "")) + '"></div>'; }).join("") + "</div></div>";
    var titles = { experiences: "💼 الخبرات التعليمية", courses: "🎓 الدورات التدريبية", certs: "📜 الشهادات المهنية" };
    var groups = Object.keys(CVROWS).map(function (g) {
      var rows = (cv[g] || []).map(function (r, i) {
        return '<div class="card p-3 mb-2"><div class="grid md:grid-cols-4 gap-2">' + CVROWS[g].map(function (c) {
          return '<div><label class="text-xs font-bold">' + c[1] + '</label><input id="cv-' + g + "-" + i + "-" + c[0] + '" type="' + c[2] + '" ' + inp + ' value="' + esc(r[c[0]] || "") + '"></div>';
        }).join("") + '</div><button class="btn btn-outline text-xs py-1 px-2 mt-2" onclick="window.PFui.cvDel(\'' + g + "'," + i + ')">🗑️ حذف</button></div>';
      }).join("");
      return '<div class="mb-3"><div class="flex items-center justify-between mb-2"><h2 class="font-extrabold">' + titles[g] + '</h2>' +
        '<button class="btn btn-outline text-sm py-1.5 px-3" onclick="window.PFui.cvRow(\'' + g + "')\">➕ إضافة</button></div>" + (rows || '<div class="text-xs" style="color:var(--sub)">لا توجد عناصر بعد.</div>') + "</div>";
    }).join("");
    var extra = '<div class="card p-4 mb-3"><div class="grid md:grid-cols-2 gap-3"><div><label class="text-xs font-bold">المهارات (كل مهارة في سطر)</label><textarea id="cv-skills" rows="4" ' + inp + ">" + esc(cv.skills || "") + "</textarea></div>" +
      '<div><label class="text-xs font-bold">الهوايات (كل هواية في سطر)</label><textarea id="cv-hobbies" rows="4" ' + inp + ">" + esc(cv.hobbies || "") + "</textarea></div></div></div>";
    return head + groups + extra + '<div class="flex gap-2"><button class="btn btn-brand flex-1 py-2.5" onclick="window.PFui.cvSave()">💾 حفظ السيرة الذاتية</button><button class="btn btn-outline py-2.5 px-4" onclick="window.PFui.cvPrint()">🖨️ طباعة</button></div>';
  }

  // ---------------- النسخ الاحتياطي ----------------
  function exportJson() {
    var blob = new Blob([JSON.stringify({ version: 1, exportedAt: Date.now(), profile: PF.profile, items: PF.items }, null, 1)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ملف_إنجاز_المعلم_" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  }
  function importJson(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var o = JSON.parse(fr.result); var list = (o.items || []).filter(function (x) { return x && x.title; });
        if (!list.length) { say("الملف لا يحتوي شواهد.", false); return; }
        if (!confirm("سيتم استيراد " + list.length + " شاهد (الملفات المرفقة لا تُستورد). متابعة؟")) return;
        var d = db(), batch = d.batch(), col = d.collection("portfolio_items");
        list.slice(0, 450).forEach(function (x) {
          var ref = col.doc(); var n = Object.assign({}, x); delete n.id; n.hasFile = false; n.fileName = ""; n.fileType = "";
          batch.set(ref, n); n.id = ref.id; PF.items.push(n);
        });
        batch.commit().then(function () { PF.msg = "✅ تم الاستيراد."; PF.msgOk = true; draw(); })
          .catch(function () { say("تعذّر الاستيراد.", false); });
      } catch (e) { say("ملف غير صالح.", false); }
    };
    fr.readAsText(file);
  }

  // ---------------- التقرير القابل للطباعة ----------------
  function printReport(withImages) {
    var p = PF.profile || {}, rows = "", detail = "";
    var total = 0, got = 0;
    STANDARDS.forEach(function (s) {
      var its = standardItems().filter(function (x) { return (x.standards || []).indexOf(s.id) >= 0; });
      total += s.weight; if (its.length) got += s.weight;
      rows += "<tr><td>" + s.id + "</td><td>" + esc(s.title) + "</td><td>" + s.weight + "</td><td>" + its.length + "</td><td>" + (its.length ? "موثّق ✔" : "ناقص") + "</td></tr>";
      detail += "<h3>" + s.id + ". " + esc(s.title) + " <small>(" + its.length + " شاهد)</small></h3>";
      if (!its.length) detail += "<p class='none'>لا توجد شواهد.</p>";
      else {
        detail += "<ul>";
        its.forEach(function (x) {
          var c = catOf(x.category);
          detail += "<li><b>" + esc(x.title) + "</b> — " + (c ? esc(c.label) : "") + " — " + esc(x.date || "") +
            (x.description ? "<br><span>" + esc(x.description) + "</span>" : "") +
            (x.url ? "<br><span dir='ltr'>" + esc(x.url) + "</span>" : "") +
            (x.hasFile ? "<br><span>📎 " + esc(x.fileName || "مرفق") + "</span>" : "") + "<div id='img-" + x.id + "-" + s.id + "'></div></li>";
        });
        detail += "</ul>";
      }
    });
    var html = "<!DOCTYPE html><html lang='ar' dir='rtl'><head><meta charset='utf-8'><title>ملف إنجاز المعلم</title><style>" +
      "@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial,sans-serif;font-size:12.5px;color:#111;line-height:1.7}" +
      "h1{text-align:center;font-size:20px;margin:0 0 4px}.sub{text-align:center;color:#555;margin-bottom:12px}" +
      "table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #444;padding:5px 8px;text-align:right}th{background:#e8f1f0}" +
      "h3{margin:16px 0 4px;font-size:14px;border-bottom:1px solid #999;padding-bottom:2px}h3 small{color:#555;font-weight:normal}" +
      "ul{margin:4px 0;padding-right:18px}li{margin-bottom:6px}.none{color:#888}img{max-width:220px;max-height:160px;margin-top:4px;border:1px solid #ccc}" +
      ".sig{display:flex;justify-content:space-between;margin-top:30px}</style></head><body>" +
      "<h1>ملف إنجاز المعلم</h1><div class='sub'>" + esc([p.name, p.subject, p.school, p.year].filter(Boolean).join(" — ")) + "</div>" +
      "<table><thead><tr><th>م</th><th>المعيار</th><th>الوزن</th><th>عدد الشواهد</th><th>الحالة</th></tr></thead><tbody>" + rows +
      "</tbody></table><p>الأوزان الموثّقة بشواهد: <b>" + got + "</b> من <b>" + total + "</b> — إجمالي الشواهد: <b>" + standardItems().length + "</b></p>" +
      detail + "<div class='sig'><div>المعلم: " + esc(p.name || "") + "</div><div>مدير المدرسة: " + esc(p.principal || "") + "</div></div></body></html>";
    var w = window.open("", "_blank");
    if (!w) { say("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة.", false); return; }
    w.document.open(); w.document.write(html); w.document.close();
    var finish = function () { setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 400); };
    if (!withImages) { finish(); return; }
    var imgs = standardItems().filter(function (x) { return x.hasFile && /^image\//.test(x.fileType || ""); }).slice(0, 40);
    Promise.all(imgs.map(function (x) {
      return db().collection("portfolio_files").doc(x.id).get().then(function (s) {
        if (!s.exists) return;
        (x.standards || []).forEach(function (sid) { var host = w.document.getElementById("img-" + x.id + "-" + sid); if (host) host.innerHTML = "<img src='" + s.data().data + "'>"; });
      });
    })).then(finish).catch(finish);
  }

  // ---------------- مساحة ملف الإنجاز الموسعة: أقسام المصدر الأصلي ----------------
  // تحفظ السجلات في portfolio_items الحالية لتبقى ضمن صلاحيات Firestore القائمة.
  // هذا نموذج سجل موحد للأقسام التي لم تُنقل نماذجها المتخصصة بعد، ولا يستبدلها بادعاء كاذب.
  var WORKSPACE_MODULES = [
    ["dashboard","لوحة التحكم","البيانات الأساسية"],["profile","السيرة الذاتية","البيانات الأساسية"],["qualifications","المؤهلات العلمية","البيانات الأساسية"],["experiences","الخبرات المهنية","البيانات الأساسية"],
    ["courses","الدورات التدريبية","التطوير المهني"],["report/16","ميثاق أخلاقيات مهنة التعليم","التطوير المهني"],["certifications","وثائق الاعتماد المهني","التطوير المهني"],["workshops","ورش العمل","التطوير المهني"],["conferences","المؤتمرات والندوات","التطوير المهني"],["readings","القراءات التربوية","التطوير المهني"],
    ["lesson-plans","التخطيط للدروس","الأداء التعليمي"],["strategies","استراتيجيات التدريس","الأداء التعليمي"],["assessments","التقويم والاختبارات ونماذج الاختبارات","الأداء التعليمي"],["results","نتائج الطلاب","الأداء التعليمي"],["activities","الأنشطة الصفية","الأداء التعليمي"],
    ["awards","الجوائز والتكريمات","الإنجازات"],["projects","المشاريع التربوية","الإنجازات"],["competitions","المسابقات","الإنجازات"],["innovations","الابتكارات التعليمية","الإنجازات"],
    ["school-activities","الأنشطة المدرسية","المشاركة المجتمعية"],["community-service","خدمة المجتمع","المشاركة المجتمعية"],["parent-communication","التواصل مع أولياء الأمور","المشاركة المجتمعية"],["collaboration","التعاون مع الزملاء","المشاركة المجتمعية"],
    ["summary","ملخص الإنجازات","التقارير"],["statistics","الإحصائيات","التقارير"],["print","طباعة الملف","التقارير"],["export","تصدير البيانات","التقارير"],["settings","الإعدادات","التقارير"],
    ["evidence-arm","ذراع الشواهد","الشواهد وإدارة الملف"],["evidence-guide","دليل الشواهد","الشواهد وإدارة الملف"],["manage-evidence","إدارة الشواهد","الشواهد وإدارة الملف"],["smart-upload","الرفع الذكي للملفات","الشواهد وإدارة الملف"],["portfolio-summary","ملخص ملف الإنجاز","الشواهد وإدارة الملف"],
    ["self-assessment","التقييم الذاتي","التقييم والتحسين"],["management-assessment","التقييم الإداري","التقييم والتحسين"],["program-execution","تنفيذ البرامج والأنشطة","التنفيذ المهني"],["mutual-visits","الزيارات المتبادلة","التنفيذ المهني"],["learning-loss","الفاقد التعليمي","التقييم والتحسين"],["improvement-plan","خطة التحسين","التقييم والتحسين"],
    ["arabic-remedial","خطة اللغة العربية","الخطط العلاجية والإثرائية"],["biology-remedial","خطة الأحياء","الخطط العلاجية والإثرائية"],["english-remedial","خطة اللغة الإنجليزية","الخطط العلاجية والإثرائية"],["digital-design-remedial","خطة التصميم الرقمي","الخطط العلاجية والإثرائية"],["critical-thinking-remedial","خطة التفكير الناقد","الخطط العلاجية والإثرائية"],["sustainable-development-remedial","خطة التنمية المستدامة","الخطط العلاجية والإثرائية"],["islamic-studies-remedial","خطة الدراسات الإسلامية","الخطط العلاجية والإثرائية"],["math-remedial","خطة الرياضيات","الخطط العلاجية والإثرائية"],["admin-skills-remedial","خطة المهارات الإدارية","الخطط العلاجية والإثرائية"],["functional-writing-remedial","خطة الكتابة الوظيفية","الخطط العلاجية والإثرائية"],["language-competencies-remedial","خطة الكفايات اللغوية","الخطط العلاجية والإثرائية"],["tafsir-remedial","خطة التفسير","الخطط العلاجية والإثرائية"],["islamic-studies-toheed-fiqh-remedial","خطة التوحيد والفقه","الخطط العلاجية والإثرائية"],["hadith-remedial","خطة الحديث","الخطط العلاجية والإثرائية"],["earth-space-remedial","خطة علوم الأرض والفضاء","الخطط العلاجية والإثرائية"],["science-remedial","خطة العلوم","الخطط العلاجية والإثرائية"],["physics-remedial","خطة الفيزياء","الخطط العلاجية والإثرائية"],["chemistry-remedial","خطة الكيمياء","الخطط العلاجية والإثرائية"],["life-skills-remedial","خطة المهارات الحياتية","الخطط العلاجية والإثرائية"],["social-studies-remedial","خطة الدراسات الاجتماعية","الخطط العلاجية والإثرائية"],["chinese-remedial","خطة اللغة الصينية","الخطط العلاجية والإثرائية"],["physical-education-remedial","خطة التربية البدنية","الخطط العلاجية والإثرائية"],["digital-skills-remedial","خطة المهارات الرقمية","الخطط العلاجية والإثرائية"],["art-education-remedial","خطة التربية الفنية","الخطط العلاجية والإثرائية"],["tajweed-remedial","خطة التجويد","الخطط العلاجية والإثرائية"]
  ];
  function isWorkspaceItem(x) { return !!(x && x.workspaceType === "portfolio-workspace"); }
  function standardItems() { return PF.items.filter(function(x){ return !isWorkspaceItem(x); }); }
  function moduleTitle(id) { var m=WORKSPACE_MODULES.filter(function(x){return x[0]===id;})[0]; return m?m[1]:id; }
  function workspaceItems() { return PF.items.filter(function(x){return isWorkspaceItem(x) && x.workspaceModule===PF.workspaceModule;}).filter(function(x){var q=(PF.workspaceQ||"").trim().toLowerCase();return !q || [x.title,x.description,x.subject,x.grade,x.status].join(" ").toLowerCase().indexOf(q)>=0;}).sort(function(a,b){return (b.date||"").localeCompare(a.date||"");}); }
  // حقول مخصصة مستندة إلى النماذج التي فُحصت في مصدر React الأصلي.
  var WORKSPACE_FIELDS = {
    "learning-loss": [{id:"semester",label:"الفصل الدراسي"},{id:"targetStudentCount",label:"عدد الطلاب المستهدفين",type:"number"},{id:"masteredPct",label:"نسبة إتقان المهارات (%)",type:"number"},{id:"partialPct",label:"نسبة الإتقان الجزئي (%)",type:"number"},{id:"notMasteredPct",label:"نسبة عدم الإتقان (%)",type:"number"},{id:"skills",label:"المهارات المستهدفة",type:"textarea"},{id:"objectives",label:"الأهداف",type:"textarea"},{id:"groupPlan",label:"خطة المعالجة للمجموعات",type:"textarea"},{id:"measurementTools",label:"أدوات القياس والمتابعة",type:"textarea"},{id:"teacherName",label:"اسم المعلم"},{id:"principalName",label:"اسم المدير/ة"}],
    "improvement-plan": [{id:"school",label:"المدرسة"},{id:"term",label:"الفصل الدراسي"},{id:"year",label:"العام الدراسي"},{id:"startDate",label:"تاريخ بداية الخطة",type:"date"},{id:"endDate",label:"تاريخ نهاية الخطة",type:"date"},{id:"goals",label:"أهداف التحسين",type:"textarea"},{id:"actions",label:"الإجراءات التنفيذية",type:"textarea"},{id:"weeks",label:"الجدول الزمني الأسبوعي",type:"textarea"},{id:"teacherName",label:"اسم المعلم"},{id:"principalName",label:"اسم المدير/ة"},{id:"supervisorName",label:"اسم المشرف/ة"}],
    "program-execution": [{id:"targetAudience",label:"الفئة المستهدفة"},{id:"activityType",label:"نوع البرنامج/النشاط"},{id:"achievementSummary",label:"ملخص الإنجاز",type:"textarea"},{id:"executionDate",label:"تاريخ التنفيذ",type:"date"},{id:"outcomes",label:"المخرجات والأثر",type:"textarea"}],
    "mutual-visits": [{id:"visitorTeacher",label:"اسم المعلم الزائر"},{id:"hostTeacher",label:"اسم المعلم المستضيف"},{id:"visitDate",label:"تاريخ الزيارة",type:"date"},{id:"lessonTitle",label:"عنوان الدرس"},{id:"visitObjectives",label:"أهداف الزيارة",type:"textarea"},{id:"strengthPoints",label:"نقاط القوة",type:"textarea"},{id:"discussionPoints",label:"نقاط النقاش",type:"textarea"},{id:"recommendations",label:"التوصيات",type:"textarea"}],
    "self-assessment": [{id:"assessmentTool",label:"أداة التقييم"},{id:"strengths",label:"نقاط القوة",type:"textarea"},{id:"improvementAreas",label:"جوانب التحسين",type:"textarea"},{id:"improvementPlan",label:"خطة التحسين الناتجة",type:"textarea"},{id:"assessmentDate",label:"تاريخ التقييم",type:"date"}],
    "management-assessment": [{id:"evaluatorType",label:"صفة المقيم"},{id:"evaluatorName",label:"اسم المقيم"},{id:"visitType",label:"نوع الزيارة"},{id:"evaluation",label:"نتيجة التقييم",type:"textarea"},{id:"recommendations",label:"التوصيات",type:"textarea"},{id:"assessmentDate",label:"تاريخ التقييم",type:"date"}],
    "smart-upload": [{id:"evidenceType",label:"نوع الشاهد"},{id:"selectedStandards",label:"المعايير المرتبطة (أرقام مفصولة بفواصل)"},{id:"fileReference",label:"رابط الملف المرفوع"},{id:"uploadNotes",label:"ملاحظات التصنيف والتحقق",type:"textarea"}],
    "courses": [{id:"provider",label:"جهة التدريب"},{id:"hours",label:"عدد الساعات",type:"number"},{id:"completionDate",label:"تاريخ الإكمال",type:"date"},{id:"certificateUrl",label:"رابط الشهادة"}],
    "certifications": [{id:"certificationBody",label:"جهة الاعتماد"},{id:"certificationNumber",label:"رقم الوثيقة"},{id:"issueDate",label:"تاريخ الإصدار",type:"date"},{id:"expiryDate",label:"تاريخ الانتهاء",type:"date"},{id:"certificateUrl",label:"رابط الوثيقة"}],
    "workshops": [{id:"organizer",label:"الجهة المنظمة"},{id:"duration",label:"المدة"},{id:"workshopDate",label:"تاريخ الورشة",type:"date"},{id:"outcomes",label:"المهارات/المخرجات المكتسبة",type:"textarea"}],
    "evidence-guide": [{id:"standardNumber",label:"رقم المعيار"},{id:"requiredEvidence",label:"الشواهد المطلوبة",type:"textarea"},{id:"completionStatus",label:"حالة الاستيفاء",type:"select",options:["غير مراجع","ناقص","مكتمل"]},{id:"reviewNotes",label:"ملاحظات المراجعة",type:"textarea"}],
    "manage-evidence": [{id:"evidenceId",label:"معرّف الشاهد المرتبط"},{id:"linkedStandards",label:"المعايير المرتبطة"},{id:"reviewStatus",label:"حالة المراجعة",type:"select",options:["جديد","تمت المراجعة","يحتاج استكمال"]},{id:"reviewNotes",label:"ملاحظات إدارة الشاهد",type:"textarea"}],
    "portfolio-summary": [{id:"period",label:"الفترة المشمولة"},{id:"keyAchievements",label:"أبرز الإنجازات",type:"textarea"},{id:"impact",label:"الأثر التعليمي",type:"textarea"},{id:"nextSteps",label:"الخطوات القادمة",type:"textarea"}],
    "assessments": [{id:"assessmentType",label:"نوع الاختبار/التقويم"},{id:"gradeLevel",label:"الصف"},{id:"assessmentDate",label:"تاريخ التطبيق",type:"date"},{id:"studentCount",label:"عدد الطلاب",type:"number"},{id:"resultsSummary",label:"ملخص النتائج",type:"textarea"},{id:"testModelUrl",label:"رابط نموذج الاختبار"}],
    "results": [{id:"gradeLevel",label:"الصف"},{id:"assessmentType",label:"نوع التقويم"},{id:"studentCount",label:"عدد الطلاب",type:"number"},{id:"passCount",label:"عدد المجتازين",type:"number"},{id:"needsSupportCount",label:"عدد المحتاجين للدعم",type:"number"},{id:"analysis",label:"تحليل النتائج وخطة المتابعة",type:"textarea"}]
  };
  function workspaceCustomFields(moduleId, data) {
    var fields=WORKSPACE_FIELDS[moduleId]||[]; if(!fields.length)return '';
    return '<div class="md:col-span-2 mt-2"><div class="font-extrabold text-sm mb-2">حقول القسم المتخصصة</div><div class="grid md:grid-cols-2 gap-3">'+fields.map(function(f){var v=(data||{})[f.id];var inputClass='class="w-full border rounded-xl px-3 py-2 bg-transparent" data-ws-field="'+f.id+'"';var html='';if(f.type==='textarea'){html='<textarea '+inputClass+' rows="3">'+esc(v||'')+'</textarea>';}else if(f.type==='select'){html='<select '+inputClass+'>'+f.options.map(function(o){return '<option '+(v===o?'selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';}else{html='<input '+inputClass+' type="'+(f.type||'text')+'" value="'+esc(v||'')+'">';}return '<div><label class="text-xs font-bold block mb-1">'+esc(f.label)+'</label>'+html+'</div>';}).join('')+'</div></div>';
  }
  function workspaceView() {
    var groups={}; WORKSPACE_MODULES.forEach(function(m){(groups[m[2]]||(groups[m[2]]=[])).push(m);});
    var nav=Object.keys(groups).map(function(g){return '<div class="mb-3"><div class="font-extrabold text-sm mb-2">'+esc(g)+'</div><div class="flex flex-wrap gap-2">'+groups[g].map(function(m){return '<button class="chip '+(PF.workspaceModule===m[0]?'active':'')+'" onclick="window.PFui.workspaceModule(\''+m[0]+'\')">'+esc(m[1])+'</button>';}).join('')+'</div></div>';}).join('');
    var list=workspaceItems();
    var rows=list.map(function(x){return '<div class="card p-3 mb-2"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="font-bold">'+esc(x.title)+'</div><div class="text-xs mt-1" style="color:var(--sub)">'+esc(x.date||'')+' · '+esc(x.subject||'')+' · '+esc(x.grade||'')+' · '+esc(x.status||'مسودة')+'</div>'+(x.description?'<div class="text-sm mt-2 whitespace-pre-wrap">'+esc(x.description)+'</div>':'')+(x.url?'<a class="chip inline-block mt-2" target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">🔗 فتح الرابط</a>':'')+(x.hasFile?'<button class="chip inline-block mt-2" onclick="window.PFui.openFile(\''+x.id+'\')">📎 فتح '+esc(x.fileName||'المرفق')+'</button>':'')+'</div><div class="flex gap-1 shrink-0"><button class="btn btn-outline text-xs py-1 px-2" onclick="window.PFui.workspaceEdit(\''+x.id+'\')">✏️</button><button class="btn btn-outline text-xs py-1 px-2" onclick="window.PFui.workspaceDelete(\''+x.id+'\')">🗑️</button></div></div></div>';}).join('');
    var e=PF.workspaceEditing?PF.items.filter(function(x){return x.id===PF.workspaceEditing && isWorkspaceItem(x);})[0]:null;
    var form='<div class="card p-4 mb-3"><h3 class="font-extrabold mb-3">'+(e?'تعديل سجل':'إضافة سجل إلى: '+esc(moduleTitle(PF.workspaceModule)))+'</h3><div class="grid md:grid-cols-2 gap-3">'+
      '<div><label class="text-xs font-bold">العنوان *</label><input id="pwx-title" class="w-full border rounded-xl px-3 py-2 bg-transparent" value="'+esc(e?e.title:'')+'" maxlength="180"></div>'+
      '<div><label class="text-xs font-bold">التاريخ</label><input id="pwx-date" type="date" class="w-full border rounded-xl px-3 py-2 bg-transparent" value="'+esc(e?e.date:today())+'"></div>'+
      '<div><label class="text-xs font-bold">المادة</label><input id="pwx-subject" class="w-full border rounded-xl px-3 py-2 bg-transparent" value="'+esc(e?e.subject:'')+'" placeholder="مثال: المهارات الرقمية"></div>'+
      '<div><label class="text-xs font-bold">الصف/الفئة</label><input id="pwx-grade" class="w-full border rounded-xl px-3 py-2 bg-transparent" value="'+esc(e?e.grade:'')+'" placeholder="اختياري"></div>'+
      '<div><label class="text-xs font-bold">الحالة</label><select id="pwx-status" class="w-full border rounded-xl px-3 py-2 bg-transparent"><option '+(!e||e.status==='مسودة'?'selected':'')+'>مسودة</option><option '+(e&&e.status==='قيد التنفيذ'?'selected':'')+'>قيد التنفيذ</option><option '+(e&&e.status==='مكتمل'?'selected':'')+'>مكتمل</option><option '+(e&&e.status==='يحتاج متابعة'?'selected':'')+'>يحتاج متابعة</option></select></div>'+
      '<div><label class="text-xs font-bold">رابط ملف أو شاهد</label><input id="pwx-url" type="url" dir="ltr" class="w-full border rounded-xl px-3 py-2 bg-transparent" value="'+esc(e?e.url:'')+'" placeholder="https://"></div>'+
      '<div class="md:col-span-2"><label class="text-xs font-bold">التفاصيل / الإجراءات / النتائج / ملاحظات المتابعة</label><textarea id="pwx-desc" rows="4" maxlength="12000" class="w-full border rounded-xl px-3 py-2 bg-transparent">'+esc(e?e.description:'')+'</textarea></div><div class="md:col-span-2"><label class="text-xs font-bold">إرفاق ملف فعلي (صورة مضغوطة أو PDF/Word حتى 600KB)</label><input id="pwx-file" type="file" accept="image/*,.pdf,.doc,.docx" class="w-full text-sm">'+(e&&e.hasFile?'<div class="text-xs mt-1">المرفق الحالي: '+esc(e.fileName||'ملف مرفق')+' — حفظ ملف جديد يستبدله.</div>':'')+'</div>'+workspaceCustomFields(PF.workspaceModule,e?e.customData:{})+'</div><div class="flex gap-2 mt-3"><button class="btn btn-brand px-4 py-2" onclick="window.PFui.workspaceSave()">💾 حفظ السجل</button>'+(e?'<button class="btn btn-outline px-4 py-2" onclick="window.PFui.workspaceCancel()">إلغاء التعديل</button>':'')+'<button class="btn btn-outline px-4 py-2" onclick="window.PFui.workspacePrint()">🖨️ تقرير القسم</button><button class="btn btn-outline px-4 py-2" onclick="window.PFui.workspaceExport()">⬇️ تصدير القسم</button></div><p class="text-xs mt-2" style="color:var(--sub)">هذه مساحة سجل موحّد محفوظة في Firestore. النماذج المتخصصة في المصدر الأصلي تحتاج نقلًا واختبارًا منفصلًا قبل اعتبارها مطابقة بالكامل.</p></div>';
    return '<div class="card p-4 mb-3"><div class="font-extrabold text-lg">🗂️ مساحة ملف الإنجاز الموسعة</div><p class="text-sm mt-1" style="color:var(--sub)">الأقسام المعروفة من المصدر الأصلي، مع سجلات قابلة للإضافة والتعديل والحذف والبحث والتصدير والطباعة.</p><input class="w-full border rounded-xl px-3 py-2 bg-transparent mt-3" placeholder="🔍 بحث في سجلات القسم" value="'+esc(PF.workspaceQ)+'" oninput="window.PFui.workspaceSearch(this.value)"></div>'+nav+form+'<div class="flex justify-between items-center mb-2"><h3 class="font-extrabold">'+esc(moduleTitle(PF.workspaceModule))+'</h3><span class="chip">'+list.length+' سجل</span></div>'+(rows||'<div class="card p-6 text-center" style="color:var(--sub)">لا توجد سجلات لهذا القسم بعد.</div>');
  }
  function workspaceSave() {
    var title=$("pwx-title").value.trim(); if(!title){say("أدخل عنوان السجل أولًا.",false);return;}
    var id=PF.workspaceEditing, existing=id?PF.items.filter(function(x){return x.id===id && isWorkspaceItem(x);})[0]:null;
    if(id && !existing){say("تعذّر العثور على السجل المراد تعديله. حدّث الصفحة وحاول مجددًا.",false);return;}
    var customData={};document.querySelectorAll('[data-ws-field]').forEach(function(el){customData[el.getAttribute('data-ws-field')]=el.value;});
    var fileInput=$("pwx-file"), file=fileInput&&fileInput.files&&fileInput.files[0];
    var btn=document.querySelector('button[onclick="window.PFui.workspaceSave()"]');if(btn)btn.disabled=true;
    readFileForWorkspace(file).then(function(fd){
      var doc=Object.assign({},existing||{}, {workspaceType:"portfolio-workspace",workspaceModule:PF.workspaceModule,title:title,date:$("pwx-date").value||today(),subject:$("pwx-subject").value.trim(),grade:$("pwx-grade").value.trim(),status:$("pwx-status").value,url:$("pwx-url").value.trim(),description:$("pwx-desc").value.trim(),customData:customData,hasFile:!!(fd||(existing&&existing.hasFile)),fileName:fd?fd.name:(existing?existing.fileName||"":""),fileType:fd?fd.type:(existing?existing.fileType||"":""),createdAt:existing?(existing.createdAt||Date.now()):Date.now(),updatedAt:Date.now()});
      var ref=id?db().collection("portfolio_items").doc(id):db().collection("portfolio_items").doc();
      return ref.set(doc).then(function(){return fd?db().collection("portfolio_files").doc(ref.id).set({data:fd.data,name:fd.name,type:fd.type}):Promise.resolve();}).then(function(){doc.id=ref.id;if(existing){var idx=PF.items.findIndex(function(x){return x.id===ref.id;});if(idx>=0)PF.items[idx]=doc;}else PF.items.unshift(doc);PF.workspaceEditing=null;say("تم حفظ السجل"+(fd?" والمرفق":"")+" في Firestore.",true);draw();});
    }).catch(function(e){console.error(e);if(btn)btn.disabled=false;say(e&&e.message?e.message:"تعذّر حفظ السجل أو المرفق. تحقق من الاتصال وقواعد Firestore.",false);});
  }
  function readFileForWorkspace(file){return file?readFile(file):Promise.resolve(null);}
  function workspaceDelete(id){var x=PF.items.filter(function(a){return a.id===id && isWorkspaceItem(a);})[0];if(!x)return;if(!confirm('حذف السجل «'+x.title+'»؟ لا يمكن التراجع عن الحذف.'))return;Promise.all([db().collection("portfolio_items").doc(id).delete(),x.hasFile?db().collection("portfolio_files").doc(id).delete():Promise.resolve()]).then(function(){PF.items=PF.items.filter(function(a){return a.id!==id;});say("تم حذف السجل والمرفق المرتبط به.",true);draw();}).catch(function(e){console.error(e);say("تعذّر حذف السجل أو مرفقه.",false);});}
  function workspaceExport(){var list=workspaceItems();var blob=new Blob([JSON.stringify({version:1,module:PF.workspaceModule,moduleTitle:moduleTitle(PF.workspaceModule),exportedAt:new Date().toISOString(),items:list},null,2)],{type:"application/json;charset=utf-8"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="سجلات_"+PF.workspaceModule.replace(/[^\w-]/g,"_")+"_"+today()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}
  function workspacePrint(){var list=workspaceItems(),p=PF.profile||{};var html="<!doctype html><html lang='ar' dir='rtl'><meta charset='utf-8'><title>"+esc(moduleTitle(PF.workspaceModule))+"</title><style>body{font-family:Tahoma,Arial;padding:24px;line-height:1.8}h1{text-align:center}table{width:100%;border-collapse:collapse}td,th{border:1px solid #aaa;padding:7px;text-align:right;vertical-align:top}th{background:#eee}</style><h1>"+esc(moduleTitle(PF.workspaceModule))+"</h1><p>"+esc([p.name,p.school,p.year].filter(Boolean).join(" — "))+"</p><table><thead><tr><th>العنوان</th><th>التاريخ</th><th>المادة/الصف</th><th>الحالة</th><th>التفاصيل</th><th>الرابط</th></tr></thead><tbody>"+list.map(function(x){return "<tr><td>"+esc(x.title)+"</td><td>"+esc(x.date||"")+"</td><td>"+esc([x.subject,x.grade].filter(Boolean).join(" / "))+"</td><td>"+esc(x.status||"")+"</td><td>"+esc(x.description||"")+"</td><td>"+esc(x.url||"")+"</td></tr>";}).join("")+"</tbody></table><script>window.onload=function(){window.print()}<\/script></html>";var w=window.open("","_blank");if(!w){say("اسمح بالنوافذ المنبثقة للطباعة.",false);return;}w.document.open();w.document.write(html);w.document.close();}

  // ---------------- الواجهة ----------------
  function counts() {
    var c = {}; STANDARDS.forEach(function (s) { c[s.id] = 0; });
    standardItems().forEach(function (x) { (x.standards || []).forEach(function (id) { if (c[id] !== undefined) c[id]++; }); });
    return c;
  }

  function viewOverview() {
    var c = counts(), done = 0, wsum = 0, wdone = 0;
    STANDARDS.forEach(function (s) { wsum += s.weight; if (c[s.id]) { done++; wdone += s.weight; } });
    var cards = STANDARDS.map(function (s) {
      var n = c[s.id], need = s.required.length, pct = Math.min(100, Math.round((n / need) * 100));
      var color = n === 0 ? "#e11d48" : (pct >= 100 ? "#0e8f5f" : "#d97706");
      return '<div class="card p-4" style="border-right:5px solid ' + color + '">' +
        '<div class="flex items-center justify-between gap-2"><div class="font-extrabold">' + s.id + '. ' + esc(s.title) + '</div>' +
        '<span class="chip" style="pointer-events:none;font-size:.75rem">الوزن ' + s.weight + '</span></div>' +
        '<div class="text-xs mt-1" style="color:var(--sub)">الشواهد المطلوبة: ' + s.required.map(esc).join("، ") + '</div>' +
        '<div class="mt-2" style="height:8px;border-radius:99px;background:rgba(100,116,139,.2)"><div style="height:8px;border-radius:99px;width:' + pct + '%;background:' + color + '"></div></div>' +
        '<div class="flex items-center justify-between mt-2 text-sm"><span>' + n + ' شاهد</span>' +
        '<button class="btn btn-outline text-xs py-1 px-3" onclick="window.PFui.addFor(' + s.id + ')">➕ أضف شاهدًا</button></div></div>';
    }).join("");
    return '<div class="card p-4 mb-4 text-center"><div class="text-3xl font-black" style="color:var(--brand)">' + wdone + ' / ' + wsum + '</div>' +
      '<div class="text-sm" style="color:var(--sub)">أوزان المعايير الموثّقة بشاهد واحد على الأقل (' + done + ' من 11 معيارًا) — إجمالي الشواهد ' + PF.items.length + '</div></div>' +
      '<div class="grid gap-3 md:grid-cols-2">' + cards + '</div>';
  }

  function viewEvidence() {
    var q = PF.q.trim().toLowerCase();
    var list = standardItems().filter(function (x) {
      if (PF.fStd && (x.standards || []).indexOf(PF.fStd) < 0) return false;
      if (PF.fCat && x.category !== PF.fCat) return false;
      if (q && ((x.title || "") + " " + (x.description || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var catChips = '<button class="chip ' + (PF.fCat === "" ? "active" : "") + '" onclick="window.PFui.setCat(\'\')">الكل</button>' +
      CATEGORIES.map(function (c) { return '<button class="chip ' + (PF.fCat === c.id ? "active" : "") + '" onclick="window.PFui.setCat(\'' + c.id + '\')">' + c.icon + ' ' + c.label + '</button>'; }).join("");
    var stdOpts = '<option value="0">كل المعايير</option>' + STANDARDS.map(function (s) { return '<option value="' + s.id + '" ' + (PF.fStd === s.id ? "selected" : "") + '>' + s.id + '. ' + esc(s.title) + '</option>'; }).join("");
    var rows = list.map(function (x) {
      var c = catOf(x.category);
      return '<div class="card p-3 mb-2"><div class="flex items-start justify-between gap-2"><div>' +
        '<div class="font-bold">' + esc(x.title) + '</div>' +
        '<div class="text-xs mt-1" style="color:var(--sub)">' + (c ? c.icon + ' ' + esc(c.label) : '') + ' · ' + esc(x.date || '') + ' · المعايير: ' + (x.standards || []).join('، ') + '</div>' +
        (x.description ? '<div class="text-sm mt-1">' + esc(x.description) + '</div>' : '') +
        '<div class="flex gap-2 mt-2 flex-wrap">' +
        (x.url ? '<a class="chip" style="text-decoration:none" target="_blank" rel="noopener noreferrer" href="' + esc(x.url) + '">🔗 الرابط</a>' : '') +
        (x.hasFile ? '<button class="chip" onclick="window.PFui.openFile(\'' + x.id + '\')">📎 ' + esc(x.fileName || 'الملف') + '</button>' : '') + '</div></div>' +
        '<div class="flex gap-1"><button class="btn btn-outline text-xs py-1 px-2" onclick="window.PFui.edit(\'' + x.id + '\')">✏️</button>' +
        '<button class="btn btn-outline text-xs py-1 px-2" onclick="window.PFui.del(\'' + x.id + '\')">🗑️</button></div></div></div>';
    }).join("");
    return '<div class="flex gap-2 flex-wrap mb-2">' + catChips + '</div>' +
      '<div class="flex gap-2 mb-3"><select class="border rounded-xl px-3 py-2 bg-transparent text-sm" style="border-color:var(--line)" onchange="window.PFui.setStd(this.value)">' + stdOpts + '</select>' +
      '<input class="flex-1 border rounded-xl px-3 py-2 bg-transparent text-sm" style="border-color:var(--line)" placeholder="🔍 بحث في الشواهد" value="' + esc(PF.q) + '" oninput="window.PFui.setQ(this.value)"></div>' +
      '<div class="text-xs mb-2" style="color:var(--sub)">' + list.length + ' شاهد</div>' +
      (rows || '<div class="card p-6 text-center" style="color:var(--sub)">لا توجد شواهد مطابقة.</div>');
  }

  function viewForm(preStd) {
    var e = PF.editing ? PF.items.filter(function (x) { return x.id === PF.editing && !isWorkspaceItem(x); })[0] : null;
    var v = e || { title: "", description: "", category: "", standards: preStd ? [preStd] : [], date: today(), url: "" };
    var catOpts = '<option value="">اختر التصنيف…</option>' + CATEGORIES.map(function (c) { return '<option value="' + c.id + '" ' + (v.category === c.id ? "selected" : "") + '>' + c.icon + ' ' + c.label + '</option>'; }).join("");
    var stds = STANDARDS.map(function (s) {
      return '<label class="flex items-center gap-2 py-1 text-sm" style="cursor:pointer"><input type="checkbox" id="pf-s' + s.id + '" ' + ((v.standards || []).indexOf(s.id) >= 0 ? "checked" : "") + '> ' + s.id + '. ' + esc(s.title) + '</label>';
    }).join("");
    var inp = 'class="w-full border rounded-xl px-3 py-2 bg-transparent text-sm" style="border-color:var(--line)"';
    return '<div class="card p-4"><h2 class="font-extrabold mb-3">' + (e ? '✏️ تعديل شاهد' : '➕ شاهد جديد') + '</h2>' +
      '<div class="grid gap-3">' +
      '<div><label class="text-xs font-bold">عنوان الشاهد</label><input id="pf-title" ' + inp + ' value="' + esc(v.title) + '" oninput="window.PFui.hint()"></div>' +
      '<div><label class="text-xs font-bold">وصف مختصر</label><textarea id="pf-desc" rows="2" ' + inp + ' oninput="window.PFui.hint()">' + esc(v.description) + '</textarea></div>' +
      '<div id="pf-hint" class="text-xs" style="color:#8a5a00"></div>' +
      '<div class="grid md:grid-cols-2 gap-3"><div><label class="text-xs font-bold">التصنيف (ذراع الشواهد)</label><select id="pf-cat" ' + inp + '>' + catOpts + '</select></div>' +
      '<div><label class="text-xs font-bold">التاريخ</label><input id="pf-date" type="date" ' + inp + ' value="' + esc(v.date) + '"></div></div>' +
      '<div><label class="text-xs font-bold">المعايير المرتبطة</label><div class="grid md:grid-cols-2">' + stds + '</div></div>' +
      '<div><label class="text-xs font-bold">رابط الشاهد (Google Drive وغيره) — اختياري</label><input id="pf-url" type="url" dir="ltr" ' + inp + ' value="' + esc(v.url || "") + '" placeholder="https://"></div>' +
      '<div><label class="text-xs font-bold">أو ارفع ملفًا (صورة تُضغط تلقائيًا، أو PDF/Word حتى 600 كيلوبايت)</label><input id="pf-file" type="file" accept="image/*,.pdf,.doc,.docx" class="text-sm w-full">' +
      (e && e.hasFile ? '<div class="text-xs mt-1" style="color:var(--sub)">مرفق حالي: ' + esc(e.fileName || "") + ' (رفع ملف جديد يستبدله)</div>' : '') + '</div>' +
      '<div class="flex gap-2"><button id="pf-save" class="btn btn-brand flex-1 py-2.5" onclick="window.PFui.save()">💾 حفظ الشاهد</button>' +
      '<button class="btn btn-outline py-2.5 px-4" onclick="window.PFui.cancel()">إلغاء</button></div></div></div>';
  }

  function viewReport() {
    return '<div class="card p-4 mb-3"><h2 class="font-extrabold mb-1">🖨️ التقرير</h2>' +
      '<p class="text-sm mb-3" style="color:var(--sub)">تقرير مطبوع (A4) بالمعايير الـ 11 وعدد الشواهد لكل معيار وقائمتها، وتوقيع المعلم والمدير.</p>' +
      '<div class="flex gap-2 flex-wrap"><button class="btn btn-brand py-2 px-4" onclick="window.PFui.print(false)">🖨️ طباعة التقرير</button>' +
      '<button class="btn btn-outline py-2 px-4" onclick="window.PFui.print(true)">🖼️ طباعة مع الصور المرفقة</button></div></div>' +
      '<div class="card p-4 mb-3"><h2 class="font-extrabold mb-2">👤 بيانات المعلم (تظهر في التقرير)</h2><div class="grid md:grid-cols-2 gap-3">' +
      [["name", "اسم المعلم"], ["subject", "المادة"], ["school", "المدرسة"], ["year", "العام الدراسي"], ["principal", "مدير المدرسة"]].map(function (f) {
        return '<div><label class="text-xs font-bold">' + f[1] + '</label><input id="pf-p-' + f[0] + '" class="w-full border rounded-xl px-3 py-2 bg-transparent text-sm" style="border-color:var(--line)" value="' + esc((PF.profile || {})[f[0]] || "") + '"></div>';
      }).join("") + '</div><button class="btn btn-brand mt-3 py-2 px-4" onclick="window.PFui.saveProfile()">💾 حفظ البيانات</button></div>' +
      '<div class="card p-4"><h2 class="font-extrabold mb-1">💾 نسخة احتياطية</h2><p class="text-xs mb-2" style="color:var(--sub)">تحفظ بيانات الشواهد (بدون الملفات المرفقة) في ملف JSON.</p>' +
      '<div class="flex gap-2 flex-wrap"><button class="btn btn-outline py-2 px-4" onclick="window.PFui.exportJson()">⬇️ تصدير</button>' +
      '<label class="btn btn-outline py-2 px-4" style="cursor:pointer">⬆️ استيراد<input type="file" accept=".json" class="hidden" style="display:none" onchange="window.PFui.importJson(this.files[0])"></label></div></div>';
  }

  // تحميل وحدة الخطط عند أول استخدام فقط
  function ensurePlans(cb) {
    if (window.PlansUI) { cb(); return; }
    var s = document.createElement("script"); s.src = "plans.js?v=6";
    s.onload = cb;
    s.onerror = function () { var r = $("plans-root"); if (r) r.innerHTML = '<div class="card p-6 text-center">تعذّر تحميل plans.js — تأكد من رفعه بجانب portfolio.js.</div>'; };
    document.body.appendChild(s);
  }

  // دوال تستخدمها وحدات أخرى (الخطط) لتسجيل شاهد تلقائيًا
  function addEvidence(d) {
    var ref = db().collection("portfolio_items").doc();
    var doc = Object.assign({ hasFile: false, fileName: "", fileType: "", url: "", createdAt: Date.now(), updatedAt: Date.now() }, d);
    return ref.set(doc).then(function () { doc.id = ref.id; PF.items.unshift(doc); return ref.id; });
  }
  function updateEvidence(id, patch) {
    var it = PF.items.filter(function (x) { return x.id === id; })[0];
    if (!it) return addEvidence(patch).then(function () { return id; });
    Object.assign(it, patch, { updatedAt: Date.now() });
    return db().collection("portfolio_items").doc(id).set(it);
  }
  function removeEvidence(id) {
    PF.items = PF.items.filter(function (x) { return x.id !== id; });
    return db().collection("portfolio_items").doc(id).delete();
  }

  var preStdForm = 0;
  function draw() {
    if (!isAdmin()) { drawLogin(); return; }
    if (!PF.loaded) { app.innerHTML = '<div class="card p-8 text-center mt-10">جارٍ تحميل ملف الإنجاز…</div>'; if (!PF.loading) load().then(draw); return; }
    var tabs = [["overview", "🏠 المعايير"], ["evidence", "📎 الشواهد"], ["plans", "🩹 الخطط العلاجية والإثرائية"], ["cv", "👤 السيرة الذاتية"], ["form", "➕ إضافة شاهد"], ["report", "🖨️ التقرير"], ["workspace", "🗂️ أقسام الملف الموسعة"]];
    var body = PF.tab === "overview" ? viewOverview() : PF.tab === "evidence" ? viewEvidence() : PF.tab === "plans" ? '<div id="plans-root"><div class="card p-6 text-center">جارٍ تحميل الخطط…</div></div>' : PF.tab === "cv" ? viewCV() : PF.tab === "form" ? viewForm(preStdForm) : PF.tab === "workspace" ? workspaceView() : viewReport();
    app.innerHTML = '<div class="fade-in max-w-3xl mx-auto"><div class="flex items-center justify-between mb-3 mt-2"><h1 class="font-extrabold text-xl">📁 ملف إنجاز المعلم</h1>' +
      '<div class="flex gap-2"><button onclick="state.screen=\'admin\';render()" class="btn btn-outline text-sm py-2 px-3">⚙️ الإعدادات</button>' +
      '<button onclick="state.screen=\'setup\';render()" class="btn btn-outline text-sm py-2 px-3">رجوع</button></div></div>' +
      '<div class="flex gap-2 mb-3 flex-wrap">' + tabs.map(function (t) { return '<button class="chip ' + (PF.tab === t[0] ? "active" : "") + '" onclick="window.PFui.tab(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join("") + '</div>' +
      '<div id="pf-msg" class="text-sm mb-2" style="color:' + (PF.msgOk ? "#0e8f5f" : "#e11d48") + '">' + esc(PF.msg || "") + '</div>' + body + '</div>';
    PF.msg = "";
    if (PF.tab === "form") hint();
    if (PF.tab === "plans") ensurePlans(function () { window.PlansUI.mount($("plans-root")); });
  }

  function drawLogin() {
    app.innerHTML = '<div class="fade-in max-w-md mx-auto"><div class="card p-6 mt-10 text-center"><div class="text-4xl mb-2">📁</div><h2 class="font-extrabold text-lg mb-4">ملف إنجاز المعلم — دخول</h2>' +
      '<div class="grid gap-2 text-right"><input id="admin-email" type="email" placeholder="البريد الإلكتروني" class="w-full border rounded-xl px-3 py-2 bg-transparent" style="border-color:var(--line)">' +
      '<input id="admin-pass" type="password" placeholder="كلمة السر" class="w-full border rounded-xl px-3 py-2 bg-transparent" style="border-color:var(--line)"></div>' +
      '<div id="admin-login-err" class="text-xs mt-2" style="color:#e11d48;display:none"></div>' +
      '<button onclick="adminLogin()" class="btn btn-brand w-full mt-4 py-2.5">دخول</button>' +
      '<button onclick="state.screen=\'setup\';render()" class="btn btn-outline w-full mt-2 py-2">رجوع</button></div></div>';
  }

  function hint() {
    var el = $("pf-hint"); if (!el) return;
    var s = suggest(($("pf-title") || {}).value, ($("pf-desc") || {}).value);
    if (!s.category && !s.standards.length) { el.innerHTML = ""; return; }
    var c = catOf(s.category);
    el.innerHTML = '💡 اقتراح: ' + (c ? 'التصنيف «' + esc(c.label) + '»' : '') + (s.standards.length ? ' — المعايير ' + s.standards.join("، ") : '') +
      ' <button class="chip" style="font-size:.7rem" onclick="window.PFui.applyHint()">تطبيق</button>';
    el._s = s;
  }

  window.PFui = {
    tab: function (t) { PF.tab = t; if (t !== "form") PF.editing = null; preStdForm = 0; draw(); },
    workspaceModule: function(id){PF.workspaceModule=id;PF.workspaceEditing=null;PF.workspaceQ="";draw();},
    workspaceSearch: function(q){PF.workspaceQ=q;var pos=q.length;draw();var i=document.querySelector('input[placeholder="🔍 بحث في سجلات القسم"]');if(i){i.focus();i.setSelectionRange(pos,pos);}},
    workspaceEdit: function(id){PF.workspaceEditing=id;draw();},
    workspaceCancel: function(){PF.workspaceEditing=null;draw();},
    workspaceSave: workspaceSave,
    workspaceDelete: workspaceDelete,
    workspaceExport: workspaceExport,
    workspacePrint: workspacePrint,
    setCat: function (c) { PF.fCat = c; draw(); },
    setStd: function (v) { PF.fStd = parseInt(v, 10) || 0; draw(); },
    setQ: function (v) { PF.q = v; var pos = v.length; draw(); var i = document.querySelector('input[placeholder="🔍 بحث في الشواهد"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } },
    addFor: function (id) { PF.editing = null; preStdForm = id; PF.tab = "form"; draw(); },
    edit: function (id) { PF.editing = id; PF.tab = "form"; preStdForm = 0; draw(); },
    cancel: function () { PF.editing = null; PF.tab = "evidence"; draw(); },
    del: delItem, save: saveItem, openFile: openFile, saveProfile: saveProfile, print: printReport,
    exportJson: exportJson, importJson: importJson, hint: hint,
    applyHint: function () {
      var el = $("pf-hint"), s = el && el._s; if (!s) return;
      if (s.category && $("pf-cat") && !$("pf-cat").value) $("pf-cat").value = s.category;
      s.standards.forEach(function (id) { var c = $("pf-s" + id); if (c) c.checked = true; });
    },
    cvRow: cvRow, cvDel: cvDel, cvSave: saveCV, cvPrint: printCV,
    addEvidence: addEvidence, updateEvidence: updateEvidence, removeEvidence: removeEvidence,
    // للاختبار فقط
    _state: PF, _suggest: suggest, _counts: counts
  };

  window.renderPortfolio = draw;
})();
