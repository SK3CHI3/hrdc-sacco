import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KOPA SACCO - Premium Member Portal",
  description: "KOPA SACCO Management System - Professional Savings, Loans, and Financial Growth",
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
                  name: 'Alexis Support Agent',
                  welcomeText: 'Hi 👋, I\'m Alexis. How can I help you today?',
                  responseTimeText: 'We typically respond right away'
                },
                style: {
                  primaryColor: '#0f172a',
                  secondaryColor: '#1e293b',
                  position: 'right',
                  backgroundColor: '#ffffff',
                  fontColor: '#0f172a'
                }
              };
            `
          }}
        />
        <script src="https://cdn.jsdelivr.net/gh/shadrack-ago/n8n/widget.js?v=2.6" async type="text/javascript"></script>
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
