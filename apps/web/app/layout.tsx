import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HeySalad OS',
  description: 'HeySalad OS global presence and office twin',
  icons: {
    icon: '/heysalad-launchericon-transparent-v2.png',
    shortcut: '/heysalad-launchericon-transparent-v2.png',
    apple: '/heysalad-launchericon-transparent-v2.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
