'use client'

import { useSearchParams } from 'next/navigation'
import { isCommunityCategory } from '@/lib/community'
import PostEditor from '@/components/community/PostEditor'
import { CommunityDenied, useCommunityMe } from '@/components/community/useCommunityMe'

export default function NewPost() {
  const me = useCommunityMe()
  const searchParams = useSearchParams()
  const c = searchParams.get('category')

  if (me.status === 'loading') {
    return <main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>
  }
  if (me.status === 'denied') return <CommunityDenied reason={me.reason} />

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-medium mb-4">글쓰기</h1>
      <PostEditor
        identities={me.identities}
        defaultCategory={isCommunityCategory(c) ? c : undefined}
      />
    </main>
  )
}
