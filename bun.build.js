import html from 'bun-plugin-html';

await Bun.build({
  entrypoints: ['./public/index.html'],
  outdir: './build',  // Specify the output directory
  plugins: [
    html()
  ],
});
