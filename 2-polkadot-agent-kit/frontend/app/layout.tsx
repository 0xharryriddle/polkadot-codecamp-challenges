import type { Metadata } from 'next';
import './globals.css';
import '@luno-kit/ui/styles.css';
import Providers from '@/app/providers';

export const metadata: Metadata = {
  title: 'Polkadot Staking Agent | AI-Powered Nomination Pool Manager',
  description: 'AI-powered cross-chain application for managing Polkadot nomination pool staking operations using @polkadot-agent-kit',
  keywords: ['Polkadot', 'Staking', 'AI Agent', 'Nomination Pools', 'DeFi', 'Web3'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
