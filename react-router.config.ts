import type { Config } from "@react-router/dev/config";

// Static site: every route is prerendered to HTML at build time.
export default {
  ssr: false,
  prerender: true,
} satisfies Config;
