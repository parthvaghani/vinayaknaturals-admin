import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string): string {
  if (!name) return 'U'
  
  return name
    ?.split(' ')
    ?.map(word => word.charAt(0))
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2)
}