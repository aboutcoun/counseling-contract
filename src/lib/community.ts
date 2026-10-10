// 커뮤니티 공용 상수/타입 (클라이언트·서버 양쪽에서 사용)

export const COMMUNITY_CATEGORIES = [
  { key: 'jobs', label: '구인구직' },
  { key: 'transfer', label: '센터 인수/양도' },
  { key: 'info', label: '정보공유' },
  { key: 'free', label: '자유/고민' },
] as const

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]['key']

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  COMMUNITY_CATEGORIES.map((c) => [c.key, c.label])
)

export function isCommunityCategory(v: unknown): v is CommunityCategory {
  return typeof v === 'string' && COMMUNITY_CATEGORIES.some((c) => c.key === v)
}

export const COMMUNITY_BUCKET = 'community-images'
export const MAX_IMAGES_PER_POST = 5
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ADMIN_IDENTITY = 'admin'
export const ADMIN_DISPLAY_NAME = '안심상담맵 운영자'
export const ANONYMOUS_NAME = '익명'

/** 글/댓글 작성 시 고를 수 있는 "누구로 쓸지" 목록 항목 */
export interface CommunityIdentity {
  id: string // provider id 또는 'admin'
  name: string
}

export interface CommunityPostListItem {
  id: string
  category: CommunityCategory
  title: string
  authorName: string
  createdAt: string
  commentCount: number
  hasImages: boolean
}

export interface CommunityComment {
  id: string
  body: string
  authorName: string
  isAnonymous: boolean
  isPostAuthor: boolean
  isMine: boolean
  canDelete: boolean
  createdAt: string
}

export interface CommunityPostDetail {
  id: string
  category: CommunityCategory
  title: string
  body: string
  images: { path: string; url: string | null }[]
  authorName: string
  isAnonymous: boolean
  authorIdentity: string | null // 수정 화면에서 기존 선택값 복원용 (본인 글일 때만 채워짐)
  isMine: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string | null
  comments: CommunityComment[]
}
