"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, RefreshCw, Trash2 } from "lucide-react";
import { createCategoryAction, createTagAction, deleteCategoryAction } from "@/app/actions/todo-actions";
import { Button, Input, Badge } from "@/components/ui";

type Category = {
  id: string;
  name: string;
  color?: string | null;
  sortOrder: number;
};

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

type Subscription = {
  id: string;
  endpoint: string;
  deviceName?: string | null;
  createdAt: Date | string;
};

type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const emptyState = (): ActionState => ({ success: false });

const categoryPalette = ["#db5461", "#6d73ff", "#2f9e44", "#f59f00", "#0ea5e9", "#8b5cf6", "#14b8a6", "#ef4444"];

function FieldMessage({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const message = errors?.[name]?.[0];
  if (!message) return null;
  return <p className="text-xs text-[var(--danger)]">{message}</p>;
}

function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, emptyState());
  const [color, setColor] = useState(categoryPalette[0]);

  return (
    <form action={formAction} className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
      <div>
        <h3 className="text-lg font-black">카테고리 추가</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">개발, 쇼핑, 펜션 같은 분류를 만들어둘 수 있어요.</p>
      </div>

      <input type="hidden" name="color" value={color} />

      <div className="space-y-2">
        <label className="text-sm font-semibold">이름</label>
        <Input name="name" placeholder="예: 개발" maxLength={80} />
        <FieldMessage errors={state.errors} name="name" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">컬러 팔레트</label>
        <div className="flex flex-wrap gap-2">
          {categoryPalette.map((swatch) => {
            const selected = color === swatch;
            return (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={`h-10 w-10 rounded-full border-2 transition ${selected ? "scale-110 border-[var(--foreground)] shadow-md" : "border-transparent"}`}
                style={{ backgroundColor: swatch }}
                aria-label={`카테고리 색상 ${swatch}`}
                title={swatch}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          선택 색상: {color}
        </div>
      </div>

      {state.message && <p className="text-sm font-semibold text-[var(--success)]">{state.message}</p>}

      <Button type="submit" disabled={pending} loading={pending}>
        {pending ? "저장 중..." : "카테고리 저장"}
      </Button>
    </form>
  );
}

function TagForm() {
  const [state, formAction, pending] = useActionState(createTagAction, emptyState());

  return (
    <form action={formAction} className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
      <div>
        <h3 className="text-lg font-black">태그 추가</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">작업을 더 세부적으로 묶어두고 싶을 때 사용하세요.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">이름</label>
        <Input name="name" placeholder="예: 급함" maxLength={50} />
        <FieldMessage errors={state.errors} name="name" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">색상</label>
        <Input name="color" placeholder="#6d73ff" maxLength={20} />
        <FieldMessage errors={state.errors} name="color" />
      </div>

      {state.message && <p className="text-sm font-semibold text-[var(--success)]">{state.message}</p>}

      <Button type="submit" disabled={pending} loading={pending}>
        {pending ? "저장 중..." : "태그 저장"}
      </Button>
    </form>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDeviceName() {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform || "";
  const os = /android/.test(ua)
    ? "Android"
    : /iphone|ipad|ipod/.test(ua)
      ? "iPhone"
      : /mac/.test(ua) || /mac/.test(platform.toLowerCase())
        ? "Mac"
        : /win/.test(ua) || /win/.test(platform.toLowerCase())
          ? "Windows"
          : /linux/.test(ua) || /linux/.test(platform.toLowerCase())
            ? "Linux"
            : "기기";

  const browser = /chrome|crios/.test(ua)
    ? "Chrome"
    : /safari/.test(ua) && !/chrome|crios/.test(ua)
      ? "Safari"
      : /firefox/.test(ua)
        ? "Firefox"
        : /edg/.test(ua)
          ? "Edge"
          : "Browser";

  return `${os} ${browser}`.trim();
}

function shortEndpoint(endpoint: string) {
  return endpoint.slice(-10);
}

function PushPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("브라우저 푸시를 아직 설정하지 않았습니다.");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

  const syncSubscription = async (subscription: PushSubscription) => {
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceName: getDeviceName(),
      }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      let responseMessage = "";

      try {
        const payload = responseText ? JSON.parse(responseText) : null;
        responseMessage = payload?.message || "";
      } catch {
        responseMessage = "";
      }

      throw new Error(responseMessage || responseText || "구독 저장에 실패했습니다.");
    }
  };

  const handleResetPush = async () => {
    if (!confirm("브라우저 푸시 구독과 서비스워커를 초기화할까요?")) return;

    try {
      setResetBusy(true);
      setStatus("브라우저 푸시 데이터를 초기화하는 중...");

      if (!("serviceWorker" in navigator)) {
        setStatus("이 브라우저는 서비스워커를 지원하지 않습니다.");
        return;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      let removed = 0;

      for (const registration of registrations) {
        const subscription = await registration.pushManager.getSubscription().catch(() => null);
        if (subscription) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          }).catch(() => null);

          await subscription.unsubscribe().catch(() => undefined);
          removed += 1;
        }

        await registration.unregister().catch(() => undefined);
      }

      router.refresh();
      setStatus(
        removed > 0
          ? "브라우저 푸시 구독을 초기화했습니다. 이제 다시 처음부터 등록할 수 있습니다."
          : "등록된 브라우저 푸시 구독이 없습니다. 서비스워커만 정리했습니다.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "브라우저 푸시 초기화 중 오류가 발생했습니다.");
    } finally {
      setResetBusy(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setBusy(true);
      setStatus("브라우저 알림 권한을 확인하는 중...");

      if (!("Notification" in window)) {
        setStatus("이 브라우저는 알림을 지원하지 않습니다.");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("알림 권한이 차단되어 있습니다. 브라우저 설정에서 허용해 주세요.");
        return;
      }

      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("알림 권한이 허용되지 않았습니다.");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("이 브라우저는 푸시 구독을 지원하지 않습니다.");
        return;
      }

      if (!vapidKey) {
        setStatus("VAPID 공개키가 아직 설정되지 않았습니다.");
        return;
      }

      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      await syncSubscription(subscription);
      setStatus("브라우저 푸시 구독이 완료되었습니다.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "푸시 설정 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
      <div>
        <h3 className="text-lg font-black">알림 설정</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">앱 안 알림과 브라우저 푸시를 함께 사용합니다.</p>
      </div>

      <div className="rounded-2xl bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">{status}</div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleEnablePush} disabled={busy} loading={busy}>
          <BellRing className="h-4 w-4" />
          {busy ? "설정 중..." : "브라우저 푸시 켜기"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleResetPush} disabled={resetBusy} loading={resetBusy}>
          <Trash2 className="h-4 w-4" />
          {resetBusy ? "초기화 중..." : "구독 초기화"}
        </Button>
      </div>

      <p className="text-xs text-[var(--muted)]">
        푸시를 켜두면 할 일이 도래했을 때 브라우저가 열려 있지 않아도 알림을 받을 수 있습니다.
      </p>
    </section>
  );
}

function SubscriptionList({ subscriptions }: { subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) {
    return <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">등록된 기기가 없습니다.</div>;
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((subscription) => (
        <div key={subscription.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">등록된 기기</div>
            <div className="mt-1 truncate text-xs text-[var(--muted)]">
              {subscription.deviceName || `기기 키 ${shortEndpoint(subscription.endpoint)}`}
            </div>
          </div>
          <Badge tone="accent">활성</Badge>
        </div>
      ))}
    </div>
  );
}

function CategoryList({
  categories,
  onDelete,
}: {
  categories: Category[];
  onDelete: (categoryId: string) => void;
}) {
  if (categories.length === 0) {
    return <div className="text-sm text-[var(--muted)]">카테고리가 없습니다.</div>;
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color || "#db5461" }} />
            <div>
              <div className="text-sm font-semibold">{category.name}</div>
              <div className="text-xs text-[var(--muted)]">{category.color || "#db5461"}</div>
            </div>
          </div>
          <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      ))}
    </div>
  );
}

export function SettingsClient({
  categories,
  tags,
  subscriptions,
}: {
  categories: Category[];
  tags: Tag[];
  subscriptions: Subscription[];
}) {
  const router = useRouter();

  const handleDeleteCategory = async (categoryId: string) => {
    const formData = new FormData();
    formData.append("categoryId", categoryId);
    const result = await deleteCategoryAction(formData);
    if (!result.success) {
      alert(result.message || "카테고리 삭제에 실패했습니다.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--muted)]">Settings</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight">설정</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">카테고리, 태그, 브라우저 알림을 관리합니다.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CategoryForm />
        <TagForm />
        <PushPanel />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">카테고리</h2>
            <Badge tone="accent">{categories.length}</Badge>
          </div>
          <div className="mt-4">
            <CategoryList categories={categories} onDelete={handleDeleteCategory} />
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">태그</h2>
            <Badge tone="accent">{tags.length}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} tone="neutral">
                {tag.name}
              </Badge>
            ))}
            {tags.length === 0 && <div className="text-sm text-[var(--muted)]">태그가 없습니다.</div>}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">브라우저 푸시 구독</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">등록된 기기를 확인하고 관리할 수 있습니다.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            등록 기기
          </div>
        </div>
        <SubscriptionList subscriptions={subscriptions} />
      </section>
    </div>
  );
}
