import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface AffiliateUser {
  id: string
  phone: string
  password: string
  name?: string
  email?: string
  created_at: string
  updated_at: string
}

export async function createAffiliateUser(userData: Omit<AffiliateUser, 'id' | 'created_at' | 'updated_at'>): Promise<AffiliateUser | null> {
  const { data, error } = await supabase
    .from('affiliate_users')
    .insert([userData])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating affiliate user:', error)
    return null
  }
  
  return data
}

export async function getAffiliateUserByPhone(phone: string): Promise<AffiliateUser | null> {
  const { data, error } = await supabase
    .from('affiliate_users')
    .select()
    .eq('phone', phone)
    .single()
  
  if (error) {
    console.error('Error fetching affiliate user:', error)
    return null
  }
  
  return data
}

export async function getAffiliateUserById(id: string): Promise<AffiliateUser | null> {
  const { data, error } = await supabase
    .from('affiliate_users')
    .select()
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching affiliate user:', error)
    return null
  }
  
  return data
}
















