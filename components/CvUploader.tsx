'use client';

import React, { useState, useCallback } from 'react';

export function CvUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

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
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && selectedFile.type !== 'text/plain') {
      setStatus('error');
      return;
    }
    
    setFile(selectedFile);
    setStatus('processing');

    try {
      // Simulação da chamada para a Route Handler em '/api/cv/process'
      const formData = new FormData();
      formData.append('cv', selectedFile);

      /*
      const response = await fetch('/api/cv/process', { 
        method: 'POST', 
        body: formData 
      });
      if (!response.ok) throw new Error('Falha no upload do CV');
      */
      
      // Simulando o delay de extração e geração de embedding...
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer w-full max-w-md mx-auto
        ${isDragging 
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.02]' 
          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500'}
      `}
      onClick={() => {
        // Fallback: ao clicar, poderia abrir um input type="file" hidden
        const input = document.getElementById('cv-upload-input');
        if (input) input.click();
      }}
    >
      <input 
        id="cv-upload-input"
        type="file" 
        accept=".pdf,.txt" 
        className="hidden" 
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      <div className="text-center flex flex-col items-center space-y-3">
        {status === 'idle' && (
          <>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-2">
              <svg className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Arraste seu CV para cá ou <span className="text-blue-600 dark:text-blue-400">clique para buscar</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Suporta apenas PDF ou TXT</p>
          </>
        )}
        
        {status === 'processing' && (
          <>
            <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-4">
              Extraindo texto e gerando matchings...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Pronto! CV processado. ({file?.name})
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Falha no envio. Envie apenas arquivos .pdf ou .txt.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
