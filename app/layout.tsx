import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Inter({
	subsets: ["latin"],
	preload: true,
	weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Excel autocorrector",
	description: "Aplicación web para corregir errores en archivos de Excel.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${fontSans.className} antialiased bg-muted`}>
				{children}

				<Toaster position="top-center" />
			</body>
		</html>
	);
}
