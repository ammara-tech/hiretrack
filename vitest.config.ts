import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests (npm test). They live in tests/ and check the logic that doesn't need Firebase:
// moving jobs between stages, reminders, interview prep, documents, stats, the CSV file and
// reading saved data.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
