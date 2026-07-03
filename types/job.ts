export type ContractType = 'CLT' | 'PJ' | 'Freelancer' | 'Temporário' | 'Estágio' | 'Aprendiz';
export type Modality = 'Presencial' | 'Híbrido' | 'Remoto';
export type JobStatus = 'ATIVA' | 'FECHADA';

export interface UserProfile {
  id: string;
  userId: string;
  cvText?: string;
  cvEmbedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyMetadata {
  name: string;
  glassdoorRating?: number;
  logoUrl?: string;
  website?: string;
}

export interface JobSource {
  url: string;
  name: string; // e.g., 'Gupy', 'LinkedIn'
  discoveredAt: Date;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  companyId: string;
  company: CompanyMetadata;
  contractType: ContractType;
  modality: Modality;
  location: string; // e.g., 'Florianópolis, SC'
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  sources: JobSource[];
  score: number;
  matchScore?: number;
  status: JobStatus;
  requiredStack: string[];
  gigDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
