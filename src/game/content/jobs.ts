export type JobRole = {
  id: string; title: string; sector: string; wageBps: number; partTime?: boolean;
  qualification?: 'secondary' | 'trade' | 'degree' | 'medicine' | 'law'; field?: string; smarts: number;
  specialCareer?: boolean;
};
export const jobs: readonly JobRole[] = [
  { id: 'shop-assistant-part', title: 'Weekend Shop Assistant', sector: 'Retail', wageBps: 2500, partTime: true, smarts: 0 },
  { id: 'cafe-part', title: 'Part-time Café Assistant', sector: 'Hospitality', wageBps: 2800, partTime: true, smarts: 0 },
  { id: 'cleaner', title: 'Cleaner', sector: 'Facilities', wageBps: 7000, smarts: 0 },
  { id: 'retail', title: 'Retail Assistant', sector: 'Retail', wageBps: 7500, smarts: 0 },
  { id: 'barista', title: 'Barista', sector: 'Hospitality', wageBps: 8000, smarts: 0 },
  { id: 'warehouse', title: 'Warehouse Assistant', sector: 'Logistics', wageBps: 8500, smarts: 0 },
  { id: 'administrator', title: 'Administrator', sector: 'Services', wageBps: 10000, qualification: 'secondary', smarts: 35 },
  { id: 'support', title: 'Customer Support Adviser', sector: 'Services', wageBps: 9500, qualification: 'secondary', smarts: 30 },
  { id: 'plumber', title: 'Plumber', sector: 'Trades', wageBps: 13000, qualification: 'trade', smarts: 30 },
  { id: 'technician', title: 'Laboratory Technician', sector: 'Laboratory', wageBps: 12500, qualification: 'trade', field: 'science', smarts: 50 },
  { id: 'designer', title: 'Graphic Designer', sector: 'Design', wageBps: 13500, qualification: 'degree', field: 'arts', smarts: 45 },
  { id: 'teacher', title: 'Teacher', sector: 'Education', wageBps: 12500, qualification: 'degree', smarts: 50 },
  { id: 'developer', title: 'Software Developer', sector: 'Technology', wageBps: 18000, qualification: 'degree', field: 'computing', smarts: 60 },
  { id: 'accountant', title: 'Accountant', sector: 'Finance', wageBps: 15500, qualification: 'degree', field: 'business', smarts: 55 },
  { id: 'researcher', title: 'Research Scientist', sector: 'Research', wageBps: 16000, qualification: 'degree', field: 'science', smarts: 65 },
  { id: 'journalist', title: 'Journalist', sector: 'Media', wageBps: 12500, qualification: 'degree', smarts: 50 },
  { id: 'lawyer', title: 'Lawyer', sector: 'Law', wageBps: 24000, qualification: 'law', smarts: 65 },
  { id: 'doctor', title: 'Doctor', sector: 'Medicine', wageBps: 28000, qualification: 'medicine', smarts: 70 },
  { id:'screen-actor', title:'Screen Actor', sector:'Screen Production', wageBps:10000, smarts:30, specialCareer:true },
  { id:'fashion-model', title:'Fashion Model', sector:'Fashion', wageBps:12000, smarts:20, specialCareer:true },
  { id:'professional-athlete', title:'Professional Athlete', sector:'Sport', wageBps:18000, smarts:25, specialCareer:true },
];
export const jobRanks = ['Junior', 'Experienced', 'Senior', 'Lead'] as const;
