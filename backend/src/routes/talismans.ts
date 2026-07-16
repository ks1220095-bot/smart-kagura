import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

interface TalismanItem {
  title: string;
  imageUrl: string;
  type: 'ofuda' | 'omamori';
}

// Memory Cache to prevent repeated heavy scraping requests
let cacheData: TalismanItem[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // Cache for 24 hours

// Fallback data in case website structure changes or fetches fail
const FALLBACK_DATA: TalismanItem[] = [
  { title: '清瀧神社 御札 (木札)', imageUrl: '/talisman_list.jpg', type: 'ofuda' },
  { title: '清瀧神社 御札 (紙札)', imageUrl: '/talisman_list.jpg', type: 'ofuda' },
  { title: '交通安全守', imageUrl: '/talisman_list.jpg', type: 'omamori' },
  { title: '厄除守', imageUrl: '/talisman_list.jpg', type: 'omamori' },
  { title: '安産守', imageUrl: '/talisman_list.jpg', type: 'omamori' },
  { title: '健康守', imageUrl: '/talisman_list.jpg', type: 'omamori' }
];

function cleanTitle(col: cheerio.Cheerio<any>, img: cheerio.Cheerio<any>): string {
  const cloned = col.clone();
  
  const ruby = cloned.find('ruby').first();
  if (ruby.length > 0) {
    ruby.find('rt, rp').remove();
    const rubyText = ruby.text().trim();
    if (rubyText) {
      const parent = ruby.parent();
      parent.find('rt, rp').remove();
      parent.find('br').before('|||');
      const parentParts = parent.text().split('|||')[0].trim();
      if (parentParts && parentParts.length < 25) {
        return parentParts;
      }
      return rubyText;
    }
  }
  
  cloned.find('rt, rp').remove();
  let titleEl = cloned.find('strong, h3, h4, h5, p').first();
  if (titleEl.length > 0) {
    titleEl.find('br').before('|||');
    let txt = titleEl.text();
    let firstPart = txt.split('|||')[0].trim();
    if (firstPart && firstPart.length < 25) {
      return firstPart;
    }
  }
  
  return img.attr('alt')?.trim() || '';
}

async function scrapeCategory(url: string, type: 'ofuda' | 'omamori'): Promise<TalismanItem[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    const $ = cheerio.load(response.data);
    const items: TalismanItem[] = [];

    $('.wp-block-column').each((_, el) => {
      const col = $(el);
      const img = col.find('img').first();
      if (img.length === 0) return;
      
      let src = img.attr('src') || img.attr('data-src') || '';
      if (!src || src.includes('logo') || src.includes('header') || src.includes('footer')) return;
      
      if (src && !src.startsWith('http') && !src.startsWith('//')) {
        try {
          src = new URL(src, url).href;
        } catch (e) {
          // ignore
        }
      }
      
      const title = cleanTitle(col, img);
      
      if (src && title && title.length < 100) {
        if (!items.find(i => i.title === title)) {
          items.push({ title, imageUrl: src, type });
        }
      }
    });

    return items;
  } catch (error) {
    console.error(`Scraping failed for type ${type} at ${url}:`, error);
    return [];
  }
}

router.get('/', async (req, res) => {
  const forceSync = req.query.sync === 'true';
  const now = Date.now();

  if (cacheData && (now - lastCacheTime < CACHE_DURATION) && !forceSync) {
    return res.json(cacheData);
  }

  try {
    const [ofudas, omamoris] = await Promise.all([
      scrapeCategory('https://seiryuujinja.com/jyuyohin/ofuda/', 'ofuda'),
      scrapeCategory('https://seiryuujinja.com/jyuyohin/omamori/', 'omamori')
    ]);

    const combined = [...ofudas, ...omamoris];
    
    if (combined.length > 0) {
      cacheData = combined;
      lastCacheTime = now;
      console.log(`[Scraping Service] Successfully synced ${combined.length} talismans from official site.`);
      return res.json(combined);
    } else {
      console.warn('[Scraping Service] Scraped empty list, serving fallback talismans.');
      return res.json(cacheData || FALLBACK_DATA);
    }
  } catch (error) {
    console.error('[Scraping Service] Web scraping request failed, serving fallback:', error);
    return res.json(cacheData || FALLBACK_DATA);
  }
});

export default router;
