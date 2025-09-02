import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soya Excel - Feed Distribution Management System",
  description: "Professional soybean meal distribution management system for Soya Excel across Canada, USA & Spain",
  keywords: ["Soya Excel", "feed distribution", "soybean meal", "management system", "agriculture"],
  authors: [{ name: "Soya Excel" }],
  creator: "Soya Excel",
  publisher: "Soya Excel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1A1A',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid #4A4A4A',
            },
            success: {
              duration: 3000,
              style: {
                background: '#2D5016',
                border: '1px solid #4A7C59',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#DC2626',
                border: '1px solid #EF4444',
              },
            },
            loading: {
              style: {
                background: '#FFD700',
                color: '#1A1A1A',
                border: '1px solid #FFE55C',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
