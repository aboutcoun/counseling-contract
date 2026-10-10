import { Suspense } from 'react'
import NewPost from './NewPost'

export default function NewPostPage() {
  return (
    <Suspense
      fallback={<main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>}
    >
      <NewPost />
    </Suspense>
  )
}
