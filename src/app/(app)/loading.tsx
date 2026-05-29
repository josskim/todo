export default function AppLoading() {
  return (
    <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center soft-shadow">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[var(--accent-weak)] border-t-[var(--accent)]" />
      <div className="mt-4 text-sm font-bold text-[var(--foreground)]">화면을 불러오는 중입니다.</div>
      <div className="mt-1 text-xs text-[var(--muted)]">잠시만 기다려 주세요.</div>
    </div>
  );
}
