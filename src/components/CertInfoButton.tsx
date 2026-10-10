'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CertificationExplainer from './CertificationExplainer'

export default function CertInfoButton() {
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
        <h3 className="text-base font-medium mb-3">인증기관이란?</h3>
        <div className="mb-5">
          <CertificationExplainer />
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-full text-sm border border-neutral-300 rounded-md py-2"
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
        className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-full px-2.5 py-1 shrink-0"
      >
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] leading-none">
          ?
        </span>
        인증기관이란?
      </button>

      {open && mounted && createPortal(modal, document.body)}
    </>
  )
}
