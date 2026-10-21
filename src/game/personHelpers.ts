import { daysInMonth, type GameDate } from './calendar';
import type { Person } from './model';

export function compareDates(a: GameDate, b: GameDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
export function ageOn(person: Pick<Person, 'born' | 'died'>, date: GameDate): number {
  const at = person.died ?? date;
  const birthdayDay = Math.min(person.born.day, daysInMonth(at.year, person.born.month));
  return at.year - person.born.year - (at.month < person.born.month || (at.month === person.born.month && at.day < birthdayDay) ? 1 : 0);
}
export const fullName = (person: Pick<Person, 'firstName' | 'lastName'>) => person.firstName + ' ' + person.lastName;

