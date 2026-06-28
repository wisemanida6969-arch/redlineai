/* ------------------------------------------------------------------ */
/*  RedlineAI – 한국 표준계약서 카탈로그                                  */
/*                                                                     */
/*  문화체육관광부(MCST)가 제·개정해 배포한 창작 분야 표준계약서 목록.    */
/*  원본 PDF는 각 부처/한국예술인복지재단(KAWF)에서 공식 배포한다.        */
/*  본 카탈로그는 "어떤 표준양식이 있는지" 안내 + 작성/검토의 기준으로     */
/*  쓰이며, 조항 전문(全文)을 임의로 재작성해 담지 않는다.               */
/* ------------------------------------------------------------------ */

export type Bi = { ko: string; en: string };

/** 관할 부처 (현재 1단계: 문체부. 추후 과기정통부 SW 6종 확장 예정) */
export type Ministry = "mcst";

export interface ContractType {
  /** 분야 내 고유 id (slug) */
  id: string;
  title: Bi;
  /** 언제 쓰는 계약인지 한 줄 설명 */
  desc: Bi;
  /** 누가 누구와 맺는 계약인지 (당사자) */
  parties: Bi;
}

export interface ContractCategory {
  id: string;
  title: Bi;
  /** 이모지 아이콘 (UI용) */
  emoji: string;
  ministry: Ministry;
  ministryLabel: Bi;
  /** 최신 제·개정 시점 (표기용) */
  revised: string;
  /** 공식 원본을 받을 수 있는 페이지 */
  sourceUrl: string;
  /** 분야 한 줄 소개 */
  blurb: Bi;
  types: ContractType[];
}

/* ── 공식 배포 포털 (전 분야 공통 다운로드처) ── */
export const OFFICIAL_PORTALS = {
  /** 한국예술인복지재단 – 표준계약서 보급 (분야별 PDF 일괄 다운로드) */
  kawf: "https://www.kawf.kr/welfare/sub03.do",
  /** 문화체육관광부 – 표준계약서 자료실 */
  mcst: "https://www.mcst.go.kr/kor/s_data/generalData/dataList.jsp?pMenuCD=0405050000",
} as const;

const mcstLabel: Bi = { ko: "문화체육관광부", en: "Ministry of Culture, Sports and Tourism" };

/* ================================================================== */
/*  문화체육관광부 표준계약서 (창작 분야)                               */
/* ================================================================== */

export const STANDARD_CONTRACTS: ContractCategory[] = [
  /* ── 미술 ── */
  {
    id: "art",
    title: { ko: "미술", en: "Fine Art" },
    emoji: "🎨",
    ministry: "mcst",
    ministryLabel: mcstLabel,
    revised: "2022.2 개정 · 12종",
    sourceUrl: "https://www.mcst.go.kr/kor/s_open/generalData/dataView.jsp?pMenuCD=0405050000&pSeq=25",
    blurb: {
      ko: "작가·화랑·미술관 사이의 전시, 매매, 위탁, 전속 관계를 위한 표준양식.",
      en: "Standard forms for exhibitions, sales, consignment, and exclusive deals between artists, galleries, and museums.",
    },
    types: [
      { id: "art-exhibit-consign", title: { ko: "전시 및 판매위탁 계약서 (작가–화랑)", en: "Exhibition & Consignment (Artist–Gallery)" }, desc: { ko: "작가가 화랑에 전시와 판매를 함께 위탁할 때.", en: "Artist consigns both exhibition and sales to a gallery." }, parties: { ko: "작가 ↔ 화랑", en: "Artist ↔ Gallery" } },
      { id: "art-exclusive", title: { ko: "전속계약서 (작가–화랑)", en: "Exclusive Agreement (Artist–Gallery)" }, desc: { ko: "작가가 특정 화랑과 전속 관계를 맺을 때.", en: "Artist enters an exclusive relationship with a gallery." }, parties: { ko: "작가 ↔ 화랑", en: "Artist ↔ Gallery" } },
      { id: "art-consign-gallery", title: { ko: "판매위탁 계약서 (작가–화랑)", en: "Sales Consignment (Artist–Gallery)" }, desc: { ko: "작가가 작품 판매만 화랑에 위탁할 때.", en: "Artist consigns only sales to a gallery." }, parties: { ko: "작가 ↔ 화랑", en: "Artist ↔ Gallery" } },
      { id: "art-consign-owner", title: { ko: "판매위탁 계약서 (소장자–화랑)", en: "Sales Consignment (Owner–Gallery)" }, desc: { ko: "소장자가 보유 작품 판매를 화랑에 위탁할 때.", en: "Owner consigns sales of a held artwork to a gallery." }, parties: { ko: "소장자 ↔ 화랑", en: "Owner ↔ Gallery" } },
      { id: "art-sale-gallery", title: { ko: "매매계약서 (매수인–화랑)", en: "Sale (Buyer–Gallery)" }, desc: { ko: "구매자가 화랑에서 작품을 살 때.", en: "Buyer purchases an artwork from a gallery." }, parties: { ko: "매수인 ↔ 화랑", en: "Buyer ↔ Gallery" } },
      { id: "art-sale-artist", title: { ko: "매매계약서 (매수인–작가)", en: "Sale (Buyer–Artist)" }, desc: { ko: "구매자가 작가에게서 작품을 직접 살 때.", en: "Buyer purchases an artwork directly from the artist." }, parties: { ko: "매수인 ↔ 작가", en: "Buyer ↔ Artist" } },
      { id: "art-exhibit", title: { ko: "전시계약서 (작가–미술관)", en: "Exhibition (Artist–Museum)" }, desc: { ko: "작가가 미술관에서 전시할 때.", en: "Artist exhibits at a museum." }, parties: { ko: "작가 ↔ 미술관", en: "Artist ↔ Museum" } },
      { id: "art-curate", title: { ko: "전시기획계약서 (독립기획자–미술관)", en: "Curation (Curator–Museum)" }, desc: { ko: "독립 기획자가 미술관 전시를 기획할 때.", en: "Independent curator plans a museum exhibition." }, parties: { ko: "독립기획자 ↔ 미술관", en: "Curator ↔ Museum" } },
      { id: "art-venue", title: { ko: "대관계약서", en: "Venue Rental" }, desc: { ko: "전시 공간을 빌릴 때.", en: "Renting an exhibition space." }, parties: { ko: "대관자 ↔ 공간 운영자", en: "Renter ↔ Venue operator" } },
      { id: "art-model", title: { ko: "모델계약서 (작가–모델)", en: "Model Agreement (Artist–Model)" }, desc: { ko: "작가가 작품 제작에 모델을 섭외할 때.", en: "Artist hires a model for artwork." }, parties: { ko: "작가 ↔ 모델", en: "Artist ↔ Model" } },
      { id: "art-architectural", title: { ko: "건축물 미술작품 제작계약서", en: "Architectural Artwork Commission" }, desc: { ko: "건축물에 설치할 미술작품을 제작할 때.", en: "Producing artwork to be installed in a building." }, parties: { ko: "작가 ↔ 발주자", en: "Artist ↔ Commissioner" } },
      { id: "art-coauthor", title: { ko: "공동창작계약서", en: "Joint Creation" }, desc: { ko: "여러 작가가 함께 작품을 만들 때.", en: "Multiple artists co-create a work." }, parties: { ko: "작가 ↔ 작가", en: "Artist ↔ Artist" } },
    ],
  },

  /* ── 만화·웹툰 ── */
  {
    id: "webtoon",
    title: { ko: "만화·웹툰", en: "Comics & Webtoon" },
    emoji: "💬",
    ministry: "mcst",
    ministryLabel: mcstLabel,
    revised: "2024.6 개정 · 8종",
    sourceUrl: "https://www.mcst.go.kr/kor/s_data/generalData/dataView.jsp?pMenuCD=0405050000&pSeq=51",
    blurb: {
      ko: "출판·연재·전자책·2차적저작물 등 만화/웹툰 창작자를 위한 표준양식.",
      en: "Standard forms for comic/webtoon creators: publishing, serialization, e-books, and derivative works.",
    },
    types: [
      { id: "wt-publish", title: { ko: "출판계약서", en: "Publishing" }, desc: { ko: "단행본 등 종이책으로 출판할 때.", en: "Publishing as a printed book." }, parties: { ko: "작가 ↔ 출판사", en: "Author ↔ Publisher" } },
      { id: "wt-ebook", title: { ko: "전자책(e-book) 발행계약서", en: "E-book Publishing" }, desc: { ko: "전자책으로 발행·유통할 때.", en: "Issuing and distributing as an e-book." }, parties: { ko: "작가 ↔ 발행사", en: "Author ↔ Publisher" } },
      { id: "wt-serialize", title: { ko: "웹툰 연재계약서", en: "Webtoon Serialization" }, desc: { ko: "플랫폼에 웹툰을 연재할 때.", en: "Serializing a webtoon on a platform." }, parties: { ko: "작가 ↔ 플랫폼/CP", en: "Author ↔ Platform/CP" } },
      { id: "wt-agency", title: { ko: "만화저작물 대리중개 계약서", en: "Agency / Brokerage" }, desc: { ko: "에이전시가 작가의 저작물을 대리·중개할 때.", en: "Agency represents/brokers the author's works." }, parties: { ko: "작가 ↔ 에이전시", en: "Author ↔ Agency" } },
      { id: "wt-coauthor", title: { ko: "공동저작 계약서", en: "Joint Authorship" }, desc: { ko: "글·그림 등 여러 창작자가 함께 만들 때.", en: "Multiple creators (story/art) work together." }, parties: { ko: "작가 ↔ 작가", en: "Author ↔ Author" } },
      { id: "wt-commission", title: { ko: "기획만화계약서", en: "Commissioned Comics" }, desc: { ko: "기획사가 주제를 정해 만화 제작을 의뢰할 때.", en: "A studio commissions comics on a set theme." }, parties: { ko: "작가 ↔ 기획사", en: "Author ↔ Studio" } },
      { id: "wt-derivative-license", title: { ko: "2차적저작물작성권 이용허락 계약서", en: "Derivative Works – License" }, desc: { ko: "영상화·게임화 등 2차 창작을 '허락'할 때 (권리 보유).", en: "Licensing derivative works (film, game) while keeping rights." }, parties: { ko: "작가 ↔ 이용자", en: "Author ↔ Licensee" } },
      { id: "wt-derivative-transfer", title: { ko: "2차적저작물작성권 양도계약서", en: "Derivative Works – Transfer" }, desc: { ko: "2차적저작물 작성권을 '양도'할 때 (권리 이전).", en: "Transferring the right to create derivative works." }, parties: { ko: "작가 ↔ 양수인", en: "Author ↔ Transferee" } },
    ],
  },

  /* ── 공연예술 ── */
  {
    id: "performing",
    title: { ko: "공연예술", en: "Performing Arts" },
    emoji: "🎭",
    ministry: "mcst",
    ministryLabel: mcstLabel,
    revised: "5종 (출연·창작·기술지원·대관)",
    sourceUrl: "https://www.mcst.go.kr/kor/s_data/generalData/dataView.jsp?pMenuCD=0405050000&pSeq=47",
    blurb: {
      ko: "출연·창작·무대 기술지원·대관 등 공연 현장을 위한 표준양식.",
      en: "Standard forms for performances: appearance, creative work, stage tech support, and venue rental.",
    },
    types: [
      { id: "pf-appear", title: { ko: "출연계약서", en: "Appearance / Performance" }, desc: { ko: "배우·연주자 등이 공연에 출연할 때.", en: "Actors/musicians appear in a performance." }, parties: { ko: "실연자 ↔ 제작자", en: "Performer ↔ Producer" } },
      { id: "pf-create", title: { ko: "창작계약서", en: "Creative Work" }, desc: { ko: "연출·작곡·안무 등 창작 작업을 맡길 때.", en: "Commissioning directing, composing, choreography." }, parties: { ko: "창작자 ↔ 제작자", en: "Creator ↔ Producer" } },
      { id: "pf-tech-labor", title: { ko: "기술지원 표준근로계약서", en: "Tech Support – Employment" }, desc: { ko: "무대·조명·음향 등 기술 인력을 근로 형태로 쓸 때.", en: "Hiring stage/lighting/sound staff as employees." }, parties: { ko: "기술인력 ↔ 제작자", en: "Tech staff ↔ Producer" } },
      { id: "pf-tech-service", title: { ko: "기술지원 표준용역계약서", en: "Tech Support – Service" }, desc: { ko: "무대 기술 인력을 용역(프리랜서)으로 쓸 때.", en: "Engaging stage tech staff as freelance/service." }, parties: { ko: "기술인력 ↔ 제작자", en: "Tech staff ↔ Producer" } },
      { id: "pf-venue", title: { ko: "대관계약서", en: "Venue Rental" }, desc: { ko: "공연장을 빌릴 때.", en: "Renting a performance venue." }, parties: { ko: "대관자 ↔ 공연장", en: "Renter ↔ Venue" } },
    ],
  },

  /* ── 영화 ── */
  {
    id: "film",
    title: { ko: "영화", en: "Film" },
    emoji: "🎬",
    ministry: "mcst",
    ministryLabel: mcstLabel,
    revised: "시나리오 4종(2015) · 근로(2024.5)",
    sourceUrl: "https://www.mcst.go.kr/kor/s_data/generalData/dataView.jsp?pMenuCD=0405050000&pSeq=13",
    blurb: {
      ko: "각본·각색·영화화 권리 등 영화 창작자를 위한 표준양식.",
      en: "Standard forms for film creators: screenplay, adaptation, and film rights.",
    },
    types: [
      { id: "fm-rights-license", title: { ko: "영화화 권리 이용허락 계약서", en: "Film Rights – License" }, desc: { ko: "원작을 영화로 만들 권리를 '허락'할 때.", en: "Licensing the right to adapt source material into film." }, parties: { ko: "원작자 ↔ 제작사", en: "Author ↔ Producer" } },
      { id: "fm-rights-transfer", title: { ko: "영화화 권리 양도 계약서", en: "Film Rights – Transfer" }, desc: { ko: "영화화 권리를 '양도'할 때.", en: "Transferring film adaptation rights." }, parties: { ko: "원작자 ↔ 제작사", en: "Author ↔ Producer" } },
      { id: "fm-screenplay", title: { ko: "각본 계약서", en: "Screenplay" }, desc: { ko: "시나리오 작가가 각본을 집필할 때.", en: "Screenwriter writes an original screenplay." }, parties: { ko: "작가 ↔ 제작사", en: "Writer ↔ Producer" } },
      { id: "fm-adaptation", title: { ko: "각색 계약서", en: "Adaptation" }, desc: { ko: "기존 각본을 각색할 때.", en: "Adapting an existing screenplay." }, parties: { ko: "작가 ↔ 제작사", en: "Writer ↔ Producer" } },
      { id: "fm-labor", title: { ko: "영화산업 근로표준계약서", en: "Film Industry Employment" }, desc: { ko: "영화 제작 스태프를 근로 형태로 고용할 때.", en: "Employing film production staff." }, parties: { ko: "스태프 ↔ 제작사", en: "Staff ↔ Producer" } },
    ],
  },

  /* ── 공예 ── */
  {
    id: "craft",
    title: { ko: "공예", en: "Craft" },
    emoji: "🏺",
    ministry: "mcst",
    ministryLabel: mcstLabel,
    revised: "2021.7 제정 · 5종",
    sourceUrl: OFFICIAL_PORTALS.kawf,
    blurb: {
      ko: "공예품 전시·판매·위탁·디자인 개발을 위한 표준양식.",
      en: "Standard forms for craft works: exhibition, sales, consignment, and design development.",
    },
    types: [
      { id: "cf-exhibit-consign", title: { ko: "전시 및 판매위탁 계약서", en: "Exhibition & Consignment" }, desc: { ko: "공예품 전시와 판매를 함께 위탁할 때.", en: "Consigning craft exhibition and sales together." }, parties: { ko: "공예가 ↔ 판매처", en: "Craftsperson ↔ Seller" } },
      { id: "cf-consign", title: { ko: "판매위탁 계약서", en: "Sales Consignment" }, desc: { ko: "공예품 판매만 위탁할 때.", en: "Consigning only the sale of craft works." }, parties: { ko: "공예가 ↔ 판매처", en: "Craftsperson ↔ Seller" } },
      { id: "cf-sale", title: { ko: "판매계약서", en: "Sale" }, desc: { ko: "공예품을 직접 판매할 때.", en: "Selling craft works directly." }, parties: { ko: "공예가 ↔ 매수인", en: "Craftsperson ↔ Buyer" } },
      { id: "cf-design", title: { ko: "공예품 디자인 개발 용역계약서", en: "Craft Design Development Service" }, desc: { ko: "공예품 디자인 개발을 의뢰받을 때.", en: "Commissioned to develop craft product design." }, parties: { ko: "공예가 ↔ 발주자", en: "Craftsperson ↔ Client" } },
      { id: "cf-venue", title: { ko: "대관계약서", en: "Venue Rental" }, desc: { ko: "공예 전시 공간을 빌릴 때.", en: "Renting a craft exhibition space." }, parties: { ko: "대관자 ↔ 공간 운영자", en: "Renter ↔ Venue operator" } },
    ],
  },
];

/* ── 헬퍼 ── */

/** id로 분야 찾기 */
export function getCategory(id: string): ContractCategory | undefined {
  return STANDARD_CONTRACTS.find((c) => c.id === id);
}

/** 분야 id + 계약 type id로 특정 계약 찾기 */
export function getContractType(categoryId: string, typeId: string): ContractType | undefined {
  return getCategory(categoryId)?.types.find((t) => t.id === typeId);
}

/** 전체 표준계약서 개수 (UI 카운트용) */
export const TOTAL_CONTRACT_COUNT = STANDARD_CONTRACTS.reduce((n, c) => n + c.types.length, 0);

/** 전체 분야 개수 */
export const TOTAL_CATEGORY_COUNT = STANDARD_CONTRACTS.length;
