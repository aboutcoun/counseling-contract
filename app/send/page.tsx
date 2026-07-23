"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";

const BRANCHES = ["안양점", "수원점"] as const;
const LEVELS = ["1급", "2급"] as const;

export default function SendPage() {
  const [branch, setBranch] = useState<(typeof BRANCHES)[number]>("안양점");
  const [counselorName, setCounselorName] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("1급");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sigRef = useRef<SignaturePadHandle>(null);

  const reset = () => {
    setCounselorName("");
    setClientName("");
    setClientEmail("");
    sigRef.current?.clear();
    setResultUrl(null);
    setCopied(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!counselorName.trim() || !clientName.trim() || !clientEmail.trim()) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }
    const signature = sigRef.current?.getDataUrl();
    if (!signature) {
      setError("상담자 서명을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const { data, error: dbError } = await supabase
      .from("contracts")
      .insert({
        branch,
        counselor_name: counselorName.trim(),
        counselor_level: level,
        counselor_signature: signature,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        status: "sent",
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (dbError || !data) {
      setError("저장 중 문제가 발생했습니다: " + (dbError?.message ?? "알 수 없는 오류"));
      return;
    }

    const url = `${window.location.origin}/form/${data.id}`;
    setResultUrl(url);
  };

  if (resultUrl) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-16">
        <div className="rounded-xl border border-line bg-white p-8 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-accent">발송 준비 완료</p>
          <h1 className="mb-4 text-xl font-bold">{clientName} 님에게 전달할 링크</h1>
          <p className="mb-4 text-sm text-ink/70">
            아래 링크를 이메일, 문자, 카카오톡 등 편한 방법으로 내담자에게 전달해 주세요. 내담자가 링크에서
            정보를 입력하고 서명을 완료하면 목록에서 확인하실 수 있습니다.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm">
            <span className="flex-1 truncate">{resultUrl}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(resultUrl);
                setCopied(true);
              }}
              className="shrink-0 rounded bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/85"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <a
            href={`mailto:${clientEmail}?subject=${encodeURIComponent(
              "[ABOUT심리상담센터] 상담계약서 작성 안내"
            )}&body=${encodeURIComponent(
              `안녕하세요, ${clientName}님.\n아래 링크에서 상담계약서 작성 및 서명을 부탁드립니다.\n\n${resultUrl}`
            )}`}
            className="mb-3 block w-full rounded-md border border-line py-2.5 text-center text-sm font-medium hover:bg-paper"
          >
            메일 앱으로 보내기
          </a>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 rounded-md bg-ink py-2.5 text-sm font-medium text-white hover:bg-ink/85"
            >
              새 계약서 발송하기
            </button>
            <Link
              href="/admin"
              className="flex-1 rounded-md border border-line py-2.5 text-center text-sm font-medium hover:bg-paper"
            >
              전체 목록 보기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-16">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">ABOUT 심리상담센터</p>
        <Link href="/admin" className="text-sm text-ink/60 underline underline-offset-2 hover:text-ink">
          전체 목록 →
        </Link>
      </div>
      <h1 className="mb-1 text-xl font-bold">상담계약서 발송</h1>
      <p className="mb-6 text-sm text-ink/60">
        정보를 입력하고 서명하면 내담자에게 전달할 작성 링크가 만들어집니다.
      </p>

      <form onSubmit={submit} className="space-y-5 rounded-xl border border-line bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-ink/70">지점</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as (typeof BRANCHES)[number])}
              className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-ink/70">급수</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}
              className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink/70">상담자 이름</label>
          <input
            value={counselorName}
            onChange={(e) => setCounselorName(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
            placeholder="예: 함OO"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink/70">내담자 이름</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
            placeholder="예: 김OO"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink/70">내담자 이메일</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
            placeholder="example@email.com"
          />
        </div>

        <SignaturePad ref={sigRef} label="상담자 서명" />

        {error && <p className="text-sm text-alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-ink py-2.5 font-medium text-white transition hover:bg-ink/85 disabled:opacity-50"
        >
          {submitting ? "생성 중..." : "서명하고 링크 만들기"}
        </button>
      </form>
    </main>
  );
}
