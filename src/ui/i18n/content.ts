import { lang } from "./index";

/**
 * Arabic display text for the phase names and item titles that Nasaq's own templates write into project.yml.
 * project.yml itself stays in English (AI tools read it). This map only changes what the page shows.
 * A title the user edited, or wrote themselves, is not in the map and is shown exactly as written.
 */
const AR: Readonly<Record<string, string>> = {
  // Phase names
  Applications: "التطبيقات",
  Build: "البناء",
  Define: "التحديد",
  Design: "التصميم",
  Discover: "الاستكشاف",
  Discovery: "الاستكشاف",
  Handoff: "التسليم للتطوير",
  Handover: "التسليم",
  "Identity core": "أساس الهوية",
  Release: "الإصدار",
  Setup: "التجهيز",
  Spec: "المواصفات",
  Strategy: "الاستراتيجية",
  System: "النظام",
  Validate: "التحقق",
  Verify: "الفحص",

  // Size history
  "Initial sizing": "تحديد الحجم الأولي",

  // Brand items
  "Questionnaire + 5 peers": "استبيان + 5 علامات منافسة",
  "Stakeholder call, peer audit": "مكالمة مع أصحاب القرار ومراجعة المنافسين",
  "Workshop, name and trademark screen": "ورشة عمل وفحص أولي للاسم والعلامة التجارية",
  "One positioning line, 3 attributes": "جملة تموضع واحدة و3 سمات",
  "One-page strategy": "استراتيجية في صفحة واحدة",
  "Full strategy, voice, architecture": "استراتيجية كاملة ونبرة الصوت وهيكل العلامة",
  "1 direction: logo AR/EN, colour, type": "اتجاه واحد: شعار عربي/إنجليزي، ألوان، خطوط",
  "2 routes, then refine one": "اتجاهان ثم تطوير أحدهما",
  "2–3 routes, full lockup set": "2–3 اتجاهات ومجموعة كاملة من تراكيب الشعار",
  "1-page usage sheet": "ورقة استخدام من صفحة واحدة",
  "Tokens, grid, 10–20 page guide": "القيم الأساسية والشبكة ودليل من 10–20 صفحة",
  "Full brand book, sub-brand rules, stretch test": "دليل هوية كامل وقواعد العلامات الفرعية واختبار التمدد",
  "2–3 mock-ups": "2–3 نماذج عرض",
  "3–6 real applications, tested on screen": "3–6 تطبيقات فعلية مختبرة على الشاشة",
  "All touchpoints, print proofs, field tests": "كل نقاط التواصل وبروفات الطباعة واختبارات ميدانية",
  "Files + sheet": "الملفات + ورقة الاستخدام",
  "Files, templates, guide": "الملفات والقوالب والدليل",
  "Files, templates, licences, usage session": "الملفات والقوالب والتراخيص وجلسة شرح الاستخدام",

  // UI/UX items
  "Goal, audience, 3–5 references": "الهدف والجمهور و3–5 مراجع",
  "Competitor review, audit of the current UI, analytics if available": "مراجعة المنافسين وتدقيق الواجهة الحالية والتحليلات إن وُجدت",
  "User interviews, audit, analytics, content inventory": "مقابلات المستخدمين والتدقيق والتحليلات وجرد المحتوى",
  "One problem statement, one flow": "صياغة واحدة للمشكلة ومسار واحد",
  "Flows, sitemap, requirements list": "المسارات وخريطة الموقع وقائمة المتطلبات",
  "IA, journeys, prioritised requirements, success metrics": "هيكلة المعلومات والرحلات والمتطلبات مرتبة ومقاييس النجاح",
  "Straight to hi-fi": "تصميم نهائي مباشرة",
  "Wireframes → UI → small component kit and tokens": "مخططات أولية ← واجهة ← مجموعة مكونات صغيرة وقيم أساسية",
  "Wireframes → UI → design system (tokens, components, states, RTL)": "مخططات أولية ← واجهة ← نظام تصميم (قيم، مكونات، حالات، RTL)",
  "Self-check: contrast, mobile, RTL": "فحص ذاتي: التباين والجوال و RTL",
  "One round of usability testing on a prototype": "جولة واحدة لاختبار الاستخدام على نموذج أولي",
  "Testing rounds, accessibility audit": "جولات اختبار وتدقيق إمكانية الوصول",
  "Annotated screens": "شاشات مشروحة",
  "Specs, tokens, states, assets": "المواصفات والقيم والحالات والأصول",
  "Specs, token file, component docs, edge cases": "المواصفات وملف القيم وتوثيق المكونات والحالات الطرفية",

  // Development items
  "Tech-spec: goal, files, acceptance check": "مواصفة تقنية: الهدف والملفات وفحص القبول",
  "PRD-lite + data model + API list": "وثيقة متطلبات مختصرة + نموذج البيانات + قائمة الواجهات البرمجية",
  "PRD, architecture, data model, API contract, non-functional needs": "وثيقة المتطلبات والمعمارية ونموذج البيانات وعقد الواجهات والمتطلبات غير الوظيفية",
  Branch: "فرع (branch)",
  "Branch, preview deploy, env list": "فرع ونشر تجريبي وقائمة متغيرات البيئة",
  "CI, staging, secrets handling, migration plan, rollback plan": "التكامل المستمر وبيئة تجريبية وإدارة الأسرار وخطة الترحيل وخطة التراجع",
  "1 session": "جلسة واحدة",
  "Phases of up to 5 milestones, one per session": "مراحل من 5 محطات كحد أقصى، واحدة في كل جلسة",
  "Sprints of up to 5 milestones, one per session": "سبرنتات من 5 محطات كحد أقصى، واحد في كل جلسة",
  "Typecheck, existing tests, manual check": "فحص الأنواع والاختبارات الحالية وفحص يدوي",
  "New tests, security baseline, preview check": "اختبارات جديدة وأساسيات الأمان وفحص النسخة التجريبية",
  "Test cases per sprint, security register, performance and accessibility": "حالات اختبار لكل سبرنت وسجل الأمان والأداء وإمكانية الوصول",
  "Your approval, merge": "موافقتك ثم الدمج",
  "Your approval, merge, smoke test": "موافقتك ثم الدمج واختبار سريع",
  "Release candidate, your approval, monitored release": "نسخة مرشحة ثم موافقتك ثم إصدار تحت المراقبة",
};

/** English keys of the map, for tests. */
export const CONTENT_KEYS: readonly string[] = Object.keys(AR);

/** Display text for a phase name, item title or history reason that came from project.yml. */
export function content(text: string): string {
  return lang() === "ar" ? (AR[text] ?? text) : text;
}

/**
 * Wraps a value from project.yml in a first-strong isolate, so a Latin title that starts with a
 * number ("2 routes") keeps its order inside an Arabic sentence. Arabic titles are unaffected.
 */
export function isolate(value: string): string {
  return lang() === "ar" ? `⁨${value}⁩` : value;
}
