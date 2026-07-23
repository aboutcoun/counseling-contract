"use client";

export type ContractFields = {
  branch: string;
  counselor_name: string;
  counselor_level: string;
  counselor_signature: string | null;
  client_name: string;
  client_email: string;
  contact1_phone: string;
  contact1_relation: string;
  contact2_phone: string;
  contact2_relation: string;
  contact3_phone: string;
  contact3_relation: string;
  client_signature: string | null;
  submitted_at: string | null;
};

type Props = {
  data: ContractFields;
  mode: "client-edit" | "view";
  onContactChange?: (
    key: "contact1_phone" | "contact1_relation" | "contact2_phone" | "contact2_relation" | "contact3_phone" | "contact3_relation",
    value: string
  ) => void;
};

function Blank({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <span className="inline-block min-w-[3.5rem] border-b border-ink/50 px-1 text-center font-medium">
      {value || <span className="text-ink/30">{placeholder ?? "\u00A0"}</span>}
    </span>
  );
}

function ContactInput({
  value,
  onChange,
  placeholder,
  width = "w-24",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder: string;
  width?: string;
}) {
  if (!onChange) return <Blank value={value} />;
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${width} border-b border-ink/50 bg-transparent px-1 text-center outline-none focus:border-accent`}
    />
  );
}

function formatDate(iso: string | null) {
  if (!iso) return { y: "", m: "", d: "" };
  const dt = new Date(iso);
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1),
    d: String(dt.getDate()),
  };
}

export default function ContractDocument({ data, mode, onContactChange }: Props) {
  const editable = mode === "client-edit";
  const date = formatDate(data.submitted_at);

  return (
    <div className="mx-auto max-w-[720px] bg-white px-8 py-10 font-serif text-[15px] leading-7 text-ink shadow-sm print:shadow-none">
      <h1 className="mb-6 text-center text-xl font-bold tracking-wide">
        상담계약서( <Blank value={data.counselor_level} /> )
      </h1>

      <p className="mb-6">
        본 계약서는 상담자에 대한 배경정보, 전문상담 관계 및 절차, 상담자와 내담자의 권리 및 의무에 대한
        정보를 제공하고 귀하의 동의와 함께 상담자와 치료계약을 맺기 위한 목적으로 작성됩니다.
      </p>

      <h2 className="mb-2 mt-6 font-bold">상담자에 대한 배경 정보</h2>
      <p className="mb-6">
        상담자 <Blank value={data.counselor_name} />은 (사)한국상담심리학회의 학회원으로서 상담심리사{" "}
        <Blank value={data.counselor_level} /> 자격을 가지고 상담서비스를 제공합니다. 해당 자격의 취득
        기준은 한국상담심리학회 홈페이지(www.krcpa.or.kr)에서 확인할 수 있습니다. 또한 본 상담자의 자격과
        학력, 경력사항은 어바웃심리상담센터 홈페이지(aboutcounsel.com)에서 확인할 수 있습니다.
      </p>

      <h2 className="mb-2 mt-6 font-bold">상담에 대한 정보</h2>
      <h3 className="mb-1 font-semibold">상담의 목적과 효과</h3>
      <p className="mb-4">
        상담은 내담자가 삶을 진정으로 자기답게 살며 성장할 수 있도록 돕는 것입니다. 상담은 크게 두 가지
        과정으로 이루어집니다. 1) 나의 마음을 들여다보며 생각과 감정을 정리하는 과정, 2) 나에게 보다 좋은
        행동을 선택하고 시도해보는 과정입니다. 이러한 두 가지 과정에 내담자가 얼마나 성실하게 임하는지, 이
        과정을 상담자와 얼마나 협력하는지에 따라 상담의 효과는 크게 달라질 수 있습니다. 귀하는 상담자의
        상담 방식에 대해 언제든지 질문할 수 있는 권리가 있습니다.
      </p>
      <h3 className="mb-1 font-semibold">상담의 제한점</h3>
      <p className="mb-4">
        상담이 모든 문제에 대한 해결책을 제공하는 것은 아닙니다. 또한 상담자는 구체적인 행동이나 방법에
        대한 직접적인 지시를 하지는 않습니다. 하지만 상담을 통해 문제 해결 및 성장·발달을 할 수 있도록
        상담자가 함께 하겠습니다.
      </p>
      <h3 className="mb-1 font-semibold">상담의 잠재적 위험요소</h3>
      <p className="mb-6">
        상담 과정 중 다소 강렬한 감정을 경험할 수 있고 불편함을 느낄 수 있습니다. 하지만 이러한 과정을
        거치는 것은 자기 인식을 향상시키며 폭넓은 자기 수용을 돕는 과정입니다.
      </p>

      <h2 className="mb-2 mt-6 font-bold">상담자의 권리와 의무</h2>
      <h3 className="mb-1 font-semibold">상담자의 권리</h3>
      <ol className="mb-4 list-decimal space-y-1 pl-5">
        <li>상담자는 자신의 교육과 수련, 경험 등에 기초한 전문적인 서비스와 교육을 제공합니다.</li>
        <li>상담자는 상담에 대한 정당한 상담료를 청구할 수 있습니다.</li>
        <li>
          상담자는 자신의 능력의 한계나 개인적인 문제로 내담자를 적절하게 도와줄 수 없을 때 전문적 자문을
          구하거나 상담을 중단할 수 있습니다.
        </li>
        <li>
          상담실 내외에서 내담자로부터 언어적, 물리적, 성적 등의 폭력 및 위협을 당했을 경우 상담을 중단할
          수 있습니다.
        </li>
      </ol>
      <h3 className="mb-1 font-semibold">상담자의 의무</h3>
      <ol className="mb-2 list-decimal space-y-1 pl-5">
        <li>
          상담자는 자신의 전문적 능력 향상을 위해 정기적으로 자기점검 및 평가를 하고, 지도감독이나 전문적
          자문, 연수 및 교육을 받아야 합니다.
        </li>
        <li>상담자는 방음, 편안함, 주의집중 등을 고려하여 상담에 적합한 독립된 공간에서 상담을 제공합니다.</li>
        <li>
          상담자는 내담자에게 상담 관련 정보, 상담의 기대효과, 상담의 목표와 이점, 한계 등을 명확히
          알려야 합니다.
        </li>
        <li>
          상담자 개인의 사정, 예컨대 질병, 사망, 신체·정신적 장애 등의 이유로 상담자가 갑작스럽게 상담을
          지속할 수 없게 되는 경우, 어바웃에서 연락을 취하여 상담이 원활히 지속될 수 있도록 다른 상담자
          또는 다른 기관과 연계해 드릴 것입니다.
        </li>
        <li>상담자는 내담자에게 홍보에 활용하기 위한 소감문 작성이나 사진 촬영 등을 강요하지 않습니다.</li>
        <li>
          상담자는 내담자의 인적 사항과 상담내용에 대하여 비밀을 지켜 드릴 것을 약속합니다. 즉, 상담자는
          동의 없이는 상담 중 밝혀진 어떠한 내용에 대해서도 공개하지 않습니다.
        </li>
      </ol>
      <p className="mb-2">
        단, (사)한국상담심리학회의 윤리강령에 의거하여 비밀보장의 원칙이 제한되는 경우는 아래와
        같습니다(제5조 다항).
      </p>
      <div className="mb-6 space-y-2 border border-ink/30 p-4 text-[14px] leading-6">
        <p>
          내담자 자신이나 타인 및 사회의 안전을 위협하는 경우(자해, 가출, 자살예고, 살해위협 등), 동의
          없이 관련 전문인이나 사회에 알릴 수 있습니다.
        </p>
        <p>
          내담자가 감염성이 있는 치명적인 질병을 가지고 있다는 확실한 정보가 있는 경우, 관계 맺고 있는
          사람 중 그 질병에 위험한 수준으로 노출되어 있는 제3자에게 정보를 공개할 수 있습니다. 다만 공개
          전, 질병에 대해서 그 사람에게 이미 알렸는지, 아니면 스스로 알릴 의도가 있는지를 확인하게 됩니다.
        </p>
        <p>
          법적으로 상담정보가 요구되는 경우(범죄사실과 관련된 경우 등), 상담자는 내담자의 권익이 침해되지
          않도록 우선적으로 법원과 조율하고, 공개를 해야 하는 경우에는 내담자에게 정보 공개 여부를 먼저
          알리고 최소한의 정보만을 공개합니다.
        </p>
        <p>
          여러 전문가로 구성된 팀이 개입하는 경우(약물을 처방한 의사와 상담자가 함께 개입방법을 논의하는
          경우 등), 상담자는 내담자에게 다른 전문가들과의 협업을 알리고 내담자의 권익을 위해 필요한 상담
          정보를 다른 전문가와 논의하게 됩니다.
        </p>
      </div>

      <h2 className="mb-2 mt-6 font-bold">내담자의 권리와 의무</h2>
      <h3 className="mb-1 font-semibold">내담자의 권리</h3>
      <ol className="mb-4 list-decimal space-y-1 pl-5">
        <li>
          상담을 시작하기 전 상담자의 자격과 경력, 상담 비용과 지불 방식, 치료기간과 종결 시기, 비밀보호
          및 한계 등에 대해 안내를 받을 수 있습니다.
        </li>
        <li>
          내담자는 상담 계획에 참여할 권리를 가지고 상담 개입방식이나 활동을 거부할 수 있으며 그러한
          거부에 따른 결과에 대해 고지 받을 수 있습니다.
        </li>
        <li>
          상담 과정의 녹음과 녹화 가능성, 사례지도 및 교육에의 활용 가능성에 대한 안내를 받고 동의 또는
          거절을 할 수 있습니다.
        </li>
        <li>
          상담 서비스를 언제든지 종료할 수 있습니다. 또 종료 시에는 상담자와 종료 사유와 목표달성 여부를
          점검할 수 있습니다.
        </li>
      </ol>
      <h3 className="mb-1 font-semibold">내담자의 의무</h3>
      <ol className="mb-6 list-decimal space-y-1 pl-5">
        <li>효과적인 상담을 위해 상담 회기에 빠지지 않고 참석하도록 노력해야 합니다.</li>
        <li>상담 과정 중 자신의 생각, 감정, 행동 등에 대해 이야기하는 것이 필요합니다.</li>
        <li>
          상담자가 문제에 대한 정답이나 해결책을 제시해 주지 않는다는 점을 이해하고 상담과정에 적극적으로
          참여하도록 노력해야 합니다.
        </li>
        <li>상담자와의 관계에서 느껴지는 것들을 솔직하게 표현해보기 위해 노력해야 합니다.</li>
        <li>정해진 상담료를 지급해야 합니다.</li>
        <li>
          상담 과정을 기록(필기, 녹음 등)하길 원하는 경우, 기록의 목적과 용도에 대해 상담자와 합의한 후
          서면동의서를 작성해야 합니다.
        </li>
      </ol>

      <h2 className="mb-2 mt-6 font-bold">상담에서의 다중관계</h2>
      <p className="mb-6">
        상담과정 중 상담자는 전문적인 판단에 영향을 미칠 수 있는 다중 관계를 맺지 않을 것을 약속드립니다.
        다중 관계는 상담료 이외의 금전적, 물질적 거래 뿐 아니라 친구, 친인척, 연인 관계를 포함합니다.
        이에 따라 상담실 밖에서의 사적인 만남을 가질 수 없습니다.
      </p>

      <h2 className="mb-2 mt-6 font-bold">사무절차와 비용</h2>
      <h3 className="mb-1 font-semibold">상담기간 및 횟수</h3>
      <p className="mb-4">
        우리의 상담은 1주일에 1회, 매회 50분의 시간이 소요됩니다. 약속한 시간을 기준으로 시작하여 50분
        뒤에 마칩니다(예: 1시~1시50분). 만약, 귀하의 사유(예: 지각)로 상담을 늦게 시작하게 되더라도,
        끝나는 시간은 동일합니다.
      </p>
      <h3 className="mb-1 font-semibold">상담비 방침</h3>
      <p className="mb-4">
        1회기의 비용은 (1급: 100,000원/2급: 80,000원)이며 4회기 단위로 일괄 납부합니다. 납부된 비용에
        해당하는 회기를 모두 진행하지 못하고 종결하였을 경우 남은 회기에 대한 금액은 전액 환불됩니다.
        부득이한 경우 상담 시간을 변경하실 수 있습니다. 4회기 진행 중 일정 변경은 2회 가능하며, 일정 취소
        및 변경시에는 24시간 전까지 연락을 주셔야 합니다. 일정 변경이 2회를 초과하거나, 24시간 이내로
        취소 및 변경을 신청하실 경우 해당 회기에 대한 상담비가 차감됩니다.
      </p>
      <h3 className="mb-1 font-semibold">비상연락</h3>
      <p className="mb-6">
        상담 관계의 전문성과 비밀보장의 원칙을 고려하여 상담서비스는 약속된 상담 시간에만 제공됩니다.
        회기 사이에 전화, 이메일 등으로 별도의 연락을 하지 않는 것이 원칙입니다. 다만 자살에 대한 위험
        등의 긴급상황의 경우 아래 연락처로 연락하실 수 있습니다. 30분 이상 지속되는 통화에 대해서는
        상담료가 청구될 수 있으며, 상담료를 청구해야할 경우 상담자가 안내해드립니다. 상담자의 개인 사정으로
        전화를 받지 못할 수 있으며, 이럴 경우 문자를 남겨주시면 36시간 이내로 답변을 드리겠습니다.
        (비상연락처: 어바웃,{" "}
        <span className={data.branch === "안양점" ? "font-bold underline" : ""}>안양점:010-2497-8708</span>{" "}
        /{" "}
        <span className={data.branch === "수원점" ? "font-bold underline" : ""}>수원점: 010-7517-8708</span>)
      </p>

      <div className="my-10 border-2 border-ink px-6 py-8">
        <h2 className="mb-6 text-center text-lg font-bold">생명존중 서약서</h2>
        <ol className="mb-6 list-decimal space-y-3 pl-5">
          <li>
            나 <Blank value={data.client_name} />은 절대로 자살하지 않을 것이며, 자해나 자살을 시도하지
            않을 것을 서약합니다. 나는 자살하고 싶은 생각이 들면 반드시 아래 연락처의 사람에게 먼저
            연락할 것입니다. 만일 이 사람들에게 연락을 할 수 없으면 24시간 상담전화로 연락할 것입니다.
          </li>
          <li>나는 충분한 휴식과 수면을 취하고 잘 먹기 위해 노력할 것임을 서약합니다.</li>
          <li>나는 자살 할 수 있는 모든 도구를 없앨 것을 서약합니다.</li>
          <li>
            나는 삶의 위기를 인생의 한 부분으로 받아들이며, 어떠한 위기의 순간에도 내 생명을 지킬 것을
            서약합니다.
          </li>
        </ol>

        <div className="mb-6 space-y-2 bg-ink/[0.03] p-4 text-[14px]">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-medium">연락처1:</span> (번호){" "}
            <ContactInput
              value={data.contact1_phone}
              onChange={editable ? (v) => onContactChange?.("contact1_phone", v) : undefined}
              placeholder="010-0000-0000"
            />
            <span className="ml-2 font-medium">(관계)</span>{" "}
            <ContactInput
              value={data.contact1_relation}
              onChange={editable ? (v) => onContactChange?.("contact1_relation", v) : undefined}
              placeholder="예: 부모"
              width="w-20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-medium">연락처2:</span> (번호){" "}
            <ContactInput
              value={data.contact2_phone}
              onChange={editable ? (v) => onContactChange?.("contact2_phone", v) : undefined}
              placeholder="010-0000-0000"
            />
            <span className="ml-2 font-medium">(관계)</span>{" "}
            <ContactInput
              value={data.contact2_relation}
              onChange={editable ? (v) => onContactChange?.("contact2_relation", v) : undefined}
              placeholder="예: 배우자"
              width="w-20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-medium">연락처3:</span> (번호){" "}
            <ContactInput
              value={data.contact3_phone}
              onChange={editable ? (v) => onContactChange?.("contact3_phone", v) : undefined}
              placeholder="선택 입력"
            />
            <span className="ml-2 font-medium">(관계)</span>{" "}
            <ContactInput
              value={data.contact3_relation}
              onChange={editable ? (v) => onContactChange?.("contact3_relation", v) : undefined}
              placeholder="선택 입력"
              width="w-20"
            />
          </div>
          <p>24시간 상담전화 — 109(자살예방상담전화), 129(희망의 전화), 1588-9191(생명의 전화)</p>
        </div>

        <div className="flex justify-end">
          <span className="mr-2 font-medium">서약자:</span>
          <SignatureSlot dataUrl={data.client_signature} width={140} height={56} label="서약자 서명" />
        </div>
      </div>

      <h2 className="mb-2 mt-6 font-bold">정보에 근거한 동의</h2>
      <p className="mb-2">
        나는 앞에서 기술된 계약서를 읽고 이를 이해하였습니다. 이에 질문할 수 있는 기회가 있었으며, 위의
        계약서의 내용에 근거하여 전문적인 심리상담을 받는 것에 동의합니다.
      </p>
      <p className="mb-8 text-[14px] font-semibold italic">
        * 위의 생명존중서약서와 상담계약서에 서명하였음에도 자살이나 자해를 시도할 경우, 혹은 계약서의
        사항을 위반할 경우 상담계약을 파기하고 상담을 종결합니다.
      </p>

      <div className="mb-8 text-right">
        <Blank value={date.y} placeholder="20__" /> 년 <Blank value={date.m} placeholder="__" /> 월{" "}
        <Blank value={date.d} placeholder="__" /> 일
      </div>

      <div className="ml-auto flex w-fit flex-col gap-4">
        <div className="flex items-center justify-end gap-3">
          <span className="font-medium">내담자</span>
          <Blank value={data.client_name} />
          <SignatureSlot dataUrl={data.client_signature} width={140} height={56} label="내담자 서명" />
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className="font-medium">상담자</span>
          <Blank value={data.counselor_name} />
          <SignatureSlot dataUrl={data.counselor_signature} width={140} height={56} label="상담자 서명" />
        </div>
      </div>
    </div>
  );
}

function SignatureSlot({
  dataUrl,
  width,
  height,
  label,
}: {
  dataUrl: string | null;
  width: number;
  height: number;
  label: string;
}) {
  return (
    <span
      style={{ width, height }}
      className="flex items-center justify-center border-b border-ink/50"
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={label} style={{ height: height - 8, objectFit: "contain" }} />
      ) : (
        <span className="pb-1 text-xs text-ink/30">(서명)</span>
      )}
    </span>
  );
}
