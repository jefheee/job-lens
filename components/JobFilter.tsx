'use client';

import React, { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { ContractType, Modality } from '../types/job';

export interface JobFilterParams {
  salaryMin?: number;
  scoreMin?: number;
  contractTypes: ContractType[];
  modalities: Modality[];
}

interface JobFilterProps {
  onFilterChange: (filters: JobFilterParams) => void;
}

const ALL_CONTRACTS: ContractType[] = ['CLT', 'PJ', 'Freelancer', 'Temporário', 'Estágio', 'Aprendiz'];
const ALL_MODALITIES: Modality[] = ['Presencial', 'Híbrido', 'Remoto'];

export function JobFilter({ onFilterChange }: JobFilterProps) {
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);

  const handleContractToggle = (contract: ContractType) => {
    const updated = contractTypes.includes(contract)
      ? contractTypes.filter(c => c !== contract)
      : [...contractTypes, contract];
    setContractTypes(updated);
    notifyChange(salaryMin, scoreMin, updated, modalities);
  };

  const handleModalityToggle = (modality: Modality) => {
    const updated = modalities.includes(modality)
      ? modalities.filter(m => m !== modality)
      : [...modalities, modality];
    setModalities(updated);
    notifyChange(salaryMin, scoreMin, contractTypes, updated);
  };

  const notifyChange = (
    sal: number, 
    score: number, 
    contracts: ContractType[], 
    mods: Modality[]
  ) => {
    onFilterChange({
      salaryMin: sal,
      scoreMin: score,
      contractTypes: contracts,
      modalities: mods,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros Avançados</h3>

      {/* Filtro de Salário */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Salário Mínimo
          </label>
          <span className="text-sm text-gray-500">R$ {salaryMin.toLocaleString('pt-BR')}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[salaryMin]}
          max={30000}
          step={1000}
          onValueChange={(val) => {
            setSalaryMin(val[0]);
            notifyChange(val[0], scoreMin, contractTypes, modalities);
          }}
        >
          <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-[0_2px_10px] shadow-black/10 focus:outline-none hover:bg-gray-50"
            aria-label="Salário Mínimo"
          />
        </Slider.Root>
      </div>

      {/* Filtro de Score */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Score Mínimo (Job Lens)
          </label>
          <span className="text-sm text-gray-500">{scoreMin.toFixed(1)}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[scoreMin]}
          max={10}
          step={0.5}
          onValueChange={(val) => {
            setScoreMin(val[0]);
            notifyChange(salaryMin, val[0], contractTypes, modalities);
          }}
        >
          <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-[0_2px_10px] shadow-black/10 focus:outline-none hover:bg-gray-50"
            aria-label="Score Mínimo"
          />
        </Slider.Root>
      </div>

      {/* Filtro de Modalidade */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Modalidade
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_MODALITIES.map((mod) => (
            <button
              key={mod}
              onClick={() => handleModalityToggle(mod)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                modalities.includes(mod)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Tipo de Contrato */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo de Contrato
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_CONTRACTS.map((contract) => (
            <button
              key={contract}
              onClick={() => handleContractToggle(contract)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                contractTypes.includes(contract)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {contract}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
