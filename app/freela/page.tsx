import React from 'react';

export default async function FreelaCalendarPage() {
  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  // Placeholder para o fetch filtrando apenas vagas com gig_date
  // const { data: gigs } = await supabase.from('jobs').select('*').not('gig_date', 'is', null);
  const gigs: any[] = []; 

  return (
    <div className="max-w-7xl mx-auto p-6">
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
              {/* Lógica de renderização dos cards das gigs entraria aqui */}
              <div className="flex-grow flex items-center justify-center">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-full">
                  Sem Gigs
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
