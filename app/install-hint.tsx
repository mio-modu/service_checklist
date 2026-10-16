'use client';

import { useEffect, useState } from 'react';

const SEEN = 'sc_install_seen';

/**
 * 폰에서 처음 열었을 때 한 번만 뜨는 안내.
 * 안드로이드는 바로 설치 버튼, 아이폰은 공유 버튼 경로를 알려줍니다.
 */
export function InstallHint() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    try { if (localStorage.getItem(SEEN)) return; } catch {}
    // 이미 홈 화면에서 연 경우에는 띄우지 않습니다
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) { setShow(true); return; }

    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const close = () => {
    setShow(false);
    try { localStorage.setItem(SEEN, '1'); } catch {}
  };

  if (!show) return null;

  return (
    <div className="install">
      <p>
        {ios ? (
          <>아래 <b>공유 버튼</b>을 누르고 <b>“홈 화면에 추가”</b>를 고르면 앱처럼 쓰실 수 있습니다.</>
        ) : (
          <><b>홈 화면에 추가</b>하면 주소를 찾지 않고 바로 열립니다.</>
        )}
      </p>
      {!ios && prompt && (
        <button className="go" onClick={async () => { prompt.prompt?.(); close(); }}>
          홈 화면에 추가
        </button>
      )}
      <button className="shut" onClick={close}>닫기</button>
    </div>
  );
}
