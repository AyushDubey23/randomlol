import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics Portal | Hriday Bajaj",
  description: "Secure Visitor Analytics Portal for Hriday Bajaj Portfolio",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
