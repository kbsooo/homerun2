import './globals.css'
import type { Metadata } from 'next'
import Providers from './components/Providers'

export const metadata: Metadata = {
  title: 'HOMERUN',
  description: '명지대학교 학생들을 위한 버스 정보 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
