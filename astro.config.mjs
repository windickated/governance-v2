// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), react()],
  site: "https://governance.degenerousdao.com",
  devToolbar: {
    enabled: false
  }
});