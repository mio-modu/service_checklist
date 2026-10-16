/* ============================================================
   예배 · 체크항목 · 주차 규칙 — 화면 두 개가 공유하는 단일 출처
   항목을 고치려면 이 파일만 고치면 됩니다.
   ============================================================ */

export type SvcId = 'sat' | 's1' | 's2' | 's3' | 'j1' | 'j2' | 'j3';

export type Service = {
  id: SvcId; site: string; name: string; time: string;
  day: 'sat' | 'sun'; bgm: string;
};

export const SVCS: Service[] = [
  { id: 'sat', site: '대전', name: '토요 주일예배', time: '10:00', day: 'sat', bgm: '09:50' },
  { id: 's1',  site: '대전', name: '주일 1부',      time: '07:10', day: 'sun', bgm: '06:55' },
  { id: 's2',  site: '대전', name: '주일 2부',      time: '09:00', day: 'sun', bgm: '08:45' },
  { id: 's3',  site: '대전', name: '주일 3부',      time: '11:30', day: 'sun', bgm: '11:15' },
  { id: 'j1',  site: '세종', name: '주일 1부',      time: '09:00', day: 'sun', bgm: '08:45' },
  { id: 'j2',  site: '세종', name: '주일 2부',      time: '11:30', day: 'sun', bgm: '11:15' },
  { id: 'j3',  site: '세종', name: '주일 3부',      time: '14:30', day: 'sun', bgm: '14:15' },
];

export const MAIN: SvcId[] = ['sat', 's1', 's2', 's3'];   // 대전 — 상시 사용
export const SUB:  SvcId[] = ['j1', 'j2', 'j3'];          // 세종 — 필요할 때만

export const svc = (id: string): Service => SVCS.find(s => s.id === id) ?? SVCS[0];
export const svcName = (id: string) => { const s = svc(id); return `${s.site} ${s.name}`; };

/* ── 체크 항목 ──────────────────────────────────────────── */

export type Item = {
  id: string; t: string; hint?: string;
  must?: boolean;                 // 필수 항목 (미완료 시 현황판 경고)
  flag?: FlagKey;                 // 이 플래그가 켜진 주에만 나타남
  off?: string;                   // 꺼졌을 때 표시할 문구
  num?: 'prayer_min' | 'team_min';  // 분 단위 숫자 입력
  numLabel?: string;
  sp?: string;                    // 특별순서 라벨
};

export type Section = { no: string; title: string; items: Item[] };

export const SECTIONS: Section[] = [
  { no: '01', title: '도착 · 장비 확인', items: [
    { id: 'a1', t: '방송실 도착' },
    { id: 'a4', t: '모든 장비 전원 ON 확인',
      hint: '카메라 · 스위처 · 오디오 콘솔 · 조명 콘솔 · 자막기 · 녹화기까지 하나씩' },
    { id: 'a5', t: '방송 송출 확인',
      hint: '중앙스크린 · 스테이지모니터 · 본당 밖 모니터까지 신호가 나가고 있는지' },
    { id: 'a6', t: 'YouTube 스트리밍 확인',
      hint: '예약 방송 · 스트림 키 연결 상태. 실제 송출 시작은 큐시트 BGM 시각에.' },
    { id: 'd2', t: '다 같이 모여 기도', num: 'team_min', numLabel: '예배 시작',
      hint: '장비 확인을 끝내고 방송팀이 함께' },
  ]},
  { no: '02', title: '준비 점검', items: [
    { id: 'a2', t: '내 큐시트(QCT) 최종 점검', hint: '순서 · 시간 · 담당자 이름까지 한 번 더. 미리 봤어도 다시 본다.' },
    { id: 'a3', t: '조명 · 음향 큐 확인', hint: '큐시트 비고란 대조 — 1층 40%, 양옆 차단기, 할로겐 ON/OFF' },
  ]},
  { no: '03', title: '자막', items: [
    { id: 'b2', t: '설교 본문 자막 대조 확인', must: true,
      hint: '성경을 펴놓고 한 절씩 — 장·절, 개역개정 문구, 빠진 절. 토요예배 PD 필수.' },
    { id: 'b4', t: '추가 본문 자막 확인',
      hint: '설교 중 인용되는 본문 외 구절. 장·절과 문구가 맞는지.' },
    { id: 'b3', t: '찬양 가사 자막 확인',
      hint: '한 절씩 볼 것 없이 — 큐시트에 있는 곡이 맞는지, 오타는 없는지만 쭉' },
    { id: 'b5', t: '대표기도문 통자막 확인', hint: '오타만 보면 됩니다' },
    { id: 'b6', t: '광고 자막 확인',
      hint: '주보가 아니라 구두광고지 기준 — 거기 적힌 내용이 자막에 들어갔는지' },
  ]},
  { no: '04', title: '영상', items: [
    { id: 'c1', t: '공동체 성경읽기 영상 — 파일 확인 · 재생 테스트', hint: '매주 고정' },
    { id: 'c2', t: '홍보 영상 — 파일 확인', flag: 'promo',
      off: '이번 주 홍보 영상 없음', hint: '※ 항상 공동체 성경읽기 직후에 붙는다' },
    { id: 'c3', t: '비전헌금 영상 — 파일 확인', flag: 'vision',
      off: '이번 주 비전헌금 영상 없음', hint: '※ 항상 설교 종료 직후에 붙는다' },
  ]},
  { no: '05', title: '섬김이', items: [
    { id: 'd1', t: '대표기도자 도착 확인', num: 'prayer_min', numLabel: '예배 시작' },
    { id: 'd3', t: '사회자 · 찬양인도자 위치 확인' },
  ]},
  { no: '06', title: '송출', items: [
    { id: 'e1', t: 'YouTube Live 스트리밍 송출 시작', hint: '큐시트 BGM 시각에' },
    { id: 'e2', t: '예배 후 스트리밍 종료' },
  ]},
];

/* ── 특별순서 · 영상 플래그 ─────────────────────────────── */

export type FlagKey = 'promo' | 'vision' | 'communion' | 'baptism' | 'specialSong' | 'cert1on1' | 'certKids';
export type Flags = Record<FlagKey, boolean> & { etc: string };

/** 특정 예배에서만 하는 순서가 어느 예배에 붙는지. 예) { baptism: ['s2'] } */
export type FlagSvcs = Partial<Record<FlagKey, string[]>>;

/** 지정 예배가 필요한 순서인데 아무 예배도 고르지 않았는지 */
export function needsService(f: Flags, fs: FlagSvcs | null | undefined) {
  return SPECIALS.filter(s => s.perService && f[s.k] && !(fs?.[s.k]?.length));
}

export const VIDFLAGS = [
  { k: 'promo'  as FlagKey, l: '홍보 영상',     when: '공동체 성경읽기 직후', rule: '그때그때' },
  { k: 'vision' as FlagKey, l: '비전헌금 · 작정헌금 영상', when: '설교 종료 직후',
    rule: '매월 둘째 주 · 1월 첫 주' },
];

/** perService: 모든 예배가 아니라 지정한 예배에서만 하는 순서 */
export const SPECIALS: { k: FlagKey; l: string; when: string; rule: string;
                        perService?: boolean; items: Item[] }[] = [
  { k: 'communion', l: '성찬식', when: '설교 직후 · 약 8분', rule: '매월 첫째 주', items: [
    { id: 'f1', t: '분병기 · 분잔기 정위치 확인',
      hint: '성찬팀이 알아서 준비합니다. 자리에 놓였는지만 눈으로.' },
    { id: 'f3', t: '분병 · 분잔 담당 동선 확인' },
    { id: 'f4', t: '분병 · 분잔 담당에게 도착 시각 연락',
      hint: '문자나 전화로 한 번 더 — 몇 시까지 와달라고' },
  ]},
  { k: 'baptism', l: '세례식', when: '설교 후', rule: '해당 월 마지막 주', perService: true, items: [
    { id: 'g3', t: '세례자 리허설 시간까지 도착 확인' },
    { id: 'g4', t: '세례자 동선 리허설 완료' },
    { id: 'g1', t: '세례자 명단 자막 확인 — 이름 · 순서' },
  ]},
  { k: 'specialSong', l: '특순', when: '헌금 영상 직후', rule: '헌금 영상 있는 주', items: [
    { id: 'k1', t: '특순자 도착 · 특순 리허설 완료' },
    { id: 'k2', t: '특순 MR · 음향 · 조명 큐 확인' },
  ]},
  { k: 'cert1on1', l: '1대1 수료식', when: '', rule: '비정기', perService: true, items: [
    { id: 'h1', t: '1대1 수료자 명단 자막 확인' },
    { id: 'h2', t: '수여 장면 카메라 큐 확인' },
  ]},
  { k: 'certKids', l: '어린이 1대1 수료식', when: '', rule: '비정기', perService: true, items: [
    { id: 'i1', t: '어린이 수료자 명단 자막 확인' },
    { id: 'i2', t: '수여 장면 카메라 큐 확인' },
  ]},
];

export const TITLE: Record<string, string> = (() => {
  const m: Record<string, string> = { z1: '기타 특별순서' };
  SECTIONS.forEach(s => s.items.forEach(i => { m[i.id] = i.t; }));
  SPECIALS.forEach(s => s.items.forEach(i => { m[i.id] = i.t; }));
  return m;
})();

/* ── 날짜 · 주차 ────────────────────────────────────────── */

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };

/** 이번 주의 토요일 (주차 키). 일요일이면 전날 토요일. */
export function currentSaturday(now = new Date()) {
  const d = new Date(now); const w = d.getDay();
  d.setDate(d.getDate() + (w === 0 ? -1 : 6 - w));
  return ymd(d);
}
export const fmtDate  = (s: string) => { const d = parseYmd(s); return `${d.getMonth() + 1}월 ${d.getDate()}일(${DOW[d.getDay()]})`; };
export const fmtShort = (s: string) => { const d = parseYmd(s); return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
export const serviceDate = (week: string, id: string) => (svc(id).day === 'sat' ? week : addDays(week, 1));

export const hm = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export function ago(iso?: string | null) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return '방금';
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

/** 주일(일요일) 기준 — 그 달의 몇 번째 주인가 */
export const nthWeek   = (sun: string) => Math.floor((parseYmd(sun).getDate() - 1) / 7) + 1;
export const monthOf   = (sun: string) => parseYmd(sun).getMonth() + 1;
export function isLastWeek(sun: string) {
  const d = parseYmd(sun);
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return d.getDate() + 7 > dim;
}

/** 세례식은 이 달의 마지막 주에만. 11월은 없습니다. */
export const DEFAULT_BAPTISM_MONTHS = [2, 4, 6, 10, 12];

/** 주차만 보고 자동으로 정해지는 특별순서 */
export function autoFlags(week: string, baptismMonths = DEFAULT_BAPTISM_MONTHS): Flags {
  const sun = addDays(week, 1);
  return {
    communion: nthWeek(sun) === 1,                                        // 매월 첫째 주 성찬식
    // 헌금 영상: 매월 둘째 주 비전헌금 + 매년 1월 첫 주 선교헌금 작정.
    // 5~6월 더멋진세상 작정은 해마다 주차가 달라 간사가 직접 켭니다.
    vision:    nthWeek(sun) === 2 || (monthOf(sun) === 1 && nthWeek(sun) === 1),
    baptism:   isLastWeek(sun) && baptismMonths.includes(monthOf(sun)),   // 해당 월 마지막 주 세례식
    promo:       false,  // 홍보 영상은 그때그때 — 간사가 켭니다
    specialSong: false,  // 아래 resolveFlags 에서 헌금 영상 유무를 따라갑니다
    cert1on1:  false,
    certKids:  false,
    etc:       '',
  };
}

/** 자동값 위에 관리자가 수동으로 덮어쓴 값을 얹는다 */
export function resolveFlags(week: string, saved: Partial<Flags> | null, baptismMonths?: number[]): Flags {
  const f = { ...autoFlags(week, baptismMonths), ...(saved ?? {}) } as Flags;
  // 특순은 헌금 영상이 있는 주에만 붙습니다. 간사가 직접 건드린 주는 그 뜻을 따릅니다.
  if (saved?.specialSong === undefined) f.specialSong = f.vision;
  return f;
}
export function isAutoOn(week: string, k: FlagKey, saved: Partial<Flags> | null, baptismMonths?: number[]) {
  return autoFlags(week, baptismMonths)[k] === true && saved?.[k] !== false;
}

/* ── 그 주에 실제로 보이는 섹션/항목 ────────────────────── */

export type BuiltSection = { no: string; title: string; items: Item[]; off: Item[] };

export function buildSections(f: Flags, svcId?: string, fs?: FlagSvcs | null): BuiltSection[] {
  const out: BuiltSection[] = SECTIONS.map(sec => ({
    no: sec.no, title: sec.title,
    items: sec.items.filter(i => !i.flag || f[i.flag]),
    off:   sec.items.filter(i => !!i.flag && !f[i.flag!]),
  }));
  const sp: Item[] = [];
  SPECIALS.forEach(s => {
    if (!f[s.k]) return;
    // 지정 예배가 필요한 순서는 그 예배의 PD 화면에만 올립니다.
    // 고른 예배가 없으면 어느 PD 화면에도 올리지 않습니다 — 없는 항목을
    // 체크하느라 영영 100% 가 안 되는 일을 막기 위함입니다.
    if (s.perService && !(svcId && fs?.[s.k]?.includes(svcId))) return;
    s.items.forEach(i => sp.push({ ...i, sp: s.l }));
  });
  if (f.etc) sp.push({ id: 'z1', t: `기타 특별순서 — ${f.etc}`, hint: '큐시트에서 순서·시각 확인', sp: '기타' });
  if (sp.length) out.push({ no: '06', title: '특별순서', items: sp, off: [] });
  return out;
}
export const activeIds = (f: Flags, svcId?: string, fs?: FlagSvcs | null) =>
  buildSections(f, svcId, fs).flatMap(s => s.items.map(i => i.id));

/* ── 상태 판정 ──────────────────────────────────────────── */

export type Check = {
  week: string; svc: SvcId; service_date: string | null; pd: string;
  items: Record<string, boolean>;
  checked_at: Record<string, string>;
  prayer_min: number | null; team_min: number | null;
  closing: { status: 'none' | 'has'; text: string; at: string; pd: string } | null;
  updated_at?: string;
};

export const emptyCheck = (week: string, id: SvcId): Check => ({
  week, svc: id, service_date: serviceDate(week, id), pd: '',
  items: {}, checked_at: {}, prayer_min: null, team_min: null, closing: null,
});

export const doneCount = (c: Check, ids: string[]) => ids.filter(i => c.items?.[i]).length;

export type Status = 'idle' | 'go' | 'done' | 'closed';
export function statusOf(c: Check, ids: string[]): Status {
  if (c.closing?.at) return 'closed';
  const n = doneCount(c, ids);
  if (n > 0 && n >= ids.length) return 'done';
  return n > 0 || c.pd ? 'go' : 'idle';
}
export const STATUS_LABEL: Record<Status, string> = {
  idle: '미시작', go: '진행 중', done: '체크 완료 · 마감 대기', closed: '마감 완료',
};

/** 가장 최근에 체크한 항목 */
export function lastChecked(c: Check): { id: string; at: string } | null {
  let at = '', id = '';
  Object.entries(c.checked_at ?? {}).forEach(([k, v]) => { if (v > at) { at = v; id = k; } });
  return id ? { id, at } : null;
}

/* ── 기록 ───────────────────────────────────────────────── */

export type LogKind = 'special' | 'issue' | 'closing';
export const KIND_LABEL: Record<LogKind, string> = { special: '특이사항', issue: '이슈', closing: '마감' };

export type Log = {
  id: string; week: string; svc: SvcId; svc_name: string; service_date: string | null;
  kind: LogKind; body: string; pd: string; created_at: string;
};
