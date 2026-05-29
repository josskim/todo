"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobile() || window.localStorage.getItem("todo-install-dismissed") === "1") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const timer = window.setTimeout(() => {
      if (!isStandalone()) {
        setVisible(true);
        setShowIosGuide(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
      }
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowIosGuide(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    window.localStorage.setItem("todo-install-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start gap-3">
        <Image src="/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black">Todo 앱 설치</div>
          <div className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {showIosGuide && !installPrompt ? "공유 버튼을 누른 뒤 홈 화면에 추가를 선택하세요." : "홈 화면에 추가해서 앱처럼 사용할 수 있습니다."}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" className="h-9 px-3" onClick={handleInstall}>
              <Download className="h-4 w-4" />
              설치
            </Button>
            <Button type="button" variant="secondary" className="h-9 px-3" onClick={handleDismiss}>
              나중에
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={handleDismiss}
          className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--surface-soft)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
