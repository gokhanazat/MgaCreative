import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase URL ve Anon Key
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
    return data || []
}

/**
 * portfolio_items tablosuna yeni uygulama ekler
 */
export async function addPortfolioItem(item) {
    const { error } = await supabase
        .from('portfolio_items')
        .insert([item]);
    return error;
}

/**
 * portfolio_items tablosundaki uygulamayı günceller
 */
export async function updatePortfolioItem(id, updates) {
    const { error } = await supabase
        .from('portfolio_items')
        .update(updates)
        .eq('id', id);
    return error;
}

/**
 * portfolio_items tablosundan uygulama siler
 */
export async function deletePortfolioItem(id) {
    const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id);
    return error;
}

/**
 * Görsel dosyasını yükler (Supabase Storage veya Base64 fallback)
 */
export async function uploadPortfolioImage(file) {
    if (!file) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        // Supabase Storage'a yüklemeyi dene
        const { data, error } = await supabase.storage
            .from('portfolio')
            .upload(filePath, file);

        if (!error && data) {
            const { data: publicUrlData } = supabase.storage
                .from('portfolio')
                .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
                return publicUrlData.publicUrl;
            }
        }
    } catch (e) {
        console.warn('Storage upload fallback to Data URL:', e);
    }

    // Fallback: Resmi Base64 Data URL'e çevir
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}
