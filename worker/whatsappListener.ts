import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import { processTextToJSON, extractTextFromImage } from '../utils/aiOrchestrator';
import { calculateJobScore } from '../utils/scoreCalculator';
import { scrapeJobPage } from './webScraper';
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
 * Se a lista estiver vazia, o listener monitora todos os grupos.
 */
export const TARGET_GROUPS: string[] = [
  '120363409585552248@g.us', // VagasFloripa.com.br
  '554888005275-1571549036@g.us', // Vagas.SC
];
export const TARGET_GROUP_IDS: string[] = TARGET_GROUPS;

const KEYWORDS = ['vaga', 'oportunidade', 'estágio', 'estagio', 'freela', 'freelancer', 'contratando', 'hiring', 'trabalho', 'emprego', 'remoto', 'home-office', 'CLT', 'salário', 'vagas', 'oportunidades', 'contrata', 'http://', 'https://'];

/**
 * Initializes WhatsApp Web client and starts listening for job messages in groups.
 */
export function initWhatsAppListener(): Client {
  console.log('[WhatsApp] Initializing WhatsApp Web Client...');

  const client = new Client({
    authStrategy: new LocalAuth(),
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
    // 1. Log inicial simplificado diretamente via msg.from sem chamar getChat()
    console.log(`[LOG] Mensagem recebida do ID: ${msg.from}`);

    // 2. Filtro por grupos alvo diretamente pelo ID da mensagem (ex: @g.us)
    if (TARGET_GROUPS.length > 0 && !TARGET_GROUPS.includes(msg.from)) {
      return;
    }

    // 3. Bloco try/catch isolado
    try {
      // 4. Interceptação e Extração de Mídia (OCR em Imagens/Flyers)
      let ocrExtractedText = '';
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media && media.mimetype && media.mimetype.startsWith('image/')) {
            console.log(`[WhatsApp] Imagem identificada (${media.mimetype}). Acionando OCR Gemini...`);
            ocrExtractedText = await extractTextFromImage(media.data, media.mimetype);
          }
        } catch (mediaErr) {
          console.error('[WhatsApp] Erro isolado ao baixar ou processar mídia da mensagem:', mediaErr);
        }
      }

      // Consolidar texto original com texto extraído da imagem (OCR)
      let fullTextToProcess = [
        msg.body,
        ocrExtractedText ? `[Texto Extraído da Imagem (OCR)]:\n${ocrExtractedText}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!fullTextToProcess.trim()) return;

      // Verificar presença de palavras-chave no texto consolidado
      const textLower = fullTextToProcess.toLowerCase();
      const hasKeyword = KEYWORDS.some((kw) => textLower.includes(kw)) || Boolean(ocrExtractedText);

      if (!hasKeyword) return;

      console.log(`[WhatsApp] Nova mensagem de vaga identificada no grupo ID: ${msg.from}`);

      // 5. Extração de Links e Web Scraping Automático
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const extractedUrls = fullTextToProcess.match(urlRegex) || [];

      if (extractedUrls.length > 0) {
        console.log(`[WhatsApp] ${extractedUrls.length} link(s) identificado(s) na mensagem. Iniciando scraping...`);
        for (const url of extractedUrls) {
          try {
            const rawHtml = await scrapeJobPage(url);
            const textOnly = rawHtml
              .replace(/<script\b[^<]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style\b[^<]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            fullTextToProcess += `\n\n[Conteúdo Raspado da URL: ${url}]\n${textOnly.substring(0, 3000)}`;
          } catch (scrapeErr) {
            console.error(`[WhatsApp] Falha ao raspar a URL (${url}):`, scrapeErr);
          }
        }
      }

      // 6. Processar texto consolidado com IA (Gemini / Fallback)
      const structuredData = await processTextToJSON(fullTextToProcess, 'job');

      // 7. Calcular Score da vaga
      const score = calculateJobScore({
        salaryMin: undefined,
        salaryMax: undefined,
        modality: (structuredData.suggestedModality as any) || 'Remoto',
        requiredStack: structuredData.skills || [],
      });

      // 8. Garantir empresa padrão no Supabase
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

      // Montar lista de fontes com URLs encontradas
      const sources = [
        {
          name: `WhatsApp (${msg.from})`,
          url: `https://web.whatsapp.com/`,
          discoveredAt: new Date().toISOString(),
        },
        ...extractedUrls.map((url) => ({
          name: 'Link de Vaga Extraído',
          url,
          discoveredAt: new Date().toISOString(),
        })),
      ];

      // 9. Inserir vaga na tabela 'jobs' no Supabase
      const { data: insertedJob, error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: structuredData.title || `Vaga de WhatsApp - ${msg.from}`,
          description: fullTextToProcess,
          company_id: companyId,
          contract_type: 'Freelancer',
          modality: structuredData.suggestedModality || 'Remoto',
          location: 'Remoto',
          score: score,
          status: 'ATIVA',
          required_stack: structuredData.skills || [],
          sources: sources,
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
      console.error('[WhatsApp] Erro capturado ao processar mensagem:', err);
    }
  });

  client.initialize();
  return client;
}
