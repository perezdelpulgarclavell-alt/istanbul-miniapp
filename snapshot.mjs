
// scripts/snapshot.mjs: crea assets/snapshot.html y assets/precache-list.js a partir de SNAPSHOT_URL
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = projectRoot;
const SNAPSHOT_URL = process.env.SNAPSHOT_URL;
if (!SNAPSHOT_URL) throw new Error('SNAPSHOT_URL env var is required');

async function fetchText(url){
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  return await res.text();
}
const absolutize = (u, base) => { try { return new URL(u, base).href; } catch { return u; } };

async function main(){
  console.log('[snapshot] Fetching', SNAPSHOT_URL);
  const html = await fetchText(SNAPSHOT_URL);
  const $ = cheerio.load(html);

  const candidates = ['main', 'article', '#content', '.entry-content', '.post-content', '.container', 'body'];
  let $root;
  for (const sel of candidates){
    const el = $(sel).first();
    if (el && el.length && el.text().trim().length > 120){ $root = el; break; }
  }
  if (!$root) $root = $('body');

  // limpiar scripts/iframes
  $root.find('script, noscript, iframe').remove();

  // absolutizar recursos
  $root.find('img').each((_, el)=>{
    const src = $(el).attr('src');
    if (src) $(el).attr('src', absolutize(src, SNAPSHOT_URL));
    const srcset = $(el).attr('srcset');
    if (srcset) {
      const items = srcset.split(',').map(s=>{
        const [u, d] = s.trim().split(' ');
        return `${absolutize(u, SNAPSHOT_URL)} ${d||''}`.trim();
      });
      $(el).attr('srcset', items.join(', '));
    }
  });
  $root.find('a').each((_, el)=>{
    const href = $(el).attr('href');
    if (href) $(el).attr('href', absolutize(href, SNAPSHOT_URL));
  });

  // recoger imágenes
  const imgSet = new Set();
  $root.find('img').each((_, el)=>{
    const src = $(el).attr('src');
    if (src) imgSet.add(src);
    const srcset = $(el).attr('srcset');
    if (srcset) srcset.split(',').forEach(item=>{
      const u = item.trim().split(' ')[0];
      if (u) imgSet.add(u);
    });
  });

  const snapshotHtml = `<!doctype html><meta charset="utf-8"><title>Snapshot</title>` + $root.html();
  fs.writeFileSync(path.join(publicDir, 'assets/snapshot.html'), snapshotHtml, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'assets/precache-list.js'), `self.__SNAP_IMAGES = ${JSON.stringify([...imgSet], null, 2)};`, 'utf-8');
  console.log(`[snapshot] Wrote snapshot, images: ${imgSet.size}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
