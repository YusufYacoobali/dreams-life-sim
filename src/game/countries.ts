import type { Currency } from './money';

export const countryCodes = ['US', 'CA', 'GB', 'AU', 'FR', 'DE', 'ES', 'IT', 'BR', 'IN', 'JP', 'ZA'] as const;
export type CountryCode = typeof countryCodes[number];
export type Country = {
  name: string; currency: Currency; locale: string; cities: readonly string[];
  firstNames: readonly string[]; lastNames: readonly string[];
};
/** Identity/currency catalogue only. Simulation rule packs are a later milestone. */
export const countries: Record<CountryCode, Country> = {
  US: { name: 'United States', currency: 'USD', locale: 'en-US', cities: ['New York', 'Los Angeles', 'Chicago'], firstNames: ['Alex', 'Jordan', 'Morgan', 'Avery', 'Taylor', 'Sam'], lastNames: ['Carter', 'Bennett', 'Brooks', 'Reed', 'Ellis'] },
  CA: { name: 'Canada', currency: 'CAD', locale: 'en-CA', cities: ['Toronto', 'Vancouver', 'Montréal'], firstNames: ['Jamie', 'Charlie', 'Camille', 'Noah', 'Robin', 'Sophie'], lastNames: ['Martin', 'Wilson', 'Roy', 'Campbell', 'Chen'] },
  GB: { name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', cities: ['London', 'Manchester', 'Edinburgh'], firstNames: ['Oliver', 'Amelia', 'Theo', 'Grace', 'Harry', 'Freddie'], lastNames: ['Clarke', 'Taylor', 'Hughes', 'Morgan', 'Ahmed'] },
  AU: { name: 'Australia', currency: 'AUD', locale: 'en-AU', cities: ['Sydney', 'Melbourne', 'Brisbane'], firstNames: ['Riley', 'Isla', 'Jack', 'Ruby', 'Harper', 'Kai'], lastNames: ['Walker', 'Kelly', 'Nguyen', 'Brown', 'Singh'] },
  FR: { name: 'France', currency: 'EUR', locale: 'fr-FR', cities: ['Paris', 'Lyon', 'Marseille'], firstNames: ['Gabriel', 'Louise', 'Jules', 'Chloé', 'Camille', 'Léa'], lastNames: ['Moreau', 'Dubois', 'Laurent', 'Lefèvre', 'Bernard'] },
  DE: { name: 'Germany', currency: 'EUR', locale: 'de-DE', cities: ['Berlin', 'Hamburg', 'Munich'], firstNames: ['Emil', 'Hannah', 'Luca', 'Mia', 'Finn', 'Leonie'], lastNames: ['Weber', 'Fischer', 'Schneider', 'Klein', 'Hoffmann'] },
  ES: { name: 'Spain', currency: 'EUR', locale: 'es-ES', cities: ['Madrid', 'Barcelona', 'Valencia'], firstNames: ['Hugo', 'Lucía', 'Mateo', 'Sofía', 'Leo', 'Valeria'], lastNames: ['García', 'López', 'Martín', 'Sánchez', 'Romero'] },
  IT: { name: 'Italy', currency: 'EUR', locale: 'it-IT', cities: ['Rome', 'Milan', 'Naples'], firstNames: ['Leonardo', 'Giulia', 'Lorenzo', 'Sofia', 'Andrea', 'Alice'], lastNames: ['Rossi', 'Russo', 'Ferrari', 'Ricci', 'Romano'] },
  BR: { name: 'Brazil', currency: 'BRL', locale: 'pt-BR', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília'], firstNames: ['Miguel', 'Helena', 'Arthur', 'Alice', 'Gabriel', 'Laura'], lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima'] },
  IN: { name: 'India', currency: 'INR', locale: 'en-IN', cities: ['Mumbai', 'Delhi', 'Bengaluru'], firstNames: ['Aarav', 'Anaya', 'Arjun', 'Diya', 'Rohan', 'Priya'], lastNames: ['Sharma', 'Patel', 'Mehta', 'Rao', 'Khan'] },
  JP: { name: 'Japan', currency: 'JPY', locale: 'ja-JP', cities: ['Tokyo', 'Osaka', 'Kyoto'], firstNames: ['Haruto', 'Yui', 'Ren', 'Hina', 'Sora', 'Akari'], lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe'] },
  ZA: { name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', cities: ['Johannesburg', 'Cape Town', 'Durban'], firstNames: ['Liam', 'Amahle', 'Sipho', 'Ava', 'Lethabo', 'Thando'], lastNames: ['Dlamini', 'Nkosi', 'Botha', 'Naidoo', 'Molefe'] },
};
