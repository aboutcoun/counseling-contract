import { NextRequest, NextResponse } from 'next/server'
import { forbidden, getCommunityMember, readJson } from '@/lib/community-server'
import { COMMUNITY_BUCKET, MAX_IMAGE_BYTES } from '@/lib/community'

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// 이미지 업로드용 1회성 서명 URL을 발급합니다.
// (Vercel 서버 요청 크기 제한을 피하려고, 파일은 브라우저에서 저장소로 바로 올립니다.
//  파일 형식·크기 제한은 버킷 설정에서도 한 번 더 걸려 있습니다.)
export async function POST(req: NextRequest) {
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)

  const { contentType, size } = await readJson(req)
  const ext =
    typeof contentType === 'string' && Object.hasOwn(EXT_BY_TYPE, contentType)
      ? EXT_BY_TYPE[contentType]
      : undefined
  if (!ext) {
    return NextResponse.json({ error: 'JPG, PNG, WEBP, GIF 이미지만 올릴 수 있습니다.' }, { status: 400 })
  }
  if (typeof size !== 'number' || size <= 0 || size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: '이미지는 장당 5MB 이하만 올릴 수 있습니다.' }, { status: 400 })
  }

  const path = `posts/${crypto.randomUUID()}.${ext}`
  const { data, error } = await res.member.service.storage
    .from(COMMUNITY_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error(error)
    return NextResponse.json({ error: '업로드 준비에 실패했습니다.' }, { status: 500 })
  }

  // 이 경로를 누가 받아갔는지 기록 — 글에 첨부할 때 본인이 올린 것인지 확인하는 데 씁니다.
  const { error: recordError } = await res.member.service
    .from('community_uploads')
    .insert({ path, uploader_email: res.member.email })
  if (recordError) {
    console.error(recordError)
    return NextResponse.json({ error: '업로드 준비에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ path, token: data.token })
}
