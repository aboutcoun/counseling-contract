'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProviderProgram } from '@/lib/types'

type DraftProgram = {
  id: string
  program_name: string
  duration_minutes: string
  price: string
  priceOnRequest: boolean
}

function emptyDraft(): DraftProgram {
  return {
    id: crypto.randomUUID(),
    program_name: '',
    duration_minutes: '',
    price: '',
    priceOnRequest: false,
  }
}

export default function ProgramsPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const { providerId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const [drafts, setDrafts] = useState<DraftProgram[]>([emptyDraft()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('provider_programs')
      .select('*')
      .eq('provider_id', providerId)
      .order('sort_order')
      .then(({ data }) => {
        const existing = (data as ProviderProgram[]) ?? []
        if (existing.length > 0) {
          setDrafts(
            existing.map((p) => ({
              id: p.id,
              program_name: p.program_name,
              duration_minutes: String(p.duration_minutes),
              price: p.price != null ? String(p.price) : '',
              priceOnRequest: p.price_on_request ?? false,
            }))
          )
        }
        setLoading(false)
      })
  }, [providerId])

  function updateDraft(id: string, patch: Partial<DraftProgram>) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  function removeDraft(id: string) {
    setDrafts((ds) => (ds.length === 1 ? ds : ds.filter((d) => d.id !== id)))
  }

  function moveDraft(index: number, direction: -1 | 1) {
    setDrafts((ds) => {
      const target = index + direction
      if (target < 0 || target >= ds.length) return ds
      const next = [...ds]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const valid = drafts.filter(
      (d) => d.program_name.trim() && d.duration_minutes && (d.priceOnRequest || d.price)
    )

    if (valid.length === 0) {
      setError('프로그램명, 소요시간, 가격(또는 별도문의)을 모두 입력한 프로그램이 최소 1개 필요합니다.')
      return
    }
    if (valid.length !== drafts.length) {
      setError('입력이 비어있는 프로그램이 있습니다. 모두 채우거나 삭제해주세요.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    await supabase.from('provider_programs').delete().eq('provider_id', providerId)
    const { error: insertError } = await supabase.from('provider_programs').insert(
      valid.map((d, i) => ({
        provider_id: providerId,
        program_name: d.program_name.trim(),
        duration_minutes: Number(d.duration_minutes),
        price: d.priceOnRequest ? null : Number(d.price),
        price_on_request: d.priceOnRequest,
        sort_order: i,
      }))
    )

    setSaving(false)

    if (insertError) {
      console.error(insertError)
      setError('저장에 실패했습니다. 다시 시도해주세요.')
      return
    }

    router.push(isEdit ? '/mypage' : `/join/${providerId}/verify`)
  }

  if (loading) return <main className="max-w-lg mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center">
          4
        </div>
        <span className="text-sm font-medium">프로그램 및 가격 (최소 1개 필수)</span>
      </div>

      <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col gap-3 mb-3">
          {drafts.map((d, i) => (
            <div key={d.id} className="border border-neutral-100 rounded-md p-2">
              <div className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-2 items-end">
                <div className="flex flex-col gap-0.5 h-[38px] justify-center">
                  <button
                    type="button"
                    aria-label="위로 이동"
                    onClick={() => moveDraft(i, -1)}
                    disabled={i === 0}
                    className="text-xs leading-none disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="아래로 이동"
                    onClick={() => moveDraft(i, 1)}
                    disabled={i === drafts.length - 1}
                    className="text-xs leading-none disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
                <Field label="프로그램명">
                  <input
                    className="w-full border border-neutral-300 rounded-md px-2 py-2 text-sm"
                    value={d.program_name}
                    onChange={(e) => updateDraft(d.id, { program_name: e.target.value })}
                    placeholder="개인상담"
                  />
                </Field>
                <Field label="소요시간(분)">
                  <input
                    type="number"
                    className="w-full border border-neutral-300 rounded-md px-2 py-2 text-sm"
                    value={d.duration_minutes}
                    onChange={(e) => updateDraft(d.id, { duration_minutes: e.target.value })}
                    placeholder="50"
                  />
                </Field>
                <Field label="가격(원)">
                  <input
                    type="number"
                    disabled={d.priceOnRequest}
                    className="w-full border border-neutral-300 rounded-md px-2 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
                    value={d.priceOnRequest ? '' : d.price}
                    onChange={(e) => updateDraft(d.id, { price: e.target.value })}
                    placeholder="100000"
                  />
                </Field>
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => removeDraft(d.id)}
                  className="border border-neutral-300 rounded-md p-2 text-sm h-[38px]"
                >
                  삭제
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500 mt-2 ml-8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.priceOnRequest}
                  onChange={(e) =>
                    updateDraft(d.id, { priceOnRequest: e.target.checked, price: '' })
                  }
                  className="w-3.5 h-3.5"
                />
                가격 별도문의로 표시 (지도에는 &quot;별도문의&quot;로 노출됩니다)
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDrafts((ds) => [...ds, emptyDraft()])}
          className="text-sm border border-neutral-300 rounded-md px-3 py-1.5 mb-4"
        >
          + 프로그램 추가
        </button>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2 leading-relaxed">
          가격은 내담자가 센터를 선택할 때 가장 중요하게 보는 정보 중 하나입니다. 부득이한 경우
          &quot;별도문의&quot;로 표시할 수 있지만, 가급적 실제 가격을 입력해주시는 것을 권장드립니다.
        </p>
        <p className="text-xs text-neutral-500 mb-4">
          가격을 직접 입력할 경우 숫자로 정확히 입력해야 저장됩니다.
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
        >
          {saving ? '저장 중…' : isEdit ? '저장' : '저장하고 자격 증빙으로'}
        </button>
      </form>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-neutral-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}
