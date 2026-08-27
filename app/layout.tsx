import type { Metadata } from "next";
import { JudgeShortcut } from "@/components/judge-shortcut";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DeepTrail — Evidence-first Web Research with WebMCP",
    template: "%s · DeepTrail",
  },
  description:
    "A local-first WebMCP workspace where humans and browser agents investigate the web together, challenge conclusions, and keep evidence, counterarguments, confidence changes, and decisions inspectable.",
  applicationName: "DeepTrail",
  keywords: ["WebMCP", "web research", "evidence", "AI agents", "decision making"],
  openGraph: {
    title: "DeepTrail — Evidence-first Web Research with WebMCP",
    description:
      "Humans and browser agents investigate the web together in one inspectable evidence workspace.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <JudgeShortcut />
      </body>
    </html>
  );
}
