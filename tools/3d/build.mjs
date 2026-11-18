// Bundles the hero scene and the parts of three.js it uses into one classic script.
// A classic script (not an ES module) also runs when index.html is opened straight from disk.
import * as esbuild from 'esbuild';

const options = {
  entryPoints: ['src/hero3d.js'],
  outfile: '../../js/hero3d.js',
  bundle: true,
  format: 'iife',
  target: 'es2019',
  minify: true,
  legalComments: 'none',
  banner: { js: '/* creatioo hero 3D. Built from tools/3d/src with three.js r178 (MIT, https://threejs.org). */' },
  logLevel: 'info'
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
