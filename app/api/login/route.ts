import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.ADMIN_PASSWORD;
  const token = process.env.SESSION_TOKEN;

  if (!correct || !token) {
    return NextResponse.json({ error: "서버에 로그인 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }
  if (password !== correct) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("staff_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14일
  });
  return res;
}
