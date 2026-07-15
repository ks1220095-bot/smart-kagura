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

    // Scan for image blocks common in WordPress
    $('.wp-block-image, .wp-block-gallery li, article img, .entry-content img, .post img').each((_, el) => {
      const img = $(el).is('img') ? $(el) : $(el).find('img');
      let src = img.attr('src') || img.attr('data-src') || '';
      
      // Resolve relative urls to absolute
      if (src && !src.startsWith('http') && !src.startsWith('//')) {
        try {
          src = new URL(src, url).href;
        } catch (e) {
          // ignore
        }
      }
      
      // Parse name from figcaption, alt tag, or adjacent text
      let name = '';
      const figcaption = $(el).find('figcaption').text().trim();
      if (figcaption) {
        name = figcaption;
      } else {
        name = img.attr('alt')?.trim() || '';
      }

      if (!name) {
        // Check next sibling texts
        const nextText = $(el).next().text().trim();
        if (nextText && nextText.length < 50) {
          name = nextText;
        }
      }

      // Clean up names
      name = name.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

      if (src && name && name.length < 100 && !src.includes('logo') && !src.includes('header') && !src.includes('footer')) {
        // Avoid duplicate matches
        if (!items.find(i => i.title === name)) {
          items.push({ title: name, imageUrl: src, type });
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
