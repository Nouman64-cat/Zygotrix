import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google"; // Using Google Fonts as requested for premium look
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Zygotrix AI | Biological Computing & Evolutionary Intelligence",
    template: "%s | Zygotrix AI",
  },
  description: "Zygotrix is the world's first biological AI engine. Harness the power of genetic algorithms, neural evolution, and self-adapting code to revolutionize your digital infrastructure.",
  keywords: ["AI", "Artificial Intelligence", "Genetic Algorithms", "Neural Evolution", "Machine Learning", "Biological Computing", "Zygotrix", "Tech", "SaaS", "Enterprise AI"],
  authors: [{ name: "Zygotrix AI Team" }],
  creator: "Zygotrix AI",
  publisher: "Zygotrix AI Inc.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zygotrix.ai",
    title: "Zygotrix AI | The Future of Biological Computing",
    description: "Experience the next evolution of artificial intelligence. Zygotrix combines biological principles with advanced computing to create self-healing, adapting systems.",
    siteName: "Zygotrix AI",
    images: [
      {
        url: "https://zygotrix.ai/og-image.jpg", // Placeholder
        width: 1200,
        height: 630,
        alt: "Zygotrix AI Hero Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zygotrix AI | Biological Computing & Evolutionary Intelligence",
    description: "Zygotrix is the world's first biological AI engine. Harness the power of genetic algorithms, neural evolution, and self-adapting code.",
    creator: "@zygotrix_ai",
    images: ["https://zygotrix.ai/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`antialiased text-slate-800 bg-white transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
