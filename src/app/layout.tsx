import type { Metadata } from "next";
import "./globals.css"; 
import Header from "@/components/Header"; // Assuming you move Header.tsx to src/components

export const metadata: Metadata = {
  title: "What Do You Value?",
  description: "A tool to understand others better",
  viewport: 'width=device-width, initial-scale=1', // Add this line
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-800">
        <div className="min-h-screen max-w-5xl mx-auto">
            <Header />
            <main className="flex flex-col w-full max-w-4xl mx-auto p-4 mt-6">
                {children}
            </main>
        </div>
      </body>
    </html>
  );
}