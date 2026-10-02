import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Analytics",
  description: "Private portfolio analytics dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
