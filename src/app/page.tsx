'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CenterMap from '@/components/CenterMap'
import MapInfoButton from '@/components/MapInfoButton'
import { VoucherBadge } from '@/components/Badges'
import { distanceKm } from '@/lib/geo'
import { shuffle } from '@/lib/shuffle'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import { TARGET_AUDIENCES, EXTRA_INFO_OPTIONS } from '@/lib/center-options'
import { KOREA_REGIONS, SIDO_LIST } from '@/lib/korea-regions'
import type { Provider } from '@/lib/types'

const DEFAULT_CENTER = { lat: 37.4138, lng: 127.0086 }

// 시/군/구 명칭 표기가 데이터마다 살짝 다를 수 있어서(예: "안양시" vs "안양시 동안구"),
// 완전히 같지 않아도 서로 포함관계면 같은 지역으로 봅니다.
function fuzzyMatch(a: string, b: string) {
  return a === b || a.includes(b) || b.includes(a)
}

export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [nameQuery, setNameQuery] = useState('')
  const [sido, setSido] = useState<string>('시/도 전체')
  const [sigungu, setSigungu] = useState<string>('시/군/구 전체')
  const [voucherOnly, setVoucherOnly] = useState(false)
  const [targetFilter, setTargetFilter] = useState('대상 전체')
  const [extraFilters, setExtraFilters] = useState<string[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sortByDistance, setSortByDistance] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const [showMobileList, setShowMobileList] = useState(false)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; zoom: number } | null>(
    null
  )
  const skipRegionFocusRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    fetchAllRows<Provider>((from, to) =>
      supabase
        .from('providers')
        .select('*')
        .not('latitude', 'is', null)
        // 인증(자격 증빙 승인)을 마친 곳, 또는 관리자가 직접 등록한 곳만 노출.
        // 둘 다 status='approved'로 관리되므로 이 조건 하나로 충분함.
        .eq('status', 'approved')
        .range(from, to)
    ).then((data) => {
      setProviders(data)
      setLoading(false)
    })
  }, [])

  // 최초 진입 시 조용히 현재 위치를 시도해서 지도 기본 위치로 사용 (실패해도 에러 표시 안 함)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setFocusLocation({ ...loc, zoom: 13 })
      },
      () => {},
      { timeout: 5000 }
    )
  }, [])

  // 특정 센터가 항상 앞에 나오지 않도록, 데이터를 불러올 때 딱 한 번만 순서를 섞음
  const shuffledProviders = useMemo(() => shuffle(providers), [providers])

  // 등록된 센터 유무와 무관하게, 전국 행정구역 목록을 항상 그대로 보여줍니다.
  const sidoOptions = useMemo(() => ['시/도 전체', ...SIDO_LIST], [])

  const sigunguOptions = useMemo(() => {
    if (sido === '시/도 전체') return ['시/군/구 전체']
    return ['시/군/구 전체', ...(KOREA_REGIONS[sido] ?? [])]
  }, [sido])

  async function handleFindNearMe() {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 정보를 지원하지 않습니다.')
      return
    }
    setLocating(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setSortByDistance(true)
        // 인증 라벨이 보일 정도(줌 14 이상)로 내 위치 주변을 바로 확대
        setFocusLocation({ ...loc, zoom: 15 })

        // 내 위치를 시/도, 시/군/구로 변환해서 그 지역으로 필터링
        try {
          const res = await fetch('/api/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loc),
          })
          const region = await res.json()

          const matchedSido = sidoOptions.find((s) => region.sido && fuzzyMatch(s, region.sido))
          if (matchedSido) {
            skipRegionFocusRef.current = true
            setSido(matchedSido)
            const matchedSigungu = region.sigungu
              ? (KOREA_REGIONS[matchedSido] ?? []).find((s) => fuzzyMatch(s, region.sigungu))
              : null
            setSigungu(matchedSigungu ?? '시/군/구 전체')
          }
        } catch (err) {
          console.error('지역 매칭 실패:', err)
        }

        setLocating(false)
        setShowFilterPanel(true)
      },
      () => {
        setLocationError('위치 정보를 가져오지 못했습니다. 위치 접근을 허용해주세요.')
        setLocating(false)
      }
    )
  }

  const displayed = useMemo(() => {
    let list = shuffledProviders
    if (nameQuery.trim()) {
      const q = nameQuery.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (sido !== '시/도 전체') list = list.filter((p) => p.sido === sido)
    if (sigungu !== '시/군/구 전체') {
      list = list.filter((p) => p.sigungu && fuzzyMatch(p.sigungu, sigungu))
    }
    if (voucherOnly) list = list.filter((p) => p.is_voucher_provider)
    if (targetFilter !== '대상 전체') {
      list = list.filter((p) => p.target_audiences?.includes(targetFilter))
    }
    if (extraFilters.length > 0) {
      list = list.filter((p) => extraFilters.every((f) => p.extra_info?.includes(f)))
    }

    if (sortByDistance && userLocation) {
      list = [...list].sort((a, b) => {
        const da = distanceKm(userLocation.lat, userLocation.lng, a.latitude!, a.longitude!)
        const db = distanceKm(userLocation.lat, userLocation.lng, b.latitude!, b.longitude!)
        return da - db
      })
      // 지역 매칭 성공 여부와 상관없이, "내 주변"은 항상 가까운 순 상위 몇 개로만 좁혀서 보여줌
      list = list.slice(0, 30)
    }
    return list
  }, [
    shuffledProviders,
    nameQuery,
    sido,
    sigungu,
    voucherOnly,
    targetFilter,
    extraFilters,
    sortByDistance,
    userLocation,
  ])

  function toggleExtraFilter(v: string) {
    setExtraFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  }

  // 시/도, 시/군/구 선택이 바뀌면 그 지역 센터들의 중심으로 지도를 이동
  // (단, "내 주변" 버튼으로 자동 매칭된 경우는 이미 내 위치 기준으로 확대해뒀으므로 건드리지 않음)
  useEffect(() => {
    if (skipRegionFocusRef.current) {
      skipRegionFocusRef.current = false
      return
    }
    if (sido === '시/도 전체') {
      setFocusLocation({ ...DEFAULT_CENTER, zoom: 11 })
      return
    }
    const regionList = providers.filter(
      (p) =>
        p.sido === sido &&
        (sigungu === '시/군/구 전체' || (p.sigungu && fuzzyMatch(p.sigungu, sigungu))) &&
        p.latitude != null &&
        p.longitude != null
    )
    if (regionList.length === 0) return
    const avgLat = regionList.reduce((sum, p) => sum + p.latitude!, 0) / regionList.length
    const avgLng = regionList.reduce((sum, p) => sum + p.longitude!, 0) / regionList.length
    setFocusLocation({ lat: avgLat, lng: avgLng, zoom: sigungu === '시/군/구 전체' ? 10 : 14 })
  }, [sido, sigungu, providers])

  function handleSelect(id: string) {
    setSelectedId(id)
    setShowMobileList(false)
  }

  function handleDeselect() {
    setSelectedId(null)
  }

  const activeFilterCount =
    (sido !== '시/도 전체' ? 1 : 0) +
    (voucherOnly ? 1 : 0) +
    (targetFilter !== '대상 전체' ? 1 : 0) +
    extraFilters.length

  const listContent = (
    <>
      {loading && <p className="p-4 text-sm text-neutral-500">불러오는 중…</p>}
      {!loading && displayed.length === 0 && (
        <p className="p-4 text-sm text-neutral-500">해당 조건의 센터가 없습니다.</p>
      )}
      <ul>
        {displayed.map((p) => (
          <li
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className={`relative p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 ${
              selectedId === p.id ? 'bg-neutral-50' : ''
            }`}
          >
            {p.is_voucher_provider && (
              <span className="absolute top-3 right-4">
                <VoucherBadge compact />
              </span>
            )}
            <p className="font-medium text-sm pr-14">{p.name}</p>
            <p className="text-xs text-neutral-500 mt-1">{p.address}</p>
            {sortByDistance && userLocation && p.latitude != null && p.longitude != null && (
              <p className="text-xs text-neutral-400 mt-0.5">
                {distanceKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude).toFixed(1)}km
              </p>
            )}
            <Link
              href={`/centers/${p.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-neutral-400 underline mt-1 inline-block"
            >
              상세 페이지
            </Link>
          </li>
        ))}
      </ul>
    </>
  )

  const filterLabelClass = 'text-[11px] font-medium text-neutral-400 mb-1.5'

  const chipClass = (active: boolean) =>
    `text-xs px-2.5 py-1.5 rounded-full border font-medium ${
      active
        ? 'border-neutral-900 bg-neutral-900 text-white'
        : 'border-neutral-200 text-neutral-500 bg-white'
    }`

  const regionSelects = () => (
    <div className="flex gap-2">
      <select
        className="flex-1 min-w-0 border border-neutral-200 rounded-md px-2 py-1.5 text-sm bg-white"
        value={sido}
        onChange={(e) => {
          setSido(e.target.value)
          setSigungu('시/군/구 전체')
        }}
      >
        {sidoOptions.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select
        className="flex-1 min-w-0 border border-neutral-200 rounded-md px-2 py-1.5 text-sm bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
        value={sigungu}
        onChange={(e) => setSigungu(e.target.value)}
        disabled={sido === '시/도 전체'}
      >
        {sigunguOptions.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  )

  // 홈 화면 필터를 한 곳에서 통일된 스타일(라벨 + 칩)로 모아둔 패널.
  // 대상: 단일 선택(전체 포함), 필터: 바우처 제공기관 + 부가정보를 함께 다중 선택.
  const filterPanel = () => (
    <div className="flex flex-col gap-3">
      <div>
        <p className={filterLabelClass}>지역</p>
        {regionSelects()}
      </div>
      <div>
        <p className={filterLabelClass}>대상</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTargetFilter('대상 전체')}
            className={chipClass(targetFilter === '대상 전체')}
          >
            전체
          </button>
          {TARGET_AUDIENCES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTargetFilter(t)}
              className={chipClass(targetFilter === t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={filterLabelClass}>필터</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setVoucherOnly((v) => !v)}
            className={chipClass(voucherOnly)}
          >
            바우처 제공기관
          </button>
          {EXTRA_INFO_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleExtraFilter(v)}
              className={chipClass(extraFilters.includes(v))}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <main className="relative h-full overflow-hidden">
      {/* ===== 데스크톱: 좌측 리스트 + 우측 지도 ===== */}
      <div className="hidden md:flex h-full">
        <div className="w-[300px] flex flex-col overflow-y-auto border-r border-neutral-200 shrink-0">
          <div className="p-4 border-b border-neutral-200 shrink-0">
            <MapInfoButton />
            <input
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm mt-3"
              placeholder="센터명으로 검색"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
            <div className="mt-3">{filterPanel()}</div>
            <button
              onClick={handleFindNearMe}
              disabled={locating}
              className="mt-2 w-full text-sm border border-neutral-300 rounded-md py-1.5 disabled:opacity-50"
            >
              {locating ? '위치 확인 중…' : '📍 내 주변 센터 보기'}
            </button>
            {locationError && <p className="text-xs text-red-600 mt-1">{locationError}</p>}
            {sortByDistance && (
              <button
                onClick={() => setSortByDistance(false)}
                className="mt-1 w-full text-xs text-neutral-400 underline"
              >
                거리순 정렬 해제
              </button>
            )}
          </div>
          {listContent}
          <div className="p-4 text-center border-t border-neutral-100">
            <a href="/terms" target="_blank" className="text-xs text-neutral-400 underline">
              이용약관
            </a>
            <span className="text-xs text-neutral-300 mx-1.5">·</span>
            <a href="/privacy" target="_blank" className="text-xs text-neutral-400 underline">
              개인정보처리방침
            </a>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <CenterMap
            providers={displayed}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            userLocation={userLocation}
            focusLocation={focusLocation}
          />
        </div>
      </div>

      {/* ===== 모바일: 지도 풀스크린 + 최소한의 오버레이 UI ===== */}
      <div className="md:hidden h-full relative">
        <div className="absolute inset-0">
          <CenterMap
            providers={displayed}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            userLocation={userLocation}
            focusLocation={focusLocation}
          />
        </div>

        <div className="absolute top-3 left-3 right-3 z-10 shadow-lg rounded-lg">
          <MapInfoButton />
        </div>

        {/* 하단 오버레이: 검색+필터 토글 한 줄, 그리고 액션 버튼 한 줄로 압축 */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-2">
          {locationError && (
            <p className="text-xs text-red-600 bg-white rounded-md px-3 py-1.5 shadow">
              {locationError}
            </p>
          )}

          {showFilterPanel && (
            <div className="bg-white rounded-2xl shadow-lg p-3 max-h-[60vh] overflow-y-auto">
              {filterPanel()}
              {sortByDistance && (
                <button
                  onClick={() => setSortByDistance(false)}
                  className="mt-3 text-xs text-neutral-400 underline text-left"
                >
                  거리순 정렬 해제
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 border border-neutral-200 rounded-full px-4 py-2.5 text-sm shadow-lg bg-white"
              placeholder="센터명으로 검색"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              className={`shrink-0 text-sm px-3 rounded-full shadow-lg border ${
                showFilterPanel || activeFilterCount > 0
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white border-neutral-200'
              }`}
            >
              필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFindNearMe}
              disabled={locating}
              className="flex-1 text-sm border border-neutral-200 rounded-full py-2 shadow-lg bg-white disabled:opacity-50"
            >
              {locating ? '위치 확인 중…' : '📍 내 주변'}
            </button>
            <button
              onClick={() => setShowMobileList(true)}
              className="flex-1 text-sm rounded-full py-2 shadow-lg bg-neutral-900 text-white"
            >
              리스트 보기 ({displayed.length})
            </button>
          </div>
        </div>

        {/* 리스트 바텀시트 */}
        {showMobileList && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <p className="text-sm font-medium">센터 목록 ({displayed.length})</p>
              <button
                onClick={() => setShowMobileList(false)}
                className="text-neutral-400 text-lg leading-none px-1"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {listContent}
              <div className="p-4 text-center border-t border-neutral-100">
                <a href="/terms" target="_blank" className="text-xs text-neutral-400 underline">
                  이용약관
                </a>
                <span className="text-xs text-neutral-300 mx-1.5">·</span>
                <a href="/privacy" target="_blank" className="text-xs text-neutral-400 underline">
                  개인정보처리방침
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
