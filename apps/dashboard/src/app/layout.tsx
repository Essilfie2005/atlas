import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATLAS Dashboard',
  description: 'Manage your payments, payouts, and settlements with ATLAS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
