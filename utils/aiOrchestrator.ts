/**
 * AI Orchestrator para processamento de textos não estruturados (Vagas e CVs)
 * O objetivo é extrair um JSON estruturado para alimentar o banco e gerar embeddings.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const GROQ_API_KEY = process.env.GROQ_API_KEY; // Preparado para o fallback

export interface StructuredAiData {
  title?: string;
  summary?: string;
  skills: string[];
  suggestedModality?: string;
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
  
  // Utilizando fetch nativo para interagir com a API do Gemini via REST
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
  
  // Como pedimos response_mime_type: application/json, a resposta deve ser um JSON válido
  return JSON.parse(textOut) as StructuredAiData;
}

async function callFallback(prompt: string): Promise<StructuredAiData> {
  // Estrutura pronta para integrar com Grok/Groq quando a chave for configurada
  // ex: return await callGroq(prompt);
  throw new Error("Fallback API (Grok/Groq) ainda não implementado.");
}
