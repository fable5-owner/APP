// Bundles the game into ONE self-contained html file that opens by double-click (no server needed).
//   node the-compact/tools/build-single.mjs            -> the-compact/play.html (full document)
//   node the-compact/tools/build-single.mjs --fragment out.html   (body-only fragment for page hosts)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'compact-'));
const bundle = join(tmp, 'bundle.js');
execFileSync('npx', ['--yes', 'esbuild@0.25.5', join(root, 'js/main.js'), '--bundle', '--format=iife', '--target=es2020', `--outfile=${bundle}`, '--log-level=warning'], { stdio: 'inherit' });

const js = readFileSync(bundle, 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(root, 'css/style.css'), 'utf8');
const fonts = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;600&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@600;900&display=swap';
const dom = '<div id="app"></div><div class="loading" id="loading">THE COMPACT</div><div id="rotate">기기를 가로로 눕혀 주세요<br>PC 브라우저를 권장합니다</div>';
const body = `<link rel="stylesheet" href="${fonts}">\n<style>${css}</style>\n${dom}\n<script>window.COMPACT_NO_ART=true;</script>\n<script>${js}</script>`;

const i = process.argv.indexOf('--fragment');
if (i > 0) {
  writeFileSync(process.argv[i + 1], `<title>The Compact</title>\n${body}`);
  console.log('fragment written:', process.argv[i + 1]);
} else {
  const out = join(root, 'play.html');
  writeFileSync(out, `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Compact</title></head><body>\n${body}\n</body></html>\n`);
  console.log('written:', out);
}
