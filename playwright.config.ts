import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
 testDir:'./e2e',
 fullyParallel:false,
 retries:0,
 workers:1,
 timeout:120_000,
 expect:{timeout:15_000},
 use:{
  baseURL:'http://127.0.0.1:4174',
  trace:'retain-on-failure',
  screenshot:'only-on-failure',
  video:'retain-on-failure',
 },
 projects:[
  {name:'desktop-chrome',testMatch:/reader-continuous\.spec\.ts/,use:{...devices['Desktop Chrome']}},
  {name:'mobile-portrait',testMatch:/reader-mobile\.spec\.ts/,grepInvert:/@landscape/,use:{...devices['Pixel 5']}},
  {name:'mobile-landscape',testMatch:/reader-mobile\.spec\.ts/,grep:/@landscape/,use:{...devices['Pixel 5 landscape']}},
 ],
 webServer:[
  {
   command:'npx tsx e2e/start-server.ts',
   url:'http://127.0.0.1:3100/api/health',
   reuseExistingServer:false,
   timeout:120_000,
  },
  {
   command:'set API_PORT=3100&& npx vite --host 127.0.0.1 --port 4174 --strictPort',
   url:'http://127.0.0.1:4174',
   reuseExistingServer:false,
   timeout:120_000,
  },
 ],
});
