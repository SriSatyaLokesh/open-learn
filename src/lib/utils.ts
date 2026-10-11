/**
 * @file src/lib/utils.ts
 * @description Tailwind CSS class merging helper.
 * Combines clsx for conditional class names with tailwind-merge to reliably resolve
 * Tailwind utility conflicts without manual deduplication.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
