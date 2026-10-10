import { CERT_TYPES } from '@/lib/cert-types'

/**
 * '인증기관'이 되기 위한 두 가지 조건(학력 + 자격)을 시각적으로 보여주고,
 * 그 아래에 어떤 자격증이 왜 포함되는지를 줄글로 설명하는 공용 블록.
 * MapInfoButton, CertInfoButton에서 함께 사용합니다.
 */
export default function CertificationExplainer() {
  return (
    <div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 mb-4">
        <p className="text-sm font-semibold text-emerald-800 text-center">
          올바른 심리상담을 위한 최소한의 안전장치
        </p>
      </div>

      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex-1 border border-neutral-200 rounded-lg p-3 text-center bg-neutral-50">
          <p className="text-[11px] text-neutral-400 mb-1">조건 ①</p>
          <p className="text-sm font-semibold text-neutral-800">학력</p>
          <p className="text-xs text-neutral-500 mt-1 leading-snug">
            관련 분야
            <br />
            석사 이상
          </p>
        </div>
        <div className="flex items-center text-neutral-300 text-base font-light">+</div>
        <div className="flex-1 border border-neutral-200 rounded-lg p-3 text-center bg-neutral-50">
          <p className="text-[11px] text-neutral-400 mb-1">조건 ②</p>
          <p className="text-sm font-semibold text-neutral-800">자격</p>
          <p className="text-xs text-neutral-500 mt-1 leading-snug">
            까다로운 수련과정
            <br />
            포함 자격증
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 mb-4">
        <span className="text-[11px] text-neutral-400">↓ 서류로 직접 확인 ↓</span>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          인증기관
        </span>
      </div>

      <p className="text-xs font-medium text-neutral-500 mb-1.5">
        인증 자격증 목록 (아래 중 1개 이상)
      </p>
      <ul className="text-xs text-neutral-500 flex flex-col gap-1 mb-4 list-disc list-inside">
        {CERT_TYPES.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <p className="text-sm text-neutral-600 leading-relaxed mb-2">
        위 자격증들은 어려운 필기·면접 시험을 통과하는 것만으로 딸 수 있는 자격증이 아닙니다.
        시험에 응시하는 것 자체가 수년간의 엄격한 수련 과정을 거쳐야만 가능합니다.
      </p>
      <p className="text-sm text-neutral-600 leading-relaxed mb-2">
        자격 취득 이후에도 윤리교육·보수교육 등 자격을 유지하기 위한 활동을 지속해야 합니다.
      </p>
      <p className="text-sm text-neutral-600 leading-relaxed">
        청소년상담사, 전문상담교사, 그 외 정신건강전문요원 직역 등은 바우처 제공기관 자격요건에는
        포함되지만 이 정도의 엄격한 수련 과정을 요구하지 않아 안심상담맵의 인증 기준에서는
        제외했습니다.
      </p>
    </div>
  )
}
