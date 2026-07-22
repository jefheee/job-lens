import cron from 'node-cron';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { initWhatsAppListener } from './whatsappListener';
import { runAllScrapers } from './webScraper';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConnection(): Promise<void> {
  console.log('[Worker Startup] Verificando conexão e integridade da infraestrutura do Supabase...');
  const { error } = await supabase.from('jobs').select('id').limit(1);

  if (error) {
    if (error.message.includes('relation "jobs" does not exist') || error.code === '42P01') {
      console.error('\n' + '='.repeat(80));
      console.error(' [ALERTA DE INFRAESTRUTURA GIGANTE] BANCO DE DADOS INCOMPLETO OU INDISPONÍVEL! ');
      console.error(' A tabela "jobs" não foi encontrada no Supabase!');
      console.error(' Por favor, execute o script SQL contido em "database/schema.sql" no SQL Editor do Supabase.');
      console.error('='.repeat(80) + '\n');
      process.exit(1);
    } else {
      console.error('[Worker Startup] Aviso de erro no Supabase:', error.message);
    }
  } else {
    console.log('[Worker Startup] Conexão com o Supabase verificada! Tabela "jobs" acessível.');
  }
}

async function startWorkerService() {
  console.log('===================================================');
  console.log('      JOBLENS WORKER SERVICE INITIALIZING          ');
  console.log('===================================================');

  // 1. Checagem de Infraestrutura
  await checkDatabaseConnection();

  // 2. Inicializar Listener do WhatsApp
  try {
    initWhatsAppListener();
  } catch (err) {
    console.error('[Worker Index] Erro ao inicializar o WhatsApp Listener:', err);
  }

  // 3. Agendar Web Scraper
  const CRON_SCHEDULE = '0 10,16 * * *';
  console.log(`[Worker Index] Agendando cron job do webScraper para: "${CRON_SCHEDULE}"`);

  cron.schedule(CRON_SCHEDULE, async () => {
    console.log(`[Worker Cron] Iniciando execução agendada do Crawler Dedicado às ${new Date().toLocaleTimeString()}...`);
    try {
      await runAllScrapers();
      console.log('[Worker Cron] Crawler Dedicado concluído com sucesso.');
    } catch (error) {
      console.error('[Worker Cron] Erro durante a execução do Crawler Dedicado agendado:', error);
    }
  });

  console.log('[Worker Index] Serviço JobLens Worker rodando com sucesso.');
}

startWorkerService();
