export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <div
      className={`${className} animate-spin rounded-full border-2 border-sky/30 border-t-sky`}
      role="status"
      aria-label="กำลังโหลด"
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-app-bg">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
