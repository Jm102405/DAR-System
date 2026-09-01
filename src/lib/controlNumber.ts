import { Case } from "../types";

// Next sequential control number suggestion for the given year.
export function suggestControlNumber(
  cases: Case[],
  year = new Date().getFullYear(),
): string {
  const nums = cases
    .map((c) => c.controlNumber.match(/^(\d{4})-(\d{4})$/))
    .filter((m): m is RegExpMatchArray => Boolean(m) && Number(m![2]) === year)
    .map((m) => Number(m[1]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${String(next).padStart(4, "0")}-${year}`;
}
