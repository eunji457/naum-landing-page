import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NAUM 가입쿠폰팩',
  description:
    '신규 회원에게 50%, 20%, 10% 쿠폰팩을 즉시 발급하는 회원가입 전환 페이지입니다.',
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
