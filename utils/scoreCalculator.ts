import { Job } from '../types/job';

/**
 * Calcula o Score de uma vaga baseado nas regras de negócio (0.0 a 10.0).
 * 
 * Regras:
 * - Base score: 5.0
 * - Transparência Salarial: +2.0 (ambos min/max), +1.0 (apenas um), -2.0 (sem salário)
 * - Modalidade: Remoto (+3.0), Híbrido (+1.0), Presencial (+0.0)
 * - Stack: +0.1 por tecnologia (máx +1.0)
 * - Localização: Punição (-1.0) se Presencial/Híbrido fora da Grande Florianópolis
 */
export function calculateJobScore(job: Partial<Job>): number {
  let score = 5.0;

  // Transparência salarial
  if (job.salaryMin != null && job.salaryMax != null) {
    score += 2.0;
  } else if (job.salaryMin != null || job.salaryMax != null) {
    score += 1.0;
  } else {
    score -= 2.0;
  }

  // Modalidade
  if (job.modality === 'Remoto') {
    score += 3.0;
  } else if (job.modality === 'Híbrido') {
    score += 1.0;
  }

  // Bônus de Stack (máx 1.0)
  if (job.requiredStack && job.requiredStack.length > 0) {
    const stackBonus = Math.min(job.requiredStack.length * 0.1, 1.0);
    score += stackBonus;
  }

  // Regra de Localização (Foco em Grande Florianópolis)
  const locationLower = job.location?.toLowerCase() || '';
  const isFloripaRegion = 
    locationLower.includes('florianópolis') || 
    locationLower.includes('são josé') || 
    locationLower.includes('palhoça');

  if (job.modality !== 'Remoto' && !isFloripaRegion) {
    score -= 1.0;
  }

  // Garante que o score final esteja entre 0 e 10
  return Math.max(0, Math.min(10, Number(score.toFixed(2))));
}
