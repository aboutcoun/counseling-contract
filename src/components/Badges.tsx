export const VOUCHER_PROGRAM_NAME = '정신건강심리상담바우처'

export function CertifiedBadge() {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
      인증
    </span>
  )
}

export function VoucherBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
      {compact ? '바우처' : `${VOUCHER_PROGRAM_NAME} 제공기관`}
    </span>
  )
}
