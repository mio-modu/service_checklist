'use client';

import { useMemo, useState } from 'react';
import { Shell, WeekBar, OfflineWarn } from './shell';
import { useWeekData } from '../lib/data';
import {
  MAIN, SUB, SPECIALS, VIDFLAGS, KIND_LABEL,
  SvcId, FlagKey, activeIds, ago, buildSections, currentSaturday, doneCount,
  fmtDate, hm, isAutoOn, resolveFlags, serviceDate, statusOf, svc,
} from '../lib/domain';

export default function CheckPage() {
  const [week, setWeek] = useState(currentSaturday);
  const [pick, setPick] = useState<SvcId>('sat');
  const [showSub, setShowSub] = useState(false);
  const [editWeek, setEditWeek] = useState(false);

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

  const setFlag = (k: FlagKey | 'etc', v: boolean | string) =>
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

        {/* ── 금주 특별순서 ───────────────────────────── */}
        <section className="band">
          <h2>
            <span className="c">/</span> 금주 특별순서
            <button className="ghost" style={{ marginLeft: 14, padding: '3px 10px' }}
                    onClick={() => setEditWeek(v => !v)}>
              {editWeek ? '편집 끝' : '편집'}
            </button>
          </h2>

          {editWeek ? (
            <>
              <div className="f">
                <label>이번 주에 있는 순서 <span className="lo">— 성찬식 · 비전헌금 · 세례식은 주차를 보고 저절로 켜집니다</span></label>
                <div className="switches">
                  {[...VIDFLAGS, ...SPECIALS].map(x => (
                    <button key={x.k} className="sw" aria-pressed={!!flags[x.k]}
                            onClick={() => setFlag(x.k, !flags[x.k])}>
                      <i>✓</i>
                      <span>{x.l}<small>{x.rule}{x.when ? ` · ${x.when}` : ''}</small></span>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="기타 특별순서 (직접 입력)" v={flags.etc} ph="예) 신년 감사예배 · 임직식"
                     on={v => setFlag('etc', v)} />

              <div className="f">
                <label>세례식 시행 월 <span className="lo">— 해당 월 마지막 주에 자동으로 켜집니다</span></label>
                <div className="months">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <button key={m} className="mo" aria-pressed={d.baptismMonths.includes(m)}
                            onClick={() => d.saveBaptismMonths(
                              d.baptismMonths.includes(m)
                                ? d.baptismMonths.filter(x => x !== m)
                                : [...d.baptismMonths, m].sort((a, b) => a - b),
                            )}>{m}</button>
                  ))}
                </div>
              </div>

              <div className="f">
                <label>PD 전달사항</label>
                <textarea value={d.weekInfo.notice} placeholder="모든 PD에게 공통으로 전달할 내용"
                          onChange={e => d.patchWeek({ notice: e.target.value })} />
              </div>
            </>
          ) : (
            <>
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
              {d.weekInfo.notice && <div className="saybox">{d.weekInfo.notice}</div>}
            </>
          )}
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

          <Closing week={week} pick={pick} d={d} />
          <Jot week={week} pick={pick} d={d} />
        </section>

        <p className="foot">
          체크는 누르는 즉시 저장되고 관리자 현황판에 실시간으로 올라갑니다. 예배 후 마감 보고까지 해야 끝납니다.
        </p>
      </main>
    </>
  );
}

/* ── 마감 보고 ───────────────────────────────────────── */
function Closing({ week, pick, d }: { week: string; pick: SvcId; d: ReturnType<typeof useWeekData> }) {
  const c = d.getCheck(pick);
  const [choice, setChoice] = useState<'' | 'none' | 'has'>('');
  const [body, setBody] = useState('');
  const [err, setErr] = useState(false);

  if (c.closing?.at) {
    return (
      <div className="close ok">
        <div className="close-h">
          <b>마감 보고 완료</b>
          <span className="sig">{hm(c.closing.at)} · {c.closing.pd || '이름 없음'}</span>
        </div>
        <div className="done-card">
          <b>{c.closing.status === 'none' ? '특이사항 없음' : '특이사항 있음'}</b>
          {c.closing.text}
        </div>
        <button className="ghost" onClick={() => {
          setChoice(c.closing!.status); setBody(c.closing!.status === 'has' ? c.closing!.text : '');
          d.patchCheck(pick, { closing: null }, true);
        }}>다시 작성</button>
      </div>
    );
  }

  const submit = () => {
    if (!choice) return;
    const text = choice === 'has' ? body.trim() : '특이사항 없음';
    if (choice === 'has' && !text) { setErr(true); return; }
    const at = new Date().toISOString();
    d.patchCheck(pick, { closing: { status: choice, text, at, pd: c.pd || '' } }, true);
    d.saveClosingLog(pick, text, c.pd || '', at);
    setChoice(''); setBody(''); setErr(false);
  };

  return (
    <div className="close wait">
      <div className="close-h">
        <b>예배 후 마감 보고</b>
        <span className="need">필수</span>
      </div>
      <p>
        예배가 끝나면 반드시 제출합니다. 특이사항이 없어도 <b>“특이사항 없음”</b>으로 제출해야 마감됩니다.
      </p>
      <div className="two">
        <button aria-pressed={choice === 'none'} onClick={() => setChoice('none')}>특이사항 없음</button>
        <button aria-pressed={choice === 'has'} onClick={() => setChoice('has')}>특이사항 있음</button>
      </div>
      {choice === 'has' && (
        <div className="f">
          <textarea value={body} autoFocus
                    style={err ? { borderColor: 'var(--alert)' } : undefined}
                    placeholder="무슨 일이 있었는지, 다음 주에 반영할 점까지 적어주세요"
                    onChange={e => { setBody(e.target.value); setErr(false); }} />
        </div>
      )}
      <button className="go" disabled={!choice} onClick={submit}>마감 보고 제출</button>
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
        <label>수시 기록 <span className="lo">— 예배 중 생긴 일을 그때그때</span></label>
      </div>
      <div className="kinds">
        <button aria-pressed={kind === 'special'} onClick={() => setKind('special')}>특이사항</button>
        <button aria-pressed={kind === 'issue'} onClick={() => setKind('issue')}>장애 · 이슈</button>
      </div>
      <div className="inline">
        <textarea value={text} placeholder="예) 2부 특순 순서 변경 / 설교 중 자막 1회 끊김"
                  onChange={e => setText(e.target.value)} />
        <button className="go" onClick={() => {
          const t = text.trim(); if (!t) return;
          d.addLog(pick, kind, t, d.getCheck(pick).pd || ''); setText('');
        }}>기록 추가</button>
      </div>
      <div className="feed">
        {mine.length === 0
          ? <div className="hint-empty">아직 기록된 내용이 없습니다.</div>
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
function Field({ label, v, ph, on }: { label: string; v: string; ph: string; on: (v: string) => void }) {
  return (
    <div className="f">
      <label>{label}</label>
      <input type="text" value={v ?? ''} placeholder={ph} onChange={e => on(e.target.value)} />
    </div>
  );
}
