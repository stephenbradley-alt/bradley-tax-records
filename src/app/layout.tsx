import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Bradley Tax Records", description: "Private UK tax record keeping" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
