'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [tab, setTab] = useState<'user' | 'center'>('center')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setLoading(false)
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
      return
    }

    // 관리자는 관리자 화면, 센터 계정은 내 센터 관리 화면으로 이동합니다.
    // (일반 헤더 상태가 바로 반영되도록 전체 새로고침으로 이동합니다.)
    try {
      const res = await fetch('/api/whoami')
      const info = await res.json()
      window.location.href = info.isAdmin ? '/admin' : info.hasProvider ? '/mypage' : '/'
    } catch {
      window.location.href = '/'
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-lg font-medium mb-4">로그인</h1>

      <div className="flex border border-neutral-200 rounded-md overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setTab('user')}
          className={`flex-1 py-2 text-sm ${
            tab === 'user' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'
          }`}
        >
          유저
        </button>
        <button
          type="button"
          onClick={() => setTab('center')}
          className={`flex-1 py-2 text-sm ${
            tab === 'center' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'
          }`}
        >
          센터
        </button>
      </div>

      {tab === 'user' ? (
        <p className="text-sm text-neutral-500 border border-neutral-200 rounded-md p-4 text-center">
          일반 유저 로그인은 리뷰 기능과 함께 준비 중입니다.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="이메일"
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>
      )}
    </main>
  )
}
