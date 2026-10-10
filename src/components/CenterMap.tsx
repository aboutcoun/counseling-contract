'use client'

import { useEffect, useRef, useState } from 'react'
import type { Provider } from '@/lib/types'

declare global {
  interface Window {
    naver: any
  }
}

interface CenterMapProps {
  providers: Provider[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  onDeselect?: () => void
  userLocation?: { lat: number; lng: number } | null
  focusLocation?: { lat: number; lng: number; zoom: number } | null
}

const DEFAULT_CENTER = { lat: 37.4138, lng: 127.0086 } // 안양 인근 기본 좌표
const NAME_LABEL_ZOOM_THRESHOLD = 11 // 센터명 라벨은 이 줌 레벨부터 보여줌 (너무 축소된 상태에서는 점만)
const MIN_MARKER_ZOOM = 9 // 이 줌 레벨보다 축소된(전국 단위) 상태에서는 마커를 그리지 않음
const MAX_MARKERS = 600 // 그래도 한 화면에 너무 많으면 안전장치로 상한

function simpleDotHtml(color: string, size = 12) {
  return `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,0.3);"></div>`
}

function truncateLabel(name: string, max = 14) {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

// 네이버 지도 자체 마커처럼, 점 옆에 작은 센터명 라벨을 붙여서 보여줌
function labeledDotHtml(name: string, color: string) {
  const label = truncateLabel(name)
  return `
    <div style="display:flex;align-items:center;gap:4px;white-space:nowrap;">
      <div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,0.3);flex-shrink:0;"></div>
      <span style="background:white;color:#171717;font-size:11px;font-weight:500;line-height:1.3;padding:1.5px 5px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">${label}</span>
    </div>
  `
}

// 지도에 표시되는 센터는 모두 이미 인증(또는 관리자 등록) 완료된 곳이라 '인증' 표시는 따로 하지 않고,
// 네이버 지도처럼 점 옆에 작은 센터명 라벨만 붙여서 보여줌
function iconFor(p: Provider, zoom: number) {
  const naver = window.naver
  const color = p.status === 'approved' ? '#059669' : '#374151'

  if (zoom >= NAME_LABEL_ZOOM_THRESHOLD) {
    return { content: labeledDotHtml(p.name, color), anchor: new naver.maps.Point(5, 5) }
  }
  const size = p.status === 'approved' ? 15 : 12
  return { content: simpleDotHtml(color, size), anchor: new naver.maps.Point(size / 2, size / 2) }
}

export default function CenterMap({
  providers,
  selectedId,
  onSelect,
  onDeselect,
  userLocation,
  focusLocation,
}: CenterMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const providerByIdRef = useRef<Record<string, Provider>>({})
  const allProvidersRef = useRef<Provider[]>(providers)
  const selectedIdRef = useRef<string | null | undefined>(selectedId)
  const infoWindowRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [tooFarOut, setTooFarOut] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (window.naver?.maps) {
      setScriptLoaded(true)
      return
    }
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  function openPopupFor(p: Provider, marker: any) {
    const voucherBadge = p.is_voucher_provider
      ? '<span style="background:#eff6ff;color:#1d4ed8;border-radius:4px;padding:2px 6px;font-size:11px;">바우처</span>'
      : ''

    const content = `
      <div style="padding:12px;min-width:200px;max-width:240px;font-size:13px;background:white;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.18);">
        ${voucherBadge ? `<div style="margin-bottom:4px;">${voucherBadge}</div>` : ''}
        <div style="font-weight:600;margin:4px 0 2px;">${p.name}</div>
        <div style="color:#737373;font-size:12px;margin-bottom:2px;">${p.address ?? ''}</div>
        ${p.phone ? `<div style="color:#737373;font-size:12px;margin-bottom:8px;">${p.phone}</div>` : '<div style="margin-bottom:8px;"></div>'}
        <a href="/centers/${p.id}" style="display:inline-block;font-size:12px;color:#171717;text-decoration:underline;">상세보기 →</a>
      </div>
    `
    infoWindowRef.current.setContent(content)
    infoWindowRef.current.open(mapRef.current, marker)
  }

  // 현재 지도 범위 + 줌 레벨 기준으로, 그 안에 있는 센터만 마커로 그림 (전국 데이터를 다 그리지 않기 위함)
  function renderVisibleMarkers() {
    const naver = window.naver
    const map = mapRef.current
    if (!naver || !map) return

    const zoom = map.getZoom()

    Object.values(markersRef.current).forEach((m: any) => m.setMap(null))
    markersRef.current = {}
    providerByIdRef.current = {}

    if (zoom < MIN_MARKER_ZOOM) {
      setTooFarOut(true)
      setVisibleCount(0)
      return
    }
    setTooFarOut(false)

    const bounds = map.getBounds()
    let candidates = allProvidersRef.current.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false
      return bounds.hasLatLng(new naver.maps.LatLng(p.latitude, p.longitude))
    })

    if (candidates.length > MAX_MARKERS) {
      candidates = candidates.slice(0, MAX_MARKERS)
    }
    setVisibleCount(candidates.length)


    // 같은 좌표(같은 주소)에 여러 센터가 있으면 살짝 원형으로 퍼뜨려서 다 보이게 함
    const groups: Record<string, Provider[]> = {}
    candidates.forEach((p) => {
      const key = `${p.latitude!.toFixed(5)},${p.longitude!.toFixed(5)}`
      ;(groups[key] ??= []).push(p)
    })

    Object.values(groups).forEach((group) => {
      group.forEach((p, idx) => {
        let lat = p.latitude!
        let lng = p.longitude!
        if (group.length > 1) {
          const angle = (2 * Math.PI * idx) / group.length
          const radiusDeg = 0.00012
          lat += radiusDeg * Math.cos(angle)
          lng += radiusDeg * Math.sin(angle) * 1.3
        }

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(lat, lng),
          map,
          icon: iconFor(p, zoom),
          zIndex: p.status === 'approved' ? 100 : 1,
        })

        naver.maps.Event.addListener(marker, 'click', (e: any) => {
          e.domEvent?.stopPropagation?.()
          onSelect?.(p.id)
        })

        markersRef.current[p.id] = marker
        providerByIdRef.current[p.id] = p
      })
    })

    // 방금 다시 그리면서, 선택돼 있던 센터가 이번엔 화면 안에 들어왔다면 팝업을 띄움
    const sid = selectedIdRef.current
    if (sid && providerByIdRef.current[sid]) {
      openPopupFor(providerByIdRef.current[sid], markersRef.current[sid])
    }
  }

  // 지도 최초 생성 (딱 한 번)
  useEffect(() => {
    if (!scriptLoaded || !mapElRef.current || mapRef.current) return
    const naver = window.naver
    const map = new naver.maps.Map(mapElRef.current, {
      center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      zoom: 11,
    })
    mapRef.current = map

    infoWindowRef.current = new naver.maps.InfoWindow({
      content: '<div></div>',
      borderWidth: 0,
      backgroundColor: 'transparent',
      disableAnchor: false,
      pixelOffset: new naver.maps.Point(0, -6),
    })

    naver.maps.Event.addListener(map, 'click', () => {
      infoWindowRef.current?.close()
      onDeselect?.()
    })

    // 패닝/줌이 끝난 뒤(idle) 한 번만 다시 그림 — 움직이는 동안 계속 다시 그리지 않음
    naver.maps.Event.addListener(map, 'idle', renderVisibleMarkers)

    renderVisibleMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded])

  // 목록(필터 결과)이 바뀌면 최신 목록을 저장해두고, 현재 보이는 범위 기준으로 다시 그림
  useEffect(() => {
    allProvidersRef.current = providers
    if (mapRef.current) renderVisibleMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers])

  // 선택된 센터가 바뀌면: 이미 화면에 있으면 바로 팝업, 없으면 그 위치로 이동(이동 후 idle에서 자동으로 팝업 뜸)
  useEffect(() => {
    selectedIdRef.current = selectedId
    if (!scriptLoaded || !mapRef.current) return

    if (!selectedId) {
      infoWindowRef.current?.close()
      return
    }

    const marker = markersRef.current[selectedId]
    if (marker) {
      const p = providerByIdRef.current[selectedId]
      mapRef.current.panTo(marker.getPosition())
      openPopupFor(p, marker)
      return
    }

    // 화면 밖에 있는 센터 — 좌표로 이동시키면 idle 이벤트가 다시 그려주고, 그때 팝업도 자동으로 뜸
    const p = allProvidersRef.current.find((pv) => pv.id === selectedId)
    if (p && p.latitude != null && p.longitude != null) {
      const targetZoom = Math.max(mapRef.current.getZoom(), MIN_MARKER_ZOOM + 2)
      mapRef.current.setZoom(targetZoom)
      mapRef.current.panTo(new window.naver.maps.LatLng(p.latitude, p.longitude))
    }
  }, [scriptLoaded, selectedId])

  // 지역 필터(시/도, 시/군/구) 선택 시 그 위치로 지도 이동
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !focusLocation) return
    mapRef.current.setCenter(new window.naver.maps.LatLng(focusLocation.lat, focusLocation.lng))
    mapRef.current.setZoom(focusLocation.zoom)
  }, [scriptLoaded, focusLocation])

  // show/pan to user location
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return
    const naver = window.naver

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null)
      userMarkerRef.current = null
    }

    if (userLocation) {
      const pos = new naver.maps.LatLng(userLocation.lat, userLocation.lng)
      userMarkerRef.current = new naver.maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: {
          content:
            '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 2px #3b82f6;"></div>',
          anchor: new naver.maps.Point(7, 7),
        },
        zIndex: 300,
      })
      // 지도 이동/확대는 focusLocation이 전담 — 여기서는 파란 점 마커만 표시
    }
  }, [scriptLoaded, userLocation])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      <div
        ref={mapElRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label="인증 상담센터 위치 지도"
      />
      {tooFarOut && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 13,
            color: '#525252',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          지도를 확대하면 센터가 표시됩니다
        </div>
      )}
      {!tooFarOut && visibleCount >= MAX_MARKERS && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 13,
            color: '#525252',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          센터가 많아 일부만 표시 중이에요 — 더 확대해보세요
        </div>
      )}
    </div>
  )
}
