import type { Metadata, Viewport } from "next";
import { AlertProvider } from "@/lib/alert-context";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#8B0000",
};

export const metadata: Metadata = {
  title: "비상비상 | 우리 가족 재난안전 습관",
  description:
    "재난 상황에서 지금 할 일을 확인하고, 가족과 안전 미션을 연습하는 재난안전 게이미피케이션 MVP입니다.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "비상비상 위기모드",
  },
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
      <head>
        <meta name="theme-color" content="#8B0000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,600&family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,600;8..144,700;8..144,800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <AlertProvider>{children}</AlertProvider>
      </body>
    </html>
  );
}
