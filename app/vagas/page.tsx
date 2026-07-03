import React from 'react';

export default async function VagasFeedPage() {
  // Placeholder para o fetch:
  // const { data: jobs } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  const jobs: any[] = []; // Array vazio simulado

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Feed de Vagas</h1>
      <div className="flex flex-col gap-4">
        {jobs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma vaga encontrada no momento.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{job.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">{job.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">{job.contract_type}</span>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">{job.modality}</span>
                <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  Publicado em {new Date(job.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
