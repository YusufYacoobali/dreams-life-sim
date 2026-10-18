export const conditionIds = ['cold', 'flu', 'measles', 'chickenpox', 'sprain', 'fracture', 'asthma', 'hypertension', 'diabetes', 'depression', 'anxiety', 'cancer', 'heart-disease', 'dependence'] as const;
export type ConditionId = typeof conditionIds[number];
export type ConditionDefinition = { name: string; symptoms: string; chronic: boolean; minAge: number; recoveryMonths: number; progression: number; healthDrain: number; mortalityBps: number; treatment: 'support' | 'rehabilitation' | 'medication' | 'therapy' | 'specialist' | 'rehab'; costFactor: number };
/** Authored simulation values, not clinical probabilities or medical advice. */
export const conditions: Record<ConditionId, ConditionDefinition> = {
  cold: { name: 'Common cold', symptoms: 'A runny nose, sore throat and tiredness', chronic: false, minAge: 1, recoveryMonths: 1, progression: -15, healthDrain: 1, mortalityBps: 0, treatment: 'support', costFactor: 1 },
  flu: { name: 'Influenza', symptoms: 'Fever, aches and unusual fatigue', chronic: false, minAge: 1, recoveryMonths: 2, progression: -8, healthDrain: 2, mortalityBps: 1, treatment: 'support', costFactor: 1 },
  measles: { name: 'Measles', symptoms: 'Fever, a rash and a persistent cough', chronic: false, minAge: 1, recoveryMonths: 2, progression: -5, healthDrain: 2, mortalityBps: 2, treatment: 'support', costFactor: 2 },
  chickenpox: { name: 'Chickenpox', symptoms: 'An itchy rash and tiredness', chronic: false, minAge: 1, recoveryMonths: 2, progression: -10, healthDrain: 1, mortalityBps: 0, treatment: 'support', costFactor: 1 },
  sprain: { name: 'Sprained ankle', symptoms: 'Pain and swelling around an ankle', chronic: false, minAge: 4, recoveryMonths: 2, progression: -10, healthDrain: 1, mortalityBps: 0, treatment: 'rehabilitation', costFactor: 2 },
  fracture: { name: 'Fracture', symptoms: 'Severe pain and difficulty moving a limb', chronic: false, minAge: 4, recoveryMonths: 4, progression: 0, healthDrain: 2, mortalityBps: 0, treatment: 'rehabilitation', costFactor: 4 },
  asthma: { name: 'Asthma', symptoms: 'Recurring wheezing and shortness of breath', chronic: true, minAge: 3, recoveryMonths: 0, progression: 2, healthDrain: 1, mortalityBps: 2, treatment: 'medication', costFactor: 2 },
  hypertension: { name: 'Hypertension', symptoms: 'Persistent headaches and dizziness', chronic: true, minAge: 30, recoveryMonths: 0, progression: 2, healthDrain: 1, mortalityBps: 2, treatment: 'medication', costFactor: 2 },
  diabetes: { name: 'Diabetes', symptoms: 'Unusual thirst and persistent fatigue', chronic: true, minAge: 18, recoveryMonths: 0, progression: 2, healthDrain: 1, mortalityBps: 3, treatment: 'medication', costFactor: 3 },
  depression: { name: 'Depression', symptoms: 'A prolonged low mood and loss of interest', chronic: true, minAge: 12, recoveryMonths: 0, progression: 1, healthDrain: 0, mortalityBps: 0, treatment: 'therapy', costFactor: 3 },
  anxiety: { name: 'Anxiety disorder', symptoms: 'Persistent worry and disrupted sleep', chronic: true, minAge: 10, recoveryMonths: 0, progression: 1, healthDrain: 0, mortalityBps: 0, treatment: 'therapy', costFactor: 2 },
  cancer: { name: 'Cancer', symptoms: 'Persistent unexplained fatigue and changes in health', chronic: true, minAge: 30, recoveryMonths: 0, progression: 4, healthDrain: 2, mortalityBps: 18, treatment: 'specialist', costFactor: 12 },
  'heart-disease': { name: 'Heart disease', symptoms: 'Recurring chest discomfort and shortness of breath', chronic: true, minAge: 40, recoveryMonths: 0, progression: 3, healthDrain: 2, mortalityBps: 15, treatment: 'specialist', costFactor: 8 },
  dependence: { name: 'Substance dependence', symptoms: 'Cravings that interfere with ordinary life', chronic: true, minAge: 18, recoveryMonths: 0, progression: 2, healthDrain: 1, mortalityBps: 2, treatment: 'rehab', costFactor: 10 },
};
