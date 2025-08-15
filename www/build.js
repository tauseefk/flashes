import { wasmLoader } from 'esbuild-plugin-wasm';
import alias from 'esbuild-plugin-alias';
import esbuild from 'esbuild';
import path from 'node:path';
import 'dotenv/config';

const __dirname = import.meta.dirname;

const isDevelopment = process.env.NODE_ENV === 'development';

const buildOptions = {
  logLevel: 'info',
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !isDevelopment,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  outdir: './dist',
  define: {
    SERVER_URL: JSON.stringify(process.env.SERVER_URL),
  },
  plugins: [
    wasmLoader(),
    alias({
      alias: {
        '@engine': path.join(__dirname, './engine'),
        '@pathfinder': path.join(__dirname, './pathfinder'),
      },
    }),
  ],
};

const run = async () => {
  try {
    const ctx = await esbuild.context(buildOptions);

    if (!isDevelopment) {
      await esbuild.build(buildOptions);
      console.log('Build complete');

      process.exit(0);
      return;
    }

    // DEV server
    await ctx.serve({
      cors: {
        origin: [process.env.LOCAL_NETWORK_ADDR, 'localhost'],
      },
      port: 8000,
      servedir: './dist',
    });
    await ctx.watch();
  } catch (e) {
    process.exit(1);
  }
};

run();
