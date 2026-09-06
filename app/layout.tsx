import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "BMCH Medicine Education",
    template: "%s | BMCH Medicine Education",
  },
  description:
    "Internal clinical teaching resource library for the Department of Medicine, Bangladesh Medical College Hospital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen w-full max-w-[1240px] px-4 pb-12 sm:px-6 lg:px-8">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
