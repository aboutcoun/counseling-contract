import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { resolveSmartplaceReviewUrl, fetchSmartplaceInfo } from '@/lib/resolve-smartplace'

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const { url } = await req.json()
  if (!url || typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ error: '플레이스 번호(또는 링크)를 입력해주세요.' }, { status: 400 })
  }

  try {
    const resolved = await resolveSmartplaceReviewUrl(url.trim())
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            '플레이스 번호를 찾지 못했어요. 숫자로 된 플레이스 번호나 naver.me / map.naver.com 링크를 입력해주세요.',
        },
        { status: 422 }
      )
    }

    // 참고용 정보 — 못 가져와도(null) 에러는 아님. placeUrl/reviewUrl만은 항상 신뢰 가능.
    const info = await fetchSmartplaceInfo(resolved.placeId)

    return NextResponse.json({
      placeId: resolved.placeId,
      placeUrl: resolved.placeUrl,
      reviewUrl: resolved.reviewUrl,
      name: info?.name ?? null,
      address: info?.address ?? null,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
