import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "LyneImob — Gestão Imobiliária Inteligente",
    template: "%s | LyneImob",
  },
  description:
    "Plataforma de gestão imobiliária com IA integrada para corretores e imobiliárias. Gerencie imóveis, clientes, negócios e loteamentos com inteligência artificial.",
  keywords: [
    "gestão imobiliária",
    "CRM imobiliário",
    "IA imobiliária",
    "corretores de imóveis",
    "imobiliária",
    "loteamentos",
  ],
  authors: [{ name: "Lynedesk" }],
  creator: "Lynedesk",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  // Icons descobertos automaticamente do app/icon.png e app/apple-icon.png
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "LyneImob",
    title: "LyneImob — Gestão Imobiliária Inteligente",
    description:
      "Plataforma de gestão imobiliária com IA integrada para corretores e imobiliárias.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
