'use client'

import { useEffect, useRef, useState } from 'react'

// 모바일(터치 기기)에서는 바로 전화 앱으로 연결하고,
// PC에서는 클릭 시 번호를 보여주는 작은 팝업만 띄웁니다.
export default function PhoneButton({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  function handleClick() {
    const isTouchDevice =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice) {
      window.location.href = `tel:${phone}`
      return
    }
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`전화 문의: ${phone}`}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-10 bg-neutral-900 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {phone}
          <span className="absolute -top-1 right-3 w-2 h-2 bg-neutral-900 rotate-45" />
        </div>
      )}
    </div>
  )
}
