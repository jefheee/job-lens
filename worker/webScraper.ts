import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to playwright-extra
chromium.use(stealthPlugin());

/**
 * Scrapes a target job listing page with stealth settings and human-like delays.
 * @param targetUrl URL to scrape (e.g., LinkedIn or Gupy jobs search)
 * @returns HTML content of the page body
 */
export async function scrapeJobPage(targetUrl: string = 'https://www.linkedin.com/jobs/search?keywords=developer'): Promise<string> {
  console.log(`[WebScraper] Starting scrape for URL: ${targetUrl}`);

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Random delay before navigation (1s - 3s)
    const initialDelay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise((res) => setTimeout(res, initialDelay));

    // Navigate to page
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Random delay to simulate human scroll/viewing (2s - 5s)
    const viewDelay = Math.floor(Math.random() * 3000) + 2000;
    await page.waitForTimeout(viewDelay);

    // Get body HTML
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log(`[WebScraper] Scrape completed successfully (${bodyHtml.length} bytes extracted).`);

    await context.close();
    return bodyHtml;
  } catch (error) {
    console.error(`[WebScraper] Error scraping ${targetUrl}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}
