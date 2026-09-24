import { wasmLoader } from 'esbuild-plugin-wasm';
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
  alias: {
    '@engine': path.join(__dirname, './engine'),
    '@pathfinder': path.join(__dirname, './pathfinder'),
  },
  plugins: [wasmLoader()],
};

const run = async () => {
  let ctx;
  try {
    if (!isDevelopment) {
      await esbuild.build(buildOptions);
      console.log('Build complete');
      return;
    }

    ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    await ctx.serve({
      cors: {
        origin: [process.env.LOCAL_NETWORK_ADDR, 'localhost'].filter(Boolean),
      },
      port: Number(process.env.PORT ?? 8000),
      servedir: './dist',
    });

    const stop = () => ctx.dispose();
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (e) {
    console.error(e);
    await ctx?.dispose();
    process.exitCode = 1;
  }
};

run();
