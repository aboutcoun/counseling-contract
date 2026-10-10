import Link from 'next/link'
import { getAdminUser } from '@/lib/admin'
import AddCenterForm from './AddCenterForm'

export default async function AdminAddCenterPage() {
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

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin" className="text-sm text-neutral-400 hover:underline">
          ← 인증 심사 관리
        </Link>
      </div>
      <h1 className="text-lg font-medium mb-1">센터 직접 등록</h1>
      <p className="text-sm text-neutral-500 mb-4">
        자격 증빙 절차 없이, 관리자가 확인한 센터를 바로 지도에 노출합니다.
      </p>
      <AddCenterForm />
    </main>
  )
}
