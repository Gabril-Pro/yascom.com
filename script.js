/**
 * script.js — حاسبة العملات
 * ===========================
 * - التنقل بين الصفحات (SPA)
 * - حاسبة العملات مع أسعار حية
 * - لا كوكيز، لا localStorage، لا تتبع
 */
"use strict";

/* ================================================
   ١. أسعار احتياطية (USD = 1 كقاعدة)
   ================================================ */
const FALLBACK_RATES = {
  USD: 1,      SDG: 601,    EUR: 0.92,   GBP: 0.79,
  SAR: 3.75,   AED: 3.67,   EGP: 48.5,   JPY: 157.5,
  CHF: 0.91,   CAD: 1.36,   TRY: 32.5,   CNY: 7.24,
  KWD: 0.308,  QAR: 3.64,   BHD: 0.376,  OMR: 0.385,
  JOD: 0.709,  MAD: 10.1,   DZD: 134.5,  TND: 3.12,
  ETB: 57.2,   INR: 83.5,   SEK: 10.6,   NOK: 10.8,
  AUD: 1.53,
};

const CURRENCY_NAMES = {
  USD: "دولار أمريكي",  SDG: "جنيه سوداني",    EUR: "يورو",
  GBP: "جنيه إسترليني", SAR: "ريال سعودي",     AED: "درهم إماراتي",
  EGP: "جنيه مصري",    JPY: "ين ياباني",       CHF: "فرنك سويسري",
  CAD: "دولار كندي",   TRY: "ليرة تركية",      CNY: "يوان صيني",
  KWD: "دينار كويتي",  QAR: "ريال قطري",       BHD: "دينار بحريني",
  OMR: "ريال عماني",   JOD: "دينار أردني",     MAD: "درهم مغربي",
  DZD: "دينار جزائري", TND: "دينار تونسي",     ETB: "بر إثيوبي",
  INR: "روبية هندية",  SEK: "كرونة سويدية",    NOK: "كرونة نرويجية",
  AUD: "دولار أسترالي",
};

/* ================================================
   ٢. حالة التطبيق
   ================================================ */
let liveRates    = null;
let ratesSource  = "احتياطي";
let currentPage  = "home";

/* ================================================
   ٣. التنقل بين الصفحات (SPA)
   ================================================ */
function showPage(pageId) {
  /* إخفاء كل الصفحات */
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  /* إظهار الصفحة المطلوبة */
  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.remove("hidden");

  /* تحديث الـ nav */
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  currentPage = pageId;
  window.scrollTo({ top: 0, behavior: "smooth" });

  /* تحميل جدول الأسعار عند فتح الحاسبة */
  if (pageId === "calculator") {
    loadRatesTable();
  }
}

/* ربط كل الروابط التي تحمل data-page */
function bindNavLinks() {
  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-page]");
    if (!el) return;
    e.preventDefault();
    showPage(el.dataset.page);
  });
}

/* ================================================
   ٤. جلب الأسعار من الإنترنت
   ================================================ */
async function fetchRates() {
  if (liveRates) return liveRates; /* استخدام الكاش إن وُجد */
  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data && data.rates) {
      liveRates   = data.rates;
      ratesSource = "مباشر";
      return liveRates;
    }
    throw new Error("بيانات غير صالحة");
  } catch (err) {
    console.warn("[حاسبة] تعذّر جلب الأسعار:", err.message);
    liveRates   = FALLBACK_RATES;
    ratesSource = "احتياطي";
    return liveRates;
  }
}

function getRates() {
  return liveRates || FALLBACK_RATES;
}

/* ================================================
   ٥. دالة التحويل
   ================================================ */
function convertCurrency(amount, from, to) {
  const rates = getRates();
  if (!rates[from] || !rates[to]) return null;
  return (amount / rates[from]) * rates[to];
}

/* ================================================
   ٦. تنسيق الأرقام
   ================================================ */
function formatNumber(num, currency) {
  if (num === null || isNaN(num)) return "—";
  const noDecimal = ["JPY", "SDG", "DZD", "ETB", "INR"];
  const decimals  = noDecimal.includes(currency) ? 0 : 2;
  return num.toLocaleString("ar-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ================================================
   ٧. منطق الحاسبة
   ================================================ */
function initCalculator() {
  const amountFromEl = document.getElementById("amount-from");
  const amountToEl   = document.getElementById("amount-to");
  const fromSelect   = document.getElementById("currency-from");
  const toSelect     = document.getElementById("currency-to");
  const convertBtn   = document.getElementById("convert-btn");
  const swapBtn      = document.getElementById("swap-btn");
  const resultBox    = document.getElementById("result-box");
  const resultRate   = document.getElementById("result-rate");
  const resultDetail = document.getElementById("result-detail");
  const errorBox     = document.getElementById("error-box");
  const errorMsg     = document.getElementById("error-msg");

  if (!amountFromEl) return;

  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.remove("hidden");
    resultBox.classList.add("hidden");
  }

  function showResult(amount, from, converted, to) {
    const rate1 = convertCurrency(1, from, to);
    const rate2 = convertCurrency(1, to, from);
    resultRate.textContent =
      formatNumber(amount, from) + " " + from +
      " = " +
      formatNumber(converted, to) + " " + to;
    resultDetail.textContent =
      "١ " + from + " = " + formatNumber(rate1, to) + " " + to +
      "  |  " +
      "١ " + to + " = " + formatNumber(rate2, from) + " " + from;
    resultBox.classList.remove("hidden");
    errorBox.classList.add("hidden");
  }

  function doConvert() {
    resultBox.classList.add("hidden");
    errorBox.classList.add("hidden");

    const rawAmount = parseFloat(amountFromEl.value);
    const from      = fromSelect.value;
    const to        = toSelect.value;

    if (amountFromEl.value.trim() === "" || isNaN(rawAmount)) {
      showError("الرجاء إدخال مبلغ صحيح.");
      amountToEl.value = "";
      return;
    }
    if (rawAmount < 0) {
      showError("المبلغ لا يمكن أن يكون سالباً.");
      amountToEl.value = "";
      return;
    }
    if (from === to) {
      amountToEl.value = rawAmount;
      showResult(rawAmount, from, rawAmount, to);
      return;
    }

    const converted = convertCurrency(rawAmount, from, to);
    if (converted === null) {
      showError("عملة غير مدعومة، يرجى المحاولة مرة أخرى.");
      return;
    }

    const noDecimal = ["JPY", "SDG", "DZD", "ETB", "INR"];
    amountToEl.value = converted.toFixed(noDecimal.includes(to) ? 0 : 2);
    showResult(rawAmount, from, converted, to);
  }

  /* إبدال العملتين */
  swapBtn.addEventListener("click", () => {
    const tmpVal = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value   = tmpVal;
    const tmpAmt     = amountFromEl.value;
    amountFromEl.value = amountToEl.value;
    amountToEl.value   = tmpAmt;
    if (amountFromEl.value) doConvert();
  });

  convertBtn.addEventListener("click", doConvert);
  amountFromEl.addEventListener("keydown", e => { if (e.key === "Enter") doConvert(); });
  fromSelect.addEventListener("change", () => { if (amountFromEl.value) doConvert(); });
  toSelect.addEventListener("change",   () => { if (amountFromEl.value) doConvert(); });
}

/* ================================================
   ٨. جدول الأسعار
   ================================================ */
async function loadRatesTable() {
  const tbody = document.getElementById("rates-body");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="3" class="loading-row">جارٍ تحميل الأسعار...</td></tr>';
  await fetchRates();

  const currencies = Object.keys(CURRENCY_NAMES).filter(c => c !== "SDG");
  const rows = currencies.map(code => {
    const rate = convertCurrency(1, code, "SDG");
    const name = CURRENCY_NAMES[code] || code;
    return `<tr>
      <td>${name}</td>
      <td><strong>${code}</strong></td>
      <td>${rate !== null ? formatNumber(rate, "SDG") : "—"} SDG</td>
    </tr>`;
  });

  tbody.innerHTML = rows.join("") +
    `<tr><td colspan="3" style="text-align:center;font-size:.78rem;color:#5a7a62;padding:.75rem;">
      المصدر: ${ratesSource} — الأسعار تقريبية وقد تختلف عن السوق
    </td></tr>`;
}

/* ================================================
   ٩. تشغيل التطبيق
   ================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  bindNavLinks();
  showPage("home");       /* ابدأ بالصفحة الرئيسية */
  initCalculator();       /* جهّز الحاسبة */
  fetchRates();           /* جلب الأسعار مسبقاً في الخلفية */
});
