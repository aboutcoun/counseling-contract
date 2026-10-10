'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import type { CommunityPostDetail } from '@/lib/community'
import PostEditor from '@/components/community/PostEditor'
import { CommunityDenied, useCommunityMe } from '@/components/community/useCommunityMe'

export default function EditCommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const me = useCommunityMe()
  const [post, setPost] = useState<CommunityPostDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (me.status !== 'ok') return
    fetch(`/api/community/posts/${id}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        if (!d.isMine) throw new Error('본인이 쓴 글만 수정할 수 있습니다.')
        setPost(d)
      })
      .catch((e) => setError(e.message || '글을 불러오지 못했습니다.'))
  }, [me.status, id])

  if (me.status === 'loading') {
    return <main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }
  if (me.status === 'denied') return <CommunityDenied reason={me.reason} />
  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-sm">
        <p className="text-neutral-500 mb-3">{error}</p>
        <Link href={`/community/${id}`} className="underline">
          글로 돌아가기
        </Link>
      </main>
    )
  }
  if (!post) {
    return <main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-medium mb-4">글 수정</h1>
      <PostEditor
        identities={me.identities}
        postId={post.id}
        initial={{
          category: post.category,
          title: post.title,
          body: post.body,
          isAnonymous: post.isAnonymous,
          identity: post.authorIdentity,
          images: post.images,
        }}
      />
    </main>
  )
}
