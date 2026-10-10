// Server-only. Converts a Korean address into { latitude, longitude } using
// the Naver Cloud Platform Geocoding API. Requires NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
// and NAVER_MAP_CLIENT_SECRET in the environment.

import { parseKoreanAddress } from './parse-korean-address'

export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('네이버 지도 API 키가 설정되지 않았습니다 (.env.local 확인)')
  }

  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`

  const res = await fetch(url, {
    headers: {
      'x-ncp-apigw-api-key-id': clientId,
      'x-ncp-apigw-api-key': clientSecret,
    },
  })

  if (!res.ok) {
    console.error('지오코딩 요청 실패:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  const first = data?.addresses?.[0]
  if (!first) return null

  return {
    latitude: parseFloat(first.y),
    longitude: parseFloat(first.x),
  }
}

// 좌표 → 시/도, 시/군/구 (역지오코딩). "내 주변" 기능에서 사용자의 위치를
// 우리 데이터의 시/도·시/군/구 필터값으로 변환하는 데 씁니다.
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ sido: string | null; sigungu: string | null } | null> {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('네이버 지도 API 키가 설정되지 않았습니다 (.env.local 확인)')
  }

  const url = `https://maps.apigw.ntruss.com/map-reversegeocoding/v2/gc?coords=${lng},${lat}&output=json&orders=admcode`

  const res = await fetch(url, {
    headers: {
      'x-ncp-apigw-api-key-id': clientId,
      'x-ncp-apigw-api-key': clientSecret,
    },
  })

  if (!res.ok) {
    console.error('역지오코딩 요청 실패:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  const region = data?.results?.[0]?.region
  if (!region) return null

  return {
    sido: region.area1?.name ?? null,
    sigungu: region.area2?.name ?? null,
  }
}

// 주소 저장 시 시/도·시/군/구를 자동으로 채우기 위한 공용 헬퍼.
// 역지오코딩 API가 실패하거나(예: 네이버클라우드플랫폼 콘솔에서 Reverse Geocoding이
// 별도로 활성화되어 있지 않은 경우) 결과를 못 받으면, 주소 문자열 자체를 파싱해서 보완합니다.
export async function resolveRegion(
  address: string,
  lat: number,
  lng: number
): Promise<{ sido: string | null; sigungu: string | null }> {
  try {
    const region = await reverseGeocode(lat, lng)
    if (region?.sido) return region
  } catch (err) {
    console.error('역지오코딩 실패, 주소 텍스트로 대체합니다:', err)
  }
  return parseKoreanAddress(address)
}
