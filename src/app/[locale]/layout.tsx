import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Dubverse — AI Video Dubbing",
  description: "Dub any video into any language with AI. Upload your video or paste a YouTube link and get a professionally dubbed version in minutes.",
  keywords: ["video dubbing", "AI dubbing", "video translation", "YouTube dubbing"],
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();


  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <body className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased selection:bg-violet-500/30`}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
