import fs from 'node:fs/promises';
import path from 'node:path';

const dataDir = path.resolve('public/data');
const cachePath = path.join(dataDir, '.translation-cache.vi.json');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

function buildQuery(word, entry) {
  const contextual = word.match(/^(.+?)\s*\((.+)\)$/);
  if (contextual) {
    return `${contextual[1]} (${contextual[2]})`;
  }
  if (entry?.pos) return `${word}`;
  return word;
}

function normalizeTranslation(value) {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .split(/[;,]/)[0]
    .replace(/\s+/g, ' ')
    .trim();
}

async function translate(query) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', 'vi');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', query);

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 cefr-translation-script',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const translated = payload?.[0]?.map((part) => part?.[0] ?? '').join('');
      const normalized = normalizeTranslation(translated);
      if (normalized) return normalized;
      throw new Error('empty translation');
    } catch (error) {
      lastError = error;
      await sleep(250 * attempt * attempt);
    }
  }
  throw lastError;
}

const files = (await fs.readdir(dataDir))
  .filter((file) => /^cefr-[a-z0-9]+\.json$/i.test(file))
  .sort();

const cache = await readJson(cachePath, {});
let translatedCount = 0;
let cacheHits = 0;

for (const file of files) {
  const fullPath = path.join(dataDir, file);
  const data = await readJson(fullPath);
  const words = Object.keys(data);

  console.log(`Translating ${file} (${words.length} entries)`);
  for (const word of words) {
    const query = buildQuery(word, data[word]);
    const cacheKey = `${word}\t${data[word]?.pos ?? ''}\t${query}`;

    if (cache[cacheKey]) {
      data[word].vi = cache[cacheKey];
      cacheHits += 1;
      continue;
    }

    const vi = await translate(query);
    cache[cacheKey] = vi;
    data[word].vi = vi;
    translatedCount += 1;

    if (translatedCount % 50 === 0) {
      await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
      console.log(`  translated ${translatedCount}, cache hits ${cacheHits}`);
    }
    await sleep(90);
  }

  await fs.writeFile(fullPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  console.log(`Saved ${file}`);
}

console.log(`Done. New translations: ${translatedCount}. Cache hits: ${cacheHits}.`);
