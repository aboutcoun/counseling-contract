'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ProviderMessage } from '@/lib/types'

type Row = ProviderMessage & { providerName: string }

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })
}

export default function MessagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [multiCenter, setMultiCenter] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
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

      const [{ data: providers }, { data: messages }] = await Promise.all([
        supabase.from('providers').select('id, name').in('id', providerIds),
        supabase
          .from('provider_messages')
          .select('*')
          .in('provider_id', providerIds)
          .order('created_at', { ascending: false }),
      ])

      const nameById: Record<string, string> = {}
      for (const p of (providers as { id: string; name: string }[]) ?? []) nameById[p.id] = p.name

      setMultiCenter(providerIds.length > 1)
      setRows(
        ((messages as ProviderMessage[]) ?? []).map((m) => ({
          ...m,
          providerName: nameById[m.provider_id] ?? '',
        }))
      )
      setLoading(false)
    })()
  }, [])

  function toggle(row: Row) {
    const opening = openId !== row.id
    setOpenId(opening ? row.id : null)

    if (opening && !row.read_at) {
      const now = new Date().toISOString()
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, read_at: now } : r)))
      fetch('/api/mark-messages-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: [row.id] }),
      })
        .then(() => window.dispatchEvent(new Event('messages-updated')))
        .catch(() => {})
    }
  }

  function markAllRead() {
    const now = new Date().toISOString()
    setRows((rs) => rs.map((r) => (r.read_at ? r : { ...r, read_at: now })))
    fetch('/api/mark-messages-read', { method: 'POST' })
      .then(() => window.dispatchEvent(new Event('messages-updated')))
      .catch(() => {})
  }

  if (loading) {
    return <main className="max-w-lg mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }

  if (notSignedIn) {
    return (
      <main className="max-w-lg mx-auto p-6 text-sm">
        로그인이 필요합니다.{' '}
        <Link href="/login" className="underline">
          로그인하러 가기
        </Link>
      </main>
    )
  }

  const unreadCount = rows.filter((r) => !r.read_at).length

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-lg font-medium">메시지함</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            안심상담맵 운영팀이 보낸 안내 메시지입니다
            {unreadCount > 0 && <> · 안읽음 {unreadCount}개</>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs text-neutral-500 border border-neutral-300 rounded-md px-2.5 py-1"
          >
            모두 읽음
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border border-neutral-200 rounded-xl py-12 text-center text-sm text-neutral-400">
          받은 메시지가 없습니다.
        </div>
      ) : (
        <ul className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
          {rows.map((r) => {
            const unread = !r.read_at
            const open = openId === r.id
            const firstLine = r.body.split('\n')[0]
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-2.5 ${
                    open ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                      unread ? 'bg-red-500' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-neutral-400">안심상담맵</span>
                      {multiCenter && r.providerName && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 truncate">
                          {r.providerName}
                        </span>
                      )}
                      <span className="text-xs text-neutral-400 ml-auto shrink-0">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${open ? '' : 'truncate'} ${
                        unread ? 'font-medium text-neutral-900' : 'text-neutral-600'
                      }`}
                    >
                      {firstLine}
                    </p>
                  </div>
                </button>
                {open && r.body.includes('\n') && (
                  <div className="px-4 pb-4 pl-8 bg-neutral-50">
                    <p className="text-sm text-neutral-700 whitespace-pre-line">
                      {r.body.split('\n').slice(1).join('\n').trim()}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
