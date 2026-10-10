export type ProviderStatus = 'unclaimed' | 'pending' | 'approved' | 'rejected'

export interface ProviderLink {
  id: string
  provider_id: string
  category: string
  url: string
  sort_order: number
}

export type HoursMode = 'same' | 'weekday_weekend' | 'daily'

export interface TimeBlock {
  closed?: boolean
  open: string
  close: string
  breakStart?: string
  breakEnd?: string
}

export interface OperatingHoursDetail {
  mode: HoursMode
  same?: TimeBlock
  weekday?: TimeBlock
  weekend?: TimeBlock
  mon?: TimeBlock
  tue?: TimeBlock
  wed?: TimeBlock
  thu?: TimeBlock
  fri?: TimeBlock
  sat?: TimeBlock
  sun?: TimeBlock
}

export interface Provider {
  id: string
  name: string
  address: string | null
  sido: string | null
  sigungu: string | null
  phone: string | null
  operating_hours: string | null
  operating_hours_detail: OperatingHoursDetail | null
  website_url: string | null
  sns_url: string | null
  smartplace_url: string | null
  naver_place_name: string | null // 센터장이 입력한, 네이버 스마트플레이스에 등록된 업체명
  consultant_count: number | null
  is_voucher_provider: boolean
  source: 'imported_list' | 'self_registered' | 'admin_added' | null
  status: ProviderStatus
  verified_certifications: string[] | null
  operator_display_name: string | null
  degree_field: string | null // 인증 시 확인된 전공분야 (석사 이상)
  target_audiences: string[] | null // 상담 가능 대상 (아동/청소년/성인/노인/부부(커플)/가족)
  extra_info: string[] | null // 부가정보 (주말상담/야간상담/비대면/퀴어프렌들리)
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface ProviderOwner {
  provider_id: string
  business_owner_name: string | null
  actual_operator_name: string | null
  is_same_person: boolean
  relationship: string | null
  relationship_proof_url: string | null
}

export interface ProviderProgram {
  id: string
  provider_id: string
  program_name: string
  duration_minutes: number
  price: number | null
  price_on_request: boolean
  sort_order: number
  created_at: string
}

export interface ProviderMessage {
  id: string
  provider_id: string
  body: string
  created_at: string
  read_at: string | null
}

export interface VerificationRequest {
  id: string
  provider_id: string
  business_reg_url: string | null
  cert_file_urls: string[] | null
  cert_file_url: string | null // 구버전 호환용, 더 이상 사용하지 않음
  claimed_certifications: string[] | null // 센터장이 보유하고 있다고 체크한 자격증 전체
  representative_certification: string | null // 그중 지도에 노출할 대표 자격 1개
  has_related_masters: boolean | null // 관련 분야 석사 이상 학위 보유 여부
  degree_field: string | null // 전공분야 (예: 상담심리학)
  degree_file_url: string | null // 학위증명서/졸업증명서 파일 경로
  academy_name: string | null
  cert_level: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_at: string
}
