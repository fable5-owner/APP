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
const fonts = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@600;900&display=swap';
const tokens = ':root{--ink:#2b1d10;--gold:#d8b25e;--gold2:#f3d98f;--leather:#2a1b11;--leather2:#1a110a;--paper:#e9dcb8;color-scheme:dark}#loading{position:absolute;inset:0;background:#140d07;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;color:#d8b25e;font-family:Cinzel,serif;letter-spacing:6px;z-index:99}#loading small{font-family:"Noto Sans KR",sans-serif;letter-spacing:0;color:#9a8a68;font-size:14px}body{background:#140d07}';
const dom = '<div id="stage"><canvas id="bg" class="dim"></canvas><div id="screen"></div><div id="loading"><div style="font-size:34px">THE COMPACT</div><small>세계 지도를 그리는 중…</small></div></div><div id="rotate">📱↻<br>가로 화면에서 플레이해 주세요<br><small style="opacity:.7">PC 또는 가로로 눕힌 태블릿을 권장합니다</small></div>';
const body = `<link rel="stylesheet" href="${fonts}">\n<style>${tokens}\n${css}</style>\n${dom}\n<script>window.COMPACT_NO_ART=true;</script>\n<script>${js}</script>`;

const i = process.argv.indexOf('--fragment');
if (i > 0) {
  writeFileSync(process.argv[i + 1], `<title>The Compact</title>\n${body}`);
  console.log('fragment written:', process.argv[i + 1]);
} else {
  const out = join(root, 'play.html');
  writeFileSync(out, `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Compact</title></head><body>\n${body}\n</body></html>\n`);
  console.log('written:', out);
}
