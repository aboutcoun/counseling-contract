'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CertificationExplainer from './CertificationExplainer'

export default function MapInfoButton() {
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
        <div className="mb-5 pb-4 border-b border-neutral-100">
          <p className="text-sm font-medium text-neutral-900 mb-2">어떤 센터들이 표시되나요?</p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            센터 운영자의 <b>학력</b>과 <b>자격</b> 두 가지를 모두 서류로 증빙하고 안심상담맵이
            직접 확인한 <b>인증기관</b>만 지도에 나타나요.
          </p>
        </div>

        <div className="mb-4">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
            인증
          </span>
          <h3 className="text-sm font-medium mt-2 mb-3">인증기관이란?</h3>
          <CertificationExplainer />
        </div>

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
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 text-left"
      >
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shrink-0">
          ?
        </span>
        <span className="flex-1">어떤 센터들이 표시되나요?</span>
        <span className="text-emerald-400 text-xs">›</span>
      </button>

      {open && mounted && createPortal(modal, document.body)}
    </>
  )
}
