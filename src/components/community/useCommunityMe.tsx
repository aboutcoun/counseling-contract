'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CommunityIdentity } from '@/lib/community'

export type CommunityMe =
  | { status: 'loading' }
  | { status: 'denied'; reason: 'login' | 'not_approved' }
  | { status: 'ok'; isAdmin: boolean; identities: CommunityIdentity[] }

export function useCommunityMe(): CommunityMe {
  const [me, setMe] = useState<CommunityMe>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/community/me')
      .then((r) => r.json())
      .then((d) =>
        setMe(
          d.allowed
            ? { status: 'ok', isAdmin: !!d.isAdmin, identities: d.identities ?? [] }
            : { status: 'denied', reason: d.reason === 'login' ? 'login' : 'not_approved' }
        )
      )
      .catch(() => setMe({ status: 'denied', reason: 'login' }))
  }, [])

  return me
}

/** 커뮤니티를 이용할 수 없을 때 보여주는 안내 */
export function CommunityDenied({ reason }: { reason: 'login' | 'not_approved' }) {
  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="border border-neutral-200 rounded-xl p-6 text-center">
        <p className="text-base font-medium mb-2">센터장 커뮤니티</p>
        {reason === 'login' ? (
          <>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              인증이 완료된 센터장만 이용할 수 있는 공간입니다.
              <br />
              센터 계정으로 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm bg-neutral-900 text-white rounded-md px-4 py-2"
            >
              로그인
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              인증이 완료된 센터장만 이용할 수 있는 공간입니다.
              <br />
              서류 심사가 끝나 인증이 완료되면 바로 이용하실 수 있어요.
            </p>
            <Link
              href="/mypage"
              className="inline-block text-sm border border-neutral-300 rounded-md px-4 py-2"
            >
              내 센터 관리로
            </Link>
          </>
        )}
      </div>
    </main>
  )
}

export function formatCommunityDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })
}

export const CATEGORY_CHIP: Record<string, string> = {
  jobs: 'bg-sky-50 text-sky-700',
  transfer: 'bg-amber-50 text-amber-700',
  info: 'bg-emerald-50 text-emerald-700',
  free: 'bg-neutral-100 text-neutral-600',
}
