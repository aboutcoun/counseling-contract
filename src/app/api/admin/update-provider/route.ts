import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ensureHttpUrl } from '@/lib/url'
import { geocodeAddress, resolveRegion } from '@/lib/naver-geocode'

// 관리자가 심사 화면에서 센터장이 입력한 정보를 보완할 때 쓰는 범용 업데이트 라우트.
// (네이버 스마트플레이스 조회 결과로 주소·리뷰 URL을 확인/보정하는 용도)
// providerId 외의 필드는 전달된 것만 반영합니다.
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const { providerId, address, smartplace_url } = await req.json()
  if (!providerId) {
    return NextResponse.json({ error: 'providerId가 필요합니다.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}

  if (typeof smartplace_url === 'string') {
    patch.smartplace_url = smartplace_url.trim() ? ensureHttpUrl(smartplace_url.trim()) : null
  }

  // 시/도·시/군/구는 따로 입력받지 않고, 주소를 좌표로 변환한 뒤 그 좌표를 역지오코딩해서 자동으로 채웁니다.
  if (typeof address === 'string' && address.trim()) {
    patch.address = address.trim()
    try {
      const geo = await geocodeAddress(address.trim())
      if (geo) {
        patch.latitude = geo.latitude
        patch.longitude = geo.longitude
        const region = await resolveRegion(address.trim(), geo.latitude, geo.longitude)
        if (region.sido) patch.sido = region.sido
        if (region.sigungu) patch.sigungu = region.sigungu
      }
    } catch (err) {
      console.error('지오코딩 실패:', err)
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '변경할 값이 없습니다.' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('providers').update(patch).eq('id', providerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
