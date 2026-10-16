'use client';

import { useMemo, useState } from 'react';
import { Shell, WeekBar, OfflineWarn } from '../shell';
import { useWeekData } from '../../lib/data';
import {
  SPECIALS, VIDFLAGS, FlagKey, currentSaturday, isAutoOn, resolveFlags,
} from '../../lib/domain';

export default function StaffPage() {
  const [week, setWeek] = useState(currentSaturday);
  const d = useWeekData(week);
  const flags = useMemo(
    () => resolveFlags(week, d.weekInfo.flags, d.baptismMonths),
    [week, d.weekInfo.flags, d.baptismMonths],
  );
  const setFlag = (k: FlagKey | 'etc', v: boolean | string) =>
    d.patchWeek({ flags: { ...d.weekInfo.flags, [k]: v } });

  return (
    <>
      <Shell here="staff" />
      <WeekBar week={week} setWeek={setWeek} />
      <main className="wrap">
        <OfflineWarn online={d.online} />

        <section className="band">
          <h2><span className="c">/</span> 금주 예배 정보</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', wordBreak: 'keep-all' }}>
            여기 적으신 내용이 <b>일곱 예배 PD 화면에 그대로</b> 뜹니다. 적는 즉시 반영되니 따로 저장할 것 없습니다.
          </p>

          <div className="grid2">
            <Field id="t" label="설교 제목" v={d.weekInfo.title}
                   ph="예) 해같이 힘차게 솟아오르는 교회"
                   on={v => d.patchWeek({ title: v })} />
            <Field id="s" label="설교 본문" v={d.weekInfo.scripture}
                   ph="예) 사사기 5:1-12, 31"
                   on={v => d.patchWeek({ scripture: v })} />
            <Field id="r" label="공동체 성경읽기" v={d.weekInfo.reading}
                   ph="예) 요한계시록 2:1-29, 시편 133:1-3"
                   on={v => d.patchWeek({ reading: v })} />
            <Field id="v" label="금주 행사 · 기타 영상" v={d.weekInfo.videos}
                   ph="예) 창립 41주년 기념영상(2'00)"
                   on={v => d.patchWeek({ videos: v })} />
          </div>
        </section>

        <section className="band">
          <h2><span className="c">/</span> 금주 특별순서 · 영상</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', wordBreak: 'keep-all' }}>
            성찬식 · 비전헌금 · 세례식은 <b>주차를 보고 저절로</b> 켜집니다. 예외가 있는 주에만 손대세요.
            홍보 영상은 매주 다르니 <b>간사님이 직접</b> 켜 주셔야 PD 체크리스트에 올라갑니다.
          </p>

          <div className="switches">
            {[...VIDFLAGS, ...SPECIALS].map(x => (
              <button key={x.k} className="sw" aria-pressed={!!flags[x.k]}
                      onClick={() => setFlag(x.k, !flags[x.k])}>
                <i>✓</i>
                <span>
                  {x.l}
                  <small>
                    {x.rule}{x.when ? ` · ${x.when}` : ''}
                    {isAutoOn(week, x.k, d.weekInfo.flags, d.baptismMonths) ? ' · 자동' : ''}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <Field id="promo" label="홍보 영상 내용" v={d.weekInfo.promo_note ?? ''}
                 ph="예) 큐티세미나 안내(1'20) — 공동체 성경읽기 직후"
                 on={v => d.patchWeek({ promo_note: v })} />

          <Field id="etc" label="기타 특별순서 (직접 입력)" v={flags.etc}
                 ph="예) 신년 감사예배 · 임직식"
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
        </section>

        <section className="band">
          <h2><span className="c">/</span> PD 전달사항</h2>
          <div className="f">
            <textarea value={d.weekInfo.notice}
                      placeholder="일곱 예배 PD 모두에게 공통으로 전달할 내용"
                      onChange={e => d.patchWeek({ notice: e.target.value })} />
          </div>
        </section>

        <p className="foot">적는 즉시 저장되어 PD 화면에 바로 뜹니다.</p>
      </main>
    </>
  );
}

function Field({ id, label, v, ph, on }: {
  id: string; label: string; v: string; ph: string; on: (v: string) => void;
}) {
  return (
    <div className="f">
      <label htmlFor={`sf-${id}`}>{label}</label>
      <input id={`sf-${id}`} type="text" value={v ?? ''} placeholder={ph}
             onChange={e => on(e.target.value)} />
    </div>
  );
}
