import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "비상비상 | 우리 가족 재난안전 습관",
  description:
    "재난 상황에서 지금 할 일을 확인하고, 가족과 안전 미션을 연습하는 재난안전 게이미피케이션 MVP입니다.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
