import Link from 'next/link'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Provider } from '@/lib/types'
import DeleteCenterButton from '@/components/DeleteCenterButton'
import AdminCenterAccountPanel from '@/components/AdminCenterAccountPanel'

const STATUS_BADGE: Record<string, { text: string; className: string }> = {
  unclaimed: { text: '미가입', className: 'bg-neutral-100 text-neutral-500' },
  pending: { text: '대기중', className: 'bg-amber-50 text-amber-700' },
  approved: { text: '승인됨', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { text: '반려됨', className: 'bg-red-50 text-red-700' },
}

const SOURCE_LABEL: Record<string, string> = {
  imported_list: '바우처 목록',
  self_registered: '센터장 가입',
  admin_added: '관리자 직접등록',
}

export default async function AdminCentersPage() {
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
  const { data } = await supabase
    .from('providers')
    .select('*')
    .order('created_at', { ascending: false })

  const list = (data as Provider[]) ?? []

  const { data: accountRows } = await supabase.from('provider_accounts').select('provider_id, email')
  const emailsByProvider: Record<string, string[]> = {}
  for (const a of (accountRows as { provider_id: string; email: string }[]) ?? []) {
    emailsByProvider[a.provider_id] = emailsByProvider[a.provider_id] ?? []
    emailsByProvider[a.provider_id].push(a.email)
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">전체 센터 관리</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md">
            인증 심사로
          </Link>
          <Link
            href="/admin/add-center"
            className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
          >
            + 센터 직접 등록
          </Link>
        </div>
      </div>
      <p className="text-sm text-neutral-500 mb-4">
        승인 여부와 관계없이, 등록된 모든 센터가 여기 표시됩니다. 총 {list.length}곳
      </p>

      {list.length === 0 && (
        <p className="text-sm text-neutral-500">등록된 센터가 없습니다.</p>
      )}

      <ul className="flex flex-col gap-2">
        {list.map((p) => {
          const badge = STATUS_BADGE[p.status]
          return (
            <li key={p.id} className="border border-neutral-200 rounded-md px-4 py-3">
              <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {badge && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
                      {badge.text}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">
                    {SOURCE_LABEL[p.source ?? ''] ?? p.source ?? '-'}
                  </span>
                  <p className="text-sm font-medium truncate">{p.name}</p>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{p.address ?? '-'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/centers/${p.id}`}
                  target="_blank"
                  className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
                >
                  보기
                </Link>
                <Link
                  href={`/admin/centers/${p.id}/edit`}
                  className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
                >
                  수정
                </Link>
                <DeleteCenterButton providerId={p.id} providerName={p.name} />
              </div>
              </div>
              <AdminCenterAccountPanel providerId={p.id} emails={emailsByProvider[p.id] ?? []} />
            </li>
          )
        })}
      </ul>
    </main>
  )
}
