import type { Metadata } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "sonner"

const syne = Syne({ 
  subsets: ["latin"],
  variable: '--font-syne'
});

const dmMono = DM_Mono({ 
  subsets: ["latin"],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono'
});

export const metadata: Metadata = {
  title: 'YENTECH | Join the Crew, Lead the Campus',
  description: 'Apply to join YENTECH - the premier tech club on campus. Be part of something extraordinary.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmMono.variable} font-mono antialiased`}>
        {children}
        <Toaster theme="dark" position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
