import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase URL ve Anon Key (Senin verdiğin bilgiler)
const SUPABASE_URL = 'https://zfkkifzyzfwccohlbqpo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpma2tpZnp5emZ3Y2NvaGxicXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzExMDMsImV4cCI6MjEwMDA0NzEwM30.a0f6n8NlzQKKjLKe7nJZER9nlnP8aNIGuFmgDD55Rl4'

// Client oluşturma
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// -- GENEL VERİ ÇEKME FONKSİYONLARI --

/**
 * site_content tablosundaki verileri çeker
 */
export async function fetchSiteContent() {
    const { data, error } = await supabase
        .from('site_content')
        .select('*')
    
    if (error) {
        console.error('Error fetching site content:', error)
        return null
    }
    
    // id'yi key, content'i value yapacak şekilde bir sözlük döndür
    const contentMap = {}
    data.forEach(item => {
        contentMap[item.id] = item.content
    })
    return contentMap
}

/**
 * portfolio_items tablosundaki tüm projeleri çeker
 */
export async function fetchPortfolioItems() {
    const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('created_at', { ascending: false })
        
    if (error) {
        console.error('Error fetching portfolio:', error)
        return []
    }
    return data
}
