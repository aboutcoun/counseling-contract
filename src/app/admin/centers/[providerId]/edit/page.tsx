import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Provider } from '@/lib/types'
import AdminProviderEditPanel from '@/app/admin/[requestId]/AdminProviderEditPanel'
import DeleteCenterButton from '@/components/DeleteCenterButton'

// 인증 심사 요청(verification_requests)이 없는 센터(관리자가 직접 등록한 센터 등)도
// 주소/네이버 플레이스 정보를 나중에 수정할 수 있도록 만든 범용 수정 페이지.
export default async function AdminCenterEditPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const { providerId } = await params
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
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single()

  if (!provider) notFound()
  const p = provider as Provider

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/centers" className="text-sm text-neutral-400 hover:underline">
          ← 전체 센터 관리
        </Link>
      </div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-medium mb-1">{p.name}</h1>
          <p className="text-sm text-neutral-500">{p.address}</p>
        </div>
        <DeleteCenterButton providerId={p.id} providerName={p.name} redirectTo="/admin/centers" />
      </div>

      <AdminProviderEditPanel
        providerId={p.id}
        naverPlaceName={p.naver_place_name ?? p.name ?? ''}
        initialAddress={p.address ?? ''}
        initialSmartplaceUrl={p.smartplace_url ?? ''}
      />
    </main>
  )
}
