import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life Store - Idle RPG Farm Game',
  description: 'Trồng trọt, chế dược, quản lý nhân viên RPG và chợ P2P thời gian thực.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
