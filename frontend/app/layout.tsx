import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Summarizer",
  description: "Transcribe and summarize YouTube videos with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-nypl-gray-light text-nypl-gray" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
