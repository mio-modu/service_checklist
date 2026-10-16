'use client';

import { useEffect } from 'react';

/** 서비스워커 등록 — 홈 화면 설치를 위해 필요합니다. */
export function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const t = setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 1200); // 첫 화면 그리는 일이 먼저입니다
    return () => clearTimeout(t);
  }, []);
  return null;
}
