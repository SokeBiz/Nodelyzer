import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculates the Gini coefficient of an array of positive numbers (0 = perfectly equal, 1 = maximally unequal).
// Zero or single-item inputs return 0.
export function giniCoefficient(values: number[]): number {
  const arr = values.filter(v => v > 0).sort((a, b) => a - b);
  const n = arr.length;
  const sum = arr.reduce((acc, v) => acc + v, 0);
  if (n <= 1 || sum === 0) return 0;

  // Σ (i+1) * valueᵢ for i starting at 0 on the sorted array
  const rankedSum = arr.reduce((acc, v, i) => acc + v * (i + 1), 0);
  // Gini formula for discrete distribution
  return (2 * rankedSum) / (n * sum) - (n + 1) / n;
}
