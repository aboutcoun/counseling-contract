import { NextRequest, NextResponse } from 'next/server'
import { reverseGeocode } from '@/lib/naver-geocode'

export async function POST(req: NextRequest) {
  const { lat, lng } = await req.json()

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: '좌표가 필요합니다.' }, { status: 400 })
  }

  try {
    const result = await reverseGeocode(lat, lng)
    if (!result) {
      return NextResponse.json({ sido: null, sigungu: null })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '역지오코딩 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
