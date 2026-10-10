import Link from 'next/link'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Provider, VerificationRequest } from '@/lib/types'

const TABS = [
  { key: 'pending', label: '대기중' },
  { key: 'approved', label: '승인됨' },
  { key: 'rejected', label: '반려됨' },
  { key: 'all', label: '전체' },
] as const

const STATUS_BADGE: Record<string, { text: string; className: string }> = {
  pending: { text: '대기중', className: 'bg-amber-50 text-amber-700' },
  approved: { text: '승인됨', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { text: '반려됨', className: 'bg-red-50 text-red-700' },
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeTab = (status as (typeof TABS)[number]['key']) ?? 'pending'

  const admin = await getAdminUser()

  if (!admin) {
    return (
      <main className="max-w-lg mx-auto p-6 text-sm">
        관리자 계정으로 로그인해야 접근할 수 있습니다.{' '}
        <Link href="/login" className="underline">
          로그인하러 가기
        </Link>
      </main>
    )
  }

  const supabase = createServiceRoleClient()

  let query = supabase
    .from('verification_requests')
    .select('*, providers(*)')
    .order('submitted_at', { ascending: activeTab === 'pending' })

  if (activeTab !== 'all') {
    query = query.eq('status', activeTab)
  }

  const { data: requests } = await query

  const list = (requests as (VerificationRequest & { providers: Provider })[]) ?? []

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">인증 심사 관리</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/centers"
            className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
          >
            전체 센터 관리
          </Link>
          <Link
            href="/admin/add-center"
            className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
          >
            + 센터 직접 등록
          </Link>
        </div>
      </div>
      <p className="text-sm text-neutral-500 mb-4">{list.length}건</p>

      <div className="flex gap-1 mb-5 border-b border-neutral-200">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin?status=${tab.key}`}
            className={`px-3 py-2 text-sm ${
              activeTab === tab.key
                ? 'border-b-2 border-neutral-900 text-neutral-900 font-medium'
                : 'text-neutral-400'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {list.length === 0 && (
        <p className="text-sm text-neutral-500">해당하는 신청이 없습니다.</p>
      )}

      <ul className="flex flex-col gap-2">
        {list.map((req) => {
          const badge = STATUS_BADGE[req.status]
          return (
            <li key={req.id}>
              <Link
                href={`/admin/${req.id}`}
                className="flex items-center justify-between border border-neutral-200 rounded-md px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                    <p className="text-sm font-medium">{req.providers?.name}</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{req.providers?.address}</p>
                </div>
                <span className="text-xs text-neutral-400">
                  {new Date(req.submitted_at).toLocaleDateString('ko-KR')} 제출
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
