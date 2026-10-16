'use client';

import { useMemo, useState } from 'react';
import { Shell, WeekBar, OfflineWarn } from '../shell';
import { useWeekData } from '../../lib/data';
import {
  MAIN, SUB, SPECIALS, VIDFLAGS, KIND_LABEL,
  SvcId, FlagKey, activeIds, ago, buildSections, currentSaturday, doneCount,
  fmtDate, hm, isAutoOn, resolveFlags, serviceDate, statusOf, svc,
} from '../../lib/domain';

export default function CheckPage() {
  const [week, setWeek] = useState(currentSaturday);
  const [pick, setPick] = useState<SvcId>('sat');
  const [showSub, setShowSub] = useState(false);

  const d = useWeekData(week);
  const flags = useMemo(
    () => resolveFlags(week, d.weekInfo.flags, d.baptismMonths),
    [week, d.weekInfo.flags, d.baptismMonths],
  );
  const sections = useMemo(() => buildSections(flags), [flags]);
  const ids = useMemo(() => activeIds(flags), [flags]);

  const s = svc(pick);
  const c = d.getCheck(pick);
  const n = doneCount(c, ids);
  const pct = ids.length ? Math.round((n / ids.length) * 100) : 0;

  /* 홍보 영상처럼 주차로 판정할 수 없는 항목은 PD가 큐시트를 보고 직접 전환합니다. */
  const setFlag = (k: FlagKey, v: boolean) =>
    d.patchWeek({ flags: { ...d.weekInfo.flags, [k]: v } });

  const toggle = (id: string) => {
    const items = { ...(c.items ?? {}) };
    const at = { ...(c.checked_at ?? {}) };
    if (items[id]) { delete items[id]; delete at[id]; }
    else { items[id] = true; at[id] = new Date().toISOString(); }
    d.patchCheck(pick, { items, checked_at: at });
  };

  return (
    <>
      <Shell here="check" />
      <WeekBar week={week} setWeek={setWeek} />
      <main className="wrap">
        <OfflineWarn online={d.online} />

        {/* ── 금주 예배 정보 (간사가 기입, PD는 보기만) ──── */}
        <section className="band">
          <h2><span className="c">/</span> 금주 예배 정보</h2>

          <dl className="facts">
            <Fact k="설교 제목" v={d.weekInfo.title} />
            <Fact k="설교 본문" v={d.weekInfo.scripture} />
            <Fact k="공동체 성경읽기" v={d.weekInfo.reading} />
            <Fact k="금주 행사 · 기타 영상" v={d.weekInfo.videos} />
          </dl>

          <div className="pills">
            {VIDFLAGS.map(x => flags[x.k] ? (
              <span key={x.k} className="pill on">
                {x.l}<em>{x.when}{isAutoOn(week, x.k, d.weekInfo.flags, d.baptismMonths) ? ' · 자동' : ''}</em>
              </span>
            ) : (
              <span key={x.k} className="pill off">{x.l} 없음</span>
            ))}
            {SPECIALS.filter(x => flags[x.k]).map(x => (
              <span key={x.k} className="pill on">
                {x.l}{x.when && <em>{x.when}{isAutoOn(week, x.k, d.weekInfo.flags, d.baptismMonths) ? ' · 자동' : ''}</em>}
              </span>
            ))}
            {flags.etc && <span className="pill on">{flags.etc}</span>}
          </div>

          {flags.promo && d.weekInfo.promo_note && (
            <div className="saybox"><b>홍보 영상</b>{d.weekInfo.promo_note}</div>
          )}
          {d.weekInfo.notice && <div className="saybox">{d.weekInfo.notice}</div>}
        </section>

        {/* ── 예배 고르기 ──────────────────────────────── */}
        <section className="band">
          <h2><span className="c">/</span> 예배 선택</h2>
          <div className="picks">
            {[
              { label: '대전', list: MAIN },
              { label: '세종', list: showSub ? SUB : [] },
            ].map(({ label, list }) => (
              <div className="pickrow" key={label}>
                <span className="tagline">{label}</span>
                {list.map(id => {
                  const sv = svc(id);
                  const st = statusOf(d.getCheck(id), ids);
                  return (
                    <button key={id} className="pick" data-st={st} aria-pressed={pick === id}
                            onClick={() => setPick(id)}>
                      <s /> {sv.name} <em>{sv.time}</em>
                    </button>
                  );
                })}
                {label === '세종' && !showSub && (
                  <button className="plus" onClick={() => setShowSub(true)}>세종 예배 보기 +</button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 체크리스트 ───────────────────────────────── */}
        <section className="sheet">
          <div className="sheet-h">
            <div className="who">
              <h1>{s.site} {s.name}</h1>
              <div className="meta">{fmtDate(serviceDate(week, pick))} · 예배 {s.time} · BGM {s.bgm}</div>
            </div>
            <div className="f pdin">
              <label htmlFor="pd">담당 PD</label>
              <input id="pd" type="text" value={c.pd} placeholder="이름 입력" autoComplete="off"
                     onChange={e => d.patchCheck(pick, { pd: e.target.value })} />
            </div>
          </div>

          <div className="gauge">
            <div className="read">
              <span className="big">{n}</span>
              <span className="of">/ {ids.length} 항목 · {pct}%</span>
              <span className="src">
                {c.updated_at ? `${hm(c.updated_at)} 기준` : '아직 체크 없음'}
              </span>
            </div>
            <div className="bar"><i style={{ width: `${pct}%` }} data-full={n > 0 && n === ids.length ? '1' : '0'} /></div>
          </div>

          {sections.map((sec, si) => {
            const got = sec.items.filter(i => c.items?.[i.id]).length;
            return (
              <div className="grp" key={si}>
                <div className="grp-h">
                  <span className="n">{sec.no}</span>
                  <h3>{sec.title}</h3>
                  <span className="of">{got}/{sec.items.length}</span>
                </div>
                <div className="rows">
                  {sec.items.map(it => {
                    const on = !!c.items?.[it.id];
                    return (
                      <div className="r" data-on={on ? '1' : '0'} key={it.id}>
                        <button className="tick" aria-pressed={on} aria-label={it.t}
                                onClick={() => toggle(it.id)}>✓</button>
                        <div className="c">
                          <div className="lab" onClick={() => toggle(it.id)}>
                            {it.t}
                            {it.must && <span className="mark-must">필수</span>}
                            {it.sp && <span className="mark-sp">{it.sp}</span>}
                          </div>
                          {it.hint && <div className="sub">{it.hint}</div>}
                          {it.flag && (
                            <button className="na" onClick={() => setFlag(it.flag!, false)}>
                              이번 주는 없음 — 항목 내리기
                            </button>
                          )}
                          {it.num && (
                            <div className="mins">
                              <span>{it.numLabel}</span>
                              <input type="number" min={0} max={120} inputMode="numeric"
                                     value={c[it.num] ?? ''} placeholder="–"
                                     onChange={e => d.patchCheck(pick, {
                                       [it.num!]: e.target.value === '' ? null
                                         : Math.max(0, Math.min(120, Number(e.target.value))),
                                     } as any)} />
                              <span>분 전</span>
                            </div>
                          )}
                          {on && c.checked_at?.[it.id] && (
                            <div className="when">✓ {hm(c.checked_at[it.id])} 확인</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {sec.off.map(it => (
                    <button className="r skip" key={it.id}
                            onClick={() => setFlag(it.flag!, true)}>
                      <span className="nope">해당 없음</span>
                      <s>{it.t.split(' — ')[0]}</s>
                      <span className="turnon">큐시트에 있으면 눌러서 항목 띄우기</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <Jot week={week} pick={pick} d={d} />
          <Closing week={week} pick={pick} d={d} />
        </section>

        <p className="foot">
          체크는 누르는 즉시 저장되고 관리자 현황판에 실시간으로 올라갑니다. 예배 후 마감 보고까지 해야 끝납니다.
          {' · '}<a href="/gate">간사 · 관리자</a>
        </p>
      </main>
    </>
  );
}

/* ── 마감 보고 ───────────────────────────────────────── */
function Closing({ week, pick, d }: { week: string; pick: SvcId; d: ReturnType<typeof useWeekData> }) {
  const c = d.getCheck(pick);
  const notes = d.logs.filter(l => l.week === week && l.svc === pick && l.kind !== 'closing');
  const [extra, setExtra] = useState('');
  const [writing, setWriting] = useState(false);

  if (c.closing?.at) {
    return (
      <div className="close ok">
        <div className="close-h">
          <b>마감 보고 완료</b>
          <span className="sig">{hm(c.closing.at)} · {c.closing.pd || '이름 없음'}</span>
        </div>
        <div className="done-card">
          <b>{c.closing.status === 'none' ? '보고할 내용 없음' : '보고 내용'}</b>
          {c.closing.text}
        </div>
        <button className="ghost" onClick={() => d.patchCheck(pick, { closing: null }, true)}>
          다시 작성
        </button>
      </div>
    );
  }

  const submit = () => {
    const parts = notes.map(n => `${hm(n.created_at)} ${n.body}`);
    const e = extra.trim();
    if (e) parts.push(e);
    const has = parts.length > 0;
    const at = new Date().toISOString();
    const text = has ? parts.join('\n') : '보고할 내용 없음';
    d.patchCheck(pick, { closing: { status: has ? 'has' : 'none', text, at, pd: c.pd || '' } }, true);
    d.saveClosingLog(pick, text, c.pd || '', at);
    setExtra(''); setWriting(false);
  };

  return (
    <div className="close wait">
      <div className="close-h">
        <b>예배 후 마감 보고</b>
        <span className="need">필수</span>
      </div>

      {notes.length > 0 ? (
        <>
          <p>예배 중 보고하신 <b>{notes.length}건</b>이 그대로 들어갑니다. 따로 또 쓰실 필요 없습니다.</p>
          <div className="rollup">
            {notes.map(n => (
              <div key={n.id}><span>{hm(n.created_at)}</span>{n.body}</div>
            ))}
          </div>
        </>
      ) : (
        <p>예배 중 보고하신 내용이 없습니다. 그대로 마감하시거나, 지금 적으셔도 됩니다.</p>
      )}

      {writing && (
        <div className="f">
          <textarea value={extra} autoFocus
                    placeholder="보고에 덧붙일 내용 — 다음 주에 반영할 점까지"
                    onChange={e => setExtra(e.target.value)} />
        </div>
      )}

      <div className="two">
        <button className="go" onClick={submit}>
          {notes.length || extra.trim() ? '이 내용으로 마감 보고' : '보고할 내용 없음으로 마감'}
        </button>
        {!writing && (
          <button className="ghost" onClick={() => setWriting(true)}>덧붙일 내용 있음</button>
        )}
      </div>
    </div>
  );
}

/* ── 수시 기록 ───────────────────────────────────────── */
function Jot({ week, pick, d }: { week: string; pick: SvcId; d: ReturnType<typeof useWeekData> }) {
  const [kind, setKind] = useState<'special' | 'issue'>('special');
  const [text, setText] = useState('');
  const mine = d.logs.filter(l => l.week === week && l.svc === pick && l.kind !== 'closing');

  return (
    <div className="jot">
      <div className="f">
        <label>예배 중 보고 <span className="lo">— 특이사항이 생기면 그 자리에서. 관리자 현황판에 바로 뜹니다.</span></label>
      </div>
      <div className="kinds">
        <button aria-pressed={kind === 'special'} onClick={() => setKind('special')}>특이사항</button>
        <button aria-pressed={kind === 'issue'} onClick={() => setKind('issue')}>장애 · 이슈</button>
      </div>
      <div className="inline">
        <textarea value={text} placeholder="예) 설교 중 자막 1회 끊김 / 대표기도자 교체 / 특순 순서 변경"
                  onChange={e => setText(e.target.value)} />
        <button className="go" onClick={() => {
          const t = text.trim(); if (!t) return;
          d.addLog(pick, kind, t, d.getCheck(pick).pd || ''); setText('');
        }}>보고하기</button>
      </div>
      <div className="feed">
        {mine.length === 0
          ? <div className="hint-empty">아직 보고한 내용이 없습니다. 여기 적는 즉시 관리자에게 전해집니다.</div>
          : mine.map(l => (
            <div className="line" key={l.id}>
              <span className="t">{hm(l.created_at)}</span>
              <div className="b">
                <p>{l.body}</p>
                <div className="by">
                  <span className={`kt ${l.kind}`}>{KIND_LABEL[l.kind]}</span>
                  {l.pd && <span>{l.pd}</span>}
                  <span>{ago(l.created_at)}</span>
                  <button className="x" onClick={() => d.removeLog(l.id)}>삭제</button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ── 작은 조각 ───────────────────────────────────────── */

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="fact">
      <dt>{k}</dt>
      <dd className={v ? '' : 'none'}>{v || '미입력'}</dd>
    </div>
  );
}
