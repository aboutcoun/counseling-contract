export const metadata = { title: '개인정보처리방침 | 안심상담맵' }

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 pb-16 text-sm leading-relaxed text-neutral-700">
      <h1 className="text-xl font-medium text-neutral-900 mb-1">개인정보처리방침</h1>
      <p className="text-xs text-neutral-400 mb-8">시행일: 2026년 8월 19일</p>

      <p className="mb-6">
        안심상담맵(이하 &quot;회사&quot;)은 「개인정보보호법」 등 관련 법령을 준수하며, 이용자의
        개인정보를 소중히 다룹니다. 본 방침은 회사가 어떤 개인정보를 수집하고, 어떻게
        이용·보관·파기하는지를 안내합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p className="mb-2 font-medium text-neutral-800">가. 일반 방문자</p>
        <p className="mb-3">
          별도의 회원가입 없이 서비스를 이용할 수 있으며, 이 경우 개인정보를 수집하지 않습니다.
          다만 위치정보 이용(&quot;내 주변 센터 보기&quot;)에 동의한 경우, 해당 세션 내에서
          기기의 위치정보를 일시적으로 이용합니다(서버에 저장하지 않음).
        </p>
        <p className="mb-2 font-medium text-neutral-800">나. 센터 회원 (가입 및 인증 신청 시)</p>
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li>이메일 주소, 비밀번호(암호화 저장)</li>
          <li>센터명, 네이버 스마트플레이스 등록 업체명, 주소, 운영시간 등 센터 운영 정보</li>
          <li>사업자등록증상 대표자명, 실제 운영자명(대표자와 다른 경우)</li>
          <li>학력 정보: 전공분야, 관련 분야 석사 이상 학위 보유 여부</li>
          <li>
            제출 서류: 사업자등록증 사본, 자격증 사본, 학위증명서(또는 졸업증명서), 대표자와 실제
            운영자의 관계 증빙서류(해당하는 경우)
          </li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li>센터 회원 식별 및 계정 관리</li>
          <li>자격 인증 심사 및 인증 배지 부여 여부 결정</li>
          <li>서비스 이용 관련 문의 응대</li>
          <li>&quot;내 주변 센터 보기&quot; 등 위치 기반 기능 제공 (일시적 이용, 미저장)</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <p>
          센터 회원 탈퇴 또는 등록 정보 삭제 요청 시 지체 없이 파기합니다. 다만 관계 법령에
          따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다. 인증 심사를 위해
          제출된 서류(사업자등록증, 자격증, 학위증명서, 관계 증빙서류)는 비공개(Private) 저장소에
          보관되며, 인증 취소 또는 회원 탈퇴 시 삭제 요청을 통해 파기할 수 있습니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 다음의 경우는
          예외로 합니다.
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </ul>
      </Section>

      <Section title="5. 개인정보 처리의 위탁">
        <p>회사는 서비스 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
        <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
          <li>Supabase Inc. — 데이터베이스 및 파일(서류) 저장</li>
          <li>Vercel Inc. — 웹사이트 호스팅</li>
          <li>네이버클라우드플랫폼(NAVER Cloud Platform) — 지도 표시 및 주소-좌표 변환(지오코딩)</li>
        </ul>
      </Section>

      <Section title="6. 이용자의 권리">
        <p>
          이용자(센터 회원)는 언제든지 자신의 개인정보를 조회, 수정할 수 있으며, 회원 탈퇴 및
          등록 정보·제출 서류의 삭제를 요청할 수 있습니다. 요청은 아래 문의처를 통해 접수
          가능하며, 회사는 관련 법령이 정한 기간 내에 조치합니다.
        </p>
      </Section>

      <Section title="7. 개인정보의 안전성 확보 조치">
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li>제출 서류는 비공개(Private) 저장소에 보관되며, 접근 권한이 있는 계정(해당 센터 본인 및 운영진)만 조회할 수 있습니다.</li>
          <li>서류 열람이 필요한 경우 유효시간이 제한된 임시 접근 링크를 통해서만 접근합니다.</li>
          <li>비밀번호는 암호화하여 저장합니다.</li>
        </ul>
      </Section>

      <Section title="8. 문의처">
        <p>
          개인정보 처리에 관한 문의, 열람·정정·삭제 요청은 서비스 내 안내된 연락처를 통해
          접수하실 수 있습니다.
        </p>
      </Section>

      <p className="text-xs text-neutral-400 mt-10">
        본 방침은 서비스 운영 초기 단계의 초안이며, 서비스 확장 및 법률 검토에 따라 내용이
        변경될 수 있습니다.
      </p>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-medium text-neutral-900 mb-2">{title}</h2>
      {children}
    </section>
  )
}
