import type { CountryCode } from '../countries';
import type { Person } from '../model';
import { firstNameExpansions } from './nameExpansion';

/** Suggestions for the new-life editor, never restrictions on a typed name. */
const originalSuggestions: Record<CountryCode, Record<Person['gender'], readonly string[]>> = {
  US: { male: ['Noah', 'James', 'Ethan', 'Alex', 'Jordan', 'Sam'], female: ['Olivia', 'Emma', 'Maya', 'Morgan', 'Avery', 'Taylor'], nonbinary: ['Alex', 'Jordan', 'Morgan', 'Avery', 'Taylor', 'Sam'] },
  CA: { male: ['Noah', 'Liam', 'Oliver', 'Jamie', 'Charlie', 'Robin'], female: ['Sophie', 'Camille', 'Emma', 'Jamie', 'Charlie', 'Robin'], nonbinary: ['Jamie', 'Charlie', 'Robin', 'Alex'] },
  GB: { male: ['Oliver', 'Theo', 'Harry', 'Freddie'], female: ['Amelia', 'Grace', 'Isla', 'Ava'], nonbinary: ['Alex', 'Morgan', 'Taylor', 'Robin'] },
  AU: { male: ['Jack', 'Oliver', 'Noah', 'Riley', 'Kai'], female: ['Isla', 'Ruby', 'Harper', 'Riley'], nonbinary: ['Riley', 'Harper', 'Kai', 'Taylor'] },
  FR: { male: ['Gabriel', 'Jules', 'Louis', 'Camille'], female: ['Louise', 'Chloé', 'Camille', 'Léa'], nonbinary: ['Camille', 'Sacha', 'Noa', 'Charlie'] },
  DE: { male: ['Emil', 'Luca', 'Finn', 'Noah'], female: ['Hannah', 'Mia', 'Leonie', 'Emma'], nonbinary: ['Kim', 'Toni', 'Mika', 'Alex'] },
  ES: { male: ['Hugo', 'Mateo', 'Leo', 'Pablo'], female: ['Lucía', 'Sofía', 'Valeria', 'Martina'], nonbinary: ['Álex', 'Dani', 'Cris', 'Noa'] },
  IT: { male: ['Leonardo', 'Lorenzo', 'Andrea', 'Matteo'], female: ['Giulia', 'Sofia', 'Alice', 'Emma'], nonbinary: ['Alex', 'Dani', 'Sasha'] },
  BR: { male: ['Miguel', 'Arthur', 'Gabriel', 'Lucas'], female: ['Helena', 'Alice', 'Laura', 'Sofia'], nonbinary: ['Alex', 'Ariel', 'Dani', 'Cris'] },
  IN: { male: ['Aarav', 'Arjun', 'Rohan', 'Kabir'], female: ['Anaya', 'Diya', 'Priya', 'Isha'], nonbinary: ['Kiran', 'Arya', 'Sai'] },
  JP: { male: ['Haruto', 'Ren', 'Sora', 'Minato'], female: ['Yui', 'Hina', 'Akari', 'Sakura'], nonbinary: ['Sora', 'Akira', 'Hinata'] },
  ZA: { male: ['Liam', 'Sipho', 'Thabo', 'Lethabo'], female: ['Amahle', 'Ava', 'Naledi', 'Thando'], nonbinary: ['Lethabo', 'Thando', 'Lesedi'] },
};

function expanded(country: CountryCode) {
  const merged = (gender: Person['gender']) => [...new Set([...originalSuggestions[country][gender], ...firstNameExpansions[country][gender]])];
  return { male: merged('male'), female: merged('female'), nonbinary: merged('nonbinary') };
}

export const creationNamePools: Record<CountryCode, Record<Person['gender'], readonly string[]>> = {
  US: expanded('US'), CA: expanded('CA'), GB: expanded('GB'), AU: expanded('AU'),
  FR: expanded('FR'), DE: expanded('DE'), ES: expanded('ES'), IT: expanded('IT'),
  BR: expanded('BR'), IN: expanded('IN'), JP: expanded('JP'), ZA: expanded('ZA'),
};
