import React from 'react';
import Link from 'next/link';

export default async function FreelaCalendarPage() {
  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

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
                className="px-3 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Feed Cru
              </Link>
              <Link
                href="/freela"
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
              >
                Calendário Freela
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendário de Gigs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Encontre trabalhos rápidos de WhatsApp/Telegram alocados por dia da semana.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[250px] overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50">
                <h3 className="font-semibold text-center text-gray-700 dark:text-gray-300">{day}</h3>
              </div>
              <div className="p-3 flex flex-col gap-3 flex-grow">
                <div className="flex-grow flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-full">
                    Sem Gigs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
