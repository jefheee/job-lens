'use client';

import React, { useState, useCallback } from 'react';

export function CvUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setErrorMessage('Selecione um arquivo (PDF/TXT) ou cole o texto do seu currículo.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMessage('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('cv', file);
      }
      if (rawText.trim()) {
        formData.append('rawText', rawText);
      }

      const response = await fetch('/api/cv', {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || 'Falha ao processar o currículo no servidor.');
      }

      setStatus('success');
    } catch (err: any) {
      console.error('[CvUploader] Erro no upload:', err);
      setErrorMessage(err.message || 'Erro ao conectar com o serviço de processamento.');
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Motor de Match com IA (Upload de CV)
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone de Arquivo */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => {
            const input = document.getElementById('cv-file-input');
            if (input) input.click();
          }}
          className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-center
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-blue-400 dark:hover:border-blue-500'
            }
          `}
        >
          <input
            id="cv-file-input"
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-xs mb-2 text-blue-600 dark:text-blue-400">
            📄
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {file ? (
              <span className="text-blue-600 font-bold">{file.name}</span>
            ) : (
              <>Arraste seu arquivo PDF ou TXT aqui, ou <span className="text-blue-600 underline">clique para buscar</span></>
            )}
          </p>
        </div>

        {/* Campo de Texto Bruto */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Ou cole o texto bruto do currículo (opcional):
          </label>
          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Ex: Engenheiro de Software com experiência em Node.js, Next.js, Supabase..."
            className="w-full p-3 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={status === 'processing'}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {status === 'processing' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processando OCR & Embeddings no Supabase...</span>
            </>
          ) : (
            <span>Analisar e Salvar Perfil</span>
          )}
        </button>

        {/* Feedback de Status */}
        {status === 'success' && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-semibold text-center">
            ✓ Perfil do currículo extraído, vetorizado e inserido na tabela 'user_profiles' do Supabase!
          </div>
        )}

        {status === 'error' && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-400 font-semibold text-center">
            ✕ {errorMessage || 'Erro ao processar o currículo. Verifique o arquivo e tente novamente.'}
          </div>
        )}
      </form>
    </div>
  );
}
