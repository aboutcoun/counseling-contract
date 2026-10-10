'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function SmartplaceGuideButton() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const modal = (
    <div
      className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-xl max-w-sm w-full p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-medium mb-3">스마트플레이스 URL 복사 방법</h3>

        <ol className="text-sm text-neutral-600 flex flex-col gap-2 mb-4 list-decimal list-inside">
          <li>네이버 지도(또는 네이버 앱)에서 우리 센터를 검색해 페이지를 엽니다.</li>
          <li>화면의 공유 아이콘(⤴)을 눌러 &quot;공유하기&quot; 창을 엽니다.</li>
          <li>맨 아래 링크 옆의 <strong>&quot;복사&quot;</strong> 버튼을 눌러 링크를 복사합니다.</li>
          <li>복사한 링크를 여기 입력창에 붙여넣고 &quot;리뷰 링크로 변환&quot;을 눌러주세요.</li>
        </ol>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smartplace-copy-guide.png"
          alt="스마트플레이스 공유하기 화면에서 복사 버튼 위치 안내"
          className="w-full rounded-lg border border-neutral-200"
        />

        <button
          onClick={() => setOpen(false)}
          className="w-full mt-5 text-sm border border-neutral-300 rounded-md py-2"
        >
          닫기
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-400 underline"
      >
        스마트플레이스 URL 복사 방법
      </button>

      {open && mounted && createPortal(modal, document.body)}
    </>
  )
}
