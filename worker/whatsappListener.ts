import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import { processTextToJSON } from '../utils/aiOrchestrator';
import { calculateJobScore } from '../utils/scoreCalculator';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * CONFIGURAÇÃO DE GRUPOS DO WHATSAPP:
 * Insira abaixo os IDs dos grupos que você deseja monitorar especificamente.
 * Exemplo: ['1203630123456789@g.us', '554899999999-12345678@g.us']
 * Se a lista estiver vazia (TARGET_GROUP_IDS = []), o listener irá monitorar TODOS os grupos dos quais o bot faz parte.
 */
export const TARGET_GROUP_IDS: string[] = [
  // 'ID_DO_GRUPO_1@g.us',
  // 'ID_DO_GRUPO_2@g.us',
];

const KEYWORDS = ['vaga', 'oportunidade', 'estágio', 'estagio', 'freela', 'freelancer', 'contratando', 'hiring'];

/**
 * Initializes WhatsApp Web client and starts listening for job messages in groups.
 */
export function initWhatsAppListener(): Client {
  console.log('[WhatsApp] Initializing WhatsApp Web Client...');

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    console.log('[WhatsApp] Escaneie o QR Code abaixo no seu aplicativo WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('[WhatsApp] Cliente WhatsApp conectado e pronto para monitorar mensagens!');
  });

  client.on('message', async (msg: Message) => {
    try {
      const chat = await msg.getChat();

      // Verificar se a mensagem é proveniente de um grupo
      if (!chat.isGroup) return;

      // Filtro por ID de Grupo (se TARGET_GROUP_IDS contiver IDs especificados)
      if (TARGET_GROUP_IDS.length > 0 && !TARGET_GROUP_IDS.includes(chat.id._serialized)) {
        return;
      }

      const text = msg.body.toLowerCase();
      const hasKeyword = KEYWORDS.some((kw) => text.includes(kw));

      if (!hasKeyword) return;

      console.log(`[WhatsApp] Nova mensagem de vaga identificada no grupo "${chat.name}" (${chat.id._serialized})`);

      // 1. Processar texto com IA (Gemini / Fallback)
      const structuredData = await processTextToJSON(msg.body, 'job');

      // 2. Calcular Score da vaga
      const score = calculateJobScore({
        salaryMin: undefined,
        salaryMax: undefined,
        modality: (structuredData.suggestedModality as any) || 'Remoto',
        requiredStack: structuredData.skills || [],
      });

      // 3. Garantir ou buscar empresa padrão no Supabase
      let companyId: string | null = null;
      const { data: defaultCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'WhatsApp Import')
        .maybeSingle();

      if (defaultCompany) {
        companyId = defaultCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({ name: 'WhatsApp Import' })
          .select('id')
          .single();
        companyId = newCompany?.id || null;
      }

      if (!companyId) {
        console.error('[WhatsApp] Falha ao obter company_id no Supabase.');
        return;
      }

      // 4. Inserir vaga na tabela 'jobs' no Supabase
      const { data: insertedJob, error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: structuredData.title || `Vaga de WhatsApp - ${chat.name}`,
          description: msg.body,
          company_id: companyId,
          contract_type: 'Freelancer',
          modality: structuredData.suggestedModality || 'Remoto',
          location: 'Remoto',
          score: score,
          status: 'ATIVA',
          required_stack: structuredData.skills || [],
          sources: [
            {
              name: `WhatsApp (${chat.name})`,
              url: `https://web.whatsapp.com/`,
              discoveredAt: new Date().toISOString(),
            },
          ],
          gig_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) {
        console.error('[WhatsApp] Erro ao inserir vaga no Supabase:', insertError);
      } else {
        console.log(`[WhatsApp] Vaga inserida com sucesso no Supabase! ID: ${insertedJob?.id}`);
      }
    } catch (err) {
      console.error('[WhatsApp] Erro ao processar mensagem do grupo:', err);
    }
  });

  client.initialize();
  return client;
}
