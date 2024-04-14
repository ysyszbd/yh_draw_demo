/*
 * @LastEditTime: 2024-03-29 16:42:30
 * @Description:
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import postcssPx2Rem from "postcss-pxtorem";
import autoprefixer from "autoprefixer";
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'

export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  base: "./",
  plugins: [vue(), crossOriginIsolation()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "./src/style/index.scss";
        `,
        charset: false,
        javascriptEnabled: true,
      },
    },
    postcss: {
      plugins: [
        autoprefixer(),
        postcssPx2Rem({
          exclude: /node_modules/,
          mediaQuery: false,
          unitPrecision: 3,
          minPixelValue: 0,
          propList: ["*"],
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: "static/js/[name]-[hash].js",
        entryFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
});
