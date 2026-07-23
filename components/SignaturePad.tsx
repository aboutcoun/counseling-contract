"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type SignaturePadHandle = {
  getDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
};

type Props = {
  label: string;
  height?: number;
};

const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { label, height = 160 },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "#1c1c1a";
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getPos(e);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getPos(e);
    if (ctx && lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      hasDrawn.current = true;
      setEmpty(false);
    }
    lastPoint.current = point;
  };

  const end = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      if (!hasDrawn.current || !canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      hasDrawn.current = false;
      setEmpty(true);
    },
    isEmpty: () => !hasDrawn.current,
  }));

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-ink/80">{label}</span>
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasDrawn.current = false;
            setEmpty(true);
          }}
          className="text-xs text-ink/50 underline underline-offset-2 hover:text-ink"
        >
          다시 서명
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full touch-none rounded-md border border-line bg-white"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      {empty && (
        <p className="mt-1 text-xs text-ink/40">이 영역에 손가락(터치) 또는 마우스로 서명해 주세요.</p>
      )}
    </div>
  );
});

export default SignaturePad;
