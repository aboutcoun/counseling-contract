import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { toSignedUrl } from '@/lib/storage-signed-url'
import type { Provider, ProviderOwner, VerificationRequest } from '@/lib/types'
import { notFound } from 'next/navigation'
import ReviewActions from './ReviewActions'
import AdminProviderEditPanel from './AdminProviderEditPanel'
import DeleteCenterButton from '@/components/DeleteCenterButton'

export default async function AdminReviewPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params
  const admin = await getAdminUser()

  if (!admin) {
    return <main className="max-w-lg mx-auto p-6 text-sm">관리자 계정으로 로그인해주세요.</main>
  }

  const supabase = createServiceRoleClient()

  const { data: request } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!request) notFound()
  const req = request as VerificationRequest

  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('id', req.provider_id)
    .single()

  const { data: owner } = await supabase
    .from('provider_owners')
    .select('*')
    .eq('provider_id', req.provider_id)
    .single()

  const p = provider as Provider
  const o = owner as ProviderOwner | null

  // 비공개 버킷이라 저장된 값(경로)을 임시 서명 링크로 변환해서 보여줌
  const businessRegSignedUrl = await toSignedUrl(supabase.storage, req.business_reg_url)
  const certSignedUrls = req.cert_file_urls
    ? await Promise.all(req.cert_file_urls.map((u) => toSignedUrl(supabase.storage, u)))
    : req.cert_file_url
    ? [await toSignedUrl(supabase.storage, req.cert_file_url)]
    : []
  const relationshipSignedUrl = await toSignedUrl(supabase.storage, o?.relationship_proof_url)
  const degreeSignedUrl = await toSignedUrl(supabase.storage, req.degree_file_url)

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-medium mb-1">{p?.name}</h1>
          <p className="text-sm text-neutral-500">{p?.address}</p>
        </div>
        {p?.id && (
          <DeleteCenterButton providerId={p.id} providerName={p.name} redirectTo="/admin" />
        )}
      </div>

      <div className="border border-neutral-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium mb-3">대표자 / 운영자 정보</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-neutral-500">사업자등록증상 대표자</dt>
          <dd>{o?.business_owner_name ?? '-'}</dd>
          <dt className="text-neutral-500">실제 운영자 (자격 보유자)</dt>
          <dd>{o?.actual_operator_name ?? '-'}</dd>
          <dt className="text-neutral-500">대표자와 동일 인물</dt>
          <dd>{o?.is_same_person ? '예' : `아니오 (${o?.relationship ?? '-'})`}</dd>
        </dl>
      </div>

      <div className="border border-neutral-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium mb-3">제출 서류</h2>

        <p className="text-xs text-neutral-500 mb-1.5">① 사업자등록증</p>
        {businessRegSignedUrl ? (
          <a
            href={businessRegSignedUrl}
            target="_blank"
            className="inline-block text-sm px-3 py-1.5 border border-neutral-300 rounded-md mb-3"
          >
            사업자등록증 보기
          </a>
        ) : (
          <p className="text-sm text-neutral-500 mb-3">첨부된 사업자등록증이 없습니다.</p>
        )}

        <p className="text-xs text-neutral-500 mb-1.5">② 자격증</p>
        {req.claimed_certifications && req.claimed_certifications.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-neutral-500 mb-1">체크한 보유 자격증</p>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {req.claimed_certifications.map((c) => (
                <span
                  key={c}
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    c === req.representative_certification
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-medium'
                      : 'border-neutral-200 text-neutral-500'
                  }`}
                >
                  {c}
                  {c === req.representative_certification && ' (대표)'}
                </span>
              ))}
            </div>
          </div>
        )}
        {certSignedUrls.filter(Boolean).length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {certSignedUrls.map(
              (url, i) =>
                url && (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    className="inline-block text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
                  >
                    {req.representative_certification
                      ? `자격증 사본 (${req.representative_certification})`
                      : `자격증 ${i + 1}`}
                  </a>
                )
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 mb-3">첨부된 자격증이 없습니다.</p>
        )}

        <p className="text-xs text-neutral-500 mb-1.5">③ 학력 (관련 분야 석사 이상)</p>
        <div className="mb-3">
          <p className="text-sm mb-1.5">
            {req.has_related_masters ? '보유함' : '미체크'}
            {req.degree_field && ` — 전공: ${req.degree_field}`}
          </p>
          {degreeSignedUrl ? (
            <a
              href={degreeSignedUrl}
              target="_blank"
              className="inline-block text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
            >
              학위증명서 보기
            </a>
          ) : (
            <p className="text-sm text-neutral-500">첨부된 학위증명서가 없습니다.</p>
          )}
        </div>

        <p className="text-xs text-neutral-500 mb-1.5">④ 기타 (관계 증빙서류)</p>
        {!o?.is_same_person && relationshipSignedUrl ? (
          <a
            href={relationshipSignedUrl}
            target="_blank"
            className="inline-block text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
          >
            관계 증빙서류 보기
          </a>
        ) : (
          <p className="text-sm text-neutral-500">대표자와 실제 운영자가 동일해 해당 없음</p>
        )}
      </div>

      <div className="border border-neutral-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium mb-3">기본 정보</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-neutral-500">네이버 스마트플레이스 업체명</dt>
          <dd>{p?.naver_place_name ?? '-'}</dd>
          <dt className="text-neutral-500">전화번호</dt>
          <dd>{p?.phone ?? '-'}</dd>
          <dt className="text-neutral-500">소속 상담자 수</dt>
          <dd>{p?.consultant_count ?? '-'}</dd>
          <dt className="text-neutral-500">정신건강심리상담바우처 제공기관</dt>
          <dd>{p?.is_voucher_provider ? '예' : '아니오'}</dd>
        </dl>
      </div>

      <AdminProviderEditPanel
        providerId={p?.id}
        naverPlaceName={p?.naver_place_name ?? ''}
        initialAddress={p?.address ?? ''}
        initialSmartplaceUrl={p?.smartplace_url ?? ''}
      />

      <ReviewActions
        requestId={req.id}
        providerId={p?.id}
        initialCertifications={
          p?.verified_certifications ??
          (req.representative_certification ? [req.representative_certification] : [])
        }
      />
    </main>
  )
}
