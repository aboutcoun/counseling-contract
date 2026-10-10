import { NextRequest, NextResponse } from 'next/server'
import { resolveSmartplaceReviewUrl } from '@/lib/resolve-smartplace'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url || typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ error: 'URL을 입력해주세요.' }, { status: 400 })
  }

  try {
    const result = await resolveSmartplaceReviewUrl(url.trim())
    if (!result) {
      return NextResponse.json(
        { error: '이 링크에서 플레이스 번호를 찾지 못했어요. naver.me 링크나 map.naver.com 링크를 입력해주세요.' },
        { status: 422 }
      )
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '링크를 확인하는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
