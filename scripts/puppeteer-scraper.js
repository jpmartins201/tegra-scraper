
const puppeteer = require('puppeteer-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');

// Aplica o plugin Stealth
puppeteer.use(stealthPlugin());

async function scrapePage(urlToScrape) {
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

    console.log(`🕸️ Acessando página: ${urlToScrape}`);
    await page.goto(urlToScrape, { waitUntil: 'networkidle2' });

    // 1. Verificação de CAPTCHA (baseada no HTML bruto)
    const pageContent = await page.content();
    if (pageContent.toLowerCase().includes('captcha') || pageContent.toLowerCase().includes('are you a robot')) {
      return { success: false, url: urlToScrape, content: null, links: [], error: 'Captcha detectado' };
    }

    // 2. Extração de Dados (via page.evaluate)
    // 'a.href' dentro do evaluate() retorna o link ABSOLUTO.
    const result = await page.evaluate(() => {
      // Extrai o texto limpo
      const content = document.documentElement.outerHTML;
      
      // Extrai links, garante que são únicos e pega os 10 primeiros
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      const uniqueAbsoluteLinks = [...new Set(
        allLinks
          .map(a => a.href) 
          .filter(href => href.startsWith('http')) 
      )];
      
      const links = uniqueAbsoluteLinks.slice(0, 10);

      return { content, links };
    });

    // 3. Verificações de Sucesso (baseadas no 'result')
    if (!result.content || result.content.length < 50) {
      return { success: false, url: urlToScrape, content: result.content, links: result.links, error: 'Conteúdo não encontrado ou muito curto' };
    }

    if (result.links.length === 0) {
      return { success: false, url: urlToScrape, content: result.content, links: result.links, error: 'Nenhum hyperlink encontrado' };
    }

    return {
      success: true,
      url: urlToScrape,
      content: result.content,
      links: result.links,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`❌ Erro no scrape: ${error.message}`);
    return {
      success: false,
      url: urlToScrape,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    if (browser) {
      console.log(`🔒 Fechando browser...`);
      await browser.close();
    }
  }
}

const url = $input.first().json.url

if (!url) {
  return { json: { success: false, error: "Nenhuma 'url' fornecida no input do Webhook." } };
}

const output = await scrapePage(url);

return { json: output };