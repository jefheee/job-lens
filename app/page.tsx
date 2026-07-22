'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { JobFilter, JobFilterParams } from '../components/JobFilter';
import { CvUploader } from '../components/CvUploader';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCvUploader, setShowCvUploader] = useState<boolean>(false);

  const [filters, setFilters] = useState<JobFilterParams>({
    contractTypes: [],
    modalities: [],
    salaryMin: 0,
    scoreMin: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companies(name, logo_url)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Dashboard] Erro ao buscar vagas do Supabase:', error);
      } else {
        setJobs(data || []);
        setFilteredJobs(data || []);
      }
    } catch (err) {
      console.error('[Dashboard] Erro ao conectar ao Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: JobFilterParams) => {
    setFilters(newFilters);
    applyFilters(jobs, newFilters);
  };

  const applyFilters = (allJobs: any[], f: JobFilterParams) => {
    let result = [...allJobs];

    if (f.salaryMin && f.salaryMin > 0) {
      result = result.filter((j) => (j.salary_max || j.salary_min || 0) >= f.salaryMin!);
    }

    if (f.scoreMin && f.scoreMin > 0) {
      result = result.filter((j) => (j.score || 0) >= f.scoreMin!);
    }

    if (f.modalities && f.modalities.length > 0) {
      result = result.filter((j) => f.modalities.includes(j.modality));
    }

    if (f.contractTypes && f.contractTypes.length > 0) {
      result = result.filter((j) => f.contractTypes.includes(j.contract_type));
    }

    setFilteredJobs(result);
  };

  const formatSalary = (min?: number, max?: number, currency: string = 'BRL') => {
    if (!min && !max) return 'Salário a combinar';
    const fmt = (val: number) =>
      val.toLocaleString('pt-BR', { style: 'currency', currency: currency });
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `A partir de ${fmt(min)}`;
    return `Até ${fmt(max!)}`;
  };

  const getModalityBadgeColor = (modality: string) => {
    switch (modality) {
      case 'Remoto':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Híbrido':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Presencial':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8.0) return 'bg-emerald-500 text-white';
    if (score >= 5.0) return 'bg-blue-500 text-white';
    return 'bg-amber-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header com Navegação e Botões de Acesso */}
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

            {/* Links de Navegação entre Páginas/Rotas */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link
                href="/"
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
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
                className="px-3 py-2 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Calendário Freela
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
            </span>

            {/* Botão para Abrir Upload de CV / Matcher */}
            <button
              onClick={() => setShowCvUploader(!showCvUploader)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>{showCvUploader ? 'Fechar CV Matcher' : 'Upload CV / Matcher'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Seção Modal/Expansível de Upload de CV */}
      {showCvUploader && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <CvUploader />
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <JobFilter onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* Grid de Vagas */}
          <section className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 dark:bg-gray-800/60 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  🔍
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Nenhuma vaga encontrada
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Tente ajustar os filtros laterais de salário, modalidade ou score mínimo para ver mais resultados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {job.title}
                          </h2>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                            {job.company?.name || 'Empresa Confidencial'} • {job.location || 'Brasil'}
                          </p>
                        </div>
                        {/* Score Badge */}
                        <div
                          className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide shadow-sm flex items-center gap-1 ${getScoreBadgeColor(
                            job.score || 0
                          )}`}
                          title="Score do JobLens (0 a 10)"
                        >
                          <span>★</span>
                          <span>{(job.score || 0).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Descrição resumida */}
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Stacks */}
                      {job.required_stack && job.required_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {job.required_stack.slice(0, 4).map((tech: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md"
                            >
                              {tech}
                            </span>
                          ))}
                          {job.required_stack.length > 4 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded-md">
                              +{job.required_stack.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-gray-200">
                          {formatSalary(job.salary_min, job.salary_max, job.currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getModalityBadgeColor(
                            job.modality
                          )}`}
                        >
                          {job.modality}
                        </span>
                        {job.contract_type && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {job.contract_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
