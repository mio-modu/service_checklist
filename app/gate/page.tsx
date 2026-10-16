'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GatePage() {
  return (
    <Suspense fallback={null}>
      <Gate />
    </Suspense>
  );
}

function Gate() {
  const router = useRouter();
  const to = useSearchParams().get('to') || '/board';
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || busy) return;
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) { router.replace(to); router.refresh(); return; }
      setMsg(
        j.reason === 'unset'
          ? 'PIN 이 아직 설정되지 않았습니다. Vercel 환경변수에 STAFF_PIN 과 ADMIN_PIN 을 넣고 재배포하세요.'
          : 'PIN 이 맞지 않습니다.',
      );
    } catch {
      setMsg('연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
    setBusy(false);
  };

  const label = to.startsWith('/board') ? '관리자 현황판' : '예배담당 간사';

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="mark">
            <b>예배 PD 체크리스트</b>
            <span>Onnuri Daejeon</span>
          </div>
        </div>
      </header>

      <main className="wrap">
        <section className="band" style={{ maxWidth: 420 }}>
          <h2><span className="c">/</span> {label}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', wordBreak: 'keep-all' }}>
            이 화면은 PIN 을 아는 분만 들어갑니다. 한 번 넣으면 이 기기에서는 두 달 동안 다시 묻지 않습니다.
          </p>
          <form onSubmit={submit} className="f" style={{ gap: 12 }}>
            <label htmlFor="pin">PIN</label>
            <input id="pin" type="password" inputMode="numeric" autoComplete="off" autoFocus
                   value={pin} onChange={e => { setPin(e.target.value); setMsg(''); }}
                   placeholder="숫자 입력"
                   style={msg ? { borderColor: 'var(--alert)' } : undefined} />
            <button className="go" type="submit" disabled={busy || !pin.trim()}>
              {busy ? '확인 중…' : '들어가기'}
            </button>
          </form>
          {msg && (
            <div className="warn" style={{ marginTop: 4 }}>
              <span>!</span><span>{msg}</span>
            </div>
          )}
          <p className="foot">
            PD 체크 화면은 PIN 없이 들어갑니다 — 주소 끝의 /gate 를 지우고 접속하세요.
          </p>
        </section>
      </main>
    </>
  );
}
