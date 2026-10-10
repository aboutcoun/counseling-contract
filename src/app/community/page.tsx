import { Suspense } from 'react'
import CommunityList from './CommunityList'

export default function CommunityPage() {
  return (
    <Suspense
      fallback={<main className="max-w-2xl mx-auto p-6 text-sm text-neutral-500">불러오는 중…</main>}
    >
      <CommunityList />
    </Suspense>
  )
}
