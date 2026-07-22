import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { processTextToJSON } from '../utils/aiOrchestrator';

chromium.use(stealthPlugin());

export const TARGET_URLS = [
  'https://vagasfloripa.com.br',
  'https://vagas.sc',
  'https://www.linkedin.com/jobs',
  'https://www.catho.com.br/vagas',
  'https://floripamaisempregos.com.br',
];

/**
 * Executa a varredura direcionada nos portais alvo focados na região da Grande Florianópolis.
 */
export async function runTargetedScraper(): Promise<void> {
  console.log('[Targeted Scraper] Iniciando varredura nos portais alvo...');
  const browser = await chromium.launch({ headless: true });

  for (const targetUrl of TARGET_URLS) {
    try {
      console.log(`[Targeted Scraper] Navegando para o portal: ${targetUrl}`);
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // Delay evasivo para simular acesso humano
      await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1500);

      const domain = new URL(targetUrl).hostname;
      let jobUrls: string[] = [];

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(2000);

        // Seletor modular dependendo do portal alvo
        switch (true) {
          case domain.includes('vagasfloripa'):
            jobUrls = await page.$$eval('a[href*="/vaga/"], a[href*="/oportunidade/"]', (links) =>
              links.map((a) => (a as HTMLAnchorElement).href)
            );
            break;

          case domain.includes('vagas.sc'):
            jobUrls = await page.$$eval('a[href*="/vaga/"], a[href*="/vagas/"]', (links) =>
              links.map((a) => (a as HTMLAnchorElement).href)
            );
            break;

          case domain.includes('linkedin'):
            jobUrls = await page.$$eval('a.base-card__full-link, a[href*="/jobs/view/"]', (links) =>
              links.map((a) => (a as HTMLAnchorElement).href)
            );
            break;

          case domain.includes('catho'):
            jobUrls = await page.$$eval('a[href*="/vaga/"]', (links) =>
              links.map((a) => (a as HTMLAnchorElement).href)
            );
            break;

          case domain.includes('floripamaisempregos'):
            jobUrls = await page.$$eval('a[href*="/vaga/"], a[href*="/emprego/"]', (links) =>
              links.map((a) => (a as HTMLAnchorElement).href)
            );
            break;

          default:
            jobUrls = await page.$$eval('a[href]', (links) =>
              links.map((a) => (a as HTMLAnchorElement).href).filter((h) => h.includes('vaga') || h.includes('job'))
            );
            break;
        }
      } catch (portalErr) {
        console.error(`[Targeted Scraper] Erro ao acessar a home do portal ${targetUrl}:`, portalErr);
      }

      // Filtrar URLs únicas
      const uniqueUrls = Array.from(new Set(jobUrls)).slice(0, 10);
      console.log(`[Targeted Scraper] ${uniqueUrls.length} vagas encontradas em ${domain}`);

      for (const jobUrl of uniqueUrls) {
        try {
          await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(Math.floor(Math.random() * 1500) + 1000);

          const bodyText = await page.evaluate(() => document.body.innerText || '');
          if (bodyText.length > 50) {
            console.log(`[Targeted Scraper] Processando vaga individual: ${jobUrl}`);
            await processTextToJSON(bodyText.substring(0, 4000), 'job');
          }
        } catch (jobErr) {
          console.error(`[Targeted Scraper] Erro ao extrair conteúdo da vaga ${jobUrl}:`, jobErr);
        }
      }

      await context.close();
    } catch (siteErr) {
      console.error(`[Targeted Scraper] Erro ao processar o portal ${targetUrl}:`, siteErr);
    }
  }

  await browser.close();
  console.log('[Targeted Scraper] Varredura nos portais alvo concluída.');
}

/**
 * Raspa o conteúdo HTML bruto de uma página específica.
 */
export async function scrapeJobPage(targetUrl: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    return await page.evaluate(() => document.body.innerHTML);
  } finally {
    await browser.close();
  }
}
