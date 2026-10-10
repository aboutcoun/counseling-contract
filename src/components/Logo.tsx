export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSize = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'
  const markSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tracking-tight ${textSize}`}>
      <span
        className={`inline-flex items-center justify-center ${markSize} rounded-md bg-emerald-600 text-white shrink-0`}
      >
        <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
      <span className="text-neutral-900">
        안심<span className="text-emerald-600">상담맵</span>
      </span>
    </span>
  )
}
