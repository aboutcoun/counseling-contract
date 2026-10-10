'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CERT_TYPES } from '@/lib/cert-types'
import { TARGET_AUDIENCES, EXTRA_INFO_OPTIONS } from '@/lib/center-options'
import OperatingHoursEditor, { defaultHours } from '@/components/OperatingHoursEditor'
import type { OperatingHoursDetail } from '@/lib/types'

const LINK_CATEGORIES = ['홈페이지', '블로그', '인스타그램', '유튜브', '카페', '기타']

type DraftLink = { id: string; category: string; url: string }
type DraftProgram = {
  id: string
  program_name: string
  duration_minutes: string
  price: string
  priceOnRequest: boolean
}

function emptyLink(): DraftLink {
  return { id: crypto.randomUUID(), category: LINK_CATEGORIES[0], url: '' }
}
function emptyProgram(): DraftProgram {
  return {
    id: crypto.randomUUID(),
    program_name: '',
    duration_minutes: '',
    price: '',
    priceOnRequest: false,
  }
}

export default function AddCenterForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState<OperatingHoursDetail>(defaultHours())
  const [smartplaceUrl, setSmartplaceUrl] = useState('')
  const [consultantCount, setConsultantCount] = useState('')
  const [isVoucherProvider, setIsVoucherProvider] = useState(false)
  const [targetAudiences, setTargetAudiences] = useState<string[]>([])
  const [extraInfo, setExtraInfo] = useState<string[]>([])
  const [operatorDisplayName, setOperatorDisplayName] = useState('')
  const [certs, setCerts] = useState<string[]>([])

  const [links, setLinks] = useState<DraftLink[]>([])
  const [programs, setPrograms] = useState<DraftProgram[]>([emptyProgram()])

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleCert(cert: string) {
    setCerts((prev) => (prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]))
  }

  function toggleTargetAudience(t: string) {
    setTargetAudiences((prev) => (prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]))
  }

  function toggleExtraInfo(v: string) {
    setExtraInfo((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  }

  function updateLink(id: string, patch: Partial<DraftLink>) {
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  function removeLink(id: string) {
    setLinks((ls) => ls.filter((l) => l.id !== id))
  }

  function updateProgram(id: string, patch: Partial<DraftProgram>) {
    setPrograms((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }
  function removeProgram(id: string) {
    setPrograms((ps) => (ps.length === 1 ? ps : ps.filter((p) => p.id !== id)))
  }
  function moveProgram(id: string, dir: -1 | 1) {
    setPrograms((ps) => {
      const idx = ps.findIndex((p) => p.id === id)
      const target = idx + dir
      if (idx === -1 || target < 0 || target >= ps.length) return ps
      const next = [...ps]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !address.trim()) {
      setError('센터명과 주소는 필수입니다.')
      return
    }

    const validPrograms = programs.filter(
      (p) => p.program_name.trim() && p.duration_minutes && (p.priceOnRequest || p.price)
    )
    const partiallyFilled = programs.some(
      (p) =>
        (p.program_name.trim() || p.duration_minutes || p.price) &&
        !(p.program_name.trim() && p.duration_minutes && (p.priceOnRequest || p.price))
    )
    if (partiallyFilled) {
      setError('입력이 일부만 채워진 프로그램이 있습니다. 모두 채우거나 삭제해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/add-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim() || null,
          operating_hours_detail: hours,
          smartplace_url: smartplaceUrl.trim() || null,
          consultant_count: consultantCount ? Number(consultantCount) : null,
          is_voucher_provider: isVoucherProvider,
          target_audiences: targetAudiences,
          extra_info: extraInfo,
          operator_display_name: operatorDisplayName.trim() || null,
          verified_certifications: certs,
          links: links.filter((l) => l.url.trim()).map((l) => ({ category: l.category, url: l.url.trim() })),
          programs: validPrograms.map((p) => ({
            program_name: p.program_name.trim(),
            duration_minutes: Number(p.duration_minutes),
            price: p.priceOnRequest ? null : Number(p.price),
            price_on_request: p.priceOnRequest,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '등록에 실패했습니다.')
        setSubmitting(false)
        return
      }
      if (!data.geocoded) {
        alert('센터는 등록됐지만 주소를 좌표로 변환하지 못했습니다. 상세페이지에서 주소를 다시 확인해주세요.')
      }
      router.push(`/centers/${data.providerId}`)
    } catch (err) {
      console.error(err)
      setError('등록 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-5">
      <Field label="센터명 *">
        <input
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="주소 * (도로명 주소)">
        <input
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="저장 시 자동으로 좌표 변환됩니다"
        />
      </Field>

      <Field label="전화번호">
        <input
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>

      <OperatingHoursEditor hours={hours} onChange={setHours} />

      <Field label="스마트플레이스 URL (후기 보기에 연결)">
        <input
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={smartplaceUrl}
          onChange={(e) => setSmartplaceUrl(e.target.value)}
        />
      </Field>

      <Field label="소속 상담자 수">
        <input
          type="number"
          className="w-32 border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={consultantCount}
          onChange={(e) => setConsultantCount(e.target.value)}
        />
      </Field>

      <Field label="운영자 표시명 (상세페이지에 노출, 선택)">
        <input
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={operatorDisplayName}
          onChange={(e) => setOperatorDisplayName(e.target.value)}
        />
      </Field>

      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">상담 가능 대상</label>
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
        <label className="text-sm text-neutral-500 block mb-1.5">부가정보 (선택)</label>
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
          checked={isVoucherProvider}
          onChange={(e) => setIsVoucherProvider(e.target.checked)}
          className="w-4 h-4"
        />
        정신건강심리상담바우처 제공기관인가요?
      </label>

      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">
          인증 자격증 (확인된 경우에만 체크, 선택)
        </label>
        <div className="flex flex-col gap-1.5">
          {CERT_TYPES.map((cert) => (
            <label
              key={cert}
              className="flex items-center gap-2 text-sm border border-neutral-200 rounded-md px-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={certs.includes(cert)}
                onChange={() => toggleCert(cert)}
                className="w-4 h-4"
              />
              {cert}
            </label>
          ))}
        </div>
      </div>

      {/* 링크 */}
      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">홈페이지 / SNS 링크 (선택)</label>
        <div className="flex flex-col gap-2">
          {links.map((l) => (
            <div key={l.id} className="flex gap-2">
              <select
                className="border border-neutral-300 rounded-md px-2 py-2 text-sm shrink-0"
                value={l.category}
                onChange={(e) => updateLink(l.id, { category: e.target.value })}
              >
                {LINK_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                className="flex-1 min-w-0 border border-neutral-300 rounded-md px-3 py-2 text-sm"
                value={l.url}
                onChange={(e) => updateLink(l.id, { url: e.target.value })}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => removeLink(l.id)}
                className="text-xs text-neutral-400 shrink-0"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks((ls) => [...ls, emptyLink()])}
            className="text-sm border border-neutral-300 rounded-md py-1.5"
          >
            + URL 추가
          </button>
        </div>
      </div>

      {/* 프로그램 */}
      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">프로그램 및 가격 (선택)</label>
        <div className="flex flex-col gap-3 mb-2">
          {programs.map((p, idx) => (
            <div key={p.id} className="border border-neutral-200 rounded-md p-3">
              <div className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-2 items-end">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveProgram(p.id, -1)}
                    disabled={idx === 0}
                    className="text-xs border border-neutral-300 rounded-md w-6 h-[18px] flex items-center justify-center disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProgram(p.id, 1)}
                    disabled={idx === programs.length - 1}
                    className="text-xs border border-neutral-300 rounded-md w-6 h-[18px] flex items-center justify-center disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <Field label="프로그램명">
                  <input
                    className="w-full border border-neutral-300 rounded-md px-2 py-2 text-sm"
                    value={p.program_name}
                    onChange={(e) => updateProgram(p.id, { program_name: e.target.value })}
                    placeholder="개인상담"
                  />
                </Field>
                <Field label="소요시간(분)">
                  <input
                    type="number"
                    className="w-full border border-neutral-300 rounded-md px-2 py-2 text-sm"
                    value={p.duration_minutes}
                    onChange={(e) => updateProgram(p.id, { duration_minutes: e.target.value })}
                    placeholder="분"
                  />
                </Field>
                <Field label="가격(원)">
                  <input
                    type="number"
                    disabled={p.priceOnRequest}
                    className="w-full border border-neutral-300 rounded-md px-2 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
                    value={p.price}
                    onChange={(e) => updateProgram(p.id, { price: e.target.value })}
                    placeholder="원"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => removeProgram(p.id)}
                  className="border border-neutral-300 rounded-md p-2 text-sm h-[38px] whitespace-nowrap"
                >
                  삭제
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500 mt-2">
                <input
                  type="checkbox"
                  checked={p.priceOnRequest}
                  onChange={(e) =>
                    updateProgram(p.id, {
                      priceOnRequest: e.target.checked,
                      price: e.target.checked ? '' : p.price,
                    })
                  }
                />
                가격 별도문의로 표시 (지도에는 &quot;별도문의&quot;로 노출됩니다)
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPrograms((ps) => [...ps, emptyProgram()])}
          className="text-sm border border-neutral-300 rounded-md px-3 py-1.5"
        >
          + 프로그램 추가
        </button>
        <p className="text-xs text-amber-600 mt-2 leading-relaxed">
          정확한 가격을 적어주시는 것이 좋지만, 상황상 어려운 경우 &quot;별도문의&quot;로 표시할 수
          있습니다.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
      >
        {submitting ? '등록 중…' : '센터 등록하기'}
      </button>
    </form>
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
