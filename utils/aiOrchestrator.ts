/**
 * AI Orchestrator para processamento de textos não estruturados e visão computacional (OCR)
 * Suporta modelos Gemini (com fallback para gemini-2.5-flash e Groq) para extração multimodal e texto bruto.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export interface StructuredAiData {
  title?: string;
  summary?: string;
  skills: string[];
  suggestedModality?: string;
}

async function getGenerativeModelResult(genAI: GoogleGenerativeAI, contents: any) {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent(contents);
    } catch (err: any) {
      lastError = err;
      if (err?.status === 404 || err?.message?.includes('404') || err?.message?.includes('not found')) {
        console.warn(`[AI Orchestrator] Modelo '${modelName}' indisponível (404). Tentando próximo modelo...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Extrai texto visível de imagens de vagas (Flyers, banners, cartazes) via Gemini Vision.
 * @param base64Data Dados da imagem codificados em Base64
 * @param mimeType Tipo MIME da imagem (ex: 'image/jpeg', 'image/png')
 */
export async function extractTextFromImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada no ambiente.");

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const prompt = "Extraia todo o texto visível nesta imagem de anúncio de emprego. Retorne apenas o texto bruto extraído, sem markdown ou explicações.";

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await getGenerativeModelResult(genAI, [prompt, imagePart]);
    const response = await result.response;
    const extractedText = response.text().trim();

    console.log(`[AI Orchestrator] OCR concluído com sucesso (${extractedText.length} caracteres extraídos da imagem).`);
    return extractedText;
  } catch (error) {
    console.error("[AI Orchestrator] Erro ao executar visão computacional/OCR na imagem:", error);
    throw error;
  }
}

export async function processTextToJSON(rawText: string, type: 'cv' | 'job'): Promise<StructuredAiData> {
  const prompt = `Extract structured data from this ${type} text and return ONLY a valid JSON object with the following keys: "title" (string), "summary" (string), "skills" (array of strings), "suggestedModality" (string). Here is the text:\n\n${rawText.substring(0, 4000)}`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.warn("Falha no Google Gemini, acionando fallback para Groq...", error);
    return await callFallback(prompt);
  }
}

async function callGemini(prompt: string): Promise<StructuredAiData> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada no ambiente.");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const result = await getGenerativeModelResult(genAI, prompt);
  const response = await result.response;
  const textOut = response.text();

  if (!textOut) throw new Error("Formato de resposta inválido retornado pelo Gemini.");

  const cleanJson = textOut.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson) as StructuredAiData;
}

async function callFallback(prompt: string): Promise<StructuredAiData> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não configurada no ambiente para fallback.");
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: Status ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const textOut = data.choices?.[0]?.message?.content;
  if (!textOut) throw new Error("Formato de resposta inválido retornado pelo Groq.");

  return JSON.parse(textOut) as StructuredAiData;
}
