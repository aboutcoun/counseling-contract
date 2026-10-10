'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  COMMUNITY_BUCKET,
  COMMUNITY_CATEGORIES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_POST,
  type CommunityCategory,
  type CommunityIdentity,
} from '@/lib/community'

const BODY_PLACEHOLDER: Record<CommunityCategory, string> = {
  jobs: '예) 지역 / 근무형태(정규·프리랜서) / 요일·시간 / 자격요건 / 처우 / 연락방법',
  transfer: '예) 위치 / 평수·방 개수 / 보증금·월세·권리금 / 양도 사유 / 가능 시기 / 연락방법',
  info: '바우처, 세무, 마케팅, 행정 등 운영에 도움이 되는 정보를 나눠주세요.',
  free: '운영하면서 겪는 고민이나 이야기를 편하게 남겨주세요.',
}

export interface PostEditorInitial {
  category: CommunityCategory
  title: string
  body: string
  isAnonymous: boolean
  identity: string | null
  images: { path: string; url: string | null }[]
}

type DraftImage = { path: string; preview: string | null }

/** 큰 사진(특히 휴대폰 사진)은 올리기 전에 긴 변 1600px JPEG로 줄입니다. GIF는 그대로 둡니다. */
async function shrinkImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    )
    return blob ?? file
  } catch {
    return file
  }
}

export default function PostEditor({
  identities,
  postId,
  initial,
  defaultCategory,
}: {
  identities: CommunityIdentity[]
  postId?: string
  initial?: PostEditorInitial
  defaultCategory?: CommunityCategory
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<CommunityCategory>(
    initial?.category ?? defaultCategory ?? 'free'
  )
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [isAnonymous, setIsAnonymous] = useState(initial?.isAnonymous ?? false)
  const [identity, setIdentity] = useState<string>(
    (initial?.identity && identities.some((i) => i.id === initial.identity)
      ? initial.identity
      : identities[0]?.id) ?? ''
  )
  const [images, setImages] = useState<DraftImage[]>(
    initial?.images.map((i) => ({ path: i.path, preview: i.url })) ?? []
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 새로 만든 미리보기용 주소는 화면을 떠날 때 정리
  const createdPreviews = useRef<string[]>([])
  useEffect(() => {
    const list = createdPreviews.current
    return () => list.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    const room = MAX_IMAGES_PER_POST - images.length
    if (room <= 0) {
      setError(`이미지는 최대 ${MAX_IMAGES_PER_POST}장까지 첨부할 수 있습니다.`)
      return
    }
    const picked = Array.from(files).slice(0, room)
    if (files.length > room) {
      setError(`이미지는 최대 ${MAX_IMAGES_PER_POST}장까지라 ${room}장만 추가했어요.`)
    }

    setUploading(true)
    const supabase = createClient()
    try {
      for (const file of picked) {
        if (!file.type.startsWith('image/')) continue
        const blob = await shrinkImage(file)
        if (blob.size > MAX_IMAGE_BYTES) {
          setError('5MB가 넘는 이미지는 올릴 수 없어요.')
          continue
        }
        const contentType = blob.type || file.type
        const res = await fetch('/api/community/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType, size: blob.size }),
        })
        const d = await res.json()
        if (!res.ok) {
          setError(d.error ?? '이미지 업로드에 실패했습니다.')
          continue
        }
        const { error: upErr } = await supabase.storage
          .from(COMMUNITY_BUCKET)
          .uploadToSignedUrl(d.path, d.token, blob, { contentType })
        if (upErr) {
          console.error(upErr)
          setError('이미지 업로드에 실패했습니다.')
          continue
        }
        const preview = URL.createObjectURL(blob)
        createdPreviews.current.push(preview)
        setImages((prev) => [...prev, { path: d.path, preview }])
      }
    } catch (err) {
      console.error(err)
      setError('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('제목을 입력해주세요.')
    if (!body.trim()) return setError('내용을 입력해주세요.')

    setSaving(true)
    try {
      const res = await fetch(postId ? `/api/community/posts/${postId}` : '/api/community/posts', {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          body: body.trim(),
          imagePaths: images.map((i) => i.path),
          isAnonymous,
          identity,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? '저장에 실패했습니다.')
        setSaving(false)
        return
      }
      router.push(`/community/${postId ?? d.id}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('저장 중 오류가 발생했습니다.')
      setSaving(false)
    }
  }

  const identityName = identities.find((i) => i.id === identity)?.name

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-5">
      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">게시판</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMUNITY_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                category === c.key
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">제목</label>
        <input
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={title}
          maxLength={100}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">내용</label>
        <textarea
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm leading-relaxed"
          rows={12}
          maxLength={10000}
          value={body}
          placeholder={BODY_PLACEHOLDER[category]}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-neutral-500 block mb-1.5">
          사진 첨부 <span className="text-neutral-400">({images.length}/{MAX_IMAGES_PER_POST})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div
              key={img.path}
              className="relative w-20 h-20 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100"
            >
              {img.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-400">
                  이미지
                </div>
              )}
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((p) => p.path !== img.path))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center"
                aria-label="사진 빼기"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES_PER_POST && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-md border border-dashed border-neutral-300 text-neutral-400 text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50"
            >
              <span className="text-xl leading-none">+</span>
              {uploading ? '올리는 중…' : '사진 추가'}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="bg-neutral-50 rounded-md px-3 py-3 flex flex-col gap-2.5">
        {postId ? (
          <p className="text-sm">{isAnonymous ? '익명 글' : '실명 글'}</p>
        ) : (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4"
            />
            익명으로 쓰기
          </label>
        )}
        {!isAnonymous && identities.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 shrink-0">표시할 이름</span>
            <select
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              className="flex-1 min-w-0 border border-neutral-300 rounded-md px-2 py-1.5 text-sm bg-white"
            >
              {identities.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <p className="text-xs text-neutral-400 leading-relaxed">
          {isAnonymous
            ? '작성자가 "익명"으로 표시됩니다. 구인구직·인수 글이라면 연락받을 방법을 본문에 적어주세요.'
            : `작성자가 "${identityName ?? ''}"(으)로 표시됩니다.`}
          {!postId && ' 익명 여부는 등록한 뒤에는 바꿀 수 없어요.'}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 text-sm border border-neutral-300 rounded-md py-2"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex-[2] bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
        >
          {saving ? '저장 중…' : postId ? '수정 완료' : '등록하기'}
        </button>
      </div>
    </form>
  )
}
