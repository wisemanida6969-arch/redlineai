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
    member:         { en: "Member",          ko: "멤버십" },
    plan:           { en: "Plan",            ko: "플랜" },
    poweredBy:      { en: "Powered by",      ko: "제공:" },
    operatedBy:     { en: "Operated by Pactbug.", ko: "운영: Pactbug" },
    copyright:      { en: "© 2026 RedlineAI. Operated by Pactbug.", ko: "© 2026 RedlineAI. 운영: Pactbug" },
    backToHome:     { en: "Back to Home",    ko: "홈으로 돌아가기" },
    backToDashboard:{ en: "Back to Dashboard →", ko: "대시보드로 돌아가기 →" },
  },

  /* ── Disclaimer Banner ── */
  disclaimer: {
    title:   { en: "RedlineAI uses AI to compare contracts against government standard forms.", ko: "RedlineAI는 AI로 계약서를 표준계약서와 비교합니다." },
    body:    {
      en: "Results are for informational purposes only and may contain errors. Always verify the output and consult a legal professional for important decisions.",
      ko: "결과는 참고용이며 오류가 있을 수 있습니다. 중요한 결정 전에는 반드시 법률 전문가와 상담하세요.",
    },
    dismiss: { en: "Dismiss disclaimer", ko: "안내 닫기" },
  },

  /* ── Landing Page ── */
  landing: {
    tag:           { en: "Based on Korean Government Standard Contracts", ko: "문화체육관광부 표준계약서 기반" },
    headline1:     { en: "Standard contracts for", ko: "프리랜서를 위한 계약서," },
    headlineAccent:{ en: "creative freelancers", ko: "정부 표준과 비교합니다" },
    sub:           {
      en: "Fine art · webtoon · performance · film · craft. Draft contracts from the government's official standard forms, and check the contracts you receive against the standard to see how each clause compares — powered by Claude AI.",
      ko: "미술·웹툰·공연·영화·공예. 문화체육관광부 표준계약서와 비교해 다른 점을 보여드립니다. 판단은 직접, 정보는 RedlineAI가.",
    },
    ctaHero:       { en: "Start Free →", ko: "무료로 비교해보기" },
    ctaPrimary:    { en: "Start Free →", ko: "무료로 시작하기 →" },
    ctaSecondary:  { en: "Browse standard contracts", ko: "표준계약서 둘러보기" },
    noCard:        { en: "No credit card · Built on official MCST standard forms", ko: "신용카드 불필요 · 문체부 공식 표준양식 기반" },

    /* Category preview */
    catTitle:      { en: "Official standard contracts, organized by field", ko: "분야별 공식 표준계약서를 한 곳에" },
    catSub:        { en: "Published by the Ministry of Culture, Sports and Tourism. Browse, download the official form, then draft or review with AI.", ko: "문화체육관광부가 배포한 표준계약서입니다. 둘러보고, 공식 양식을 받고, AI로 작성·검토하세요." },
    catTypesLabel: { en: "forms", ko: "종" },
    catViewAll:    { en: "Open the standard contract library →", ko: "표준계약서 라이브러리 열기 →" },

    /* Sample preview */
    sampleDoc:     { en: "webtoon_serialization.pdf — Reviewed vs. standard", ko: "웹툰_연재계약서.pdf — 표준 대비 검토 완료" },
    suggestedFix:  { en: "Standard form says:", ko: "표준양식 기준:" },

    /* How it works */
    howTitle:      { en: "How it works", ko: "사용 방법" },
    step:          { en: "Step",         ko: "단계" },
    howStep1Title: { en: "Pick your field", ko: "내 분야 선택" },
    howStep1Desc:  { en: "Choose the standard contract for your field — fine art, webtoon, performance, film, or craft.", ko: "미술·웹툰·공연·영화·공예 중 내 분야의 표준계약서를 고르세요." },
    howStep2Title: { en: "Draft or review with AI", ko: "AI로 작성 또는 검토" },
    howStep2Desc:  { en: "Enter your project terms to draft from the standard form, or upload a contract you received to compare it against the standard.", ko: "내 조건을 입력해 표준양식 기반 초안을 만들거나, 받은 계약서를 올려 표준과 비교 분석하세요." },
    howStep3Title: { en: "Sign with confidence", ko: "안심하고 계약" },
    howStep3Desc:  { en: "See which clauses differ from or are missing compared to the standard, update them, and sign knowing your rights are protected.", ko: "표준과 다르거나 빠진 보호 조항을 확인하고 수정한 뒤, 권리를 지킨 채 서명하세요." },

    /* Features */
    featuresTitle: { en: "Everything a creative freelancer needs to contract safely", ko: "창작 프리랜서가 안전하게 계약하는 데 필요한 모든 것" },
    f1Title: { en: "Standard contract library", ko: "표준계약서 라이브러리" },
    f1Desc:  { en: "Fine art (12), webtoon (8), performance (5), film (5), craft (5) — every official MCST standard form in one place, with a direct link to the authoritative download.", ko: "미술 12종·웹툰 8종·공연 5종·영화 5종·공예 5종 — 문체부 공식 표준양식을 한 곳에서, 원본 다운로드 링크와 함께." },
    f2Title: { en: "Review against the standard", ko: "표준 대비 검토" },
    f2Desc:  { en: "Upload a contract you were offered. AI compares it to the matching standard form and shows missing protections and clauses that differ from the standard.", ko: "제안받은 계약서를 올리면, AI가 해당 분야 표준양식과 비교해 빠진 보호 조항과 표준과 다른 조항을 표시합니다." },
    f3Title: { en: "Standard-form draft organizer", ko: "표준양식 기반 초안 정리 툴" },
    f3Desc:  { en: "Enter your project details and this automation tool organizes them into the official standard structure — no blank-page stress. Not legal advice.", ko: "내 프로젝트 조건만 입력하면 공식 표준 구조에 맞춰 초안을 정리해 드리는 자동화 도구입니다. 법률 자문이 아닙니다." },
    f4Title: { en: "Chat → Draft", ko: "대화 → 초안 정리" },
    f4Desc:  { en: "Agreed something over KakaoTalk? Drop a screenshot or paste the chat — this tool organizes it into a standard-form draft for you to review.", ko: "카톡으로 합의했나요? 스크린샷을 올리거나 대화를 붙여넣으면 표준 양식에 맞춰 초안으로 정리해 드립니다." },
    f5Title: { en: "AI legal assistant", ko: "AI 법률 도우미" },
    f5Desc:  { en: "Chat with AI to understand a clause, draft a negotiation message, or ask what a term means in plain Korean.", ko: "AI와 대화하며 조항을 이해하고, 협상 메시지를 작성하고, 어려운 용어를 쉬운 말로 물어보세요." },

    /* Sign recommendation card */
    signNeededTag:   { en: "After review", ko: "검토 이후" },
    signNeededTitle: { en: "Need to sign your contract?", ko: "계약서에 서명이 필요하신가요?" },
    signNeededBody:  {
      en: "RedlineAI focuses on drafting and reviewing contracts. For legally binding e-signatures, we recommend trusted Korean services like ModuSign or eformsign. Once your contract is reviewed and ready, you can sign it securely there.",
      ko: "RedlineAI는 계약서 작성과 검토에 집중하는 도구입니다. 법적 효력이 있는 전자서명은 모두싸인, 이폼사인 같은 검증된 서비스 이용을 권장드립니다. 검토와 수정이 끝난 계약서를 해당 서비스에서 안전하게 서명하실 수 있습니다." },
    signNeededLinkModoosign:   { en: "모두싸인 →", ko: "모두싸인 →" },
    signNeededLinkEformsign:   { en: "이폼사인 →", ko: "이폼사인 →" },
    signNeededLinkDocusign:    { en: "DocuSign →", ko: "DocuSign →" },
    signNeededLinkDropbox:     { en: "Dropbox Sign →", ko: "Dropbox Sign →" },

    /* Pricing */
    pricingTitle: { en: "Simple, transparent pricing", ko: "투명하고 단순한 가격" },
    pricingSub:   { en: "Start free. Upgrade when you need more.", ko: "무료로 시작하고 필요할 때 업그레이드하세요." },
    mostPopular:  { en: "Most Popular", ko: "가장 인기" },
    perMonth:     { en: "/month", ko: "/월" },

    /* Plan descriptions */
    planFreeDesc:     { en: "For creators trying RedlineAI", ko: "RedlineAI를 처음 써보는 창작자용" },
    planProDesc:      { en: "For active freelance creators",  ko: "활동 중인 프리랜서 창작자를 위한" },
    planBusinessDesc: { en: "For studios and agencies", ko: "스튜디오·에이전시를 위한" },
    planPrecedentPassDesc: { en: "One-time, 24-hour access", ko: "1회 구매, 24시간 이용 가능" },
    planVendorPassDesc:    { en: "One-time, 24-hour access", ko: "1회 구매, 24시간 이용 가능" },
    planMemberDesc:        { en: "For frequent precedent/vendor lookups", ko: "판례·업체스캔을 자주 쓰는 분에게" },
    ctaFree:          { en: "Get started free", ko: "무료로 시작" },
    ctaPro:           { en: "Start Pro",        ko: "Pro 시작" },
    ctaBusiness:      { en: "Start Business",   ko: "Business 시작" },
    betaNotice:       { en: "Beta pricing through", ko: "베타 기간 가격, ~" },
    pass24h:          { en: "24h pass", ko: "24시간" },

    /* Features list (per plan) */
    featStandardLibrary:   { en: "Standard contract library",  ko: "표준계약서 라이브러리" },
    featContractAnalysis:  { en: "Review against standard",  ko: "표준 대비 검토" },
    featQuoteToContract:   { en: "Draft organizer (standard / chat)",  ko: "표준양식 / 대화 → 초안 정리" },
    featVendorRiskScan:    { en: "Vendor Risk Scan",   ko: "공급업체 리스크 스캔" },
    featAIAgent:           { en: "AI legal assistant (chat)", ko: "AI 법률 도우미 (채팅)" },
    featChatMessages:      { en: "messages",           ko: "메시지" },
    featPerMonth:          { en: "/month",             ko: "/월" },
    featLocked:            { en: "locked",             ko: "잠김" },
    featUnlimited:         { en: "Unlimited",          ko: "무제한" },
    featEmailSupport:      { en: "Email support",      ko: "이메일 지원" },
    featPrioritySupport:   { en: "Priority support",   ko: "우선 지원" },
    featAllLangs:          { en: "Korean + English",   ko: "한국어 + 영어" },
    featChatScreenshot:    { en: "KakaoTalk / Slack screenshot OCR", ko: "카톡 / 슬랙 스크린샷 OCR" },
    featPrecedentSearch:   { en: "Court precedent search & list", ko: "법원 판례 검색·목록" },
    featPrecedentHolding:  { en: "Precedent holdings (issue & ruling)", ko: "판례 판결요지 열람" },

    /* CTA */
    ctaSectionTitle: { en: "Ready to contract safely?", ko: "안전하게 계약할 준비가 되셨나요?" },
    ctaSectionSub:   { en: "Browse the standard contracts and draft your first one — free.", ko: "표준계약서를 둘러보고 첫 계약서를 무료로 작성해보세요." },

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
    tabStandard: { en: "Standard Contracts", ko: "표준계약서" },
    tabAnalysis: { en: "Review",             ko: "계약서 검토" },
    tabQuote:    { en: "Draft Organizer",     ko: "초안 정리 툴" },
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
    analyze:          { en: "Compare Contract →", ko: "계약서 비교하기 →" },
    extracting:       { en: "Extracting text…", ko: "텍스트 추출 중…" },
    analyzing:        { en: "Comparing clauses with Claude AI…", ko: "Claude AI로 조항 비교 중…" },
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

    /* New 5th tab */
    tabAgent:         { en: "AI Agent", ko: "AI 에이전트" },
  },

  /* ── AI Agent ── */
  agent: {
    title:           { en: "AI Agent", ko: "AI 에이전트" },
    intro:           { en: "Chat with your AI legal assistant. Draft negotiation emails, get quick answers on contracts and business law, and explore alternative clause wording — optionally with your own contract attached for context.", ko: "AI 법률 어시스턴트와 대화하세요. 협상 이메일 초안 작성, 계약·비즈니스 법률 질문, 조항 수정 대안 탐색까지 — 필요하면 계약서를 첨부해 맥락 기반 답변을 받을 수 있습니다." },

    /* Conversation list */
    newChat:         { en: "+ New conversation", ko: "+ 새 대화" },
    yourChats:       { en: "Your conversations", ko: "내 대화 목록" },
    noChats:         { en: "No conversations yet. Start a new one!", ko: "아직 대화가 없습니다. 새 대화를 시작하세요!" },

    /* Empty / welcome screen */
    welcomeTitle:    { en: "Hi! How can I help you today?", ko: "안녕하세요! 무엇을 도와드릴까요?" },
    welcomeSub:      { en: "I can draft negotiation emails, answer contract questions, discuss clause wording, and more.", ko: "협상 이메일 작성, 계약 질문 답변, 조항 문구 논의 등을 도와드립니다." },
    suggested:       { en: "Example prompts", ko: "질문 예시" },
    prompt1:         { en: "Draft a polite email asking to reduce a contract's penalty clause to 50%.", ko: "계약서의 위약금 조항을 50%로 줄여달라는 정중한 이메일을 작성해줘." },
    prompt2:         { en: "What's the difference between a unilateral NDA and a mutual NDA?", ko: "일방 NDA와 상호 NDA의 차이가 뭐야?" },
    prompt3:         { en: "Explain what 'liquidated damages' means in plain language.", ko: "'손해배상예정액'이 무슨 뜻인지 쉬운 말로 설명해줘." },
    prompt4:         { en: "Review my attached contract and list the top 3 clauses I should negotiate.", ko: "첨부한 계약서를 검토해서 협상해야 할 상위 3개 조항을 알려줘." },

    /* Composer */
    placeholder:     { en: "Ask anything about contracts, draft a negotiation email…", ko: "계약 관련 무엇이든 물어보거나 협상 이메일을 요청하세요…" },
    send:            { en: "Send", ko: "전송" },
    sending:         { en: "Sending…", ko: "전송 중…" },
    thinking:        { en: "Thinking…", ko: "생각 중…" },
    attachContract:  { en: "Attach contract (optional)", ko: "계약서 첨부 (선택)" },
    contractAttached:{ en: "Contract attached:", ko: "첨부된 계약서:" },
    removeContract:  { en: "Remove", ko: "제거" },

    /* Messages */
    you:             { en: "You", ko: "나" },
    assistant:       { en: "AI Agent", ko: "AI 에이전트" },
    copy:            { en: "Copy", ko: "복사" },
    copied:          { en: "Copied!", ko: "복사됨!" },
    sendEmail:       { en: "Send as email", ko: "이메일로 보내기" },
    emailHint:       { en: "Opens your default email app with subject and body pre-filled.", ko: "기본 이메일 앱이 열리며 제목과 본문이 자동으로 입력됩니다." },

    /* Errors */
    failedSend:      { en: "Failed to send message", ko: "메시지 전송 실패" },
    onlyPdfDocx:     { en: "Please attach a PDF or DOCX file.", ko: "PDF 또는 DOCX 파일만 첨부 가능합니다." },
    tooLarge:        { en: "File too large. Max 10MB.", ko: "파일이 너무 큽니다. 최대 10MB." },
    extracting:      { en: "Reading contract…", ko: "계약서 읽는 중…" },

    /* Delete */
    deleteChat:      { en: "Delete conversation", ko: "대화 삭제" },
    deleteConfirm:   { en: "Delete this conversation? This cannot be undone.", ko: "이 대화를 삭제할까요? 되돌릴 수 없습니다." },
  },

  /* ── Standard Contract Library ── */
  standard: {
    title:        { en: "Standard Contracts", ko: "표준계약서" },
    intro:        { en: "Official standard contracts published by Korea's Ministry of Culture, Sports and Tourism. Browse by field, download the authoritative form, then draft or review with AI.", ko: "문화체육관광부가 배포한 분야별 공식 표준계약서입니다. 분야를 둘러보고 공식 양식을 내려받은 뒤, AI로 작성하거나 받은 계약서를 표준과 비교 검토하세요." },
    poweredByGov: { en: "Official forms by the Ministry of Culture, Sports and Tourism", ko: "문화체육관광부 공식 표준양식" },

    /* Category grid */
    fieldsLabel:  { en: "fields", ko: "개 분야" },
    formsLabel:   { en: "forms",  ko: "종" },
    typesIn:      { en: "forms in this field", ko: "종의 표준양식" },
    revisedLabel: { en: "Updated", ko: "기준" },
    openField:    { en: "Open", ko: "열기" },

    /* Type detail */
    backToFields: { en: "← All fields", ko: "← 분야 목록" },
    partiesLabel: { en: "Parties", ko: "당사자" },
    whenToUse:    { en: "When to use", ko: "이럴 때 사용" },
    downloadOfficial: { en: "Download official form", ko: "공식 양식 다운로드" },
    officialSource:   { en: "Official source", ko: "공식 출처" },

    /* Actions */
    actionDraft:  { en: "Draft this with AI", ko: "이 양식으로 AI 작성" },
    actionReview: { en: "Review a contract I received", ko: "받은 계약서 검토하기" },
    actionsTitle: { en: "What do you want to do?", ko: "무엇을 하시겠어요?" },

    /* Disclaimer */
    disclaimer:   { en: "⚠️ Always confirm against the official form from the Korea Artist Welfare Foundation / MCST. AI drafts and reviews are for reference — verify the final version against the official standard and consult a professional for important deals.", ko: "⚠️ 최종본은 반드시 한국예술인복지재단 / 문체부의 공식 양식과 대조하세요. AI 작성·검토 결과는 참고용이며, 중요한 계약은 공식 표준양식 확인과 전문가 상담을 권장합니다." },
    officialPortalKawf: { en: "Korea Artist Welfare Foundation", ko: "한국예술인복지재단" },
    officialPortalMcst: { en: "Ministry of Culture, Sports and Tourism", ko: "문화체육관광부 자료실" },

    /* Related precedents */
    precedentsTitle:      { en: "Related court precedents", ko: "관련 판례" },
    precedentsIntro:      { en: "Real Korean court cases related to disputes in this field. Open each official source for the full text.", ko: "이 분야 계약·저작권 분쟁과 관련된 실제 판례입니다. 각 판례의 공식 출처에서 전문을 확인하세요." },
    precedentsLoading:    { en: "Loading precedents…", ko: "판례 불러오는 중…" },
    precedentsNone:       { en: "No precedents registered for this field yet.", ko: "이 분야에 등록된 판례가 아직 없습니다." },
    precedentsSource:     { en: "View official source", ko: "공식 출처에서 보기" },
    precedentsGeneral:    { en: "All fields", ko: "전 분야 공통" },
    precedentsRef:        { en: "Precedent", ko: "판례" },
    precedentsCount:      { en: "cases", ko: "건" },
    precedentsSearchedAs: { en: "Searched for", ko: "검색어" },
    precedentsKeyTitle:   { en: "Key precedents", ko: "주요 판례" },
    precedentsFreeBadge:  { en: "Free", ko: "무료 제공" },
    precedentsLiveTitle:  { en: "Search court precedents (live)", ko: "법원 판례 실시간 검색" },
    precedentsSearchPlaceholder: { en: "Search by keyword (e.g. webtoon, copyright transfer)", ko: "키워드로 검색 (예: 웹툰, 저작권 양도, 전속계약)" },
    precedentsSearchBtn:  { en: "Search", ko: "검색" },
    precedentsSearching:  { en: "Searching…", ko: "검색 중…" },
    precedentsMore:       { en: "Load more", ko: "더 보기" },
    precedentsLiveNone:   { en: "No results. Try another keyword.", ko: "검색 결과가 없습니다. 다른 키워드로 검색해 보세요." },
    precedentsLiveSource: { en: "Live from the Korea Copyright Commission precedent database", ko: "출처: 한국저작권위원회 저작권판례 (실시간)" },
    precedentsLiveSourceLaw: { en: "Live from the Korea Law Information Center (MOLEG) precedent API", ko: "출처: 법제처 국가법령정보 판례 API (실시간)" },
    precedentsViewHolding: { en: "View holding", ko: "판결요지 보기" },
    precedentsHide:        { en: "Hide", ko: "접기" },
    precedentsIssue:       { en: "Issue", ko: "판시사항" },
    precedentsHolding:     { en: "Holding", ko: "판결요지" },
    precedentsDetailNone:  { en: "Could not load the holding.", ko: "판결요지를 불러올 수 없습니다." },
    precedentsLockedTitle: { en: "Holdings need a pass or membership", ko: "판결요지는 패스 또는 멤버십이 필요합니다" },
    precedentsLockedBody:  { en: "Searching and browsing case lists is free. Buy a 24h pass or join membership to read the full issue & holding inline.", ko: "검색과 사건 목록 보기는 무료입니다. 판시사항·판결요지 전체를 앱에서 바로 보려면 24시간 패스 또는 멤버십이 필요해요." },
    precedentsDisclaimer: { en: "⚠️ Precedents are for reference — outcomes depend on the specific facts. Check the official source and consult a professional for your situation.", ko: "⚠️ 판례는 참고용이며 구체적 사실관계에 따라 결론이 달라질 수 있습니다. 본인 사안은 공식 출처 확인과 전문가 상담이 필요합니다." },

    /* Selected-standard banner (shown on Review / Draft tabs) */
    bannerReview: { en: "Reviewing against standard", ko: "표준 대비 검토" },
    bannerDraft:  { en: "Drafting based on standard",  ko: "표준양식 기반 작성" },
    clear:        { en: "Clear", ko: "해제" },
    aiDraftNote:  { en: "AI drafted this following the structure of the standard form above. Download it and check against the official form before signing.", ko: "위 표준계약서 구조를 따라 AI가 작성한 초안입니다. 서명 전 공식 양식·전문가 검토와 대조하세요." },
    reviewModeNote: { en: "Upload the contract you received — AI compares it against this standard form and flags missing or weaker protections.", ko: "받은 계약서를 올리면 AI가 이 표준양식과 비교해 누락되거나 약화된 보호 조항을 표시합니다." },
  },

  /* ── Usage Counter ── */
  usage: {
    remaining:    { en: "remaining this month",        ko: "이번 달 남음" },
    limitReached: { en: "Limit reached. Resets on",    ko: "한도 도달. 갱신일:" },
    onlyLeft:     { en: "Only {n} left — upgrade for more.", ko: "{n}회 남음 — 업그레이드로 더 사용하세요." },
    usedOf:       { en: "Used {used} of {limit} this {month}. Resets on {reset}.", ko: "{month}에 {limit}회 중 {used}회 사용. 갱신일: {reset}." },
    unlimitedUsage: { en: "Unlimited usage", ko: "무제한 사용" },
    businessNoCap:  { en: "Free during the beta period — no monthly cap.", ko: "베타 기간 무료 — 월 한도 없음." },
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

  /* ── Quote to Contract ── */
  quote: {
    title:        { en: "Draft Organizer Tool", ko: "초안 정리 툴" },
    intro:        { en: "Upload a quote, paste a chat, or drop a screenshot — this automation tool extracts the terms and organizes them into a standard-form draft for you to review.", ko: "견적서 업로드, 카톡/슬랙 대화 붙여넣기, 또는 스크린샷 — 핵심 조건을 추출해 표준 양식에 맞춰 초안으로 정리해 드리는 자동화 도구입니다." },
    autoToolDisclaimer: {
      en: "This service is an \"automation tool\" that helps organize a standard-form draft based on your KakaoTalk chat content, and does not provide any legal advice. Final contractual responsibility rests with the parties.",
      ko: "본 서비스는 카톡 대화 내용을 바탕으로 표준 계약서 작성을 돕는 '자동화 도구'이며, 어떠한 법률 자문도 제공하지 않습니다. 최종 계약적 책임은 당사자에게 있습니다.",
    },
    autoMatchedNote: { en: "This tool analysed your content and auto-selected the MCST standard form above. Want a different one? Pick it in the 'Standard Contracts' tab. Verify against the official form before signing.", ko: "내용을 분석해 위 문체부 표준계약서를 자동 선택했습니다. 다른 양식을 원하면 '표준계약서' 탭에서 직접 고르세요. 서명 전 공식 양식·전문가 검토와 대조하세요." },
    dropQuote:    { en: "Drop your file here", ko: "파일을 여기에 끌어다 놓으세요" },
    clickBrowse:  { en: "or click to browse", ko: "또는 클릭해서 선택" },
    pdfOrDocx:    { en: "PDF, DOCX, HWPX, PNG, JPG, TXT · Max 20MB", ko: "PDF, DOCX, HWPX, PNG, JPG, TXT · 최대 20MB" },

    /* Modes */
    modeFile:        { en: "Upload File",   ko: "파일 업로드" },
    modeChat:        { en: "Paste Chat",    ko: "대화 붙여넣기" },
    modeManual:      { en: "Enter Manually", ko: "직접 입력" },
    manualIntro:     { en: "No quote or chat? Pick a field and enter the terms yourself.", ko: "견적서나 대화가 없으신가요? 분야를 고르고 조건을 직접 입력하세요." },
    manualFieldLabel:{ en: "Field", ko: "분야" },
    manualFormLabel: { en: "Standard form", ko: "표준양식" },
    manualGenericOption: { en: "None — generic contract", ko: "선택 안 함 — 일반 계약서" },
    manualSelectForm: { en: "Select a form", ko: "양식을 선택하세요" },
    manualStandardNote: { en: "Will draft on this standard form:", ko: "이 표준양식으로 작성합니다:" },
    manualStart:     { en: "Start drafting →", ko: "작성 시작하기 →" },
    chatHint:        { en: "Paste a conversation from KakaoTalk, Slack, Discord, WhatsApp, email, etc.", ko: "카톡, 슬랙, 디스코드, 왓츠앱, 이메일 등의 대화를 붙여넣으세요." },
    chatPlaceholder: { en: "[Kim] Can you do the design work?\n[Hong] Yes, when do you need it?\n[Kim] July 1 ~ September 30, 3 months, 5 million won, 50% upfront\n[Hong] Sounds good!", ko: "[김부장] 디자인 작업 가능하세요?\n[홍길동] 네, 일정 어떻게 되나요?\n[김부장] 7월 1일~9월 30일 3개월, 500만원, 50% 선금\n[홍길동] 좋습니다!" },
    fileHintScreenshot: { en: "📸 Chat screenshot? Just drop the image — Claude Vision will read it automatically.", ko: "📸 카톡 스크린샷? 이미지를 그대로 끌어다 놓으세요 — Claude Vision이 자동으로 읽습니다." },
    generate:     { en: "Generate Contract", ko: "계약서 생성하기" },
    readingQuote: { en: "Claude AI is reading your quote…", ko: "Claude AI가 견적서를 읽는 중…" },
    estimated:    { en: "~15–30s", ko: "약 15~30초" },

    /* Review */
    quoteAnalyzed:    { en: "Quote analyzed successfully!", ko: "견적서 분석 완료!" },
    reviewBelow:      { en: "Review and edit the extracted terms below, then generate your contract.", ko: "아래에서 추출된 조건을 검토·수정한 후 계약서를 생성하세요." },
    reviewTerms:      { en: "Review extracted terms", ko: "추출된 조건 검토" },
    uploadDifferent:  { en: "Upload a different quote", ko: "다른 견적서 업로드" },
    provider:         { en: "Provider (Seller / Vendor)", ko: "공급자 (판매자)" },
    client:           { en: "Client (Buyer)", ko: "고객 (구매자)" },
    companyName:      { en: "Company Name", ko: "회사명" },
    contactPerson:    { en: "Contact Person", ko: "담당자" },
    address:          { en: "Address", ko: "주소" },
    scopeOfWork:      { en: "Scope of Work", ko: "업무 범위" },
    serviceDescQ:     { en: "Service / Product Description", ko: "서비스/제품 설명" },
    payment:          { en: "Payment", ko: "결제" },
    totalAmount:      { en: "Total Amount", ko: "총 금액" },
    paymentTerms:     { en: "Payment Terms", ko: "결제 조건" },
    deliveryTerm:     { en: "Delivery / Term", ko: "납기/계약 기간" },
    deliveryDate:     { en: "Delivery Date or Duration", ko: "납기일 또는 계약 기간" },
    additionalTerms:  { en: "Additional Terms (Optional)", ko: "추가 조항 (선택)" },
    additionalTermsPlaceholder: { en: "Any extra terms, warranties, or conditions…", ko: "기타 조건, 보증 사항 등…" },
    previewContract:  { en: "Preview Contract", ko: "계약서 미리보기" },

    /* Preview */
    editTerms:        { en: "Edit terms", ko: "조건 수정" },
    downloadPdf:      { en: "Download PDF", ko: "PDF 다운로드" },
    generatingPdf:    { en: "Generating PDF…", ko: "PDF 생성 중…" },
    contractPreview:  { en: "Service Agreement Preview", ko: "용역 계약서 미리보기" },
    pdfReady:         { en: "A4 · PDF Ready", ko: "A4 · PDF 준비됨" },
    legalNotice:      { en: "⚠️ This is a template draft. Have a lawyer review before signing important contracts.", ko: "⚠️ 이것은 템플릿 초안입니다. 중요한 계약 서명 전 변호사 검토를 받으세요." },
    referencedTitle:  { en: "Related dispute cases", ko: "관련 분쟁 사례" },
    referencedIntro:  { en: "Real court disputes in this field. The clauses above follow the structure of the standard contract form — open each official source for details.", ko: "이 분야에서 실제 발생한 법원 분쟁입니다. 위 초안은 표준계약서 구조를 따라 관련 조항을 포함했어요. 자세한 내용은 각 공식 출처에서 확인하세요." },
    protectionsTitle: { en: "Precedent-based protections", ko: "판례 기반 보호 조항" },
    protectionsIntro: { en: "How specific clauses in this draft protect you — each tied to a real court dispute in your field.", ko: "이 계약서의 어떤 조항이, 실제 법원 분쟁을 근거로, 당신을 어떻게 보호하는지 보여줍니다." },
  },

  /* ── Vendor Risk Scan ── */
  vendor: {
    title:        { en: "Vendor Risk Scan", ko: "공급업체 리스크 스캔" },
    intro:        { en: "Type any vendor or supplier name. Claude AI searches the web for news, lawsuits, financial signals, and reputation risks — then delivers a complete due-diligence report.", ko: "공급업체명을 입력하세요. Claude AI가 뉴스·소송·재무·평판 정보를 웹에서 검색해 완전한 실사 리포트를 제공합니다." },
    passNotice:   { en: "This feature needs a 24h pass or membership.", ko: "이 기능은 24시간 패스 또는 멤버십이 필요합니다." },
    vendorName:   { en: "Vendor / Company Name", ko: "공급업체/회사명" },
    placeholder:  { en: "e.g., Acme Corp, Stripe, OpenAI, John's Plumbing LLC", ko: "예: Acme Corp, Stripe, OpenAI, 김배관 주식회사" },
    runScan:      { en: "Run Risk Scan", ko: "리스크 스캔 실행" },
    scanning:     { en: "Scanning…", ko: "스캔 중…" },
    researching:  { en: "Claude is researching the web…", ko: "Claude가 웹에서 조사 중…" },
    estimated:    { en: "~30–60s", ko: "약 30~60초" },
    enterName:    { en: "Please enter a vendor or company name.", ko: "공급업체 또는 회사명을 입력해주세요." },

    hintNews:        { en: "News", ko: "뉴스" },
    hintFinancials:  { en: "Financials", ko: "재무" },
    hintLegal:       { en: "Legal", ko: "법적 이슈" },
    hintReputation:  { en: "Reputation", ko: "평판" },

    /* Report */
    scanAnother:     { en: "Scan another vendor", ko: "다른 공급업체 스캔" },
    copySummary:     { en: "Copy Summary", ko: "요약 복사" },
    copied:          { en: "Copied!", ko: "복사됨!" },
    downloadReport:  { en: "Download Report", ko: "리포트 다운로드" },
    company:         { en: "Company", ko: "회사" },
    overall:         { en: "Overall", ko: "종합" },
    highRisk:        { en: "High Risk", ko: "높은 리스크" },
    mediumRisk:      { en: "Medium Risk", ko: "중간 리스크" },
    lowRisk:         { en: "Low Risk", ko: "낮은 리스크" },
    executiveSummary:{ en: "Executive Summary", ko: "임원 요약" },
    newsReputation:  { en: "News & Reputation Risk", ko: "뉴스 & 평판 리스크" },
    financialRisk:   { en: "Financial Risk", ko: "재무 리스크" },
    legalRisk:       { en: "Legal Risk", ko: "법적 리스크" },
    keyFindings:     { en: "Key findings", ko: "주요 발견사항" },
    riskBadge:       { en: "risk", ko: "리스크" },
    recommendations: { en: "Recommendations", ko: "권장사항" },
    sources:         { en: "Sources", ko: "출처" },
    disclaimer:      { en: "⚠️ AI-generated due-diligence summary. Verify critical findings before making business decisions.", ko: "⚠️ AI가 생성한 실사 요약입니다. 비즈니스 의사 결정 전에 중요한 발견사항을 검증하세요." },

    /* History */
    recentVendor:   { en: "Recent Vendor Scans", ko: "최근 공급업체 스캔" },
    noVendor:       { en: "No vendor scans yet. Run your first scan above!", ko: "아직 공급업체 스캔이 없습니다. 위에서 첫 스캔을 실행하세요!" },

    /* Disambiguation hints */
    optionalHints:  { en: "Optional details (helps narrow down if multiple companies share the name)", ko: "선택 입력 (동명회사 구분에 도움)" },
    /* placeholder reserved */
    placeholderEnd: { en: "", ko: "" },
    country:        { en: "Country",     ko: "국가" },
    countryPlaceholder: { en: "e.g., USA, Korea, Japan, India", ko: "예: 한국, 미국, 일본, 인도" },
    website:        { en: "Website",     ko: "웹사이트" },
    websitePlaceholder: { en: "e.g., samsung.com, apple.com", ko: "예: samsung.com, apple.com" },
    industry:       { en: "Industry",    ko: "업종" },
    industryPlaceholder: { en: "e.g., Software, Manufacturing, Logistics", ko: "예: 소프트웨어, 제조, 물류" },
    showHints:      { en: "+ Add details", ko: "+ 상세 정보 추가" },
    hideHints:      { en: "− Hide details", ko: "− 상세 정보 숨기기" },
  },

  /* ── E-Signature ── */
  esign: {
    title:         { en: "E-Signature", ko: "전자서명" },
    intro:         { en: "Upload a contract, place signature fields, and send it for legally-tracked e-signing. Get a signed PDF back automatically.", ko: "계약서를 업로드하고 서명 필드를 배치한 후 법적으로 추적되는 전자서명을 위해 발송하세요. 서명된 PDF를 자동으로 받습니다." },
    createNew:     { en: "Create New Signing Request", ko: "새 서명 요청 만들기" },
    recentReq:     { en: "Recent Requests", ko: "최근 요청" },
    noRequests:    { en: "No signing requests yet. Create your first above.", ko: "아직 서명 요청이 없습니다. 위에서 첫 요청을 만들어보세요." },

    /* Steps */
    step1Title:    { en: "Step 1 of 3 · Upload Contract", ko: "1/3 단계 · 계약서 업로드" },
    dropPdf:       { en: "Drop your PDF here", ko: "PDF를 여기에 끌어다 놓으세요" },
    clickBrowse:   { en: "or click to browse · Max 20MB · PDF only", ko: "또는 클릭해서 선택 · 최대 20MB · PDF만" },
    rendering:     { en: "Rendering PDF preview…", ko: "PDF 미리보기 생성 중…" },

    step2Title:    { en: "Step 2 of 3 · Place Signature Fields", ko: "2/3 단계 · 서명 필드 배치" },
    step2Sub:      { en: "Click on the document where you want each field to appear.", ko: "문서에서 각 필드를 표시할 위치를 클릭하세요." },
    signature:     { en: "Signature", ko: "서명" },
    nameField:     { en: "Name", ko: "이름" },
    dateField:     { en: "Date", ko: "날짜" },
    fieldsPlaced:  { en: "fields placed", ko: "필드 배치됨" },
    clickToAdd:    { en: "Click to add", ko: "클릭해서 추가" },
    pageOf:        { en: "of", ko: "/" },
    pageLabel:     { en: "Page", ko: "페이지" },
    nextAddSigner: { en: "Next: Add Signer →", ko: "다음: 서명자 추가 →" },

    step3Title:    { en: "Step 3 of 3 · Add Recipient", ko: "3/3 단계 · 수신자 추가" },
    document:      { en: "Document", ko: "문서" },
    fieldsPlacedShort:{ en: "fields placed", ko: "개 필드 배치됨" },
    docTitle:      { en: "Document Title", ko: "문서 제목" },
    signerName:    { en: "Signer Name", ko: "서명자 이름" },
    signerEmail:   { en: "Signer Email", ko: "서명자 이메일" },
    send:          { en: "Send Signing Request", ko: "서명 요청 발송" },
    sending:       { en: "Sending…", ko: "발송 중…" },
    nameEmailReq:  { en: "Signer name and email are required.", ko: "서명자 이름과 이메일이 필요합니다." },

    /* Sent */
    sent:              { en: "Sent!", ko: "발송 완료!" },
    sentDesc:          { en: "We emailed a signing link to", ko: "다음 주소로 서명 링크를 발송했습니다:" },
    sentDesc2:         { en: "They'll receive a unique URL to review and sign the document.", ko: "수신자는 문서를 검토하고 서명할 수 있는 고유 URL을 받게 됩니다." },
    signingLink:       { en: "Signing link (you can share this manually too)", ko: "서명 링크 (수동으로 공유할 수도 있습니다)" },
    done:              { en: "Done", ko: "완료" },

    /* Status */
    awaitingSignature: { en: "Awaiting signature", ko: "서명 대기 중" },
    signed:            { en: "Signed", ko: "서명 완료" },
    expired:           { en: "Expired", ko: "만료됨" },
    cancelled:         { en: "Cancelled", ko: "취소됨" },
    download:          { en: "Download", ko: "다운로드" },
    downloadingPdf:    { en: "PDF…", ko: "PDF…" },
    downloadingDocx:   { en: "Word…", ko: "Word…" },
    downloadSignedPdf: { en: "Signed contract · .pdf", ko: "서명된 계약서 · .pdf" },
    downloadSignedDocx:{ en: "Editable · .docx", ko: "편집 가능 · .docx" },
  },

  /* ── Analysis Page ── */
  analysis: {
    riskReport:     { en: "Standard Comparison Report", ko: "표준계약서 비교 리포트" },
    issuesFound:    { en: "differences found", ko: "개 항목 확인" },
    issueFound:     { en: "difference found", ko: "개 항목 확인" },
    scanAnother:    { en: "Scan another contract", ko: "다른 계약서 스캔" },
    downloadReport: { en: "Download Report", ko: "리포트 다운로드" },
    export:         { en: "Export", ko: "내보내기" },
    generatingPdf:  { en: "Generating PDF…", ko: "PDF 생성 중…" },
    generatingDocx: { en: "Generating DOCX…", ko: "DOCX 생성 중…" },
    downloadPdf:    { en: "Download PDF", ko: "PDF 다운로드" },
    downloadWord:   { en: "Download Word", ko: "Word 다운로드" },
    styledReport:   { en: "Styled report · .pdf", ko: "스타일 리포트 · .pdf" },
    editableDoc:    { en: "Editable document · .docx", ko: "편집 가능 문서 · .docx" },
    aiSummary:      { en: "Comparison Summary", ko: "비교 요약" },
    noIssues:       { en: "No differences from the standard in this category", ko: "이 카테고리에는 표준과 다른 점이 없습니다" },
    originalClause: { en: "Original clause", ko: "원문 조항" },
    whyRisky:       { en: "How it differs from the standard", ko: "표준과 다른 점" },
    suggestedFix:   { en: "Official Standard Text", ko: "표준계약서 원문" },
    standardSourcePrefix: { en: "Source: Korea MCST —", ko: "출처: 문화체육관광부" },
    copied:         { en: "Copied!", ko: "복사됨!" },
    copy:           { en: "Copy", ko: "복사" },
    downloadFailed: { en: "Download failed", ko: "다운로드 실패" },
    highRisk:       { en: "Differs significantly", ko: "표준과 큰 차이" },
    mediumRisk:     { en: "Differs somewhat", ko: "표준과 다소 차이" },
    lowRisk:        { en: "Differs slightly", ko: "표준과 경미한 차이" },
    tabAll:         { en: "all", ko: "전체" },
    tabHigh:        { en: "big diff", ko: "큰 차이" },
    tabMedium:      { en: "some diff", ko: "다소 차이" },
    tabLow:         { en: "minor diff", ko: "경미한 차이" },

    /* Send-to-client message */
    copyKakaoMsg:   { en: "Copy message to send", ko: "카톡 문구 복사하기" },
    copiedKakaoMsg: { en: "Copied!", ko: "복사됨!" },

    /* Related precedents (after review) */
    relatedPrecedents:      { en: "Related court precedents", ko: "관련 판례" },
    relatedPrecedentsIntro: { en: "Real precedents from disputes similar to this contract — found using keywords extracted from your contract. Tap a keyword or search your own.", ko: "이 계약과 비슷한 분쟁의 실제 판례입니다. 계약 내용에서 뽑아낸 검색어로 찾았어요. 키워드를 누르거나 직접 검색해 보세요." },
  },

  /* ── Precedent-view / vendor-scan pass & membership purchase ── */
  pass: {
    buyPass:     { en: "Buy 24h pass", ko: "24시간 패스 구매" },
    joinMember:  { en: "Join membership", ko: "멤버십 가입" },
    perMonth:    { en: "mo", ko: "월" },
    viewPricing: { en: "See pricing", ko: "가격 보기" },
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
