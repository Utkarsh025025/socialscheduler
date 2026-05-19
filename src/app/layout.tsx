import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CreatorPost — AI Social Media Scheduler',
  description:
    'Schedule smarter. Grow faster. The AI-powered social media scheduler built for content creators and influencers.',
  keywords: ['social media scheduler', 'content creator', 'AI caption generator', 'Instagram scheduler'],
  openGraph: {
    title: 'CreatorPost',
    description: 'Schedule smarter. Grow faster.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f1f22',
              color: '#fff',
              border: '1px solid #3f3f46',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
