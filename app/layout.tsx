import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ElevenLabsWidget } from "@/components/ElevenLabsWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRDC SACCO - Member Portal",
  description: "HRDC SACCO Management System - Savings, Loans, and Member Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ChatWidgetConfig = {
                webhook: {
                  url: 'https://agents.customcx.com/webhook/4091fa09-fb9a-4039-9411-7104d213f601/chat',
                  route: 'general'
                },
                branding: {
                  logo: 'https://t4.ftcdn.net/jpg/01/40/37/27/360_F_140372778_t5pCMkpioaa3MDXvXy17S9yq1pdGI6V2.jpg',
                  name: 'CustomCX Agent',
                  welcomeText: 'Hi 👋, how can we help?',
                  responseTimeText: 'We typically respond right away'
                },
                style: {
                  primaryColor: '#854fff',
                  secondaryColor: '#6b3fd4',
                  position: 'right',
                  backgroundColor: '#ffffff',
                  fontColor: '#333333'
                }
              };
            `
          }}
        />
        <script src="https://cdn.jsdelivr.net/gh/shadrack-ago/n8n/widget.js?v=2.6" async type="text/javascript"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ElevenLabsWidget agentId="agent_6401kgq5n0n8f6885h7xh4cp96me" />
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
      </body>
    </html>
  );
}
