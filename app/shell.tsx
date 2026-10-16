'use client';

import Link from 'next/link';
import {
  addDays, currentSaturday, fmtDate, isLastWeek, monthOf, nthWeek,
} from '../lib/domain';

type Where = 'check' | 'staff' | 'board';

async function signOut() {
  await fetch('/api/gate', { method: 'DELETE' }).catch(() => {});
  window.location.href = '/check';
}

const TAG: Record<Where, string> = {
  check: 'PD 체크',
  staff: '예배담당 간사',
  board: '관리자 현황판',
};

export function Shell({ here }: { here: Where }) {
  return (
    <header className="top">
      <div className="wrap">
        <div className="mark">
          <b>예배 PD 체크리스트</b>
          <span>{TAG[here]}</span>
        </div>
        {/* PD 화면에서는 간사·관리자가 바로 들어갈 수 있게 한 칸만 둡니다. */}
        {here === 'check' && (
          <Link href="/gate" className="enter">간사 · 관리자</Link>
        )}
        {here !== 'check' && (
          <nav className="nav">
            <Link href="/staff" className={here === 'staff' ? 'on' : ''}>금주 정보</Link>
            <Link href="/board" className={here === 'board' ? 'on' : ''}>현황판</Link>
            <Link href="/check">PD 화면</Link>
            <button onClick={signOut}>나가기</button>
          </nav>
        )}
      </div>
    </header>
  );
}

export function WeekBar({ week, setWeek }: { week: string; setWeek: (w: string) => void }) {
  const sun = addDays(week, 1);
  return (
    <div className="weekbar">
      <div className="wrap">
        <button className="step" onClick={() => setWeek(addDays(week, -7))} aria-label="이전 주">◀</button>
        <div className="wk">
          <b>{fmtDate(week)} ~ {fmtDate(sun)}</b>
          <em>
            {monthOf(sun)}월 {nthWeek(sun)}주차{isLastWeek(sun) ? ' · 마지막 주' : ''}
          </em>
        </div>
        {week !== currentSaturday() && (
          <button className="now" onClick={() => setWeek(currentSaturday())}>이번 주</button>
        )}
        <button className="step" onClick={() => setWeek(addDays(week, 7))} aria-label="다음 주">▶</button>
      </div>
    </div>
  );
}

export function OfflineWarn({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="warn">
      <span>!</span>
      <span>
        데이터베이스에 연결되지 않았습니다. 화면은 쓸 수 있지만 <b>저장되지 않습니다</b>.
        Vercel 환경변수 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인하세요.
      </span>
    </div>
  );
}
