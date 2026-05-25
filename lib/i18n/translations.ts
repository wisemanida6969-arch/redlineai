/* ------------------------------------------------------------------ */
/*  RedlineAI – Translation strings (EN / KO)                           */
/* ------------------------------------------------------------------ */

export type Lang = "en" | "ko";

export const translations = {
  /* ── Common ── */
  common: {
    upgrade:        { en: "Upgrade",         ko: "업그레이드" },
    signIn:         { en: "Sign in",         ko: "로그인" },
    signUp:         { en: "Try Free",        ko: "무료 시작" },
    signOut:        { en: "Sign out",        ko: "로그아웃" },
    dashboard:      { en: "Dashboard",       ko: "대시보드" },
    pricing:        { en: "Pricing",         ko: "가격" },
    help:           { en: "Help",            ko: "도움말" },
    helpGuide:      { en: "Help & Guide",    ko: "도움말 및 가이드" },
    contact:        { en: "Contact",         ko: "문의하기" },
    inquiries:      { en: "Contact",         ko: "문의" },
    save:           { en: "Save",            ko: "저장" },
    cancel:         { en: "Cancel",          ko: "취소" },
    download:       { en: "Download",        ko: "다운로드" },
    back:           { en: "Back",            ko: "뒤로" },
    next:           { en: "Next",            ko: "다음" },
    submit:         { en: "Submit",          ko: "제출" },
    loading:        { en: "Loading…",        ko: "불러오는 중…" },
    error:          { en: "Error",           ko: "오류" },
    locked:         { en: "Locked",          ko: "잠김" },
    unlimited:      { en: "Unlimited",       ko: "무제한" },
    free:           { en: "Free",            ko: "무료" },
    pro:            { en: "Pro",             ko: "프로" },
    business:       { en: "Business",        ko: "비즈니스" },
    plan:           { en: "Plan",            ko: "플랜" },
    poweredBy:      { en: "Powered by",      ko: "제공:" },
    operatedBy:     { en: "Operated by Pactbug.", ko: "운영: Pactbug" },
    copyright:      { en: "© 2026 RedlineAI. Operated by Pactbug.", ko: "© 2026 RedlineAI. 운영: Pactbug" },
    backToHome:     { en: "Back to Home",    ko: "홈으로 돌아가기" },
    backToDashboard:{ en: "Back to Dashboard →", ko: "대시보드로 돌아가기 →" },
  },

  /* ── Disclaimer Banner ── */
  disclaimer: {
    title:   { en: "RedlineAI uses AI to analyze contracts.", ko: "RedlineAI는 AI로 계약서를 분석합니다." },
    body:    {
      en: "Results are for informational purposes only and may contain errors. Always verify the output and consult a legal professional for important decisions.",
      ko: "결과는 참고용이며 오류가 있을 수 있습니다. 중요한 결정 전에는 반드시 법률 전문가와 상담하세요.",
    },
    dismiss: { en: "Dismiss disclaimer", ko: "안내 닫기" },
  },

  /* ── Landing Page ── */
  landing: {
    tag:           { en: "AI-Powered Contract Analysis", ko: "AI 기반 계약서 분석" },
    headline1:     { en: "Spot risky contract clauses", ko: "위험한 계약 조항을 찾아내세요" },
    headlineAccent:{ en: "before you sign", ko: "서명 전에" },
    sub:           {
      en: "RedlineAI scans your contracts in seconds, flags dangerous clauses, and gives you copy-paste ready rewrites. Powered by Claude AI.",
      ko: "RedlineAI는 몇 초 만에 계약서를 스캔하고 위험한 조항을 표시하며, 바로 복사해서 쓸 수 있는 대안 문구를 제공합니다. Claude AI 기반.",
    },
    ctaPrimary:    { en: "Scan a Contract Free →", ko: "무료로 계약서 스캔하기 →" },
    ctaSecondary:  { en: "See how it works",      ko: "사용 방법 보기" },
    noCard:        { en: "No credit card required · 3 free scans/month", ko: "신용카드 불필요 · 월 3회 무료" },

    /* Risk preview */
    sampleDoc:     { en: "sample_nda.pdf — Analysis complete", ko: "sample_nda.pdf — 분석 완료" },
    suggestedFix:  { en: "Suggested fix:", ko: "제안 수정안:" },

    /* How it works */
    howTitle:      { en: "How it works", ko: "사용 방법" },
    step:          { en: "Step",         ko: "단계" },
    howStep1Title: { en: "Upload your contract", ko: "계약서 업로드" },
    howStep1Desc:  { en: "Drag & drop a PDF or paste your contract text directly.", ko: "PDF를 드래그하거나 계약 내용을 붙여넣으세요." },
    howStep2Title: { en: "AI scans every clause", ko: "AI가 모든 조항 분석" },
    howStep2Desc:  { en: "Claude AI analyzes the entire document for risks, ambiguities, and one-sided terms.", ko: "Claude AI가 전체 문서에서 위험, 모호한 표현, 불공정 조항을 찾아냅니다." },
    howStep3Title: { en: "Get your risk report", ko: "리스크 리포트 받기" },
    howStep3Desc:  { en: "Receive a full report with severity ratings and copy-paste ready fix suggestions.", ko: "심각도 평가와 즉시 사용 가능한 수정 제안이 담긴 리포트를 받으세요." },

    /* Features */
    featuresTitle: { en: "Everything you need to review contracts safely", ko: "안전한 계약 검토에 필요한 모든 것" },
    f1Title: { en: "Risk categorization", ko: "리스크 분류" },
    f1Desc:  { en: "Every issue categorized as High, Medium, or Low severity so you know what to prioritize.", ko: "모든 이슈를 높음/중간/낮음으로 분류해 우선순위를 한눈에 파악합니다." },
    f2Title: { en: "Fix suggestions",  ko: "수정 제안" },
    f2Desc:  { en: "Each flagged clause comes with a professionally rewritten version you can copy instantly.", ko: "지적된 조항마다 바로 복사해 사용할 수 있는 전문가 수준의 수정안을 제공합니다." },
    f3Title: { en: "PDF export", ko: "PDF 내보내기" },
    f3Desc:  { en: "Download a clean, branded risk report to share with your team or lawyer.", ko: "팀이나 변호사에게 공유할 수 있는 깔끔한 리스크 리포트를 다운로드하세요." },
    f4Title: { en: "PDF & text upload", ko: "PDF 및 텍스트 업로드" },
    f4Desc:  { en: "Upload a PDF or paste raw contract text — we handle both formats seamlessly.", ko: "PDF 업로드와 텍스트 붙여넣기를 모두 매끄럽게 지원합니다." },

    /* Pricing */
    pricingTitle: { en: "Simple, transparent pricing", ko: "투명하고 단순한 가격" },
    pricingSub:   { en: "Start free. Upgrade when you need more.", ko: "무료로 시작하고 필요할 때 업그레이드하세요." },
    mostPopular:  { en: "Most Popular", ko: "가장 인기" },
    perMonth:     { en: "/month", ko: "/월" },

    /* Plan descriptions */
    planFreeDesc:     { en: "For individuals trying RedlineAI", ko: "RedlineAI를 처음 사용해 보는 개인용" },
    planProDesc:      { en: "For freelancers and small teams",  ko: "프리랜서와 소규모 팀을 위한" },
    planBusinessDesc: { en: "For teams reviewing contracts at scale", ko: "대량 계약을 검토하는 팀을 위한" },
    ctaFree:          { en: "Get started free", ko: "무료로 시작" },
    ctaPro:           { en: "Start Pro",        ko: "Pro 시작" },
    ctaBusiness:      { en: "Start Business",   ko: "Business 시작" },

    /* Features list (per plan) */
    featContractAnalysis:  { en: "Contract Analysis",  ko: "계약서 분석" },
    featQuoteToContract:   { en: "Quote to Contract",  ko: "견적서 → 계약서" },
    featVendorRiskScan:    { en: "Vendor Risk Scan",   ko: "공급업체 리스크 스캔" },
    featESignature:        { en: "E-Signature",        ko: "전자서명" },
    featPerMonth:          { en: "/month",             ko: "/월" },
    featLocked:            { en: "locked",             ko: "잠김" },
    featUnlimited:         { en: "Unlimited",          ko: "무제한" },
    featEmailSupport:      { en: "Email support",      ko: "이메일 지원" },
    featPrioritySupport:   { en: "Priority support",   ko: "우선 지원" },

    /* CTA */
    ctaSectionTitle: { en: "Ready to protect yourself?", ko: "자신을 보호할 준비가 되셨나요?" },
    ctaSectionSub:   { en: "Scan your first contract in under 60 seconds — free.", ko: "60초 안에 첫 계약서를 무료로 스캔하세요." },

    /* Risk levels */
    high:   { en: "high",   ko: "높음" },
    medium: { en: "medium", ko: "중간" },
    low:    { en: "low",    ko: "낮음" },
  },

  /* ── Auth ── */
  auth: {
    welcomeBack:      { en: "Welcome back", ko: "다시 오신 것을 환영합니다" },
    signInSubtitle:   { en: "Sign in to your RedlineAI account", ko: "RedlineAI 계정으로 로그인하세요" },
    continueGoogle:   { en: "Continue with Google", ko: "Google로 계속하기" },
    signingIn:        { en: "Signing in…", ko: "로그인 중…" },
    noAccount:        { en: "Don't have an account? Just sign in with Google — we'll create one automatically.", ko: "계정이 없으신가요? Google로 로그인하면 자동으로 계정이 생성됩니다." },

    createAccount:    { en: "Create your account", ko: "계정 만들기" },
    freeScans:        { en: "Get 3 free contract scans per month", ko: "매월 3회 무료 계약서 스캔" },
    noCreditCard:     { en: "No credit card", ko: "신용카드 불필요" },
    scansPerMonth:    { en: "3 free scans/month", ko: "월 3회 무료" },
    cancelAnytime:    { en: "Cancel anytime", ko: "언제든 해지" },
    signUpGoogle:     { en: "Sign up with Google", ko: "Google로 가입" },
    signingUp:        { en: "Signing up…", ko: "가입 중…" },
    alreadyHave:      { en: "Already have an account?", ko: "이미 계정이 있으신가요?" },

    agreeTerms:       { en: "By signing in, you agree to our", ko: "로그인하면 다음에 동의하는 것으로 간주됩니다:" },
    agreeTermsSignup: { en: "By signing up, you agree to our", ko: "가입하면 다음에 동의하는 것으로 간주됩니다:" },
    and:              { en: "and", ko: "및" },
    termsOfService:   { en: "Terms of Service", ko: "이용약관" },
    privacyPolicy:    { en: "Privacy Policy",   ko: "개인정보처리방침" },
    refundPolicy:     { en: "Refund Policy",    ko: "환불정책" },
  },

  /* ── Dashboard ── */
  dashboard: {
    title:            { en: "Dashboard", ko: "대시보드" },
    subtitle:         { en: "All-in-one AI contract toolkit.", ko: "올인원 AI 계약 도구." },
    viewGuide:        { en: "View guide →", ko: "가이드 보기 →" },
    manageSub:        { en: "Manage Subscription", ko: "구독 관리" },

    /* Feature tabs */
    tabAnalysis: { en: "Contract Analysis",  ko: "계약서 분석" },
    tabQuote:    { en: "Quote to Contract",  ko: "견적서 → 계약서" },
    tabVendor:   { en: "Vendor Risk Scan",   ko: "공급업체 리스크 스캔" },
    tabEsign:    { en: "E-Signature",        ko: "전자서명" },
    soon:        { en: "Soon", ko: "곧 출시" },

    /* Upload area */
    uploadFile:       { en: "Upload File",      ko: "파일 업로드" },
    pasteText:        { en: "Paste Text",       ko: "텍스트 붙여넣기" },
    dropFile:         { en: "Drop your file here", ko: "파일을 여기에 끌어다 놓으세요" },
    clickToBrowse:    { en: "or click to browse", ko: "또는 클릭해서 선택" },
    maxSize:          { en: "Max 20MB", ko: "최대 20MB" },
    pasteContract:    { en: "Paste your contract text here…", ko: "계약서 내용을 여기에 붙여넣으세요…" },
    scannedPdf:       { en: "Scanned PDF?", ko: "스캔된 PDF인가요?" },
    scannedPdfDesc:   { en: "RedlineAI uses Claude Vision to read it automatically.", ko: "RedlineAI가 Claude Vision으로 자동 인식합니다." },

    /* Analyze */
    analyze:          { en: "Analyze Contract →", ko: "계약서 분석하기 →" },
    extracting:       { en: "Extracting text…", ko: "텍스트 추출 중…" },
    analyzing:        { en: "Analyzing clauses with Claude AI…", ko: "Claude AI로 조항 분석 중…" },
    aiReviewing:      { en: "Claude AI is reviewing every clause…", ko: "Claude AI가 모든 조항을 검토 중…" },
    estimated:        { en: "~15–30s", ko: "약 15~30초" },

    /* History */
    recentScans:      { en: "Recent Scans",   ko: "최근 스캔 기록" },
    noScans:          { en: "No scans yet. Upload your first contract above!", ko: "아직 스캔 기록이 없습니다. 위에서 첫 계약서를 업로드해보세요!" },
    loadingHistory:   { en: "Loading history…", ko: "기록을 불러오는 중…" },

    /* Errors */
    selectFile:       { en: "Please upload a file first.", ko: "먼저 파일을 업로드하세요." },
    selectText:       { en: "Please paste your contract text.", ko: "계약서 내용을 붙여넣어 주세요." },
    onlyPdfDocx:      { en: "Please upload a PDF or DOCX file.", ko: "PDF 또는 DOCX 파일만 가능합니다." },
    tooLarge:         { en: "File too large. Max 20MB.", ko: "파일이 너무 큽니다. 최대 20MB." },

    /* Plan badge */
    freePlanLeft:     { en: "free scans left this month", ko: "이번 달 남은 무료 횟수" },
    upgradeNow:       { en: "Upgrade", ko: "업그레이드" },
  },

  /* ── Usage Counter ── */
  usage: {
    remaining:    { en: "remaining this month",        ko: "이번 달 남음" },
    limitReached: { en: "Limit reached. Resets on",    ko: "한도 도달. 갱신일:" },
    onlyLeft:     { en: "Only {n} left — upgrade for more.", ko: "{n}회 남음 — 업그레이드로 더 사용하세요." },
    usedOf:       { en: "Used {used} of {limit} this {month}. Resets on {reset}.", ko: "{month}에 {limit}회 중 {used}회 사용. 갱신일: {reset}." },
    unlimitedUsage: { en: "Unlimited usage", ko: "무제한 사용" },
    businessNoCap:  { en: "You're on the Business plan — no monthly cap.", ko: "Business 플랜 사용 중 — 월 한도 없음." },
    lockedOnPlan: { en: "is locked on the {plan} plan", ko: "은(는) {plan} 플랜에서 잠겨 있습니다" },
    upgradeToUnlock: { en: "Upgrade to unlock this feature.", ko: "업그레이드하여 이 기능을 사용하세요." },
  },

  /* ── Help Page ── */
  help: {
    badge:        { en: "User Guide",        ko: "사용 가이드" },
    title:        { en: "How RedlineAI works", ko: "RedlineAI 사용법" },
    sub:          { en: "Step-by-step guide for every feature.", ko: "기능별 단계별 가이드." },
    stillQuestions: { en: "Still have questions?", ko: "더 궁금한 점이 있으신가요?" },
    emailUs:      { en: "Email us anytime — we usually reply within 24 hours.", ko: "언제든 이메일 보내주세요 — 보통 24시간 내 답변드립니다." },
  },

  /* ── Footer ── */
  footer: {
    inquiries:    { en: "Contact:",          ko: "문의:" },
  },
};

/** Helper: get translated string by dotted key (e.g. "common.signIn") */
export function tKey(lang: Lang, key: string): string {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = translations;
  for (const p of parts) {
    if (node && typeof node === "object" && p in node) node = node[p];
    else return key; // fallback to key
  }
  if (node && typeof node === "object" && lang in node) return node[lang];
  return key;
}
