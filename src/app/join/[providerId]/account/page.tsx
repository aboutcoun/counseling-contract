'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const { providerId } = use(params)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        // 이미 이 센터에 연결된 계정이면 계정 생성 단계 없이 바로 다음으로 진행
        const { data: existing } = await supabase
          .from('provider_accounts')
          .select('provider_id')
          .eq('provider_id', providerId)
          .eq('email', user.email)
          .maybeSingle()

        if (existing) {
          router.replace(`/join/${providerId}/basic`)
          return
        }
        setLoggedInEmail(user.email)
      }
      setChecking(false)
    })()
  }, [providerId, router])

  async function handleLinkExisting() {
    if (!loggedInEmail) return
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { error: linkError } = await supabase
      .from('provider_accounts')
      .insert({ provider_id: providerId, email: loggedInEmail })

    setLoading(false)

    if (linkError) {
      console.error(linkError)
      setError('센터 연결에 실패했습니다. 다시 시도해주세요.')
      return
    }

    router.push(`/join/${providerId}/basic`)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || password.length < 8) {
      setError('이메일을 입력하고, 비밀번호는 8자 이상으로 설정해주세요.')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !signUpData.user) {
      setLoading(false)
      setError(signUpError?.message ?? '가입에 실패했습니다.')
      return
    }

    const { error: linkError } = await supabase
      .from('provider_accounts')
      .insert({ provider_id: providerId, email })

    setLoading(false)

    if (linkError) {
      console.error(linkError)
      setError('센터 연결에 실패했습니다. 다시 시도해주세요.')
      return
    }

    router.push(`/join/${providerId}/basic`)
  }

  if (checking) {
    return <main className="max-w-lg mx-auto p-6 text-sm text-neutral-500">확인 중…</main>
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center">
          2
        </div>
        <span className="text-sm font-medium">계정 만들기</span>
      </div>

      {loggedInEmail ? (
        <div className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            현재 <span className="font-medium text-neutral-900">{loggedInEmail}</span> 계정으로
            로그인되어 있습니다. 이 계정에 이 센터를 추가로 연결할게요 — 한 계정으로 여러 센터를
            함께 관리할 수 있습니다.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleLinkExisting}
            disabled={loading}
            className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
          >
            {loading ? '연결 중…' : '이 계정으로 등록 계속하기'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-neutral-400 underline self-center"
          >
            다른 계정으로 등록하려면 로그아웃
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-4"
        >
          <div>
            <label className="text-sm text-neutral-500 block mb-1.5">이메일</label>
            <input
              type="email"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="center@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-500 block mb-1.5">비밀번호</label>
            <input
              type="password"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
          >
            {loading ? '처리 중…' : '다음'}
          </button>

          <p className="text-xs text-neutral-400 text-center">
            가입 시{' '}
            <a href="/terms" target="_blank" className="underline">
              이용약관
            </a>{' '}
            및{' '}
            <a href="/privacy" target="_blank" className="underline">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다.
          </p>
        </form>
      )}
    </main>
  )
}
