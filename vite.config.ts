import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
    env: {
      VITE_API_BASE_URL: "http://localhost:8000",
      VITE_CLINIC_ID: "55ad4fc1-a5ad-4ddb-bcfa-d76ab1df7375",
      VITE_ACTIVE_CLINIC_ID: "dhanvantari-001",
    },
  },
});
