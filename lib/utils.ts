import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Hardcoded list of admin usernames
export const ADMIN_USERNAMES = [
  'admin',
];

export function isAdmin(identifier?: string | null): boolean {
  if (!identifier) return false;
  return ADMIN_USERNAMES.includes(identifier);
}
