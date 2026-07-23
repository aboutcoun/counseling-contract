"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, ContractRow } from "@/lib/supabase";

export default function AdminListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "completed">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
      setRows((data as ContractRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (query && !r.client_name.includes(query) && !r.counselor_name.includes(query)) return false;
    return true;
  });

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-accent">ABOUT 심리상담센터</p>
          <h1 className="text-xl font-bold">상담계약서 목록</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/send" className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-white">
            + 새 계약서 발송
          </Link>
          <button onClick={logout} className="text-sm text-ink/50 underline underline-offset-2 hover:text-ink">
            로그아웃
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름으로 검색"
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex gap-1 rounded-md border border-line bg-white p-1 text-sm">
          {(["all", "sent", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 ${filter === f ? "bg-ink text-white" : "text-ink/60 hover:bg-paper"}`}
            >
              {f === "all" ? "전체" : f === "sent" ? "발송됨" : "작성완료"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-ink/50">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white/50 px-4 py-10 text-center text-ink/40">
          해당하는 계약서가 없습니다.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {filtered.map((r) => (
            <Link
              href={`/admin/${r.id}`}
              key={r.id}
              className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-paper"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "completed" ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink/60"
                  }`}
                >
                  {r.status === "completed" ? "작성완료" : "발송됨"}
                </span>
                <span className="font-medium">{r.client_name}</span>
                <span className="text-ink/40">
                  {r.branch} · {r.counselor_name}({r.counselor_level})
                </span>
              </div>
              <span className="text-ink/30">
                {new Date(r.created_at).toLocaleDateString("ko-KR")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
