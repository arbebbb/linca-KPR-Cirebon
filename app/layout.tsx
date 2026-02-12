import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "./providers"

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
})

export const metadata: Metadata = {
  title: "LINCA Dashboard - Tracking Progress KPR & Consumer Loan",
  description: "Dashboard untuk tracking progress aplikasi KPR dan Consumer Loan",
  keywords: ["LINCA", "Dashboard", "KPR", "Consumer Loan", "Progress Tracking"],
  authors: [{ name: "LINCA" }],
  openGraph: {
    title: "LINCA Dashboard",
    description: "Dashboard untuk tracking progress aplikasi KPR dan Consumer Loan",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={plusJakartaSans.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
