import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HomeRun',
  description: '명지대학교 학생들을 위한 버스 정보 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
