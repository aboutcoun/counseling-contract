'use client'

import { useState } from 'react'

export default function AdminCenterAccountPanel({
  providerId,
  emails,
}: {
  providerId: string
  emails: string[]
}) {
  const [resettingEmail, setResettingEmail] = useState<string | null>(null)
  const [showMessageBox, setShowMessageBox] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleResetPassword(email: string) {
    const confirmed = window.confirm(`${email} 주소로 비밀번호 재설정 메일을 보낼까요?`)
    if (!confirmed) return

    setResettingEmail(email)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? '메일 발송에 실패했습니다.')
        return
      }
      alert(`${email} 주소로 재설정 메일을 보냈습니다.`)
    } catch (err) {
      console.error(err)
      alert('메일 발송 중 오류가 발생했습니다.')
    } finally {
      setResettingEmail(null)
    }
  }

  async function handleSendMessage() {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, body: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? '메시지 전송에 실패했습니다.')
        return
      }
      setMessage('')
      setShowMessageBox(false)
      alert('메시지를 보냈습니다.')
    } catch (err) {
      console.error(err)
      alert('메시지 전송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-2 pt-2 border-t border-neutral-100">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-neutral-400 shrink-0">센터장 계정</span>
        {emails.length === 0 ? (
          <span className="text-xs text-neutral-400">연결된 계정 없음</span>
        ) : (
          emails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md pl-2 pr-1 py-1"
            >
              {email}
              <button
                type="button"
                onClick={() => handleResetPassword(email)}
                disabled={resettingEmail === email}
                className="text-[11px] px-1.5 py-0.5 border border-neutral-300 rounded bg-white disabled:opacity-50"
              >
                {resettingEmail === email ? '발송 중…' : '비밀번호 초기화'}
              </button>
            </span>
          ))
        )}
        <button
          type="button"
          onClick={() => setShowMessageBox((v) => !v)}
          className="text-xs px-2 py-1 border border-neutral-300 rounded-md ml-auto"
        >
          메시지 보내기
        </button>
      </div>

      {showMessageBox && (
        <div className="mt-2 flex flex-col gap-1.5">
          <textarea
            className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-sm"
            rows={3}
            placeholder="센터장에게 보낼 메시지를 입력해주세요 (마이페이지 메시지함에 표시됩니다)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowMessageBox(false)}
              className="text-xs px-2.5 py-1 border border-neutral-300 rounded-md"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className="text-xs px-2.5 py-1 bg-neutral-900 text-white rounded-md disabled:opacity-50"
            >
              {sending ? '전송 중…' : '전송'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
