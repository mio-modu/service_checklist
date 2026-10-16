'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Shell, WeekBar, OfflineWarn } from '../shell';
import { useWeekData } from '../../lib/data';
import {
  MAIN, SUB, SPECIALS, VIDFLAGS, STATUS_LABEL, KIND_LABEL, TITLE,
  SvcId, activeIds, addDays, ago, buildSections, currentSaturday, doneCount,
  fmtShort, hm, lastChecked, resolveFlags, statusOf, svc, svcName,
} from '../../lib/domain';

export default function BoardPage() {
  const [week, setWeek] = useState(currentSaturday);
  const [showSub, setShowSub] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const d = useWeekData(week);
  const flags = useMemo(
    () => resolveFlags(week, d.weekInfo.flags, d.baptismMonths),
    [week, d.weekInfo.flags, d.baptismMonths],
  );
  const ids = useMemo(() => activeIds(flags), [flags]);
  const list: SvcId[] = showSub ? [...MAIN, ...SUB] : MAIN;
  const w = d.weekInfo;
  const infoEmpty = !w.title && !w.scripture && !w.reading && !w.videos && !w.notice;

  /* ── 숫자 ─────────────────────────────────────────── */
  let closed = 0, running = 0, total = 0, newest = '';
  list.forEach(id => {
    const c = d.getCheck(id);
    if (c.closing?.at) { closed++; if (c.closing.at > newest) newest = c.closing.at; }
    const n = doneCount(c, ids);
    if (n > 0) running++;
    total += n;
    const lc = lastChecked(c);
    if (lc && lc.at > newest) newest = lc.at;
  });

  /* ── 타임라인 ─────────────────────────────────────── */
  /* 이번 주 예배 중 보고 (마감 보고 제외) */
  const reports = useMemo(
    () => d.logs.filter(l => l.week === week && l.kind !== 'closing'),
    [d.logs, week],
  );
  const freshCount = reports.filter(l => Date.now() - new Date(l.created_at).getTime() < 30 * 60_000).length;

  const feed = useMemo(() => {
    const ev: { at: string; svc: SvcId; text: string; pd: string; kind: string }[] = [];
    list.forEach(id => {
      const c = d.getCheck(id);
      Object.entries(c.checked_at ?? {}).forEach(([k, at]) =>
        ev.push({ at, svc: id, text: TITLE[k] ?? k, pd: c.pd, kind: 'check' }));
    });
    d.logs.filter(l => l.week === week).forEach(l =>
      ev.push({ at: l.created_at, svc: l.svc, text: l.body, pd: l.pd, kind: l.kind }));
    return ev.sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [d, list, week, ids]);

  /* ── 누적 기록 ────────────────────────────────────── */
  const history = useMemo(() => {
    const rows = d.logs.filter(l => {
      if (filter === 'all') return true;
      if (filter.startsWith('k:')) return l.kind === filter.slice(2);
      return l.svc === filter;
    });
    const groups: { week: string; items: typeof rows }[] = [];
    rows.forEach(l => {
      let g = groups[groups.length - 1];
      if (!g || g.week !== l.week) { g = { week: l.week, items: [] }; groups.push(g); }
      g.items.push(l);
    });
    return groups;
  }, [d.logs, filter]);

  return (
    <>
      <Shell here="board" />
      <WeekBar week={week} setWeek={setWeek} />
      <main className="wrap">
        <OfflineWarn online={d.online} />

        {/* ── 숫자 — T20 ───────────────────────────────── */}
        <section className="band">
          <h2><span className="c">/</span> 이번 주 현황 · 실시간</h2>
          <dl className="counts">
            <Count k="마감 보고" v={closed} of={list.length} tone={closed < list.length ? 'hot' : 'good'}
                   src={closed < list.length ? `${list.length - closed}개 예배 미제출` : '전 예배 마감'} />
            <Count k="진행 중" v={running} of={list.length}
                   src={newest ? `마지막 변동 ${ago(newest)}` : '아직 움직임 없음'} />
            <Count k="전체 체크" v={total} of={list.length * ids.length}
                   src={`항목 ${ids.length}개 × 예배 ${list.length}개 기준`} />
            <Report n={reports.length} fresh={freshCount}
                    last={reports[0] ? ago(reports[0].created_at) : ''} />
          </dl>
          {!showSub && (
            <button className="plus" onClick={() => setShowSub(true)}>세종 예배 포함해서 보기 +</button>
          )}
        </section>

        {/* ── 금주 정보 — 간사가 못 넣었으면 관리자가 직접 ── */}
        <section className="band">
          <h2>
            <span className="c">/</span> 금주 예배 정보
            <Link href="/staff" className="ghost"
                  style={{ marginLeft: 14, padding: '3px 10px', textDecoration: 'none' }}>
              {infoEmpty ? '직접 입력' : '수정'}
            </Link>
          </h2>
          {infoEmpty ? (
            <div className="hint-empty" style={{ padding: '14px 0' }}>
              아직 아무것도 들어오지 않았습니다. 간사님이 못 넣으셨다면 직접 넣으셔도 됩니다.
            </div>
          ) : (
            <>
              <dl className="facts">
                <Fact k="설교 제목" v={d.weekInfo.title} />
                <Fact k="설교 본문" v={d.weekInfo.scripture} />
                <Fact k="공동체 성경읽기" v={d.weekInfo.reading} />
                <Fact k="금주 행사 · 기타 영상" v={d.weekInfo.videos} />
              </dl>
              <div className="pills">
                {VIDFLAGS.map(x => flags[x.k]
                  ? <span key={x.k} className="pill on">{x.l}<em>{x.when}</em></span>
                  : <span key={x.k} className="pill off">{x.l} 없음</span>)}
                {SPECIALS.filter(x => flags[x.k]).map(x => (
                  <span key={x.k} className="pill on">{x.l}{x.when && <em>{x.when}</em>}</span>
                ))}
                {flags.etc && <span className="pill on">{flags.etc}</span>}
              </div>
              {d.weekInfo.notice && <div className="saybox">{d.weekInfo.notice}</div>}
            </>
          )}
        </section>

        {/* ── 예배별 ──────────────────────────────────── */}
        <section className="band">
          <h2><span className="c">/</span> 예배별 진행</h2>
          <div>
            {list.map(id => {
              const sv = svc(id);
              const c = d.getCheck(id);
              const n = doneCount(c, ids);
              const st = statusOf(c, ids);
              const pct = ids.length ? Math.round((n / ids.length) * 100) : 0;
              const lc = lastChecked(c);
              const notes = d.logs.filter(l => l.week === week && l.svc === id && l.kind !== 'closing');
              return (
                <div className="svc" key={id}>
                  <div className="hd">
                    <b>{sv.site} {sv.name}</b>
                    <span className="at">{sv.time}</span>
                    <span className={`state ${st}`}>{STATUS_LABEL[st]}</span>
                    <span className="pdn">{c.pd || <span>PD 미지정</span>}</span>
                  </div>
                  <div className="meter">
                    <div className="bar"><i style={{ width: `${pct}%` }} data-full={n > 0 && n === ids.length ? '1' : '0'} /></div>
                    <span className="num">{n}/{ids.length}</span>
                  </div>
                  <div className="chips">
                    {lc && <span className="chip hit">{hm(lc.at)} · {TITLE[lc.id] ?? lc.id}</span>}
                    <span className="chip">기도자 {c.prayer_min != null ? `${c.prayer_min}분 전` : '–'}</span>
                    <span className="chip">함께기도 {c.team_min != null ? `${c.team_min}분 전` : '–'}</span>
                    {!c.items?.b2 && <span className="chip bad">본문↔자막 대조 미완료</span>}
                    {!c.closing?.at && <span className="chip bad">마감 보고 미제출</span>}
                  </div>
                  {c.closing?.at && (
                    <div className="quote lit">
                      <b>{hm(c.closing.at)} 마감 보고 · {c.closing.status === 'none' ? '특이사항 없음' : '특이사항 있음'}</b>
                      {c.closing.text}
                    </div>
                  )}
                  {notes.slice(0, 3).map(l => {
                    const fresh = Date.now() - new Date(l.created_at).getTime() < 30 * 60_000;
                    return (
                      <div className={`quote${fresh ? ' fresh' : ''}`} key={l.id}>
                        <b>
                          {hm(l.created_at)} · {KIND_LABEL[l.kind]}
                          {fresh && <span className="just">{ago(l.created_at)}</span>}
                        </b>
                        {l.body}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 타임라인 ────────────────────────────────── */}
        <section className="band">
          <h2><span className="c">/</span> 오늘의 움직임 {feed.length > 0 && `· ${feed.length}건`}</h2>
          <div className="feed">
            {feed.length === 0 ? (
              <div className="hint-empty">
                아직 움직임이 없습니다.<br />
                PD가 항목을 체크하는 순간 여기에 시각과 함께 바로 올라옵니다.
              </div>
            ) : feed.slice(0, 16).map((e, i) => (
              <div className="line" key={i}>
                <span className="t">{hm(e.at)}</span>
                <div className="b">
                  <p>{e.text}</p>
                  <div className="by">
                    {e.kind !== 'check' && (
                      <span className={`kt ${e.kind}`}>{KIND_LABEL[e.kind as 'special'] ?? '특이사항'}</span>
                    )}
                    <span>{svcName(e.svc)}</span>
                    {e.pd && <span>{e.pd}</span>}
                    <span>{ago(e.at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 누적 기록 ───────────────────────────────── */}
        <section className="band">
          <h2><span className="c">/</span> 보고 · 특이사항 누적 {d.logs.length > 0 && `· ${d.logs.length}건`}</h2>
          <div className="filters">
            {[
              { k: 'all', l: '전체' },
              ...MAIN.map(id => ({ k: id as string, l: `${svc(id).site} ${svc(id).name}` })),
              { k: 'k:closing', l: '마감 보고' },
              { k: 'k:issue', l: '이슈만' },
            ].map(o => (
              <button key={o.k} aria-pressed={filter === o.k} onClick={() => setFilter(o.k)}>{o.l}</button>
            ))}
          </div>
          {history.length === 0 ? (
            <div className="hint-empty">
              누적된 기록이 없습니다.<br />
              마감 보고와 특이사항은 주차와 상관없이 여기에 계속 쌓입니다.
            </div>
          ) : history.map(g => (
            <div key={g.week}>
              <div className="wkhead">
                {fmtShort(g.week)} ~ {fmtShort(addDays(g.week, 1))} · {g.items.length}건
              </div>
              <div className="feed">
                {g.items.map(l => (
                  <div className="line" key={l.id}>
                    <span className="t">{hm(l.created_at)}</span>
                    <div className="b">
                      <p>{l.body}</p>
                      <div className="by">
                        <span className={`kt ${l.kind}`}>{KIND_LABEL[l.kind]}</span>
                        <span>{l.svc_name || svcName(l.svc)}</span>
                        {l.pd && <span>{l.pd}</span>}
                        <span>{ago(l.created_at)}</span>
                        <button className="x" onClick={() => d.removeLog(l.id)}>삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <p className="foot">
          각 예배 PD가 체크하는 순간 이 화면이 스스로 갱신됩니다. 새로고침 필요 없음.
        </p>
      </main>
    </>
  );
}

function Report({ n, fresh, last }: { n: number; fresh: number; last: string }) {
  return (
    <div className="ct">
      <dt>예배 중 보고</dt>
      <dd className={fresh ? 'good' : ''}>{n}<small> 건</small></dd>
      <div className="src">{n === 0 ? '아직 없음' : fresh ? `방금 ${fresh}건 · 마지막 ${last}` : `마지막 ${last}`}</div>
    </div>
  );
}

function Count({ k, v, of, src, tone }: {
  k: string; v: number; of: number; src: string; tone?: 'hot' | 'good';
}) {
  return (
    <div className="ct">
      <dt>{k}</dt>
      <dd className={tone ?? ''}>{v}<small> / {of}</small></dd>
      <div className="src">{src}</div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="fact">
      <dt>{k}</dt>
      <dd className={v ? '' : 'none'}>{v || '미입력'}</dd>
    </div>
  );
}
