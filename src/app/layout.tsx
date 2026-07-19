import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traction — AI Business Partner",
  description: "Replace your consultant, coach, and agency with AI that delivers outcomes. Get actionable business insights in hours, not weeks.",
  keywords: ["Traction", "AI Business Consultant", "Business Analysis", "AI Consulting", "Revenue Optimization"],
  authors: [{ name: "Traction Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: "Traction — AI Business Partner",
    description: "Replace your consultant, coach, and agency with AI that delivers outcomes",
    siteName: "Traction",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
