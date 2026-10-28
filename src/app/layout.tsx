import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "The School Expert | Registration",
  description: "Professional registration forms for The School Expert.",
    icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
