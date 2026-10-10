'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteCenterButton({
  providerId,
  providerName,
  redirectTo,
  className,
}: {
  providerId: string
  providerName?: string
  /** 삭제 성공 후 이동할 경로. 없으면 현재 페이지를 새로고침만 합니다. */
  redirectTo?: string
  className?: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${providerName ?? '이 센터'}"를 정말 삭제하시겠습니까?\n제출된 서류, 프로그램, 연결된 계정 정보가 모두 함께 삭제되며 되돌릴 수 없습니다.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? '삭제에 실패했습니다.')
        setDeleting(false)
        return
      }
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      alert('삭제 중 오류가 발생했습니다.')
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={
        className ??
        'text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-md disabled:opacity-50'
      }
    >
      {deleting ? '삭제 중…' : '센터 삭제'}
    </button>
  )
}
