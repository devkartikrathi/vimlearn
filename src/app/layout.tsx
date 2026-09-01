import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://vimlearn.local"),
  title: {
    default: "VimLearn — learn Vim by pressing the keys",
    template: "%s — VimLearn",
  },
  description:
    "An interactive Vim course. 50+ lessons of motions, operators, text objects and visual mode, drilled in a real modal editor until they stick.",
  keywords: [
    "vim", "learn vim", "vim tutorial", "vim motions", "text objects",
    "interactive vim", "vim practice", "vim for beginners",
  ],
};

/** Set the theme before first paint so the page never flashes the wrong one. */
const themeScript = `
try {
  var stored = localStorage.getItem("vimlearn.theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
