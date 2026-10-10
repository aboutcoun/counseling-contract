import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { summarizeHours } from '@/lib/hours'
import { ensureHttpUrl } from '@/lib/url'
import type { Provider, ProviderLink, ProviderProgram } from '@/lib/types'
import { notFound } from 'next/navigation'
import CertInfoButton from '@/components/CertInfoButton'
import { VoucherBadge } from '@/components/Badges'
import { TARGET_AUDIENCES } from '@/lib/center-options'
import PhoneButton from '@/components/PhoneButton'

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: provider } = await supabase.from('providers').select('*').eq('id', id).single()

  if (!provider) notFound()

  const p = provider as Provider
  const isApproved = p.status === 'approved'

  const { data: programs } = await supabase
    .from('provider_programs')
    .select('*')
    .eq('provider_id', id)
    .order('sort_order', { ascending: true })

  const { data: links } = await supabase
    .from('provider_links')
    .select('*')
    .eq('provider_id', id)
    .order('sort_order')

  const programList = (programs as ProviderProgram[]) ?? []
  const linkList = (links as ProviderLink[]) ?? []
  const hoursText = p.operating_hours_detail ? summarizeHours(p.operating_hours_detail) : p.operating_hours

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p.is_voucher_provider && (
            <div className="mb-1.5">
              <VoucherBadge />
            </div>
          )}
          <h1 className="text-2xl font-medium">{p.name}</h1>
          <p className="text-neutral-500 text-sm mt-1">{p.address}</p>
        </div>
        {p.phone && <PhoneButton phone={p.phone} />}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-neutral-600">
        <span>상담자 {p.consultant_count != null ? `${p.consultant_count}명` : '정보 없음'}</span>
        <details className="inline-block">
          <summary className="cursor-pointer select-none inline-flex items-center gap-1">
            운영시간 <span className="text-neutral-400 text-xs">▾</span>
          </summary>
          <p className="mt-1.5 text-neutral-700 leading-relaxed">{hoursText || '정보 없음'}</p>
        </details>
      </div>

      <div className="mt-5 border border-neutral-200 rounded-xl p-4 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-400 mb-1.5">상담 가능 대상</p>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_AUDIENCES.map((t) => {
              const active = p.target_audiences?.includes(t)
              return (
                <span
                  key={t}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    active
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200'
                  }`}
                >
                  {t}
                </span>
              )
            })}
          </div>
        </div>

        {p.extra_info && p.extra_info.length > 0 && (
          <div>
            <p className="text-xs font-medium text-neutral-400 mb-1.5">부가정보</p>
            <div className="flex flex-wrap gap-1.5">
              {p.extra_info.map((e) => (
                <span
                  key={e}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        {linkList.map((l) => (
          <a
            key={l.id}
            href={ensureHttpUrl(l.url)}
            target="_blank"
            className="text-sm px-3 py-1.5 border border-neutral-300 rounded-md"
          >
            {l.category}
          </a>
        ))}
        {p.smartplace_url && (
          <a
            href={ensureHttpUrl(p.smartplace_url)}
            target="_blank"
            className="text-sm font-medium px-3 py-1.5 rounded-full bg-[#03C75A] text-white flex items-center gap-1.5"
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#03C75A] text-[10px] font-bold">
              N
            </span>
            네이버 후기
          </a>
        )}
      </div>

      {isApproved && p.verified_certifications && p.verified_certifications.length > 0 && (
        <div className="mt-5 border border-emerald-100 bg-emerald-50/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-emerald-800">안심상담맵 인증기관</h2>
            <CertInfoButton />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '사업자등록', value: '등록 확인' },
              { label: '학력', value: '석사 이상 확인' },
              { label: '자격증', value: '인증자격 확인' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-0.5 bg-white border border-emerald-200 rounded-lg py-2 px-1 text-center"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] leading-none mb-0.5">
                  ✓
                </span>
                <span className="text-[11px] text-neutral-500">{item.label}</span>
                <span className="text-xs font-semibold text-emerald-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isApproved ? (
        <>
          <h2 className="text-base font-medium mt-8 mb-3">프로그램 및 비용</h2>
          {programList.length === 0 && (
            <p className="text-sm text-neutral-500">등록된 프로그램이 없습니다.</p>
          )}
          <ul className="divide-y divide-neutral-100 border-t border-b border-neutral-200">
            {programList.map((prog) => (
              <li key={prog.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{prog.program_name}</p>
                  <p className="text-neutral-500">{prog.duration_minutes}분</p>
                </div>
                <p className="font-medium">
                  {prog.price_on_request || prog.price == null
                    ? '별도문의'
                    : `${prog.price.toLocaleString()}원`}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-8 border border-neutral-200 rounded-xl p-5">
          <p className="text-sm text-neutral-600 mb-3">
            아직 자격 인증을 받지 않은 센터입니다. 프로그램·가격 정보는 인증 후 확인할 수 있습니다.
          </p>
          <Link href="/join" className="inline-block text-sm px-3 py-1.5 border border-neutral-300 rounded-md">
            이 센터 관계자이신가요? 인증 신청하기
          </Link>
        </div>
      )}
    </main>
  )
}
