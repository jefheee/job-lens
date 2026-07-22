import cron from 'node-cron';
import dotenv from 'dotenv';
import { initWhatsAppListener } from './whatsappListener';
import { scrapeJobPage } from './webScraper';

dotenv.config();

console.log('===================================================');
console.log('      JOBLENS WORKER SERVICE INITIALIZING          ');
console.log('===================================================');

// 1. Inicializar Listener do WhatsApp instantaneamente
try {
  initWhatsAppListener();
} catch (err) {
  console.error('[Worker Index] Erro ao inicializar o WhatsApp Listener:', err);
}

// 2. Agendar Web Scraper via node-cron para rodar todos os dias às 10:00 e 16:00
const CRON_SCHEDULE = '0 10,16 * * *'; // Todos os dias às 10h e 16h

console.log(`[Worker Index] Agendando cron job do webScraper para: "${CRON_SCHEDULE}"`);

cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`[Worker Cron] Iniciando execução agendada do WebScraper às ${new Date().toLocaleTimeString()}...`);
  try {
    const html = await scrapeJobPage('https://www.linkedin.com/jobs/search?keywords=developer');
    console.log(`[Worker Cron] WebScraper concluído com sucesso. (${html.length} caracteres obtidos)`);
  } catch (error) {
    console.error('[Worker Cron] Erro durante a execução do WebScraper agendado:', error);
  }
});

console.log('[Worker Index] Serviço JobLens Worker rodando com sucesso.');
