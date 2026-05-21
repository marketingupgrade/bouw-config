import { defineConfig, devices } from "@playwright/test";

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    screenshot: "only-on-failure",
    trace: "off",
    launchOptions: {
      executablePath: CHROME,
      args: [
        "--no-sandbox",
        "--use-gl=swiftshader",
        "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
