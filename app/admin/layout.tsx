import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | Hriday Bajaj",
  description: "Secure Content Management Portal for Hriday Bajaj Portfolio",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
