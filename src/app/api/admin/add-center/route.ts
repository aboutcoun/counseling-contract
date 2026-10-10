import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { geocodeAddress, resolveRegion } from '@/lib/naver-geocode'
import { ensureHttpUrl } from '@/lib/url'
import { summarizeHours } from '@/lib/hours'
import type { OperatingHoursDetail } from '@/lib/types'

interface AddCenterLink {
  category: string
  url: string
}

interface AddCenterProgram {
  program_name: string
  duration_minutes: number
  price: number | null
  price_on_request?: boolean
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name,
    address,
    phone,
    operating_hours_detail,
    smartplace_url,
    consultant_count,
    is_voucher_provider,
    operator_display_name,
    verified_certifications,
    target_audiences,
    extra_info,
    links,
    programs,
  }: {
    name?: string
    address?: string
    phone?: string
    operating_hours_detail?: OperatingHoursDetail
    smartplace_url?: string
    consultant_count?: number
    is_voucher_provider?: boolean
    operator_display_name?: string
    verified_certifications?: string[]
    target_audiences?: string[]
    extra_info?: string[]
    links?: AddCenterLink[]
    programs?: AddCenterProgram[]
  } = body

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json({ error: '센터명과 주소는 필수입니다.' }, { status: 400 })
  }

  // 시/도·시/군/구는 따로 입력받지 않고, 주소를 좌표로 변환한 뒤 그 좌표를 역지오코딩해서 자동으로 채웁니다.
  let latitude: number | null = null
  let longitude: number | null = null
  let sido: string | null = null
  let sigungu: string | null = null
  try {
    const geo = await geocodeAddress(address.trim())
    if (geo) {
      latitude = geo.latitude
      longitude = geo.longitude
      const region = await resolveRegion(address.trim(), geo.latitude, geo.longitude)
      sido = region.sido
      sigungu = region.sigungu
    }
  } catch (err) {
    console.error('지오코딩 실패:', err)
  }

  const supabase = createServiceRoleClient()

  const { data: provider, error: insertError } = await supabase
    .from('providers')
    .insert({
      name: name.trim(),
      address: address.trim(),
      sido,
      sigungu,
      phone: phone?.trim() || null,
      operating_hours: operating_hours_detail ? summarizeHours(operating_hours_detail) : null,
      operating_hours_detail: operating_hours_detail ?? null,
      smartplace_url: smartplace_url ? ensureHttpUrl(smartplace_url.trim()) : null,
      consultant_count: consultant_count ?? null,
      is_voucher_provider: !!is_voucher_provider,
      operator_display_name: operator_display_name?.trim() || null,
      verified_certifications:
        verified_certifications && verified_certifications.length > 0 ? verified_certifications : null,
      target_audiences: target_audiences ?? [],
      extra_info: extra_info ?? [],
      source: 'admin_added',
      status: 'approved',
      latitude,
      longitude,
    })
    .select()
    .single()

  if (insertError || !provider) {
    console.error(insertError)
    return NextResponse.json({ error: insertError?.message ?? '센터 등록에 실패했습니다.' }, { status: 500 })
  }

  if (links && links.length > 0) {
    const { error: linkError } = await supabase.from('provider_links').insert(
      links
        .filter((l) => l.url?.trim())
        .map((l, i) => ({
          provider_id: provider.id,
          category: l.category,
          url: ensureHttpUrl(l.url.trim()),
          sort_order: i,
        }))
    )
    if (linkError) console.error(linkError)
  }

  if (programs && programs.length > 0) {
    const { error: programError } = await supabase.from('provider_programs').insert(
      programs
        .filter((p) => p.program_name?.trim())
        .map((p, i) => ({
          provider_id: provider.id,
          program_name: p.program_name.trim(),
          duration_minutes: p.duration_minutes,
          price: p.price_on_request ? null : p.price,
          price_on_request: !!p.price_on_request,
          sort_order: i,
        }))
    )
    if (programError) console.error(programError)
  }

  return NextResponse.json({
    ok: true,
    providerId: provider.id,
    geocoded: latitude != null,
  })
}
