'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'

interface WhoAmI {
  loggedIn: boolean
  isAdmin: boolean
  hasProvider: boolean
  canUseCommunity?: boolean
  unreadMessages?: number
}

export default function SiteHeader() {
  const [info, setInfo] = useState<WhoAmI | null>(null)

  useEffect(() => {
    function load() {
      fetch('/api/whoami')
        .then((res) => res.json())
        .then(setInfo)
        .catch(() => setInfo(null))
    }
    load()
    // 메시지함에서 읽음 처리하면 아이콘의 안읽음 숫자도 바로 갱신합니다.
    window.addEventListener('messages-updated', load)
    return () => window.removeEventListener('messages-updated', load)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="h-12 shrink-0 border-b border-neutral-200 flex items-center justify-between px-4 z-30 relative bg-white">
      <Link href="/">
        <Logo size="sm" />
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href={info?.hasProvider ? '/mypage' : '/join'}
          className="text-neutral-500"
        >
          센터 등록/관리
        </Link>

        {info?.canUseCommunity && (
          <Link href="/community" className="text-neutral-500">
            커뮤니티
          </Link>
        )}

        {info?.hasProvider && (
          <Link
            href="/messages"
            aria-label="메시지함"
            title="메시지함"
            className="relative text-neutral-500 hover:text-neutral-800 p-1"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
            {!!info?.unreadMessages && (
              <span className="absolute -top-0.5 -right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none">
                {info.unreadMessages > 99 ? '99+' : info.unreadMessages}
              </span>
            )}
          </Link>
        )}

        {info?.isAdmin && (
          <Link href="/admin" className="text-neutral-500">
            관리자
          </Link>
        )}
        {!info?.loggedIn && (
          <Link href="/login" className="text-neutral-500">
            로그인
          </Link>
        )}
        {info?.loggedIn && (
          <button onClick={handleLogout} className="text-neutral-500">
            로그아웃
          </button>
        )}
      </nav>
    </header>
  )
}
