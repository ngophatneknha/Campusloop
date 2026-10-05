import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
export default defineConfig(({command}) => ({
  cacheDir: command === 'serve' ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
  plugins: [vinext(), cloudflare({viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false})],
}));
