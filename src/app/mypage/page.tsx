'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Provider, VerificationRequest } from '@/lib/types'

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  unclaimed: { text: '미가입', className: 'bg-neutral-100 text-neutral-600' },
  pending: { text: '심사중', className: 'bg-amber-50 text-amber-700' },
  approved: { text: '인증완료', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { text: '반려됨', className: 'bg-red-50 text-red-700' },
}

export default function MyPage() {
  const [centers, setCenters] = useState<Provider[]>([])
  const [latestRequests, setLatestRequests] = useState<Record<string, VerificationRequest>>({})
  const [loading, setLoading] = useState(true)
  const [notSignedIn, setNotSignedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        setNotSignedIn(true)
        setLoading(false)
        return
      }

      const { data: accounts } = await supabase
        .from('provider_accounts')
        .select('provider_id')
        .eq('email', user.email)

      const providerIds = (accounts ?? []).map((a) => a.provider_id)

      if (providerIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: providersData } = await supabase
        .from('providers')
        .select('*')
        .in('id', providerIds)
      setCenters((providersData as Provider[]) ?? [])

      const { data: requests } = await supabase
        .from('verification_requests')
        .select('*')
        .in('provider_id', providerIds)
        .order('submitted_at', { ascending: false })
      const latestByProvider: Record<string, VerificationRequest> = {}
      for (const r of (requests as VerificationRequest[]) ?? []) {
        if (!latestByProvider[r.provider_id]) latestByProvider[r.provider_id] = r
      }
      setLatestRequests(latestByProvider)
      setLoading(false)
    })()
  }, [])

  if (loading) return <main className="max-w-lg mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>

  if (notSignedIn) {
    return (
      <main className="max-w-lg mx-auto p-6 text-sm">
        로그인이 필요합니다. <Link href="/join" className="underline">인증 신청하러 가기</Link>
      </main>
    )
  }

  if (centers.length === 0) {
    return (
      <main className="max-w-lg mx-auto p-6 text-sm text-neutral-500">
        연결된 센터 정보를 찾을 수 없습니다.
      </main>
    )
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">내 센터 관리</h1>
        <Link href="/join" className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md">
          + 센터 추가 등록
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {centers.map((provider) => (
          <CenterCard
            key={provider.id}
            provider={provider}
            latestRequest={latestRequests[provider.id]}
          />
        ))}
      </div>

      {centers.some((c) => c.status === 'approved') && (
        <Link
          href="/community"
          className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-emerald-900 hover:bg-emerald-100/60"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-emerald-600"
          >
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug">센터장 커뮤니티</p>
            <p className="text-xs text-emerald-700/80 mt-0.5">구인구직 · 센터 인수/양도 · 정보공유 · 자유/고민</p>
          </div>
          <span className="text-sm text-emerald-400 shrink-0">›</span>
        </Link>
      )}

      <a
        href="https://open.kakao.com/o/gt3D1WFg"
        target="_blank"
        rel="noopener noreferrer"
        className={`${centers.some((c) => c.status === 'approved') ? 'mt-3' : 'mt-6'} flex items-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3.5 text-[#191919] hover:brightness-95`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
          <path d="M12 3C6.48 3 2 6.51 2 10.84c0 2.8 1.87 5.26 4.68 6.65l-.95 3.48c-.08.3.26.54.52.37l4.14-2.75c.53.06 1.07.09 1.61.09 5.52 0 10-3.51 10-7.84S17.52 3 12 3z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">센터 운영자 고민/정보교류 오픈카톡방</p>
          <p className="text-xs opacity-70 mt-0.5">입장코드: good1234</p>
        </div>
        <span className="text-sm opacity-60 shrink-0">›</span>
      </a>
    </main>
  )
}

function CenterCard({
  provider,
  latestRequest,
}: {
  provider: Provider
  latestRequest?: VerificationRequest
}) {
  const status = STATUS_LABEL[provider.status]

  return (
    <div className="border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-medium">{provider.name}</h2>
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${status.className}`}>
          {status.text}
        </span>
      </div>
      {provider.address && <p className="text-xs text-neutral-400 mb-2">{provider.address}</p>}

      {provider.status === 'rejected' && latestRequest?.rejection_reason && (
        <div className="mt-2 border border-red-200 bg-red-50 rounded-md p-4">
          <p className="text-sm font-medium text-red-700 mb-1">반려 사유</p>
          <p className="text-sm text-red-700">{latestRequest.rejection_reason}</p>
          <Link
            href={`/join/${provider.id}/verify`}
            className="inline-block mt-3 text-sm px-3 py-1.5 border border-red-300 rounded-md text-red-700"
          >
            서류 다시 제출하기
          </Link>
        </div>
      )}

      {provider.status === 'pending' && (
        <p className="mt-2 text-sm text-neutral-500">
          제출하신 서류를 검토하고 있습니다. 완료되면 인증 배지가 부여됩니다.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          href={`/join/${provider.id}/basic?edit=1`}
          className="flex-1 text-sm px-3 py-2 border border-neutral-300 rounded-md text-center"
        >
          기본 정보 수정
        </Link>
        <Link
          href={`/join/${provider.id}/programs?edit=1`}
          className="flex-1 text-sm px-3 py-2 border border-neutral-300 rounded-md text-center"
        >
          프로그램 및 가격 수정
        </Link>
      </div>
    </div>
  )
}
