'use server'

import { isAdmin } from '@/lib/auth'

export async function checkIsAdmin(): Promise<boolean> {
  return await isAdmin()
}