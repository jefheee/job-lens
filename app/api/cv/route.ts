import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Usar service_role se disponível para ignorar RLS no backend, ou anon key como fallback
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

async function getGenerativeResult(genAI: GoogleGenerativeAI, contents: any) {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contents);
      return result;
    } catch (err: any) {
      lastError = err;
      if (err?.status === 404 || err?.message?.includes('404') || err?.message?.includes('not found')) {
        console.warn(`[API CV] Modelo '${modelName}' indisponível (404). Tentando próximo modelo...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    let cvText = '';
    let pdfBase64 = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('cv') as File | null;
      const textInput = formData.get('rawText') as string | null;

      if (textInput && textInput.trim()) {
        cvText = textInput;
      } else if (file) {
        const buffer = await file.arrayBuffer();
        if (file.type === 'application/pdf') {
          pdfBase64 = Buffer.from(buffer).toString('base64');
        } else {
          cvText = new TextDecoder().decode(buffer);
        }
      }
    } else {
      const body = await req.json();
      cvText = body.rawText || '';
    }

    if (!cvText && !pdfBase64) {
      return NextResponse.json(
        { error: 'Nenhum currículo (arquivo PDF/TXT ou texto bruto) foi fornecido.' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada no ambiente.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    let extractedInfo: { skills: string[]; experience: string; seniority: string } = {
      skills: [],
      experience: '',
      seniority: 'Pleno',
    };

    const prompt = `Analise este currículo e retorne APENAS um objeto JSON válido com as chaves:
"skills" (array de strings com as tecnologias e competências),
"experience" (resumo da experiência profissional),
"seniority" (string: 'Júnior', 'Pleno', 'Sênior', 'Especialista').`;

    let result;
    if (pdfBase64) {
      const imagePart = {
        inlineData: {
          data: pdfBase64,
          mimeType: 'application/pdf',
        },
      };
      result = await getGenerativeResult(genAI, [prompt, imagePart]);
    } else {
      result = await getGenerativeResult(genAI, [prompt, `Texto do Currículo:\n${cvText}`]);
    }

    const resText = (await result.response).text();
    const cleanJson = resText.replace(/```json|```/g, '').trim();
    extractedInfo = JSON.parse(cleanJson);

    if (pdfBase64) {
      cvText = `[Extraído de PDF]: ${extractedInfo.experience || ''}`;
    }

    // Geração simulada de vetor de embedding de 1536 dimensões (ou zeros estruturados)
    const mockVector = Array.from({ length: 1536 }, () => Number((Math.random() * 0.1 - 0.05).toFixed(6)));

    // Inserção no Supabase na tabela 'user_profiles'
    const { data: profile, error: dbError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // ID padrão ou anon
        cv_text: cvText,
        cv_embedding: mockVector,
      })
      .select()
      .single();

    if (dbError) {
      console.warn('[API CV] Aviso ao salvar perfil no Supabase (banco pode não ter a tabela ainda):', dbError.message);
      return NextResponse.json({
        success: true,
        extractedInfo,
        warning: 'Extração por IA concluída com sucesso. Nota: Perfil não salvo no Supabase (tabela user_profiles pendente).',
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      extractedInfo,
    });
  } catch (err: any) {
    console.error('[API CV] Erro inesperado ao processar currículo:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
