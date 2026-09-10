import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: './',
  // The standalone preview uses mock extension APIs without renaming sources.
  resolve: command === 'serve' ? {
    alias: [{ find: /^\.\.\/modules\//, replacement: '../modules-dev/' }]
  } : undefined,
  build: {
    outDir: 'build',
    target: ['chrome121', 'firefox128'],
    assetsInlineLimit: 0,
    modulePreload: false
  }
}));
