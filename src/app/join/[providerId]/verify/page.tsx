'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CERT_TYPES } from '@/lib/cert-types'

const fileInputClass =
  'text-sm w-full border border-neutral-300 rounded-md px-3 py-2 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-neutral-300 file:bg-neutral-50 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-neutral-100'

export default function VerifyPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const { providerId } = use(params)
  const router = useRouter()

  const [businessOwnerName, setBusinessOwnerName] = useState('')
  const [isSamePerson, setIsSamePerson] = useState(true)
  const [actualOperatorName, setActualOperatorName] = useState('')
  const [relationship, setRelationship] = useState('배우자')
  const [relationshipFile, setRelationshipFile] = useState<File | null>(null)

  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null)

  const [claimedCerts, setClaimedCerts] = useState<string[]>([])
  const [representativeCert, setRepresentativeCert] = useState('')
  const [repCertFile, setRepCertFile] = useState<File | null>(null)

  const [hasRelatedMasters, setHasRelatedMasters] = useState(false)
  const [degreeField, setDegreeField] = useState('')
  const [degreeFile, setDegreeFile] = useState<File | null>(null)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function uploadFile(file: File, label: string) {
    const supabase = createClient()
    // Storage 키에는 한글·괄호 등 특수문자를 쓸 수 없어서, 확장자만 남기고 안전한 이름으로 저장
    const extMatch = file.name.match(/\.[a-zA-Z0-9]+$/)
    const ext = extMatch ? extMatch[0] : ''
    const path = `${providerId}/${label}-${Date.now()}${ext}`
    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(path, file)
    if (uploadError) throw uploadError
    // 버킷이 비공개라 공개 URL로는 접근이 안 됨 — 경로만 저장해두고,
    // 볼 때(관리자 화면)마다 서버에서 임시 서명 링크를 새로 만들어서 사용함
    return path
  }

  function toggleClaimedCert(cert: string) {
    setClaimedCerts((prev) => {
      const next = prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
      // 대표 자격으로 골라둔 게 체크 해제되면 대표 자격 선택도 같이 초기화
      if (representativeCert && !next.includes(representativeCert)) {
        setRepresentativeCert('')
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!businessOwnerName.trim()) {
      setError('사업자등록증상 대표자명을 입력해주세요.')
      return
    }
    if (!businessRegFile) {
      setError('사업자등록증을 업로드해주세요.')
      return
    }
    if (claimedCerts.length === 0) {
      setError('보유하신 자격증을 1개 이상 체크해주세요.')
      return
    }
    if (!representativeCert) {
      setError('지도에 노출할 대표 자격을 선택해주세요.')
      return
    }
    if (!repCertFile) {
      setError('대표 자격의 자격증 파일을 업로드해주세요.')
      return
    }
    if (!hasRelatedMasters) {
      setError('관련 분야 석사 이상 학력 보유 여부를 체크해주세요.')
      return
    }
    if (!degreeField.trim()) {
      setError('전공분야를 입력해주세요.')
      return
    }
    if (!degreeFile) {
      setError('학위증명서(또는 졸업증명서)를 업로드해주세요.')
      return
    }
    if (!isSamePerson && (!actualOperatorName.trim() || !relationshipFile)) {
      setError('실제 운영자명과 관계 증빙서류를 모두 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const businessRegUrl = await uploadFile(businessRegFile, 'bizreg')
      const repCertUrl = await uploadFile(repCertFile, 'cert-rep')
      const degreeUrl = await uploadFile(degreeFile, 'degree')
      const relationshipUrl = relationshipFile
        ? await uploadFile(relationshipFile, 'relationship')
        : null

      const supabase = createClient()

      const { error: ownerError } = await supabase.from('provider_owners').upsert({
        provider_id: providerId,
        business_owner_name: businessOwnerName.trim(),
        actual_operator_name: isSamePerson
          ? businessOwnerName.trim()
          : actualOperatorName.trim(),
        is_same_person: isSamePerson,
        relationship: isSamePerson ? null : relationship,
        relationship_proof_url: relationshipUrl,
      })
      if (ownerError) throw ownerError

      const { error: reqError } = await supabase.from('verification_requests').insert({
        provider_id: providerId,
        business_reg_url: businessRegUrl,
        cert_file_urls: [repCertUrl],
        claimed_certifications: claimedCerts,
        representative_certification: representativeCert,
        has_related_masters: hasRelatedMasters,
        degree_field: degreeField.trim(),
        degree_file_url: degreeUrl,
        status: 'pending',
      })
      if (reqError) throw reqError

      const { error: statusError } = await supabase
        .from('providers')
        .update({ status: 'pending' })
        .eq('id', providerId)
      if (statusError) throw statusError

      router.push('/mypage')
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? '제출에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center">
          5
        </div>
        <span className="text-sm font-medium">자격 증빙</span>
      </div>

      <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-5">
        <p className="text-xs text-neutral-500 -mt-1">
          학회 자격 + 관련 분야 석사 이상 학력을 보유한 실제 운영자 기준으로 확인합니다.
        </p>

        <Field label="사업자등록증상 대표자명">
          <input
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={businessOwnerName}
            onChange={(e) => setBusinessOwnerName(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between bg-neutral-50 rounded-md px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">실제 운영자가 대표자와 다른가요?</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              자격 보유자가 사업자등록증상 대표와 다른 경우 체크해주세요.
            </p>
          </div>
          <input
            type="checkbox"
            checked={!isSamePerson}
            onChange={(e) => setIsSamePerson(!e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        {!isSamePerson && (
          <div className="border-l-2 border-neutral-300 pl-3 flex flex-col gap-3">
            <Field label="실제 운영자명 (자격 보유자)">
              <input
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                value={actualOperatorName}
                onChange={(e) => setActualOperatorName(e.target.value)}
              />
            </Field>
            <Field label="대표자와의 관계">
              <select
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                <option>배우자</option>
                <option>가족</option>
                <option>위임받은 운영자</option>
                <option>기타</option>
              </select>
            </Field>
          </div>
        )}

        <hr className="border-neutral-100" />

        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
          <p className="text-sm font-medium text-amber-800">필수 등록 요건 (모두 충족 필요)</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            안심상담맵은 ① 사업자등록증 보유, ② 아래 자격증 중 1개 이상 보유, ③ 관련 분야 석사
            이상 학위 보유 — 이 세 가지를 모두 충족하는 센터만 등록·인증할 수 있습니다. 선택 사항이
            아니며, 하나라도 해당하지 않으면 등록이 어려운 점 양해 부탁드립니다.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">증빙서류 업로드 (아래 3가지 모두 필요)</p>
          <div className="flex gap-1.5">
            {[
              { label: '① 사업자등록증', done: !!businessRegFile },
              { label: '② 자격증', done: !!representativeCert && !!repCertFile },
              { label: '③ 최종학력증명', done: hasRelatedMasters && !!degreeFile },
            ].map((item) => (
              <span
                key={item.label}
                className={`flex-1 text-center text-xs px-2 py-1.5 rounded-md border ${
                  item.done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-medium'
                    : 'border-neutral-200 text-neutral-400'
                }`}
              >
                {item.done ? '✓ ' : ''}
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* 1. 사업자등록증 */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">① 사업자등록증</h3>
          <input
            type="file"
            onChange={(e) => setBusinessRegFile(e.target.files?.[0] ?? null)}
            className={fileInputClass}
          />
        </div>

        {/* 2. 자격증 (보유 자격 체크 + 대표 자격 선택 + 파일 업로드) */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">② 자격증</h3>

          <label className="text-sm text-neutral-500 block mb-1.5">
            보유하신 자격증을 모두 체크해주세요
          </label>
          <div className="flex flex-col gap-1.5 mb-3">
            {CERT_TYPES.map((cert) => (
              <label
                key={cert}
                className="flex items-center gap-2 text-sm border border-neutral-200 rounded-md px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={claimedCerts.includes(cert)}
                  onChange={() => toggleClaimedCert(cert)}
                  className="w-4 h-4"
                />
                {cert}
              </label>
            ))}
          </div>

          {claimedCerts.length > 0 && (
            <>
              <label className="text-sm text-neutral-500 block mb-1.5">
                대표 자격 선택 (지도에 노출될 자격 1개)
              </label>
              <select
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm mb-3"
                value={representativeCert}
                onChange={(e) => setRepresentativeCert(e.target.value)}
              >
                <option value="">선택해주세요</option>
                {claimedCerts.map((cert) => (
                  <option key={cert} value={cert}>
                    {cert}
                  </option>
                ))}
              </select>

              {representativeCert && (
                <Field label={`대표 자격 자격증 사본 — "${representativeCert}"`}>
                  <input
                    type="file"
                    onChange={(e) => setRepCertFile(e.target.files?.[0] ?? null)}
                    className={fileInputClass}
                  />
                </Field>
              )}
            </>
          )}
        </div>

        {/* 3. 최종학력증명 (관련 분야 석사 이상) */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">③ 최종학력증명 (관련 분야 석사 이상)</h3>
          <label className="flex items-center gap-2 text-sm border border-neutral-200 rounded-md px-3 py-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={hasRelatedMasters}
              onChange={(e) => setHasRelatedMasters(e.target.checked)}
              className="w-4 h-4"
            />
            관련 분야 석사 이상 학위를 보유하고 있습니다
          </label>

          {hasRelatedMasters && (
            <div className="flex flex-col gap-3">
              <Field label="전공분야">
                <input
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                  value={degreeField}
                  onChange={(e) => setDegreeField(e.target.value)}
                  placeholder="예: 상담심리학"
                />
              </Field>
              <Field label="학위증명서 또는 졸업증명서">
                <input
                  type="file"
                  onChange={(e) => setDegreeFile(e.target.files?.[0] ?? null)}
                  className={fileInputClass}
                />
              </Field>
            </div>
          )}
        </div>

        {/* 4. 기타 (대표자-운영자 관계 증빙, 필요한 경우만) */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-semibold">
              ④ 기타 (대표자와 실제 운영자가 다른 경우, 관계 증빙서류)
            </h3>
            {!isSamePerson && (
              <a
                href="/templates/실제운영자확인서.docx"
                download
                className="text-xs text-neutral-500 underline shrink-0"
              >
                서식 다운로드
              </a>
            )}
          </div>
          {!isSamePerson && (
            <p className="text-xs text-neutral-400 mb-1.5">
              양식을 다운로드해 사업자등록증상 대표자와 실제 운영자 두 분 모두 서명(또는 날인) 후
              작성해서 업로드해주세요. 가족관계증명서·위임장 등으로 대신 제출하셔도 됩니다.
            </p>
          )}
          <input
            type="file"
            disabled={isSamePerson}
            onChange={(e) => setRelationshipFile(e.target.files?.[0] ?? null)}
            className={`${fileInputClass} ${isSamePerson ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {isSamePerson && (
            <p className="text-xs text-neutral-400 mt-1">
              대표자와 실제 운영자가 같으면 업로드하지 않아도 됩니다.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm disabled:opacity-50"
        >
          {submitting ? '제출 중…' : '제출하고 검토 요청'}
        </button>
        <p className="text-xs text-neutral-500 text-center">
          제출 후 관리자 검토를 거쳐 인증 배지가 부여됩니다.
        </p>
      </form>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-500 block mb-1.5">{label}</label>
      {children}
    </div>
  )
}
