/**
 * AI Orchestrator para processamento de textos não estruturados e visão computacional (OCR)
 * Suporta Gemini 1.5 Flash para extração multimodal de imagens de vagas e texto bruto.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface StructuredAiData {
  title?: string;
  summary?: string;
  skills: string[];
  suggestedModality?: string;
}

/**
 * Extrai texto visível de imagens de vagas (Flyers, banners, cartazes) via Gemini 1.5 Flash Vision.
 * @param base64Data Dados da imagem codificados em Base64
 * @param mimeType Tipo MIME da imagem (ex: 'image/jpeg', 'image/png')
 */
export async function extractTextFromImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada no ambiente.");

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Extraia todo o texto visível nesta imagem de anúncio de emprego. Retorne apenas o texto bruto extraído, sem markdown ou explicações.";

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
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
    console.warn("Falha no Google Gemini, acionando fallback para a API alternativa...", error);
    return await callFallback(prompt);
  }
}

async function callGemini(prompt: string): Promise<StructuredAiData> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada no ambiente.");
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: Status ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textOut) throw new Error("Formato de resposta inválido retornado pelo Gemini.");
  
  return JSON.parse(textOut) as StructuredAiData;
}

async function callFallback(prompt: string): Promise<StructuredAiData> {
  throw new Error("Fallback API (Grok/Groq) ainda não implementado.");
}
