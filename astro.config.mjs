// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://tubhyam.dev",
  output: "static",
  integrations: [
    react(),
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: {
        theme: "vesper",
      },
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'motion': ['motion', 'motion/react'],
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: "vesper",
    },
  },
});
