'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CERT_TYPES } from '@/lib/cert-types'

const REASON_PRESETS = [
  '자격증 불명확',
  '관계 증빙서류 미비',
  '자격 요건 미충족',
  '기타',
]

export default function ReviewActions({
  requestId,
  providerId,
  initialCertifications = [],
}: {
  requestId: string
  providerId: string
  initialCertifications?: string[]
}) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [reasonPreset, setReasonPreset] = useState(REASON_PRESETS[0])
  const [customReason, setCustomReason] = useState('')
  const [selectedCerts, setSelectedCerts] = useState<string[]>(initialCertifications)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleCert(cert: string) {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    )
  }

  async function handleApprove() {
    if (selectedCerts.length === 0) {
      setError('증빙된 자격증을 최소 1개 선택해주세요.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        providerId,
        action: 'approve',
        certifications: selectedCerts,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('승인 처리에 실패했습니다.')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  async function handleReject() {
    const trimmedCustom = customReason.trim()
    if (reasonPreset === '기타' && !trimmedCustom) {
      setError('반려 사유를 입력해주세요.')
      return
    }
    const reason =
      reasonPreset === '기타'
        ? trimmedCustom
        : trimmedCustom
        ? `${reasonPreset}\n${trimmedCustom}`
        : reasonPreset
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, providerId, action: 'reject', reason }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('반려 처리에 실패했습니다.')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-5">
      <h2 className="text-sm font-medium mb-3">심사 처리</h2>

      {!rejecting && (
        <>
          <p className="text-xs text-neutral-500 mb-2">
            제출된 자격증 중 실제로 증빙된 항목을 선택해주세요 (승인 시 필수)
          </p>
          <div className="flex flex-col gap-1.5 mb-4">
            {CERT_TYPES.map((cert) => (
              <label
                key={cert}
                className="flex items-center gap-2 text-sm border border-neutral-200 rounded-md px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCerts.includes(cert)}
                  onChange={() => toggleCert(cert)}
                  className="w-4 h-4"
                />
                {cert}
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
            >
              승인
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={loading}
              className="flex-1 border border-red-300 text-red-600 rounded-md py-2 text-sm"
            >
              반려
            </button>
          </div>
        </>
      )}

      {rejecting && (
        <div className="flex flex-col gap-3">
          <select
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={reasonPreset}
            onChange={(e) => setReasonPreset(e.target.value)}
          >
            {REASON_PRESETS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <textarea
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            rows={3}
            placeholder={
              reasonPreset === '기타'
                ? '반려 사유를 입력해주세요'
                : '센터장에게 전달할 추가 설명이 있으면 적어주세요 (선택)'
            }
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setRejecting(false)}
              className="flex-1 border border-neutral-300 rounded-md py-2 text-sm"
            >
              취소
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm disabled:opacity-50"
            >
              반려 확정
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}
