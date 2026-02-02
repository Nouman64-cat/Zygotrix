import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "../components/Providers";
import Navbar from "../components/universal/Navbar";
import Footer from "../components/universal/Footer";

const axiforma = localFont({
    src: [
        {
            path: "../../public/fonts/Axiforma-Light.ttf",
            weight: "300",
            style: "normal",
        },
        {
            path: "../../public/fonts/Axiforma-Regular.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/Axiforma-Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/Axiforma-SemiBold.ttf",
            weight: "600",
            style: "normal",
        },
        {
            path: "../../public/fonts/Axiforma-Bold.ttf",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-axiforma",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL('https://zygotrix.com'),
    title: "Zygotrix - Genetics Intelligence Engine",
    description: "Uniting Mendelian ratios, polygenic scores, and expressive trait registries in a toolkit designed for the future of genetic research.",
    alternates: {
        canonical: './',
    },
    openGraph: {
        title: "Zygotrix - Genetics Intelligence Engine",
        description: "Uniting Mendelian ratios, polygenic scores, and expressive trait registries in a toolkit designed for the future of genetic research.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${axiforma.variable} antialiased font-sans`}
            >
                <Providers>
                    <div className="flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-grow">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
