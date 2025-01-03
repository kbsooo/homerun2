import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "HOMERUN",
  description: "homerun2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
