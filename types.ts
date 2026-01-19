
export type InputMode = 'solar' | 'bazi';

export interface UserProfile {
  name: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  birthDate?: string;
  birthTime?: string;
  baziAnalysis?: BaziAnalysis;
}

export interface BaziAnalysis {
  elementBalance: string;
  summary: string;
  pianCaiStrength: string;
  pianCaiAnalysis: string;
}

export interface FortuneResult {
  numbers: number[];
  explanation: string;
  auspiciousDate: string;
  bettingTime: string;
  sources?: any[]; // To store grounding sources from Google Search
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  correctPillar?: string;
}
