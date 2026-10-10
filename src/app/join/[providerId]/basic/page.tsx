'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { summarizeHours } from '@/lib/hours'
import { ensureHttpUrl } from '@/lib/url'
import type { OperatingHoursDetail, Provider, ProviderLink } from '@/lib/types'
import { TARGET_AUDIENCES, EXTRA_INFO_OPTIONS } from '@/lib/center-options'
import OperatingHoursEditor, { defaultHours } from '@/components/OperatingHoursEditor'

const LINK_CATEGORIES = ['홈페이지', '블로그', '인스타그램', '유튜브', '카페', '기타']

export default function BasicInfoPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const { providerId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const [form, setForm] = useState<Partial<Provider>>({})
  const [links, setLinks] = useState<ProviderLink[]>([])
  const [hours, setHours] = useState<OperatingHoursDetail>(defaultHours())
  const [targetAudiences, setTargetAudiences] = useState<string[]>([])
  const [extraInfo, setExtraInfo] = useState<string[]>([])

  const [showLinkForm, setShowLinkForm] = useState(false)
  const [newLinkCategory, setNewLinkCategory] = useState(LINK_CATEGORIES[0])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('providers').select('*').eq('id', providerId).single(),
      supabase.from('provider_links').select('*').eq('provider_id', providerId).order('sort_order'),
    ]).then(([providerRes, linksRes]) => {
      if (providerRes.data) {
        const p = providerRes.data as Provider
        setForm(p)
        setHours(p.operating_hours_detail ?? defaultHours())
        setTargetAudiences(p.target_audiences ?? [])
        setExtraInfo(p.extra_info ?? [])
      }
      setLinks((linksRes.data as ProviderLink[]) ?? [])
      setLoading(false)
    })
  }, [providerId])

  function set<K extends keyof Provider>(key: K, value: Provider[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addLink() {
    if (!newLinkUrl.trim()) return
    const url = ensureHttpUrl(newLinkUrl)

    if (editingLinkId) {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === editingLinkId ? { ...l, category: newLinkCategory, url } : l
        )
      )
    } else {
      setLinks((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          provider_id: providerId,
          category: newLinkCategory,
          url,
          sort_order: prev.length,
        },
      ])
    }
    setNewLinkUrl('')
    setEditingLinkId(null)
    setShowLinkForm(false)
  }

  function startEditLink(link: ProviderLink) {
    setNewLinkCategory(link.category)
    setNewLinkUrl(link.url)
    setEditingLinkId(link.id)
    setShowLinkForm(true)
  }

  function cancelLinkForm() {
    setNewLinkUrl('')
    setEditingLinkId(null)
    setShowLinkForm(false)
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  function toggleTargetAudience(t: string) {
    setTargetAudiences((prev) => (prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]))
  }

  function toggleExtraInfo(v: string) {
    setExtraInfo((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name || !form.naver_place_name || !form.address) {
      setError('센터명, 네이버 스마트플레이스 업체명, 주소는 필수입니다.')
      return
    }

    setSaving(true)

    let latitude: number | null = null
    let longitude: number | null = null
    let geoSido: string | null = form.sido ?? null
    let geoSigungu: string | null = form.sigungu ?? null
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: form.address }),
      })
      if (res.ok) {
        const geo = await res.json()
        latitude = geo.latitude
        longitude = geo.longitude
        if (geo.sido) geoSido = geo.sido
        if (geo.sigungu) geoSigungu = geo.sigungu
      }
    } catch (err) {
      console.error('지오코딩 실패:', err)
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('providers')
      .update({
        name: form.name,
        naver_place_name: form.naver_place_name,
        address: form.address,
        phone: form.phone?.trim() || null,
        sido: geoSido,
        sigungu: geoSigungu,
        operating_hours: summarizeHours(hours),
        operating_hours_detail: hours,
        consultant_count: form.consultant_count ?? null,
        is_voucher_provider: form.is_voucher_provider ?? false,
        target_audiences: targetAudiences,
        extra_info: extraInfo,
        latitude,
        longitude,
      })
      .eq('id', providerId)

    if (updateError) {
      setSaving(false)
      console.error(updateError)
      setError('저장에 실패했습니다. 다시 시도해주세요.')
      return
    }

    await supabase.from('provider_links').delete().eq('provider_id', providerId)
    if (links.length > 0) {
      const { error: linkError } = await supabase.from('provider_links').insert(
        links.map((l, i) => ({
          provider_id: providerId,
          category: l.category,
          url: l.url,
          sort_order: i,
        }))
      )
      if (linkError) {
        console.error(linkError)
      }
    }

    setSaving(false)

    if (latitude == null) {
      setError('주소를 좌표로 변환하지 못했습니다. 저장은 됐지만 주소를 다시 확인해주세요.')
    }

    router.push(isEdit ? '/mypage' : `/join/${providerId}/programs`)
  }

  if (loading) return <main className="max-w-lg mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center">
          3
        </div>
        <span className="text-sm font-medium">기본 정보</span>
      </div>

      <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-5">
        <Field label="센터명">
          <input
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label="네이버 스마트플레이스(지도)에 등록된 업체명">
          <input
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.naver_place_name ?? ''}
            onChange={(e) => set('naver_place_name', e.target.value)}
            placeholder="네이버 지도에서 검색했을 때 나오는 업체명 그대로 입력해주세요"
          />
          <p className="text-xs text-neutral-400 mt-1">
            네이버 스마트플레이스에 등록된 업체만 등록 가능합니다. 등록돼 있지 않다면 먼저
            스마트플레이스에 업체를 등록한 뒤 신청해주세요.
          </p>
        </Field>
        <Field label="전화번호">
          <input
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="02-1234-5678"
          />
        </Field>
        <Field label="주소">
          <input
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.address ?? ''}
            onChange={(e) => set('address', e.target.value)}
            placeholder="도로명 주소로 입력해주세요"
          />
        </Field>

        <OperatingHoursEditor hours={hours} onChange={setHours} />

        {/* URL 목록 */}
        <div>
          <label className="text-sm text-neutral-500 block mb-2">
            운영중인 홈페이지, SNS, 커뮤니티 등이 있나요?
          </label>
          <div className="flex flex-col gap-2 mb-2">
            {links.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between border border-neutral-200 rounded-md px-3 py-2"
              >
                <div className="text-sm truncate">
                  <span className="text-xs text-neutral-500 mr-2">{l.category}</span>
                  {l.url}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditLink(l)}
                    className="text-xs text-neutral-500"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLink(l.id)}
                    className="text-xs text-neutral-400"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showLinkForm ? (
            <button
              type="button"
              onClick={() => setShowLinkForm(true)}
              className="w-full text-sm border border-neutral-300 rounded-md py-2"
            >
              + URL 추가
            </button>
          ) : (
            <div className="border border-neutral-200 rounded-md p-3">
              <p className="text-xs text-neutral-500 mb-1.5">
                {editingLinkId ? 'URL 수정' : '분류 선택'}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {LINK_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewLinkCategory(c)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      newLinkCategory === c
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm mb-3"
                placeholder="URL을 입력해주세요"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelLinkForm}
                  className="flex-1 text-sm border border-neutral-300 rounded-md py-1.5"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={addLink}
                  className="flex-1 text-sm bg-neutral-900 text-white rounded-md py-1.5"
                >
                  {editingLinkId ? '수정 완료' : '추가하기'}
                </button>
              </div>
            </div>
          )}
        </div>

        <Field label="소속 상담자 수 (운영자 포함)">
          <input
            type="number"
            className="w-32 border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.consultant_count ?? ''}
            onChange={(e) => set('consultant_count', Number(e.target.value))}
          />
        </Field>

        <div>
          <label className="text-sm text-neutral-500 block mb-2">
            상담 가능 대상을 모두 선택해주세요
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_AUDIENCES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTargetAudience(t)}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  targetAudiences.includes(t)
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-500 block mb-2">
            해당하는 부가정보가 있다면 선택해주세요 (선택)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EXTRA_INFO_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleExtraInfo(v)}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  extraInfo.includes(v)
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-neutral-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm bg-neutral-50 rounded-md px-3 py-2.5">
          <input
            type="checkbox"
            checked={form.is_voucher_provider ?? false}
            onChange={(e) => set('is_voucher_provider', e.target.checked)}
            className="w-4 h-4"
          />
          정신건강심리상담바우처 제공기관인가요?
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
        >
          {saving ? '저장 중…' : isEdit ? '저장' : '다음'}
        </button>
      </form>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-500 block mb-1.5">{label}</label>
      {children}
    </div>
  )
}
