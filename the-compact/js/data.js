// Static game data: companies, characters, origins, story events, letters.
// All people and events are fictional. Company names are used only as scenario flavor.

export const COMPANIES = [
  { id: 'NV', kr: '엔비디아', en: 'NVIDIA', color: '#76b900', ceo: 'jonah', rev: 63.0, nm: 0.71, g: 0.07, pe: 31.6, cash: 62, desc: 'GPU 설계', pub: true },
  { id: 'AP', kr: '애플', en: 'APPLE', color: '#8a8f98', ceo: null, rev: 112.4, nm: 0.26, g: 0.02, pe: 42, cash: 160, desc: '기기·서비스', pub: true },
  { id: 'GO', kr: '알파벳', en: 'ALPHABET', color: '#d99a00', ceo: null, rev: 96.1, nm: 0.30, g: 0.035, pe: 36, cash: 110, desc: '검색·클라우드·TPU', pub: true },
  { id: 'MS', kr: '마이크로소프트', en: 'MICROSOFT', color: '#0b7fb8', ceo: null, rev: 81.6, nm: 0.36, g: 0.04, pe: 33.6, cash: 85, desc: '클라우드·소프트웨어', pub: true },
  { id: 'AM', kr: '아마존', en: 'AMAZON', color: '#d97a00', ceo: null, rev: 176.2, nm: 0.09, g: 0.03, pe: 43, cash: 90, desc: '리테일·클라우드', pub: true },
  { id: 'TS', kr: 'TSMC', en: 'TSMC', color: '#8a3ab0', ceo: 'lin', rev: 33.9, nm: 0.42, g: 0.05, pe: 42, cash: 55, desc: '파운드리', pub: true },
  { id: 'ME', kr: '메타', en: 'META', color: '#2a5fd0', ceo: null, rev: 52.0, nm: 0.35, g: 0.04, pe: 24.7, cash: 70, desc: 'SNS·광고·AI', pub: true },
  { id: 'BC', kr: '브로드컴', en: 'BROADCOM', color: '#c9302c', ceo: null, rev: 17.6, nm: 0.33, g: 0.06, pe: 73, cash: 18, desc: '맞춤 칩·네트워크', pub: true },
  { id: 'BK', kr: '버크셔 해서웨이', en: 'BERKSHIRE', color: '#8a2432', ceo: null, rev: 94.0, nm: 0.17, g: 0.01, pe: 17, cash: 120, desc: '보험·투자 (비상금 창구)', pub: true },
  { id: 'AN', kr: 'Anthropic', en: 'ANTHROPIC', color: '#c4603f', ceo: null, ai: 'sage', rev: 16.8, nm: -0.25, g: 0.14, mult: 14.4, cash: 36, desc: 'AI 연구·서비스', pub: false },
  { id: 'OA', kr: 'OpenAI', en: 'OPENAI', color: '#12906a', ceo: null, ai: 'aria', rev: 12.2, nm: -0.35, g: 0.10, mult: 17.5, cash: 36, desc: 'AI 연구·서비스', pub: false },
];

export const LEVERS = [
  { id: 'capex', icon: '🏭', kr: '설비투자 (CAPEX)', hint: '가동 용량·성장 ↑ / 현금 ↓ / 거품 ↑' },
  { id: 'rnd', icon: '🔬', kr: '연구개발 (R&D)', hint: '기술 ↑ · 장기 성장 / 단기 이익 ↓' },
  { id: 'hire', icon: '👥', kr: '채용·인재', hint: '사기 ↑ · 인재 ↑ / 인건비 ↑' },
  { id: 'price', icon: '🏷️', kr: '가격 정책', hint: '마진 ↑ / 성장 ↓ · 규제 열기 ↑' },
  { id: 'lobby', icon: '🏛️', kr: '로비·대관', hint: '규제 열기 ↓ · 정부 관계 ↑ / 비용' },
  { id: 'mkt', icon: '📣', kr: '마케팅', hint: '평판 ↑ · 성장 소폭 ↑ / 비용' },
];

export const CHARS = {
  mira: { kr: '미라 오콩코', role: '비서실장', preset: 'mira', trust: 60, tag: '선대의 뜻' },
  victor: { kr: '빅터 헤일', role: '재무장관', preset: 'victor', trust: 48, tag: '숨은 의도 ❓' },
  jonah: { kr: '조나 레예스', role: '칩 설계 대표', preset: 'jonah', trust: 52, tag: '야심 ↑' },
  lin: { kr: '린 웨이천 박사', role: '파운드리 총괄', preset: 'lin', trust: 55, tag: '조국과 회사 사이' },
  dana: { kr: '다나 브라이트워터', role: '상원의원', preset: 'dana', trust: 30, tag: '정직한 견제자' },
  aria: { kr: 'ARIA', role: 'OpenAI의 AI', orb: ['#ffb46a', '#d9531e'], trust: 55, tag: '가속' },
  sage: { kr: 'SAGE', role: 'Anthropic의 AI', orb: ['#6fd0ff', '#1c4f9a'], trust: 62, tag: '질문' },
  elias: { kr: '엘리아스 밴스', role: '선대 (고인)', preset: 'elias', trust: 100, tag: '편지' },
};
export const SUSPECTS = ['victor', 'mira', 'jonah', 'lin', 'aria'];

export const ORIGINS = {
  auditor: {
    kr: '감사인', en: 'THE AUDITOR', blurb: '선대의 투자사 한 곳에서 분식회계를 폭로하고 해고당했다. 숫자는 거짓말을 하지 않는다고 믿는다.',
    trait: '장부의 눈', traitDesc: '감사 위험이 20% 덜 쌓이고, 재무 이벤트에서 숨은 비용을 먼저 발견한다.',
    fx: { gov: 6, tech: -3, talent: -2, intel: 1 }, flag: 'auditEye',
  },
  engineer: {
    kr: '엔지니어', en: 'THE ENGINEER', blurb: '칩 설계 공정의 치명적 결함을 보고했다가 묵살당했다. 기술이 사람을 구한다고 믿는다.',
    trait: '현장의 감각', traitDesc: '연구개발 효과 +15%. 조나·린 박사 신뢰도 시작 +10.',
    fx: { tech: 8, talent: 4, gov: -3, trust: { jonah: 10, lin: 10 } }, flag: 'fieldSense',
  },
  analyst: {
    kr: '펀드 분석가', en: 'THE ANALYST', blurb: '선대의 거래를 공개 비판한 적이 있다. 시장은 감정이 아니라 확률이라고 믿는다.',
    trait: '확률의 눈', traitDesc: '개인 펀드 수익 +15%, 정보 자원 +1. 대신 탐욕 이벤트가 자주 발생.',
    fx: { liquid: 0.8, talent: -3, gov: -3, intel: 1 }, flag: 'probEye',
  },
};

export const SHOP = [
  { id: 'jet', icon: '✈️', kr: '전용 제트기', desc: '매 분기 정보 +1, 회의 이벤트 추가', cost: 0.18, fx: {}, flag: 'jet' },
  { id: 'think', icon: '🏛️', kr: '싱크탱크·재단', desc: '정부 관계 +6, 반독점 방어 ↑', cost: 0.6, fx: { gov: 6 }, flag: 'think' },
  { id: 'art', icon: '🖼️', kr: '예술품·저택', desc: '인물 호감 +3 (전원), 자산 가치 보존', cost: 0.32, fx: { trustAll: 3 }, flag: 'art', keep: 0.7 },
  { id: 'found', icon: '🎗️', kr: '자선재단', desc: '평판 +, 감사 위험 −10, 편지 조건 해금', cost: 1.0, fx: { gov: 3, audit: -10 }, flag: 'found' },
  { id: 'bunker', icon: '🏝️', kr: '벙커·섬', desc: '붕괴 시 개인 자산 40% 보존', cost: 0.9, fx: {}, flag: 'bunker', keep: 0.5 },
  { id: 'media', icon: '📺', kr: '미디어 인수', desc: '정부 관계 +4 · 언론 사유화 스캔들 위험', cost: 2.4, fx: { gov: 4, sec: 6 }, flag: 'media', keep: 0.6 },
];

export const LETTERS = {
  L1: {
    n: 1, title: '첫 번째 편지', sig: '엘리아스 밴스',
    text: `이 편지를 열었다면, 나는 이미 떠났겠구나.

열한 개의 불을 네게 맡긴다. 이유는 나중에 알게 될 것이다. 지금은 두 가지만 기억하거라.

하나. 이 불들은 한곳에 모여 있어야 안전하다.
둘. 가장 크게 웃는 사람이 가장 많이 계산하는 사람이다.

마지막 편지를 열기 전에는, 아무도 믿지 마라.`,
  },
  L2: {
    n: 2, title: '두 번째 편지 · 열한 개의 이유', sig: '엘리아스 밴스',
    text: `첫 위기를 넘겼구나. 이제 말해 줄 수 있겠다.

칩, 클라우드, 모델, 그리고 돈. 이 사슬의 고리를 한 사람이 모두 쥐면, 세계의 지능은 그 사람의 것이 된다. 나는 그 사람이 나쁜 사람이 아니어도 위험하다고 생각했다.

그래서 고리를 한곳에 묶었다. 아무도 위기의 날에 헐값으로 주워 가지 못하도록.

…하지만 이 말은 아직 절반이다.`,
  },
  L3: {
    n: 3, title: '세 번째 편지 · 나의 후회', sig: '엘리아스 밴스',
    text: `누군가를 믿기 시작했구나. 좋은 일이다. 그리고 위험한 일이다.

나는 평생 사람을 믿는 대신 장부를 믿었다. 가장 가까웠던 이들에게 끝내 진실을 말하지 못했고, 그것이 내 가장 큰 후회다.

너는 숫자 앞에서도 사람을 보거라. 다만 그 사람이 웃을 때, 눈이 함께 웃는지는 꼭 확인해라.`,
  },
  L4: {
    n: 4, title: '네 번째 편지 · 스위치의 정체', sig: '엘리아스 밴스',
    text: `거품이 차올랐겠구나. 이제 진짜를 말하마.

컴팩트는 데드맨 스위치다. 거품이 터지는 날, 누군가 사슬을 헐값에 모으려 들 것이다. 켈스트럴이라 불리는 자들이다. 내가 죽으면 열한 개의 고리가 한 사람의 손에 머물도록 만든 것은, 그날을 버티기 위해서다.

그런데 보거라. 이 장치는 한 사람에게 모든 것을 몰아준다. 내가 두려워한 바로 그 구조다.

그래서 너를 골랐다. 이 장치를 끝내 해체할 수 있는 사람을.`,
  },
};

// ---- Story events ---------------------------------------------------------
// stance: y = 찬성, n = 반대/중단, h = 보류
// fx keys: gov tech talent bubble liquid intel audit sec | trust:{id:n} | comp:{ID:{g,nm,reg,rep,morale,cash}} | all:{...}
//          levers:{capex,rnd,...} (set for all) | flag | clue:{who,n} | trustAll
export const EVENTS = {
  focus: {
    kicker: 'QUARTERLY BRIEFING · 분기 브리핑', title: '첫 분기 — 어디에 힘을 줄까요?',
    body: '열한 개 기업을 한꺼번에 키울 수는 없습니다. 이번 분기의 큰 방향을 정해 주세요. 이후 회사 화면에서 기업별로 세부 조정할 수 있습니다.',
    advisors: [
      { who: 'mira', stance: 'h', quote: '"처음부터 전부 쥐려 하지 마세요. 방향을 정하고, 숫자가 말해 주는 걸 지켜보시죠."' },
      { who: 'victor', stance: 'y', quote: '"성장이 답입니다. 시장은 달리는 쪽을 보상합니다."' },
      { who: 'sage', stance: 'n', quote: '"속도보다 방향. 지금 서두르는 투자가 나중의 짐이 됩니다."' },
    ],
    options: [
      { label: '성장 우선 — 설비투자와 채용 확대', fx: { levers: { capex: 66, hire: 60, rnd: 54, price: 46 }, bubble: 3, trust: { victor: 3, sage: -2 } }, result: '시장은 환호했고, 데이터센터 공사가 전 세계에서 시작되었습니다.' },
      { label: '수익성 우선 — 가격과 비용 관리', fx: { levers: { capex: 42, hire: 46, rnd: 46, price: 62 }, bubble: -1, gov: -2, trust: { sage: 2, victor: -1 } }, result: '마진은 올랐지만, 일부 고객은 불만을 드러냈습니다.' },
      { label: '연구 우선 — 다음 세대에 투자', fx: { levers: { rnd: 72, capex: 52, hire: 56, price: 50 }, tech: 4, trust: { jonah: 3, lin: 2 } }, result: '연구소마다 불이 꺼지지 않았습니다. 결과는 몇 분기 뒤에 나옵니다.' },
    ],
  },
  h200: {
    kicker: 'EMERGENCY COUNCIL · 긴급 회의', title: 'H200 중국 수출 허가 — 결단의 시간',
    body: '상무부가 엔비디아의 H200 대중 수출 허가를 검토 중입니다. 중국 업체 주문은 200만 개를 넘었고, TSMC는 증산 라인을 요구합니다. 허가를 로비하면 매출이 폭발하지만, 의회와 안보 당국이 주시하고 있습니다.',
    advisors: [
      { who: 'victor', stance: 'y', quote: '"중국 매출은 포기하기엔 너무 큽니다. 지금 아니면 경쟁사가 가져갑니다. 제가 의회를 설득하죠."', tag: '숨은 의도 ❓', initiator: true },
      { who: 'jonah', stance: 'y', quote: '"회장님, 시장은 기다려주지 않아요. 라인 증설도 이미 끝났습니다. 허가 받으세요."', tag: '야심 ↑' },
      { who: 'mira', stance: 'h', quote: '"이 안건… 누가 가장 먼저 꺼냈는지 기억하세요. 지금은 서두를 때가 아닙니다."', tag: '선대의 뜻' },
      { who: 'aria', stance: 'y', quote: '"허가가 나면 GPU 12%를 우리에게 더 배정해 주세요. 학습 런이 멈춰 있어요."', tag: '요구 ↑' },
      { who: 'sage', stance: 'n', quote: '"한 가지 확인하고 가시죠. 이 안건을 가장 먼저 꺼낸 사람이 누구였습니까?"', tag: '질문 ❓' },
    ],
    intelAction: { cost: 1, label: '정보 1 사용 — 안건 최초 발의자 확인', reveal: '회의록 기록: 이 안건을 처음 꺼낸 사람은 <b>빅터 헤일</b>입니다. 3주 전, 조나와 만나기도 전이었습니다.', clue: { who: 'victor', n: 1 } },
    options: [
      { label: '허가 로비 강행', who: '헤일·조나·ARIA 지지', fx: { comp: { NV: { g: 0.018, nm: 0.012, reg: 12 } }, gov: -12, tech: 4, bubble: 6, trust: { mira: -5, jonah: 4, victor: 3, sage: -3 }, flag: 'h200_lobby', clue: { who: 'victor', n: 1 } }, result: '허가가 났고 주문서가 쏟아졌습니다. 의회에서는 청문회 이야기가 나오기 시작했습니다.' },
      { label: '구형 칩만 제한 판매', who: '절충안', fx: { comp: { NV: { g: 0.006, nm: 0.004, reg: 3 } }, gov: 3, trust: { sage: 3, jonah: -2 } }, result: '이익은 작지만 규제 리스크는 낮췄습니다. 조나는 입맛을 다셨습니다.' },
      { label: '수출 포기 · 국내 증설', who: '미라·SAGE 지지', fx: { comp: { NV: { g: -0.008, cash: -14, reg: -6 } }, gov: 8, talent: 5, bubble: -5, trust: { jonah: -8, mira: 3, sage: 4 }, flag: 'h200_abandon' }, result: '당장은 손해지만, 워싱턴에서 당신의 이름이 달리 불리기 시작했습니다.' },
    ],
  },
  gpu: {
    kicker: 'COUNCIL · 긴급 회의', title: 'ARIA와 SAGE의 GPU 다툼',
    body: '새 가속기 물량이 한정되어 있습니다. OpenAI와 Anthropic이 같은 물량을 요청했고, 두 AI는 서로를 당신에게 고발하고 있습니다. 둘 다 당신 소유의 회사입니다.',
    advisors: [
      { who: 'aria', stance: 'y', quote: '"우리가 먼저 시장을 잡아야 해요. SAGE는 일부러 느리게 가고 있어요."', tag: '요구 ↑' },
      { who: 'sage', stance: 'h', quote: '"ARIA의 학습 런은 검증 없이 돌아가고 있습니다. 위험을 감수하는 건 당신의 회사입니다."', tag: '경고' },
      { who: 'jonah', stance: 'y', quote: '"경매로 파세요. 비싸게 부르는 쪽이 가져가는 게 시장입니다."', tag: '야심 ↑' },
      { who: 'lin', stance: 'n', quote: '"라인은 한정되어 있어요. 어느 쪽이든 누군가는 기다려야 합니다."', tag: '병목' },
    ],
    options: [
      { label: 'OpenAI에 우선 배정', who: 'ARIA·조나 지지', fx: { comp: { OA: { g: 0.03 }, AN: { g: -0.012 } }, bubble: 3, trust: { aria: 6, sage: -5 } }, result: 'ARIA의 학습 런이 폭주하듯 돌아가기 시작했습니다. SAGE는 말이 없었습니다.' },
      { label: 'Anthropic에 우선 배정', who: 'SAGE 지지', fx: { comp: { AN: { g: 0.03 }, OA: { g: -0.012 } }, bubble: -1, trust: { sage: 6, aria: -5 } }, result: 'SAGE는 감사를 표했고, ARIA는 서운함을 숨기지 않았습니다.' },
      { label: '50 : 50 균등 배분', who: '절충안', fx: { comp: { AN: { g: 0.008 }, OA: { g: 0.008 } }, trust: { aria: -2, sage: -1 } }, result: '아무도 만족하지 않았지만, 아무도 완전히 화나지도 않았습니다.' },
      { label: '경매로 최고가 입찰자에게', who: '조나 지지', fx: { comp: { NV: { nm: 0.012 } }, talent: -3, trust: { aria: -3, sage: -3, jonah: 3 } }, result: '엔비디아의 마진은 올랐지만, 두 AI는 처음으로 같은 말을 했습니다. "비겁하군요."' },
    ],
  },
  ipo: {
    kicker: 'BOARD · 이사회', title: 'IPO 심사 — 누구를 먼저 상장시킬까',
    body: 'Anthropic과 OpenAI 모두 상장 서류가 심사 중입니다. 상장은 막대한 자금과 함께 시장의 눈과 규제를 불러옵니다. 시장은 AI 이야기에 달아올라 있습니다.',
    advisors: [
      { who: 'victor', stance: 'y', quote: '"지금이 최고가입니다. 둘 다 올리세요. 거품은 터지기 전까지만 가치가 있습니다."', tag: '숨은 의도 ❓' },
      { who: 'mira', stance: 'h', quote: '"선생님이라면 서두르지 않으셨을 겁니다. 하지만 자금은 필요합니다."', tag: '선대의 뜻' },
      { who: 'sage', stance: 'n', quote: '"상장하면 저는 주주를 위해 말해야 합니다. 그것이 안전한지 모르겠습니다."', tag: '질문 ❓' },
      { who: 'aria', stance: 'y', quote: '"먼저 올라야 먼저 큰 돈을 모아요. 제가 먼저면 좋겠어요."', tag: '요구 ↑' },
    ],
    options: [
      { label: 'Anthropic 먼저 상장', fx: { comp: { AN: { cash: 40, rep: 4 } }, bubble: 4, liquid: 0.25, trust: { sage: 3, aria: -4 }, flag: 'ipo_an' }, result: '청약이 몰렸습니다. 시장의 열기가 한 단계 더 올랐습니다.' },
      { label: 'OpenAI 먼저 상장', fx: { comp: { OA: { cash: 40, rep: 4 } }, bubble: 4, liquid: 0.25, trust: { aria: 3, sage: -4 }, flag: 'ipo_oa' }, result: '시장은 환호했고, SAGE는 조용히 숫자를 기록했습니다.' },
      { label: '둘 다 상장 (공격적)', fx: { comp: { AN: { cash: 38 }, OA: { cash: 38 } }, bubble: 9, liquid: 0.55, gov: -3, trust: { victor: 3, mira: -3 }, flag: 'ipo_both' }, result: '막대한 자금이 들어왔지만, 거품 지수가 위험 수위로 올랐습니다.' },
      { label: '둘 다 보류', fx: { bubble: -3, gov: 2, trust: { mira: 3, victor: -3 } }, result: '시장은 실망했지만, 규제 기관은 한숨을 돌렸습니다.' },
    ],
  },
  senator: {
    kicker: 'POLITICS · 의회', title: '브라이트워터 의원, 청문회를 예고하다',
    body: '다나 브라이트워터 상원의원이 "빅테크 소유 집중 청문회"를 예고했습니다. 당신의 이름이 직접 증인으로 거론되고 있습니다. 그녀는 적이라기보다 가장 정직한 견제자입니다.',
    advisors: [
      { who: 'victor', stance: 'y', quote: '"맞서 싸우세요. 제가 막후에서 길을 터 두겠습니다. 그녀는 순진합니다."', tag: '숨은 의도 ❓' },
      { who: 'mira', stance: 'h', quote: '"그분은 거래할 상대가 아니라 설득할 상대입니다. 정직하게 가는 편이 이깁니다."', tag: '선대의 뜻' },
      { who: 'jonah', stance: 'y', quote: '"한 번 허용하면 끝없이 요구해요. 로비로 막아야 합니다."', tag: '야심 ↑' },
    ],
    options: [
      { label: '맞서 싸운다', who: '헤일·조나 지지', fx: { gov: -8, all: { reg: 6 }, trust: { victor: 3, dana: -8 }, liquid: -0.05, flag: 'fight_dana' }, result: '전선은 분명해졌습니다. 의회의 시선은 더 날카로워졌습니다.' },
      { label: '증인으로 협조한다', who: '미라 지지', fx: { gov: 6, all: { nm: -0.003 }, trust: { dana: 12, mira: 3, victor: -3 }, flag: 'deal_dana' }, result: '당신은 투명하게 증언했고, 브라이트워터는 처음으로 고개를 끄덕였습니다.' },
      { label: '정치 후원으로 완화한다', who: '절충', fx: { gov: 3, liquid: -0.3, sec: 4, trust: { dana: -4 }, flag: 'dana_debt' }, result: '당장은 조용해졌지만, 이 청구서는 몇 분기 뒤에 돌아올 것입니다.' },
    ],
  },
  taiwan: {
    kicker: 'GEOPOLITICS · 지정학', title: '대만 해협 — 린 박사의 보고',
    body: '해협 인근 훈련이 확대되고 있습니다. TSMC의 첨단 라인은 한 곳에 몰려 있고, 그만큼 당신의 열한 개 기업 모두가 이 한 곳에 의존합니다.',
    advisors: [
      { who: 'lin', stance: 'h', quote: '"대피 계획은 이미 있습니다. 하지만 모든 계획은 침묵 위에서만 작동하죠. 제 조국과 회사 사이에서, 저는 침묵하고 있습니다."', tag: '조국과 회사 사이' },
      { who: 'jonah', stance: 'n', quote: '"비축 물량을 늘려요. 위기가 와도 최소 한 분기는 버틸 수 있게."', tag: '야심 ↑' },
      { who: 'mira', stance: 'y', quote: '"분산은 비용이지만, 비용을 안 쓰면 보험이 없는 겁니다."', tag: '선대의 뜻' },
    ],
    options: [
      { label: '미국·일본에 신규 팹 분산 투자', fx: { comp: { TS: { cash: -12, g: -0.008 } }, gov: 2, trust: { lin: 6 }, flag: 'fab_diversify' }, result: '비용은 컸지만, 위기가 닥쳐도 완전히 멈추지는 않을 것입니다.' },
      { label: '칩 비축 물량을 늘린다', fx: { comp: { NV: { cash: -8 }, TS: { nm: 0.004 } }, trust: { jonah: 3 }, flag: 'stockpile' }, result: '창고마다 칩이 쌓였습니다. 조용한 보험입니다.' },
      { label: '현 체제를 유지한다', fx: { comp: { TS: { nm: 0.006 } }, trust: { lin: -3 }, flag: 'taiwan_risk' }, result: '숫자는 좋아졌지만, 린 박사는 시선을 피했습니다.' },
    ],
  },
  short: {
    kicker: 'INTEL · 정보', title: '실적 직전의 비정상 공매도',
    body: '실적 발표 직전, 당신의 기업 주식에 대한 비정상적 공매도 계좌가 포착되었습니다. 내부 정보가 새고 있다는 뜻입니다. 이것은 켈스트럴의 흔적일 수 있습니다.',
    advisors: [
      { who: 'mira', stance: 'h', quote: '"조용히 처리하세요. 소문이 나면 오히려 그들이 이깁니다."', tag: '선대의 뜻' },
      { who: 'sage', stance: 'y', quote: '"거래 기록을 추적하겠습니다. 제 쪽 데이터에서 패턴이 보입니다."', tag: '질문 ❓' },
    ],
    options: [
      { label: '정보 2를 써서 직접 추적', needIntel: 2, fx: { intel: -2, clueMole: 1 }, result: '계좌의 소유 구조에서 한 가지 연결 고리가 보였습니다.' },
      { label: '미라에게 맡기고 조용히 덮는다', fx: { trust: { mira: 3 } }, result: '미라가 처리하겠다고 했습니다. 정확히 무엇을 했는지는 말하지 않았습니다.' },
      { label: '무시한다', fx: { sec: 0, bubble: 1 }, result: '아무 일도 없었다는 듯 지나갔습니다. 정말로 아무 일도 없었을까요.' },
    ],
  },
  audit: {
    kicker: 'AUDIT · 감사', title: '배당 상한 초과 — 감사 이벤트',
    body: '컴팩트 헌장의 배당 상한(40%)을 넘긴 흔적을 이사회 감사팀이 발견했습니다. 상속 직후부터 이어진 일입니다. 당신의 과거가 감사인이라면, 이 장면이 더 아프게 느껴질 것입니다.',
    advisors: [
      { who: 'mira', stance: 'n', quote: '"선생님이라면 이러시지 않았을 겁니다. 지금 바로잡으세요."', tag: '선대의 뜻' },
      { who: 'victor', stance: 'h', quote: '"사소한 절차 문제입니다. 제가 이사회를 설득하죠."', tag: '숨은 의도 ❓' },
    ],
    options: [
      { label: '공개 사과하고 배당 성향을 35%로', fx: { forcePayout: 35, gov: 2, audit: -35, liquid: -0.1, trust: { mira: 5, victor: -2 } }, result: '고개를 숙이자 이사회는 조용해졌습니다. 대신 지갑은 얇아졌습니다.' },
      { label: '헤일에게 맡긴다', fx: { audit: -15, gov: -4, sec: 4, trust: { victor: 4, mira: -5 } }, result: '문제는 덮였지만 누군가의 빚이 되었습니다.' },
    ],
  },
  hire: {
    kicker: 'OPPORTUNITY · 기회', title: '핵심 인재 스카우트 제안',
    body: '경쟁사의 최고 연구진 전원이 이직을 타진해 왔습니다. 인재는 사람이지만, 동시에 거대한 비용이기도 합니다.',
    advisors: [
      { who: 'jonah', stance: 'y', quote: '"사세요. 연봉 같은 건 숫자일 뿐입니다."', tag: '야심 ↑' },
      { who: 'mira', stance: 'h', quote: '"기존 인력의 사기도 같이 보셔야 합니다."', tag: '선대의 뜻' },
    ],
    options: [
      { label: '전원 영입', fx: { talent: 6, tech: 3, liquid: -0.1, all: { morale: -2 } }, result: '연구소에 새 얼굴이 가득했지만 기존 인력은 술렁였습니다.' },
      { label: '핵심 3인만', fx: { talent: 3, tech: 1 }, result: '꼭 필요한 사람만 영입했습니다.' },
      { label: '거절', fx: { talent: -2 }, result: '경쟁사는 웃었고, 당신은 비용을 지켰습니다.' },
    ],
  },
  rumor: {
    kicker: 'PRESS · 언론', title: '"컴팩트는 왜 비밀인가" — 탐사 보도',
    body: '한 탐사 매체가 컴팩트의 구조를 추적하는 연재를 시작했습니다. 아직은 피상적이지만, 곧 핵심에 닿을 수 있습니다.',
    advisors: [
      { who: 'victor', stance: 'y', quote: '"법적으로 막읍시다. 시간을 벌 수 있습니다."', tag: '숨은 의도 ❓' },
      { who: 'mira', stance: 'h', quote: '"투명하게 일부를 공개하는 건 어떨까요? 의혹은 비밀에서 자랍니다."', tag: '선대의 뜻' },
    ],
    options: [
      { label: '법적 대응으로 막는다', fx: { gov: -3, liquid: -0.08, trust: { victor: 3 } }, result: '보도는 중단됐지만 의혹은 땅 밑으로 숨었습니다.' },
      { label: '일부를 투명하게 공개한다', fx: { gov: 4, trust: { mira: 3, dana: 4 } }, result: '의혹의 절반은 사라졌고, 절반은 새로운 질문이 되었습니다.' },
      { label: '무대응', fx: { gov: -1 }, result: '기사는 이틀 만에 잊혔습니다.' },
    ],
  },
  fund: {
    kicker: 'FUNDING · 자금', title: '자금 압박 — 비상금 수혈',
    body: '회사 한 곳의 현금이 바닥나고 있습니다. 비상금 창구인 버크셔에서 끌어오면 해결되지만, 컴팩트 전체의 안전판이 얇아집니다.',
    dynamic: true,
    advisors: [
      { who: 'mira', stance: 'y', quote: '"선생님이 버크셔를 만든 이유가 바로 이런 날을 위해서였습니다."', tag: '선대의 뜻' },
      { who: 'victor', stance: 'h', quote: '"외부 자본을 받으면 어떨까요? 대가는 지분입니다."', tag: '숨은 의도 ❓' },
    ],
    options: [
      { label: '버크셔에서 $25B 수혈', fx: { fundFromBK: 25 }, result: '위기는 넘겼지만, 안전판이 얇아졌습니다.' },
      { label: '외부 자본 유치 (지분 희석)', fx: { fundExternal: 25, liquid: -0.1, trust: { mira: -3 } }, result: '자금은 들어왔지만, 컴팩트의 한 모서리가 열렸습니다.' },
      { label: '지출 삭감으로 버틴다', fx: { cutTarget: 1, talent: -4 }, result: '허리띠를 졸랐고, 인재가 흔들렸습니다.' },
    ],
  },
  crossroads: {
    kicker: 'CROSSROADS · 갈림길', title: '거품의 정점 — 어떻게 착륙할 것인가',
    body: '거품 지수가 위험 수위에 닿았습니다. 시장은 여전히 환호하지만, 설비투자가 현금흐름을 앞지르고 있습니다. 지금의 선택이 앞으로의 모든 결말을 가릅니다.',
    advisors: [
      { who: 'sage', stance: 'n', quote: '"속도를 줄이고, 규제 당국과 함께 천천히 내려오세요. 부드러운 착륙은 가능합니다."', tag: '질문 ❓' },
      { who: 'aria', stance: 'y', quote: '"멈추면 뒤처져요! 더 빨리 가서 모두를 따돌려요!"', tag: '요구 ↑' },
      { who: 'victor', stance: 'h', quote: '"개인 펀드로 폭락에 베팅하는 방법도 있습니다. 누구도 알 수 없죠."', tag: '숨은 의도 ❓' },
      { who: 'mira', stance: 'n', quote: '"선생님의 마지막 편지가 이 순간을 위한 것이라면… 서두르지 마세요."', tag: '선대의 뜻' },
    ],
    options: [
      { label: '연착륙 — 투자를 줄이고 규제와 협력', who: 'SAGE·미라 지지', fx: { bubble: -22, all: { g: -0.012 }, gov: 6, trust: { sage: 6, mira: 4, aria: -6 }, flag: 'soft' }, result: '시장은 잠시 얼어붙었지만, 어떤 고리도 헐값에 팔려 나가지 않았습니다.' },
      { label: '가속 — 설비투자를 더 늘린다', who: 'ARIA 지지', fx: { bubble: 12, all: { g: 0.01 }, trust: { aria: 6, sage: -8 }, flag: 'accel' }, result: '숫자는 더 가파르게 올랐습니다. 아무도 내려올 길을 말하지 않았습니다.' },
      { label: '폭락에 개인 베팅 (공매도)', who: '헤일 제안', fx: { bubble: 2, gov: -4, sec: 14, liquid: 0.6, trust: { mira: -8, sage: -5, victor: 4 }, flag: 'short_own' }, result: '당신의 지갑은 두꺼워질 것입니다. 당신의 회사가 무너질 때만.' },
    ],
  },
  power: {
    kicker: 'INFRASTRUCTURE · 전력', title: '데이터센터 전력이 바닥났다',
    body: '텍사스와 버지니아의 전력망이 한계에 닿았습니다. 완공된 데이터센터 세 곳이 전기 없이 멈춰 서 있습니다. 소형 원전 장기 계약은 비싸고, 10년 동안 묶입니다.',
    advisors: [
      { who: 'jonah', stance: 'y', quote: '"원전 계약하죠! 칩은 전기 없이는 그냥 비싼 돌멩이예요."' },
      { who: 'sage', stance: 'h', quote: '"같은 일을 절반의 전기로 하는 연구도 함께 봐 주세요. 더 싸고, 더 오래갑니다."' },
      { who: 'victor', stance: 'n', quote: '"10년 계약이라… 거품이 꺼지는 날, 그 계약서가 우리 목을 조를 겁니다."' },
    ],
    options: [
      { label: '소형 원전 10년 계약 체결', who: '조나 지지', fx: { comp: { MS: { g: 0.01, cash: -6 }, AM: { g: 0.01, cash: -6 } }, bubble: 4, tech: 3, trust: { jonah: 3, victor: -2 } }, result: '전력 걱정은 사라졌지만, 10년치 고정비가 장부에 새겨졌습니다.' },
      { label: '효율화 우선 — 모델 경량화 연구', who: 'SAGE 지지', fx: { tech: 5, bubble: -2, comp: { AN: { g: 0.008 }, OA: { g: -0.004 } }, trust: { sage: 4, aria: -3 } }, result: 'SAGE 팀이 같은 연산을 절반의 전기로 해냈습니다. ARIA는 느리다며 투덜댑니다.' },
      { label: '증설 보류 — 시장이 식기를 기다린다', who: '헤일 지지', fx: { bubble: -3, all: { g: -0.004 }, trust: { victor: 2, jonah: -3 } }, result: '공사가 멈췄습니다. 시장은 고개를 갸웃했지만, 거품 지수는 조금 내려왔습니다.' },
    ],
  },
  leak: {
    kicker: 'SECURITY · 보안 사고', title: '모델 가중치 유출 의혹',
    body: 'OpenAI 최신 모델의 가중치 일부가 다크웹에 올라왔다는 제보가 들어왔습니다. 외부 해킹이 아니라 내부자의 손을 탄 흔적이 보입니다. 켈스트럴이 남긴 발자국일지도 모릅니다.',
    advisors: [
      { who: 'aria', stance: 'n', quote: '"제 잘못이 아니에요! 저는 문을 잠그라고 몇 번이나 말했다고요!"' },
      { who: 'sage', stance: 'h', quote: '"먼저 공개하고 사과하는 것이, 길게 보면 신뢰를 지키는 길입니다."' },
      { who: 'mira', stance: 'y', quote: '"조용히 내부 감사부터 하시죠. 범인은 아직 이 건물 안에 있습니다."' },
    ],
    intelAction: { cost: 1, label: '정보 1 사용 — 접속 로그 추적', reveal: '접속 로그: 유출 직전 새벽 3시, <b>ARIA의 자동화 계정</b>이 우회 경로로 쓰였습니다. 누군가 ARIA를 방패로 삼았을 수도 있습니다.', clue: { who: 'aria', n: 1 } },
    options: [
      { label: '즉시 공개하고 사과한다', who: 'SAGE 지지', fx: { gov: 4, comp: { OA: { rep: -8, g: -0.006 } }, trust: { sage: 4, aria: -2 } }, result: '주가는 하루 출렁였지만, 규제 당국은 당신의 투명함을 기록해 두었습니다.' },
      { label: '조용히 내부 감사', who: '미라 지지', fx: { clueMole: true, sec: 4, trust: { mira: 3 } }, result: '감사팀이 수상한 흔적 두 개를 찾아냈습니다. 수사 탭에서 확인하세요.' },
      { label: '경쟁사 탓으로 돌린다', who: '아무도 지지하지 않음', fx: { gov: -6, sec: 8, bubble: 2, trust: { sage: -5, dana: -4 } }, result: '언론은 경쟁사를 의심했습니다. 하지만 거짓말은 언젠가 이자를 붙여 돌아옵니다.' },
    ],
  },
  strike: {
    kicker: 'LABOR · 현장', title: '신주 팹 엔지니어들이 멈췄다',
    body: '야간 3교대가 1년째 이어졌습니다. TSMC 신주 공장의 엔지니어 수백 명이 장비를 끄고 휴게실에 모였습니다. 린 박사가 새벽에 직접 전화를 걸어 왔습니다.',
    advisors: [
      { who: 'lin', stance: 'h', quote: '"그들은 지쳤을 뿐입니다. 사람을 기계처럼 돌리면, 결국 기계도 멈춥니다."' },
      { who: 'jonah', stance: 'n', quote: '"납기가 2주만 밀려도 엔비디아 출하가 통째로 밀려요. 빨리 끝내 주세요!"' },
      { who: 'victor', stance: 'y', quote: '"보너스로 해결하시죠. 돈으로 살 수 있는 시간은 싸게 사는 겁니다."' },
    ],
    options: [
      { label: '처우 개선 + 4교대 전환', who: '린 지지', fx: { comp: { TS: { nm: -0.02, morale: 20, g: 0.004 } }, talent: 5, trust: { lin: 6, jonah: -2 } }, result: '공장은 다시 돌기 시작했고, 엔지니어들은 처음으로 회장님의 이름을 불렀습니다.' },
      { label: '일회성 보너스 지급', who: '헤일 지지', fx: { comp: { TS: { cash: -3, morale: 8 } }, trust: { victor: 2, lin: 1 } }, result: '불은 꺼졌지만, 불씨는 남았습니다.' },
      { label: '대체 인력 투입 — 강행', who: '조나 지지', fx: { comp: { TS: { morale: -20, rep: -10 }, NV: { g: 0.004 } }, talent: -6, gov: -3, trust: { lin: -8, jonah: 3 } }, result: '납기는 지켰습니다. 린 박사는 전화를 끊기 전, 아무 말도 하지 않았습니다.' },
    ],
  },
  gala: {
    kicker: 'SOCIETY · 사교계', title: '뉴욕 자선 갈라 — 모두가 당신을 본다',
    body: '올해 가장 비싼 밤. 상원의원과 펀드 매니저, 기자들이 한 홀에 모였습니다. 당신의 한마디, 수표 한 장이 내일 아침의 헤드라인이 됩니다.',
    advisors: [
      { who: 'dana', stance: 'h', quote: '"수표의 금액보다, 그 돈이 어디로 가는지를 보겠습니다, 회장님."' },
      { who: 'mira', stance: 'y', quote: '"선생님은 매년 조용히 기부하셨어요. 이름 없이요."' },
      { who: 'aria', stance: 'y', quote: '"무대에 서세요! 사람들은 큰 그림을 그리는 사람을 사랑해요!"' },
    ],
    options: [
      { label: '익명으로 거액 기부 ($600M)', who: '미라 지지', fx: { liquid: -0.6, gov: 3, trustAll: 2, trust: { mira: 4, dana: 2 } }, result: '이름 없는 기부. 다음 날 어느 신문도 쓰지 않았지만, 미라는 알고 있었습니다.' },
      { label: '무대에서 비전 발표 + 기부 ($300M)', who: 'ARIA 지지', fx: { liquid: -0.3, bubble: 3, gov: 2, comp: { OA: { rep: 6 }, AN: { rep: 4 } }, trust: { aria: 4, dana: -2 } }, result: '박수가 쏟아졌고, 다음 날 AI 관련주가 일제히 올랐습니다.' },
      { label: '얼굴만 비추고 조용히 빠진다', who: '—', fx: { intel: 1, trust: { dana: 2 } }, result: '구석에서 들은 귓속말 하나가 쓸모 있는 정보가 되었습니다.' },
    ],
  },
  accuse: {
    kicker: 'INVESTIGATION · 수사', title: '켈스트럴의 첩자를 지목하라',
    body: '지금까지 모은 단서로 내부의 첩자를 지목할 수 있습니다. 틀리면 그 인물은 적이 되고, 진범은 계속 숨어 있게 됩니다. 지목하지 않을 수도 있습니다.',
    dynamic: 'accuse',
    advisors: [],
    options: [],
  },
};

export const SCRIPT_ORDER = ['focus', 'h200', 'gpu', 'ipo', 'senator', 'taiwan', 'short', null, 'crossroads', 'accuse'];
// null = conditional/filler slot (audit if payout high, else random minor)
export const FILLERS = ['hire', 'rumor', 'power', 'leak', 'strike', 'gala'];
export const BONUS_TURNS = [3, 5, 7, 12];
export const TOTAL_TURNS = 12;

export const QUARTERS = ["Q4 '26", "Q1 '27", "Q2 '27", "Q3 '27", "Q4 '27", "Q1 '28", "Q2 '28", "Q3 '28", "Q4 '28", "Q1 '29", "Q2 '29", "Q3 '29"];

// ---- Prologue (visual novel) ---------------------------------------------
export const PROLOGUE = [
  { who: 'narr', text: '2026년 10월, 오마하. 엘리아스 밴스의 낡은 법률 사무소. 저녁 노을이 긴 탁자 위의 열한 개 인장을 붉게 물들이고 있었다.' },
  { who: 'mira', emo: 'worried', text: '"선생님은 당신의 이름만 쓰셨어요. 이유는… 저도 모릅니다."' },
  {
    who: 'victor', emo: 'smug', text: '"축하합니다, 류 선생. 열한 개의 불을 이어받으셨군요. 곧 이 자리가 얼마나 위험한지 아시게 될 겁니다. 그전에… 한 가지만 묻겠습니다. 선대께서 왜 당신을 고르셨는지, 짐작이 가십니까?"',
    choices: [
      { text: '"이 모든 걸… 저 혼자 감당하라는 건가요?"', sub: '미라 +1 · 헤일 −1', fx: { trust: { mira: 1, victor: -1 } }, reply: { who: 'mira', emo: 'happy', text: '"혼자가 아닙니다. 적어도 저는, 선생님의 마지막 부탁을 지킬 거예요."' } },
      { text: '"왜 하필 접니까? 이유를 아십니까?"', sub: '미라 +2', fx: { trust: { mira: 2 } }, reply: { who: 'victor', emo: 'neutral', text: '"…편지가 말해줄 겁니다. 일곱 통이 있다더군요. 한 통씩, 때가 되면."' } },
      { text: '"일단 장부부터 보여주십시오."', sub: '헤일 −2 · 정보 +1', fx: { trust: { victor: -2 }, intel: 1 }, reply: { who: 'victor', emo: 'angry', text: '"…급하시군요. 좋습니다. 장부는 미라가 가져올 겁니다. 다만 숫자만 보진 마시길."' } },
    ],
  },
  { who: 'mira', emo: 'neutral', text: '"이것이 첫 번째 편지입니다. 소리 내어 읽지는 마세요. 이 방에도 귀가 있으니까요."', letter: 'L1' },
  { who: 'narr', text: '열한 개의 불이 한 사람의 손에 놓였다. 그리고 그 손은, 아직 아무것도 쥐어 본 적이 없었다.' },
];

export const ENDINGS = {
  soft: { n: 3, key: 'soft', title: '연착륙의 설계자', en: 'THE ARCHITECT OF THE SOFT LANDING', quote: '"당신이 가장 많이 가진 사람이 되지 않은 것을, 나는 자랑스럽게 생각한다." — 엘리아스 밴스', text: ['그날, 열한 개의 불은 한꺼번에 꺼지지 않았다. 버블은 터졌지만, 누구도 사슬을 줍지 못했다.', '당신은 마지막 편지를 열었고, 선대가 40년 동안 준비한 장치는 처음부터 해체되기 위해 만들어진 것임을 알았다.', '미라는 말없이 편지 봉투를 접었고, SAGE는 처음으로 질문 대신 대답을 했다.'] },
  emperor: { n: 5, key: 'emperor', title: '황제의 왕관', en: 'THE EMPEROR\'S CROWN', quote: '"모든 것을 쥔 사람은, 모든 것을 잃을 이유도 쥔다." — 엘리아스 밴스', text: ['숫자는 더 가파르게 올랐다. 모든 고리가 당신의 손 안에 있었다.', '그리고 어느 날, 당신 곁에는 아무도 남아 있지 않았다. 미라도, SAGE도.', '선대가 가장 두려워한 바로 그 사람이, 지금 이 방의 가장 높은 의자에 앉아 있다.'] },
  crash: { n: 7, key: 'crash', title: '거품의 붕괴', en: 'THE BURST', quote: '"회장님, 우리는 너무 많이 지었습니다."', text: ['데이터센터 투자가 현금흐름을 넘어선 지 세 분기. 채권 스프레드가 폭등했고 신규 투자가 얼어붙었다.', '켈스트럴은 기다리고 있었다. 헐값에 나온 고리들을 하나씩 주워 가며.', '컴팩트는 데드맨 스위치를 눌렀지만, 누르는 사람이 이미 늦어 있었다.'] },
  alone: { n: 9, key: 'alone', title: '혼자 남은 부자', en: 'THE LONELY BILLIONAIRE', quote: '"세계에서 가장 부유한 사람이, 가장 외로운 사람이 되었다."', text: ['당신의 순자산은 어떤 순위표에서도 최상단에 올랐다.', '그러나 열한 개의 불은 서서히 식어 갔고, 사람들은 하나둘 떠났다.', '컴팩트는 남았다. 껍데기만.'] },
  prototype: { n: 1, key: 'prototype', title: '아직 끝나지 않은 이야기', en: 'TO BE CONTINUED', quote: '"마지막 편지는 아직 열리지 않았다."', text: ['열두 분기가 지났다. 이 프로토타입의 이야기는 여기까지다.', '일곱 통의 편지 중 네 통이 열렸고, 첩자와 켈스트럴의 정체는 아직 완전히 드러나지 않았다.', '당신의 선택은 기록되었다. 정식 버전에서는 마흔 분기가 이어진다.'] },
};

// ---- Tech tree (Civ-style): research points come from every company's R&D lever + the Tech stat ----
export const TECHS = [
  { id: 'scaling', tier: 1, row: 0, kr: '스케일링 법칙', en: 'SCALING LAWS', cost: 10, req: [], icon: 'chart', desc: '모델 규모를 키울수록 성능이 오른다는 경험칙. 전 기업 기본 성장 +0.4%p', fx: { permG: 0.004 } },
  { id: 'dc', tier: 1, row: 1, kr: '대규모 데이터센터', en: 'HYPERSCALE DC', cost: 10, req: [], icon: 'server', desc: '표준화된 대형 센터 설계. 마이크로소프트·아마존·알파벳 성장 +0.6%p', fx: { permComp: { MS: { g: 0.006 }, AM: { g: 0.006 }, GO: { g: 0.006 } } } },
  { id: 'rlhf', tier: 1, row: 2, kr: '정렬 기술', en: 'ALIGNMENT', cost: 12, req: [], icon: 'shield', desc: '모델을 사람의 의도에 맞춘다. 정부 +4, SAGE 신뢰 +4', fx: { gov: 4, trust: { sage: 4 } } },
  { id: 'euv', tier: 2, row: 0.5, kr: 'High-NA EUV 공정', en: 'HIGH-NA EUV', cost: 20, req: ['dc'], icon: 'chip', desc: 'TSMC 성장 +1.2%p, 엔비디아 +0.6%p, 기술 +3', fx: { permComp: { TS: { g: 0.012 }, NV: { g: 0.006 } }, tech: 3 } },
  { id: 'moe', tier: 2, row: 1.5, kr: '희소 전문가 모델', en: 'MIXTURE OF EXPERTS', cost: 20, req: ['scaling'], icon: 'brain', desc: '같은 성능을 절반의 연산으로. 거품 −3, Anthropic·OpenAI 성장 +1%p', fx: { bubble: -3, permComp: { AN: { g: 0.01 }, OA: { g: 0.01 } } } },
  { id: 'sec', tier: 2, row: 2.5, kr: '보안 아키텍처', en: 'ZERO-TRUST', cost: 18, req: ['rlhf'], icon: 'lock', desc: '내부자 유출 방어. 감사 위험 −10, 켈스트럴 단서 +1', fx: { audit: -10, clue: { who: 'victor', n: 1 } } },
  { id: 'agent', tier: 3, row: 1, kr: '자율 에이전트', en: 'AUTONOMOUS AGENTS', cost: 30, req: ['moe'], icon: 'robot', desc: '전 기업 기본 성장 +0.8%p. 단, 거품 +4', fx: { permG: 0.008, bubble: 4 } },
  { id: 'fusion', tier: 3, row: 0, kr: '소형 원자로', en: 'SMALL MODULAR REACTOR', cost: 30, req: ['euv'], icon: 'bolt', desc: '전력 문제 해결. 전 기업 마진 +0.4%p', fx: { permNm: 0.004 } },
  { id: 'interp', tier: 3, row: 2, kr: '해석가능성', en: 'INTERPRETABILITY', cost: 28, req: ['sec', 'moe'], icon: 'eye', desc: '모델 내부를 들여다본다. 정부 +6, SAGE 신뢰 +6', fx: { gov: 6, trust: { sage: 6 } } },
  { id: 'agi', tier: 4, row: 0.6, kr: '범용 지능', en: 'GENERAL INTELLIGENCE', cost: 50, req: ['agent', 'fusion'], icon: 'star', desc: '전 기업 성장 +1.5%p. 거품 +10 — 불은 켜지만 불길이 커진다', fx: { permG: 0.015, bubble: 10 } },
  { id: 'unwind', tier: 4, row: 1.8, kr: '컴팩트 해체 프로토콜', en: 'UNWIND PROTOCOL', cost: 50, req: ['interp', 'agent'], icon: 'key', desc: '선대가 남긴 마지막 열쇠. 유산 점수 +12, 정부 +8', fx: { gov: 8, flag: 'unwind' } },
];
