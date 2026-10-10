'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CATEGORY_LABEL, type CommunityPostDetail } from '@/lib/community'
import {
  CATEGORY_CHIP,
  CommunityDenied,
  formatCommunityDate,
  useCommunityMe,
} from '@/components/community/useCommunityMe'

function formatFull(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const me = useCommunityMe()
  const router = useRouter()

  const [post, setPost] = useState<CommunityPostDetail | null>(null)
  const [loadError, setLoadError] = useState('')
  const [viewer, setViewer] = useState<string | null>(null)

  const [comment, setComment] = useState('')
  const [commentAnon, setCommentAnon] = useState(false)
  const [commentIdentity, setCommentIdentity] = useState('')
  const [sending, setSending] = useState(false)
  const [commentError, setCommentError] = useState('')

  // 댓글을 쓰거나 지운 뒤 숫자를 올려서 글을 다시 불러옵니다.
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const effectiveIdentity =
    commentIdentity || (me.status === 'ok' ? me.identities[0]?.id : '') || ''

  useEffect(() => {
    if (me.status !== 'ok') return
    let cancelled = false
    fetch(`/api/community/posts/${id}`)
      .then(async (r) => {
        const d = await r.json()
        if (cancelled) return
        if (!r.ok) setLoadError(d.error ?? '글을 불러오지 못했습니다.')
        else setPost(d)
      })
      .catch(() => {
        if (!cancelled) setLoadError('글을 불러오지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [me.status, id, reloadKey])

  async function handleDeletePost() {
    if (!post) return
    if (!window.confirm('이 글을 삭제할까요? 댓글과 첨부 사진도 함께 삭제됩니다.')) return
    const r = await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) {
      alert(d.error ?? '삭제에 실패했습니다.')
      return
    }
    router.push('/community')
    router.refresh()
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    setCommentError('')
    try {
      const r = await fetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: comment.trim(),
          isAnonymous: commentAnon,
          identity: effectiveIdentity,
        }),
      })
      const d = await r.json()
      if (!r.ok) {
        setCommentError(d.error ?? '댓글 등록에 실패했습니다.')
        return
      }
      setComment('')
      reload()
    } catch (err) {
      console.error(err)
      setCommentError('댓글 등록 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm('댓글을 삭제할까요?')) return
    const r = await fetch(`/api/community/comments/${commentId}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) {
      alert(d.error ?? '삭제에 실패했습니다.')
      return
    }
    reload()
  }

  if (me.status === 'loading') {
    return <main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }
  if (me.status === 'denied') return <CommunityDenied reason={me.reason} />

  if (loadError) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-sm">
        <p className="text-neutral-500 mb-3">{loadError}</p>
        <Link href="/community" className="underline">
          목록으로
        </Link>
      </main>
    )
  }
  if (!post) {
    return <main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }

  const viewableImages = post.images.filter((i) => i.url)

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Link
        href={`/community?category=${post.category}`}
        className="text-xs text-neutral-500 inline-flex items-center gap-1 mb-3"
      >
        ‹ {CATEGORY_LABEL[post.category]} 목록
      </Link>

      <article className="border border-neutral-200 rounded-xl p-5">
        <span
          className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded mb-2 ${
            CATEGORY_CHIP[post.category] ?? ''
          }`}
        >
          {CATEGORY_LABEL[post.category]}
        </span>
        <h1 className="text-lg font-medium leading-snug break-words">{post.title}</h1>
        <div className="flex items-center gap-2 mt-2 pb-4 border-b border-neutral-100">
          <p className="text-xs text-neutral-500 flex-1 min-w-0 truncate">
            {post.authorName} · {formatFull(post.createdAt)}
            {post.updatedAt && <span className="text-neutral-400"> (수정됨)</span>}
          </p>
          {post.isMine && (
            <Link
              href={`/community/${post.id}/edit`}
              className="text-xs px-2 py-1 border border-neutral-300 rounded-md shrink-0"
            >
              수정
            </Link>
          )}
          {post.canDelete && (
            <button
              type="button"
              onClick={handleDeletePost}
              className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded-md shrink-0"
            >
              삭제
            </button>
          )}
        </div>

        <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line break-words mt-4">
          {post.body}
        </p>

        {viewableImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {viewableImages.map((img) => (
              <button
                key={img.path}
                type="button"
                onClick={() => setViewer(img.url)}
                className="aspect-square rounded-md overflow-hidden border border-neutral-200 bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url!} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </article>

      <section className="mt-5">
        <h2 className="text-sm font-medium mb-2">
          댓글 <span className="text-emerald-600">{post.comments.length}</span>
        </h2>

        {post.comments.length > 0 && (
          <ul className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 mb-3">
            {post.comments.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-medium text-neutral-700">{c.authorName}</span>
                  {c.isPostAuthor && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      글쓴이
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">{formatCommunityDate(c.createdAt)}</span>
                  {c.canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="ml-auto text-[11px] text-neutral-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="text-sm text-neutral-800 whitespace-pre-line break-words">{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleComment} className="border border-neutral-200 rounded-xl p-3">
          <textarea
            className="w-full text-sm resize-none outline-none"
            rows={3}
            maxLength={2000}
            placeholder="댓글을 남겨주세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <label className="flex items-center gap-1.5 text-xs text-neutral-600 shrink-0">
              <input
                type="checkbox"
                checked={commentAnon}
                onChange={(e) => setCommentAnon(e.target.checked)}
              />
              익명
            </label>
            {!commentAnon && me.identities.length > 1 && (
              <select
                value={effectiveIdentity}
                onChange={(e) => setCommentIdentity(e.target.value)}
                className="min-w-0 flex-1 border border-neutral-200 rounded-md px-1.5 py-1 text-xs bg-white"
              >
                {me.identities.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              disabled={sending || !comment.trim()}
              className="ml-auto text-xs bg-neutral-900 text-white rounded-md px-3 py-1.5 disabled:opacity-40 shrink-0"
            >
              {sending ? '등록 중…' : '등록'}
            </button>
          </div>
          {commentError && <p className="text-xs text-red-600 mt-2">{commentError}</p>}
        </form>
      </section>

      {viewer && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewer(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewer} alt="" className="max-w-full max-h-full object-contain rounded" />
        </div>
      )}
    </main>
  )
}
