'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Provider } from '@/lib/types'

export default function JoinSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Provider[]>([])
  const [searched, setSearched] = useState(false)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  async function handleSearch() {
    if (!query.trim()) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10)
    if (error) console.error(error)
    setResults((data as Provider[]) ?? [])
    setSearched(true)
  }

  async function handleClaim(providerId: string) {
    router.push(`/join/${providerId}/account`)
  }

  async function handleRegisterNew() {
    if (!query.trim()) {
      alert('센터명을 입력해주세요.')
      return
    }
    setCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('providers')
      .insert({ name: query.trim(), source: 'self_registered', status: 'unclaimed' })
      .select()
      .single()
    setCreating(false)
    if (error || !data) {
      console.error(error)
      alert('센터 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    router.push(`/join/${(data as Provider).id}/account`)
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center">
          1
        </div>
        <span className="text-sm font-medium">센터 찾기</span>
      </div>

      <div className="border border-neutral-200 rounded-xl p-5">
        <label className="text-sm text-neutral-500 block mb-1.5">센터명으로 검색</label>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="예: 어바웃심리상담센터"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 text-sm border border-neutral-300 rounded-md"
          >
            검색
          </button>
        </div>

        {searched && results.length === 0 && (
          <p className="text-sm text-neutral-500 mb-4">검색 결과가 없습니다.</p>
        )}

        <ul className="flex flex-col gap-2 mb-4">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between border border-neutral-200 rounded-md px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-neutral-500">{r.address ?? r.sido}</p>
              </div>
              <button
                onClick={() => handleClaim(r.id)}
                className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
              >
                이 센터예요
              </button>
            </li>
          ))}
        </ul>

        <div className="text-center pt-3 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 mb-2">목록에 없으신가요?</p>
          <button
            onClick={handleRegisterNew}
            disabled={creating}
            className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md disabled:opacity-50"
          >
            {creating ? '등록 중…' : '직접 등록할게요'}
          </button>
        </div>
      </div>
    </main>
  )
}
