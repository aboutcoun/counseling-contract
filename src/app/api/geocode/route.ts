import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress, resolveRegion } from '@/lib/naver-geocode'

// 주소 → 좌표 변환과 동시에, 그 좌표를 다시 역지오코딩해서 시/도·시/군/구까지
// 함께 반환합니다. (센터장/관리자가 시/도·시/군/구를 직접 입력할 필요 없이
// 주소만 입력하면 홈 화면 지역 필터에 자동으로 분류되도록 하기 위함)
export async function POST(req: NextRequest) {
  const { address } = await req.json()

  if (!address || typeof address !== 'string') {
    return NextResponse.json({ error: '주소를 입력해주세요.' }, { status: 400 })
  }

  try {
    const result = await geocodeAddress(address)
    if (!result) {
      return NextResponse.json(
        { error: '주소를 좌표로 변환하지 못했습니다. 주소를 다시 확인해주세요.' },
        { status: 422 }
      )
    }

    const region = await resolveRegion(address, result.latitude, result.longitude)

    return NextResponse.json({ ...result, sido: region.sido, sigungu: region.sigungu })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '지오코딩 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
