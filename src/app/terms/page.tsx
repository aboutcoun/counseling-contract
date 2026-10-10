export const metadata = { title: '이용약관 | 안심상담맵' }

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 pb-16 text-sm leading-relaxed text-neutral-700">
      <h1 className="text-xl font-medium text-neutral-900 mb-1">안심상담맵 이용약관</h1>
      <p className="text-xs text-neutral-400 mb-8">시행일: 2026년 8월 19일</p>

      <Section title="제1조 (목적)">
        <p>
          이 약관은 안심상담맵(이하 &quot;회사&quot;)이 제공하는 심리상담센터 정보 큐레이션 서비스(이하
          &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타
          필요한 사항을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (정의)">
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li>&quot;서비스&quot;란 회사가 운영하는 웹사이트를 통해 제공하는 심리상담센터 정보 제공 및 검색 서비스를 말합니다.</li>
          <li>&quot;이용자&quot;란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 일반 방문자 및 센터 회원을 말합니다.</li>
          <li>&quot;센터 회원&quot;이란 자신이 운영·소속된 심리상담센터 정보를 등록하고, 자격 인증을 신청할 수 있는 계정을 보유한 이용자를 말합니다.</li>
          <li>
            &quot;인증 배지&quot;란 센터 회원이 제출한 자격증·학위증명서 등 서류를 회사가 자체
            기준에 따라 확인한 후 부여하는 표시로, 정부기관·학회 등 제3의 공인기관이 발급하는
            공식 인증과는 구별됩니다.
          </li>
        </ul>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <p>
          이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이
          발생합니다. 회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있으며,
          개정 시 적용일자 및 개정사유를 명시하여 사전 공지합니다.
        </p>
      </Section>

      <Section title="제4조 (서비스의 내용)">
        <p>회사는 다음과 같은 서비스를 제공합니다.</p>
        <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
          <li>지역별 심리상담센터 정보(위치, 연락처, 운영시간, 프로그램 및 비용 등) 제공</li>
          <li>센터 운영자의 자격 서류 제출 및 자체 인증 심사</li>
          <li>인증 결과에 따른 인증 배지 표시</li>
          <li>지도 기반 센터 검색 및 필터링</li>
        </ul>
      </Section>

      <Section title="제5조 (정보의 출처 및 정확성)">
        <p>
          서비스에 표시되는 센터 정보 중 일부는 보건복지부·한국사회보장정보원 등이 공개한
          공공데이터(정신건강심리상담바우처 제공기관 목록 등)를 기초로 하며, 일부는 센터 회원이
          직접 입력·수정합니다. 회사는 정보의 최신성을 위해 노력하나, 각 정보의 정확성에 대한
          최종 책임은 해당 정보를 제공한 센터 또는 원 데이터 출처에 있으며, 회사는 이로 인해
          발생한 손해에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="제6조 (인증 배지의 의미와 한계)">
        <p>
          인증 배지는 회사가 자체적으로 정한 기준(제출 서류 확인)에 따라 부여하는 표시이며,
          국가, 지방자치단체, 관련 학회 등이 공식적으로 발급·보증하는 자격이나 인증이 아닙니다.
          이용자는 인증 배지가 특정 센터 또는 상담사의 상담 역량, 상담 결과를 보장하지 않는다는
          점을 이해하고 이용하여야 합니다.
        </p>
      </Section>

      <Section title="제7조 (센터 회원의 의무)">
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li>센터 회원은 등록하는 모든 정보가 사실에 부합하도록 하여야 합니다.</li>
          <li>제출하는 자격증, 사업자등록증 등 서류는 본인 또는 정당한 권한이 있는 자의 것이어야 합니다.</li>
          <li>허위 정보 등록, 타인의 자격증 도용 등이 확인될 경우 회사는 사전 통지 없이 인증을 취소하거나 등록을 삭제할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제8조 (지식재산권)">
        <p>
          서비스 화면 구성, 로고, 디자인 등에 대한 저작권 및 지식재산권은 회사에 귀속됩니다.
          센터 회원이 직접 등록한 텍스트, 이미지, 링크 등의 권리는 해당 회원에게 있으며,
          회원은 회사가 서비스 운영 목적 범위 내에서 이를 사용하는 것에 동의합니다.
        </p>
      </Section>

      <Section title="제9조 (면책조항)">
        <p>
          회사는 천재지변, 정전, 통신장애 등 불가항력으로 인한 서비스 제공 중단에 대해 책임을
          지지 않습니다. 회사는 이용자 간 또는 이용자와 센터 간에 발생한 상담 계약, 상담 진행,
          비용 정산 등 실제 상담 이용과 관련된 분쟁에 개입하지 않으며, 이에 대한 책임을 지지
          않습니다.
        </p>
      </Section>

      <Section title="제10조 (준거법 및 관할)">
        <p>
          이 약관과 관련하여 회사와 이용자 간 발생한 분쟁에는 대한민국 법을 적용하며, 관할
          법원은 민사소송법에 따른 관할 법원으로 합니다.
        </p>
      </Section>

      <p className="text-xs text-neutral-400 mt-10">
        본 약관은 서비스 운영 초기 단계의 초안이며, 서비스 확장 및 법률 검토에 따라 내용이
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
