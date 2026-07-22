import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { processTextToJSON } from '../utils/aiOrchestrator';

// Injeção da extensão stealth no Playwright
chromium.use(stealthPlugin());

/**
 * Extrator dedicado para o portal VagasFloripa (vagasfloripa.com.br)
 */
export async function scrapeVagasFloripa(browser: any): Promise<void> {
  console.log('[Scraper - VagasFloripa] Iniciando Fase 1: Descoberta de links recentes...');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // Fase A: Navegar até a página principal com timeout curto e tolerância a redirecionamento
    await page
      .goto('https://vagasfloripa.com.br', { waitUntil: 'commit', timeout: 15000 })
      .catch(() => console.log('[Scraper - VagasFloripa] Timeout ignorado na Home, tentando extração parcial...'));
    
    await page.waitForTimeout(2000);

    // Fase B & C: Extrair links das 10 vagas mais recentes
    const rawLinks = await page.$$eval('a[href*="/vaga/"], a[href*="/oportunidade/"]', (anchors: any[]) =>
      anchors.map((a) => a.href)
    );

    const jobLinks = Array.from(new Set(rawLinks)).slice(0, 10);
    console.log(`[Scraper - VagasFloripa] ${jobLinks.length} vagas recentes identificadas.`);

    // Fase D: Iteração e extração do conteúdo de cada vaga
    for (const link of jobLinks) {
      try {
        console.log(`[Scraper - VagasFloripa] Extraindo vaga: ${link}`);
        await page
          .goto(link, { waitUntil: 'commit', timeout: 15000 })
          .catch(() => console.log('[Scraper] Timeout ignorado, tentando extrair texto parcial...'));
        
        // Evasão de rate-limit
        await page.waitForTimeout(2000);

        const bodyText = await page.evaluate(() => document.body.innerText || '');
        if (bodyText.length > 50) {
          await processTextToJSON(bodyText.substring(0, 4000), 'job');
        }
      } catch (linkErr) {
        console.error(`[Scraper - VagasFloripa] Falha ao extrair vaga (${link}):`, linkErr);
      }
    }
  } catch (portalErr) {
    console.error('[Scraper - VagasFloripa] Erro na Fase de Descoberta:', portalErr);
  } finally {
    await context.close();
  }
}

/**
 * Extrator dedicado para o portal Vagas.SC (vagas.sc)
 */
export async function scrapeVagasSC(browser: any): Promise<void> {
  console.log('[Scraper - Vagas.SC] Iniciando Fase 1: Descoberta de links recentes...');
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // Fase A: Navegar até a página principal
    await page
      .goto('https://vagas.sc', { waitUntil: 'commit', timeout: 15000 })
      .catch(() => console.log('[Scraper - Vagas.SC] Timeout ignorado na Home, tentando extração parcial...'));
    
    await page.waitForTimeout(2000);

    // Fase B & C: Extrair links das 10 vagas mais recentes
    const rawLinks = await page.$$eval('a[href*="/vaga/"], a[href*="/vagas/"]', (anchors: any[]) =>
      anchors.map((a) => a.href)
    );

    const jobLinks = Array.from(new Set(rawLinks)).slice(0, 10);
    console.log(`[Scraper - Vagas.SC] ${jobLinks.length} vagas recentes identificadas.`);

    // Fase D: Iteração e extração do conteúdo de cada vaga
    for (const link of jobLinks) {
      try {
        console.log(`[Scraper - Vagas.SC] Extraindo vaga: ${link}`);
        await page
          .goto(link, { waitUntil: 'commit', timeout: 15000 })
          .catch(() => console.log('[Scraper] Timeout ignorado, tentando extrair texto parcial...'));
        
        // Evasão de rate-limit
        await page.waitForTimeout(2000);

        const bodyText = await page.evaluate(() => document.body.innerText || '');
        if (bodyText.length > 50) {
          await processTextToJSON(bodyText.substring(0, 4000), 'job');
        }
      } catch (linkErr) {
        console.error(`[Scraper - Vagas.SC] Falha ao extrair vaga (${link}):`, linkErr);
      }
    }
  } catch (portalErr) {
    console.error('[Scraper - Vagas.SC] Erro na Fase de Descoberta:', portalErr);
  } finally {
    await context.close();
  }
}

/**
 * Função principal que instancia o browser uma única vez e orquestra os extratores dedicados.
 */
export async function runAllScrapers(): Promise<void> {
  console.log('===================================================');
  console.log('    INICIANDO CRAWLER DEDICADO (VagasFloripa & Vagas.SC)');
  console.log('===================================================');

  const browser = await chromium.launch({ headless: true });

  try {
    await scrapeVagasFloripa(browser);
    await scrapeVagasSC(browser);
  } catch (err) {
    console.error('[Scraper Main] Erro durante a execução dos scrapers:', err);
  } finally {
    await browser.close();
    console.log('[Scraper Main] Instância do browser fechada e varredura concluída.');
  }
}

/**
 * Função legado mantida para compatibilidade com raspagem direta de links (com bypass de timeout/redirecionamento).
 */
export async function scrapeJobPage(targetUrl: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page
      .goto(targetUrl, { waitUntil: 'commit', timeout: 15000 })
      .catch(() => console.log('[Scraper] Timeout ignorado, tentando extrair texto parcial...'));
    return await page.evaluate(() => document.body.innerHTML);
  } finally {
    await browser.close();
  }
}
