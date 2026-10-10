import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "안심상담맵",
  description: "자격 검증을 통과한 심리상담센터를 지역별로 소개합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </body>
    </html>
  );
}
