"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, ContractRow } from "@/lib/supabase";
import ContractDocument, { ContractFields } from "@/components/ContractDocument";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";

const SLOT_LABEL: Record<"pledge" | "contract", string> = {
  pledge: "서약자 서명 (생명존중서약서)",
  contract: "내담자 서명 (상담계약서)",
};

export default function ClientFormPage() {
  const params = useParams();
  const id = params.id as string;

  const [row, setRow] = useState<ContractRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contacts, setContacts] = useState({
    contact1_phone: "",
    contact1_relation: "",
    contact2_phone: "",
    contact2_relation: "",
    contact3_phone: "",
    contact3_relation: "",
  });
  const [signatures, setSignatures] = useState<{ pledge: string | null; contract: string | null }>({
    pledge: null,
    contract: null,
  });
  const [activeSlot, setActiveSlot] = useState<"pledge" | "contract" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalSigRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !data) {
        setNotFound(true);
      } else {
        setRow(data as ContractRow);
        if (data.status === "completed") setSubmitted(true);
      }
      setLoading(false);
    })();
  }, [id]);

  const saveSignature = () => {
    if (!activeSlot) return;
    const dataUrl = modalSigRef.current?.getDataUrl();
    if (!dataUrl) {
      setError("서명을 입력한 후 저장해 주세요.");
      return;
    }
    setSignatures((prev) => ({ ...prev, [activeSlot]: dataUrl }));
    setError("");
    setActiveSlot(null);
  };

  const submit = async () => {
    setError("");
    if (!contacts.contact1_phone.trim() || !contacts.contact1_relation.trim()) {
      setError("연락처1은 필수 입력입니다.");
      return;
    }
    if (!contacts.contact2_phone.trim() || !contacts.contact2_relation.trim()) {
      setError("연락처2는 필수 입력입니다.");
      return;
    }
    if (!signatures.pledge) {
      setError("서약자 서명(생명존중서약서)을 입력해 주세요.");
      return;
    }
    if (!signatures.contract) {
      setError("내담자 서명(상담계약서)을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        ...contacts,
        pledge_signature: signatures.pledge,
        client_signature: signatures.contract,
        status: "completed",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSubmitting(false);

    if (updateError) {
      setError("제출 중 문제가 발생했습니다: " + updateError.message);
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-ink/50">불러오는 중...</main>;
  }
  if (notFound || !row) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-ink/60">유효하지 않은 링크입니다. 상담센터에 문의해 주세요.</p>
      </main>
    );
  }

  const fields: ContractFields = {
    branch: row.branch,
    counselor_name: row.counselor_name,
    counselor_level: row.counselor_level,
    counselor_signature: row.counselor_signature,
    client_name: row.client_name,
    client_email: row.client_email,
    contact1_phone: submitted ? row.contact1_phone ?? "" : contacts.contact1_phone,
    contact1_relation: submitted ? row.contact1_relation ?? "" : contacts.contact1_relation,
    contact2_phone: submitted ? row.contact2_phone ?? "" : contacts.contact2_phone,
    contact2_relation: submitted ? row.contact2_relation ?? "" : contacts.contact2_relation,
    contact3_phone: submitted ? row.contact3_phone ?? "" : contacts.contact3_phone,
    contact3_relation: submitted ? row.contact3_relation ?? "" : contacts.contact3_relation,
    pledge_signature: submitted ? row.pledge_signature : signatures.pledge,
    client_signature: submitted ? row.client_signature : signatures.contract,
    submitted_at: submitted ? row.submitted_at : null,
  };

  return (
    <main className="min-h-screen px-4 py-10">
      {submitted && (
        <div className="no-print mx-auto mb-6 max-w-[720px] rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          제출이 완료되었습니다. 담당 상담자가 확인 후 최종 서명하여 다시 안내드립니다. 감사합니다.
        </div>
      )}

      <ContractDocument
        data={fields}
        mode={submitted ? "view" : "client-edit"}
        onContactChange={(key, value) => setContacts((prev) => ({ ...prev, [key]: value }))}
        onSignatureClick={submitted ? undefined : (slot) => setActiveSlot(slot)}
      />

      {!submitted && (
        <div className="no-print mx-auto mt-6 max-w-[720px] rounded-xl border border-line bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-ink/60">
            문서 안의 "서약자"와 "내담자" 서명란을 각각 클릭해서 서명해 주세요.
          </p>
          {error && <p className="mb-3 text-sm text-alert">{error}</p>}
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-md bg-ink py-2.5 font-medium text-white transition hover:bg-ink/85 disabled:opacity-50"
          >
            {submitting ? "제출 중..." : "작성 완료 및 제출"}
          </button>
        </div>
      )}

      {activeSlot && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">{SLOT_LABEL[activeSlot]}</h2>
            <SignaturePad ref={modalSigRef} label="아래에 서명해 주세요" />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveSlot(null)}
                className="flex-1 rounded-md border border-line py-2.5 text-sm font-medium hover:bg-paper"
              >
                취소
              </button>
              <button
                onClick={saveSignature}
                className="flex-1 rounded-md bg-ink py-2.5 text-sm font-medium text-white hover:bg-ink/85"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
