'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProviderEditPanel({
  providerId,
  naverPlaceName,
  initialAddress,
  initialSmartplaceUrl,
}: {
  providerId: string
  naverPlaceName: string
  initialAddress: string
  initialSmartplaceUrl: string
}) {
  const router = useRouter()
  const [smartplaceInput, setSmartplaceInput] = useState(initialSmartplaceUrl)
  const [address, setAddress] = useState(initialAddress)
  const [resolvedReviewUrl, setResolvedReviewUrl] = useState<string | null>(null)
  const [fetchedName, setFetchedName] = useState<string | null>(null)
  const [fetchedAddress, setFetchedAddress] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  async function resolveSmartplace(): Promise<{ reviewUrl: string } | null> {
    if (!smartplaceInput.trim()) return null
    const res = await fetch('/api/admin/fetch-smartplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: smartplaceInput.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '조회에 실패했습니다.')
      return null
    }
    setResolvedReviewUrl(data.reviewUrl)
    setFetchedName(data.name ?? '(업체명을 가져오지 못했어요 — 직접 확인해주세요)')
    if (data.address) {
      setFetchedAddress(data.address)
      setAddress(data.address)
    } else {
      setFetchedAddress('(주소를 가져오지 못했어요 — 직접 확인 후 아래에 입력해주세요)')
    }
    return { reviewUrl: data.reviewUrl }
  }

  async function handleFetch() {
    setFetching(true)
    setError('')
    setFetchedName(null)
    setFetchedAddress(null)
    try {
      await resolveSmartplace()
    } catch {
      setError('조회 중 오류가 발생했습니다.')
    }
    setFetching(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSavedMsg('')
    try {
      // 리뷰 URL을 아직 계산 안 했다면(=정보 가져오기를 안 눌렀다면) 저장 전에 한 번 계산합니다.
      let reviewUrl = resolvedReviewUrl
      if (!reviewUrl && smartplaceInput.trim()) {
        const resolved = await resolveSmartplace()
        reviewUrl = resolved?.reviewUrl ?? null
      }

      const res = await fetch('/api/admin/update-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, address, smartplace_url: reviewUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '저장에 실패했습니다.')
      } else {
        setSavedMsg('저장했습니다.')
        router.refresh()
      }
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    }
    setSaving(false)
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-5 mb-4">
      <h2 className="text-sm font-medium mb-1">관리자 보완 입력</h2>
      <p className="text-xs text-neutral-500 mb-3">
        센터장이 입력한 업체명(&quot;{naverPlaceName || '미입력'}&quot;)으로 네이버 지도에서 직접
        찾아 <b>플레이스 번호</b>만 입력해주세요 (예: 2073279402). 센터장이 주소를 잘못 입력하는
        경우가 많으니, 여기서 가져온 주소로 확인 후 저장해주세요.
      </p>

      <label className="text-sm text-neutral-500 block mb-1.5">네이버 플레이스 번호</label>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          className="flex-1 min-w-0 border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={smartplaceInput}
          onChange={(e) => {
            setSmartplaceInput(e.target.value)
            setResolvedReviewUrl(null)
          }}
          placeholder="2073279402 (또는 naver.me / map.naver.com 링크)"
        />
        <button
          type="button"
          onClick={handleFetch}
          disabled={fetching}
          className="text-sm px-3 py-2 border border-neutral-300 rounded-md whitespace-nowrap disabled:opacity-50 shrink-0"
        >
          {fetching ? '조회 중…' : '정보 가져오기'}
        </button>
      </div>

      {fetchedName && (
        <p className="text-xs text-neutral-500 mb-1">
          조회된 업체명: <span className="font-medium text-neutral-700">{fetchedName}</span> —
          위 업체명과 같은 곳이 맞는지 꼭 확인해주세요. (자동 조회는 참고용이며 정확하지 않을 수
          있어요)
        </p>
      )}
      {fetchedAddress && (
        <p className="text-xs text-neutral-500 mb-2">
          조회된 주소: <span className="font-medium text-neutral-700">{fetchedAddress}</span>
        </p>
      )}
      {resolvedReviewUrl && (
        <p className="text-xs text-neutral-400 mb-3">
          연결될 리뷰 페이지: {resolvedReviewUrl}
        </p>
      )}

      <label className="text-sm text-neutral-500 block mb-1.5">주소</label>
      <input
        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm mb-1.5"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="도로명 주소"
      />
      <p className="text-xs text-neutral-400 mb-3">
        저장하면 이 주소를 기준으로 홈 화면 지역 필터(시/도, 시/군/구)에 쓰일 값이 자동으로
        채워집니다.
      </p>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {savedMsg && <p className="text-sm text-emerald-600 mb-2">{savedMsg}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="text-sm px-4 py-1.5 bg-neutral-900 text-white rounded-md disabled:opacity-50"
      >
        {saving ? '저장 중…' : '저장'}
      </button>
    </div>
  )
}
