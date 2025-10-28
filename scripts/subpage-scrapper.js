const puppeteer = require('puppeteer-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');

// Aplica o plugin Stealth
puppeteer.use(stealthPlugin());

async function scrapeSubpage(url) {
  let browser = null;

  try {
    console.log(`🚀 Iniciando browser...`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    // Bloqueia recursos desnecessários
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    console.log(`🕸️ Scraping subpage: ${url}`);
    
    // Adiciona uma verificação para garantir que a URL é uma string
    if (typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error(`URL inválida ou não é uma string: ${url}`);
    }

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extrai texto limpo
    const content = await page.evaluate(() => {
      return document.documentElement.outerHTML;
    });

    await browser.close();

    return {
      json: {
        success: true,
        url,
        content,
        length: content.length,
        timestamp: new Date().toISOString(),
      }
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return {
      json: { 
        success: false, 
        url, 
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    };
  }
}

const url = $json.url;

return scrapeSubpage(url);