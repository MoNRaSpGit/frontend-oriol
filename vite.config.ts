import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isGithubPagesBuild = mode === "github-pages";
  const base = isGithubPagesBuild ? "/frontend-oriol/" : "/";

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        // El registro del service worker se hace a mano (ver
        // hooks/useServiceWorkerUpdate.ts) con `updateViaCache: 'none'` --
        // GitHub Pages sirve sw.js con Cache-Control: max-age=600, y sin
        // ese flag el navegador puede seguir viendo la version vieja del
        // service worker hasta que ese cache HTTP expire, aunque ya haya
        // un deploy nuevo. El registro automatico del plugin no permite
        // pasar esa opcion, por eso se desactiva aca.
        injectRegister: false,
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Agro Insumos",
          short_name: "Agro Insumos",
          description: "Sistema de facturacion y stock -- Agro Insumos",
          lang: "es-UY",
          theme_color: "#16233b",
          background_color: "#f4f6f9",
          display: "standalone",
          start_url: base,
          scope: base,
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
          ]
        },
        workbox: {
          // La API siempre va directo a la red -- no tiene sentido cachear
          // datos de stock/ventas/etc. Solo se cachea el shell de la app.
          navigateFallbackDenylist: [/^\/api\//],
          // Clave para que la actualizacion funcione con varias
          // pestanas/PWA abiertas a la vez: clientsClaim hace que el
          // worker nuevo tome control de todas apenas se activa, asi el
          // listener de "controlling" en useServiceWorkerUpdate.ts se
          // dispara en todas y cada una se recarga sola. (No se activa
          // junto con skipWaiting: eso aplicaria la actualizacion sin
          // pedir confirmacion, y aca el aviso al usuario es intencional.)
          clientsClaim: true
        }
      })
    ],
    server: {
      port: 5196,
      strictPort: true
    }
  };
});
