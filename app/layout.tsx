import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Pizza Hut · Store Operations Command Center",
  description:
    "Predictive insights, explainable recommendations and executable plans for Pizza Hut store managers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
