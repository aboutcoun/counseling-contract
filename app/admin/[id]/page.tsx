"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, ContractRow } from "@/lib/supabase";
import ContractDocument, { ContractFields } from "@/components/ContractDocument";

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [row, setRow] = useState<ContractRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contracts").select("*").eq("id", id).single();
      setRow((data as ContractRow) ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <main className="flex min-h-screen items-center justify-center text-ink/50">불러오는 중...</main>;
  if (!row) return <main className="flex min-h-screen items-center justify-center text-ink/50">계약서를 찾을 수 없습니다.</main>;

  const fields: ContractFields = {
    branch: row.branch,
    counselor_name: row.counselor_name,
    counselor_level: row.counselor_level,
    counselor_signature: row.counselor_signature,
    client_name: row.client_name,
    client_email: row.client_email,
    contact1_phone: row.contact1_phone ?? "",
    contact1_relation: row.contact1_relation ?? "",
    contact2_phone: row.contact2_phone ?? "",
    contact2_relation: row.contact2_relation ?? "",
    contact3_phone: row.contact3_phone ?? "",
    contact3_relation: row.contact3_relation ?? "",
    pledge_signature: row.pledge_signature,
    client_signature: row.client_signature,
    submitted_at: row.submitted_at,
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="no-print mx-auto mb-6 flex max-w-[720px] items-center justify-between">
        <Link href="/admin" className="text-sm text-ink/50 underline underline-offset-2 hover:text-ink">
          ← 목록으로
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.status === "completed" ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink/60"
            }`}
          >
            {row.status === "completed" ? "작성완료" : "발송됨 · 내담자 응답 대기"}
          </span>
          <span className="text-sm text-ink/50">{row.client_email}</span>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink/85"
          >
            인쇄 / PDF 저장
          </button>
        </div>
      </div>
      <ContractDocument data={fields} mode="view" />
    </main>
  );
}
