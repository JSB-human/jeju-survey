"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react"; // 아이콘

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 브라우저가 "설치 가능한 상태다!"라고 신호를 보내면 그 이벤트를 잡습니다.
    const handler = (e: any) => {
      e.preventDefault(); // 브라우저 기본 팝업 막기
      setDeferredPrompt(e); // 이벤트 저장해두기
      setIsVisible(true);   // 내 버튼 보여주기
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 저장해둔 설치 팝업 띄우기
    deferredPrompt.prompt();

    // 사용자가 설치를 수락했는지 확인
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // 사용 후 초기화
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null; // 설치 불가능하거나 이미 설치했으면 안 보임

  return (
    <button
      onClick={handleInstallClick}
      className="fixed top-4 left-4 z-50 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full shadow-lg flex items-center gap-2 animate-bounce"
    >
      <Download size={18} />
      앱으로 설치하기
    </button>
  );
}