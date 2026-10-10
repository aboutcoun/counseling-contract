// 서버 전용. 네이버 플레이스 번호(또는 그 번호가 포함된 링크)로부터
// 플레이스 URL / 리뷰 URL을 만들고, 참고용 업체 정보를 조회합니다.

function extractPlaceId(input: string): string | null {
  const trimmed = input.trim()
  // 숫자만 입력한 경우 (관리자가 플레이스 번호만 붙여넣는 경우)
  if (/^\d+$/.test(trimmed)) return trimmed
  // URL 안에 place/12345 형태로 포함된 경우
  const match = trimmed.match(/place\/(\d+)/)
  return match ? match[1] : null
}

export function buildPlaceUrls(placeId: string) {
  return {
    placeUrl: `https://map.naver.com/p/entry/place/${placeId}`,
    reviewUrl: `https://m.place.naver.com/place/${placeId}/review`,
  }
}

export async function resolveSmartplaceReviewUrl(
  inputUrl: string
): Promise<{ placeId: string; reviewUrl: string; placeUrl: string } | null> {
  // 플레이스 번호만 입력했거나, 번호가 포함된 URL이면 바로 처리
  const directId = extractPlaceId(inputUrl)
  if (directId) {
    return { placeId: directId, ...buildPlaceUrls(directId) }
  }

  // naver.me 같은 단축링크는 리디렉션을 따라가야 번호를 알 수 있음
  try {
    const res = await fetch(inputUrl, { redirect: 'follow' })
    const finalUrl = res.url
    const placeId = extractPlaceId(finalUrl)
    if (!placeId) return null
    return { placeId, ...buildPlaceUrls(placeId) }
  } catch {
    return null
  }
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// 참고용 자동 조회입니다. 네이버 플레이스는 비공식 스크레이핑 대상이라
// 언제든 값을 못 가져오거나(null) 실제와 다를 수 있어요 — 관리자가 눈으로
// 확인한 뒤 저장하는 용도로만 씁니다.
// 페이지 구조에 따라 결과가 다를 수 있어 여러 URL을 순서대로 시도합니다.
export async function fetchSmartplaceInfo(
  placeId: string
): Promise<{ name: string | null; address: string | null } | null> {
  const candidates = [
    `https://m.place.naver.com/place/${placeId}/home`,
    `https://pcmap.place.naver.com/place/${placeId}/home`,
    `https://map.naver.com/p/entry/place/${placeId}`,
  ]

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          Referer: 'https://map.naver.com/',
        },
      })
      if (!res.ok) continue
      const html = await res.text()

      // 1) JSON-LD 구조화 데이터 (있으면 가장 신뢰도 높음)
      const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      for (const m of ldMatches) {
        try {
          const json = JSON.parse(m[1])
          const obj = Array.isArray(json) ? json[0] : json
          if (obj?.name) {
            return {
              name: obj.name ?? null,
              address: obj.address?.streetAddress ?? obj.address ?? null,
            }
          }
        } catch {
          // 다음 방법으로
        }
      }

      // 2) og:title / og:description 메타태그
      const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? null
      const ogDescription =
        html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ?? null
      if (ogTitle) {
        return {
          name: ogTitle.replace(/\s*[:|]\s*네이버.*$/, '').trim(),
          address: ogDescription ?? null,
        }
      }
    } catch {
      // 이 URL은 실패 — 다음 후보 URL로
      continue
    }
  }

  return null
}
