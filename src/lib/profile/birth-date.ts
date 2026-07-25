/** Walidacja i pomocnicze dla daty urodzenia. */

export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const [y, m, d] = value.split("-").map(Number);
  if (
    date.getFullYear() !== y ||
    date.getMonth() + 1 !== m ||
    date.getDate() !== d
  ) {
    return false;
  }

  const today = new Date();
  if (date > today) return false;

  const age = getAgeFromBirthDate(value);
  return age !== null && age >= 13 && age <= 120;
}

export function getAgeFromBirthDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const birth = new Date(`${value}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function birthDateInputBounds() {
  const today = new Date();
  const max = new Date(today);
  max.setFullYear(max.getFullYear() - 13);
  const min = new Date(today);
  min.setFullYear(min.getFullYear() - 120);

  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { min: toIso(min), max: toIso(max) };
}
