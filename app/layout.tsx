import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "어바웃심리상담센터 | 온라인 상담계약서",
  description: "어바웃심리상담센터 비대면 상담계약서 · 생명존중서약서 전자서명",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
