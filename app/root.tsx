import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { MotionConfig } from "motion/react";
import { LucideProvider } from "lucide-react";
import type { Route } from "./+types/root";
import TopBar from "~/components/TopBar";
import StatusBar from "~/components/StatusBar";
import Footer from "~/components/Footer";
import NotFoundView from "~/components/NotFoundView";
import "./app.css";
import monoLatin from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preload", href: monoLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];

// The boot sequence plays once per browser session; later page loads skip straight to the content.
const bootScript = `try{if(sessionStorage.getItem("bh-booted"))document.documentElement.classList.add("no-boot");else sessionStorage.setItem("bh-booted","1")}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#08090a" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-green focus:px-4 focus:py-2 focus:text-green-ink">
          Skip to content
        </a>
        {children}
        <div aria-hidden className="scanlines" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LucideProvider strokeWidth={1.75}>
        <TopBar />
        <main id="main" className="min-h-[70vh]">{children}</main>
        <Footer />
        <StatusBar />
      </LucideProvider>
    </MotionConfig>
  );
}

export default function App() {
  return <Shell><Outlet /></Shell>;
}

export function ErrorBoundary() {
  return <Shell><NotFoundView /></Shell>;
}
