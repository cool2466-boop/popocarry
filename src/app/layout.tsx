import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PopoCarry | 글로벌 P2P 핸드캐리 플랫폼',
  description: 'Grabr 벤치마크 P2P 글로벌 직송 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased bg-[#FDFDFD] text-slate-900">{children}</body>
    </html>
  );
}