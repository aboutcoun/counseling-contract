'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Phase = 'checking' | 'ready' | 'invalid' | 'done'

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>('checking')
  const [invalidReason, setInvalidReason] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // 메일 링크는 Supabase 설정/버전에 따라 세 가지 형태 중 하나로 들어옵니다.
    //  1) #access_token=...&refresh_token=...   (implicit 방식 — 관리자가 서버에서 보낸 메일은 대부분 이 형태)
    //  2) ?code=...                              (PKCE 방식)
    //  3) ?token_hash=...&type=recovery          (커스텀 메일 템플릿)
    // 브라우저 클라이언트는 2)만 자동 처리하기 때문에, 세 가지를 모두 직접 처리합니다.
    async function establishSession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const query = new URLSearchParams(window.location.search)

      const linkError = hash.get('error_description') || query.get('error_description')
      if (linkError) {
        return fail(
          linkError.includes('expired') || hash.get('error_code') === 'otp_expired'
            ? '링크가 만료되었거나 이미 사용되었습니다. 관리자에게 재설정 메일을 다시 요청해주세요.'
            : '유효하지 않은 링크입니다. 관리자에게 재설정 메일을 다시 요청해주세요.'
        )
      }

      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        // 주소창에 토큰이 남지 않도록 지워둡니다.
        window.history.replaceState(null, '', window.location.pathname)
        return error ? fail('링크 인증에 실패했습니다. 재설정 메일을 다시 요청해주세요.') : ok()
      }

      const tokenHash = query.get('token_hash')
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        window.history.replaceState(null, '', window.location.pathname)
        return error ? fail('링크가 만료되었거나 이미 사용되었습니다.') : ok()
      }

      const code = query.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        window.history.replaceState(null, '', window.location.pathname)
        if (!error) return ok()
        // 자동 처리로 이미 세션이 잡혔을 수도 있으니 한 번 더 확인합니다.
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) return ok()

      fail('인증 정보가 없습니다. 메일로 받은 링크를 통해 다시 접속해주세요.')
    }

    function ok() {
      if (!cancelled) setPhase('ready')
    }
    function fail(reason: string) {
      if (cancelled) return
      setInvalidReason(reason)
      setPhase('invalid')
    }

    establishSession().catch((err) => {
      console.error(err)
      fail('링크 인증 중 오류가 발생했습니다. 재설정 메일을 다시 요청해주세요.')
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('비밀번호는 8자 이상으로 설정해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      setError(
        updateError.message?.includes('different')
          ? '이전과 다른 비밀번호로 설정해주세요.'
          : updateError.message ?? '비밀번호 변경에 실패했습니다.'
      )
      return
    }
    setPhase('done')
  }

  if (phase === 'checking') {
    return <main className="max-w-sm mx-auto p-6 text-sm text-neutral-500">링크 확인 중…</main>
  }

  if (phase === 'invalid') {
    return (
      <main className="max-w-sm mx-auto p-6 text-sm">
        <p className="text-red-600 mb-4 leading-relaxed">{invalidReason}</p>
        <a href="/login" className="underline text-neutral-600">
          로그인 페이지로
        </a>
      </main>
    )
  }

  if (phase === 'done') {
    return (
      <main className="max-w-sm mx-auto p-6 text-sm">
        <p className="mb-4">비밀번호가 변경되었습니다. 새 비밀번호로 이용하실 수 있어요.</p>
        <a href="/mypage" className="underline">
          내 센터 관리로 가기
        </a>
      </main>
    )
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-lg font-medium mb-4">새 비밀번호 설정</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
        >
          {saving ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </main>
  )
}
