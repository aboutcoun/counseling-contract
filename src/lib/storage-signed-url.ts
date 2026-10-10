// 서버 전용. verification-docs 버킷의 저장값(경로 또는 예전 공개 URL)을
// 임시 서명 링크로 바꿔줍니다. 비공개 버킷이라 이 방식으로만 접근 가능합니다.

export function extractStoragePath(stored: string): string {
  // 예전에 getPublicUrl()로 저장된 값이면 경로 부분만 추출
  const match = stored.match(/verification-docs\/(.+)$/)
  return match ? match[1] : stored
}

export async function toSignedUrl(
  storage: any,
  stored: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!stored) return null
  const path = extractStoragePath(stored)
  const { data, error } = await storage
    .from('verification-docs')
    .createSignedUrl(path, expiresInSeconds)
  if (error) {
    console.error('서명 링크 생성 실패:', path, error.message)
    return null
  }
  return data.signedUrl
}
