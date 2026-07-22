import React from 'react';
import Link from 'next/link';

export default async function VagasFeedPage() {
  const jobs: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                JL
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JobLens
              </span>
            </Link>

            <nav className="flex items-center space-x-2">
              <Link
                href="/"
                className="px-3 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/vagas"
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
              >
                Feed Cru
              </Link>
              <Link
                href="/freela"
                className="px-3 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Calendário Freela
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Feed Cru de Vagas</h1>
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
      </main>
    </div>
  );
}
