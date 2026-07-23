import emailjs from "@emailjs/browser";

type SendArgs = {
  toEmail: string;
  toName: string;
  link: string;
  counselorName: string;
  branch: string;
};

// EmailJS는 서버 없이 브라우저에서 바로 메일을 보낼 수 있는 서비스입니다.
// emailjs.com 에서 무료 계정을 만들고, Email Service(Gmail 등 연결)와
// Email Template을 만든 뒤 아래 3개 값을 Vercel 환경변수에 넣어주세요.
// - NEXT_PUBLIC_EMAILJS_SERVICE_ID
// - NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
// - NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
//
// 템플릿 안에서 아래 변수명을 그대로 사용하시면 됩니다:
// {{to_email}} {{to_name}} {{link}} {{counselor_name}} {{branch}}
export async function sendContractEmail(args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, error: "이메일 발송 설정(EmailJS 환경변수)이 아직 되어 있지 않습니다." };
  }

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: args.toEmail,
        to_name: args.toName,
        link: args.link,
        counselor_name: args.counselorName,
        branch: args.branch,
      },
      { publicKey }
    );
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return { ok: false, error: message };
  }
}
