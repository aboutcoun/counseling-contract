"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get("next") || "/send");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "로그인에 실패했습니다.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-line bg-white p-8 shadow-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-accent">ABOUT 심리상담센터</p>
        <h1 className="mb-6 text-xl font-bold">상담자 로그인</h1>
        <label className="mb-1.5 block text-sm text-ink/70">비밀번호</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
          placeholder="센터 공용 비밀번호"
        />
        {error && <p className="mb-4 text-sm text-alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ink py-2.5 font-medium text-white transition hover:bg-ink/85 disabled:opacity-50"
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
