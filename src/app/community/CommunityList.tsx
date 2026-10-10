'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CATEGORY_LABEL,
  COMMUNITY_CATEGORIES,
  type CommunityPostListItem,
} from '@/lib/community'
import {
  CATEGORY_CHIP,
  CommunityDenied,
  formatCommunityDate,
  useCommunityMe,
} from '@/components/community/useCommunityMe'

export default function CommunityList() {
  const me = useCommunityMe()
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  // 어떤 조건(카테고리·페이지)으로 불러온 결과인지 함께 저장해서,
  // 조건이 바뀌면 이전 결과 대신 "불러오는 중"이 보이도록 합니다.
  const queryKey = `${category}|${page}`
  const [result, setResult] = useState<{
    key: string
    posts: CommunityPostListItem[]
    totalPages: number
    error: string
  } | null>(null)

  useEffect(() => {
    if (me.status !== 'ok') return
    let cancelled = false
    const qs = new URLSearchParams()
    if (category) qs.set('category', category)
    if (page > 1) qs.set('page', String(page))
    fetch(`/api/community/posts?${qs.toString()}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        if (!cancelled) setResult({ key: queryKey, posts: d.posts, totalPages: d.totalPages, error: '' })
      })
      .catch((e) => {
        if (!cancelled) {
          setResult({
            key: queryKey,
            posts: [],
            totalPages: 1,
            error: e.message || '글 목록을 불러오지 못했습니다.',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [me.status, category, page, queryKey])

  const current = result?.key === queryKey ? result : null
  const posts = current && !current.error ? current.posts : current ? [] : null
  const totalPages = current?.totalPages ?? 1
  const error = current?.error ?? ''

  function go(nextCategory: string, nextPage = 1) {
    const qs = new URLSearchParams()
    if (nextCategory) qs.set('category', nextCategory)
    if (nextPage > 1) qs.set('page', String(nextPage))
    const s = qs.toString()
    router.push(s ? `/community?${s}` : '/community')
  }

  if (me.status === 'loading') {
    return <main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }
  if (me.status === 'denied') return <CommunityDenied reason={me.reason} />

  const tabs = [{ key: '', label: '전체' }, ...COMMUNITY_CATEGORIES]

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-lg font-medium">센터장 커뮤니티</h1>
          <p className="text-xs text-neutral-400 mt-0.5">인증이 완료된 센터장만 보고 쓸 수 있어요</p>
        </div>
        <Link
          href={category ? `/community/new?category=${category}` : '/community/new'}
          className="text-sm bg-neutral-900 text-white rounded-md px-3 py-1.5 shrink-0"
        >
          글쓰기
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            className={`text-sm px-3 py-1.5 rounded-full border whitespace-nowrap ${
              category === t.key
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {posts === null ? (
        <p className="text-sm text-neutral-500 py-8 text-center">불러오는 중…</p>
      ) : error ? null : posts.length === 0 ? (
        <div className="border border-neutral-200 rounded-xl py-12 text-center">
          <p className="text-sm text-neutral-400 mb-3">아직 글이 없어요.</p>
          <Link
            href={category ? `/community/new?category=${category}` : '/community/new'}
            className="text-sm underline text-neutral-600"
          >
            첫 글 남기기
          </Link>
        </div>
      ) : (
        (
          <ul className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/community/${p.id}`} className="block px-4 py-3 hover:bg-neutral-50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!category && (
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                          CATEGORY_CHIP[p.category] ?? ''
                        }`}
                      >
                        {CATEGORY_LABEL[p.category]}
                      </span>
                    )}
                    <span className="text-sm font-medium truncate">{p.title}</span>
                    {p.hasImages && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-neutral-400 shrink-0"
                        aria-label="이미지 첨부"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="9" cy="10" r="2" />
                        <path d="M21 17l-5-5-9 8" />
                      </svg>
                    )}
                    {p.commentCount > 0 && (
                      <span className="text-xs text-emerald-600 font-medium shrink-0">
                        [{p.commentCount}]
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {p.authorName} · {formatCommunityDate(p.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => go(category, page - 1)}
            className="px-3 py-1.5 border border-neutral-300 rounded-md disabled:opacity-30"
          >
            이전
          </button>
          <span className="text-neutral-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => go(category, page + 1)}
            className="px-3 py-1.5 border border-neutral-300 rounded-md disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </main>
  )
}
