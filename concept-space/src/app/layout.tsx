import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concept Space",
  description: "A 3D interface for navigating many-dimensional concept space",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "#000008" }}>
        {children}
      </body>
    </html>
  );
}
