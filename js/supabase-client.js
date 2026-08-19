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
    try {
        const itemToInsert = { ...item };
        if (itemToInsert.id && String(itemToInsert.id).startsWith('def-')) {
            delete itemToInsert.id;
        }
        const insertPromise = supabase
            .from('portfolio_items')
            .insert([itemToInsert])
            .select();
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Veritabanı yanıt süresi aşıldı')), 8000)
        );

        const { data, error } = await Promise.race([insertPromise, timeoutPromise]);
        return { data, error };
    } catch (e) {
        console.error('addPortfolioItem hatası:', e);
        return { data: null, error: e };
    }
}

/**
 * portfolio_items tablosundaki uygulamayı günceller
 */
export async function updatePortfolioItem(id, updates) {
    try {
        const updatePromise = supabase
            .from('portfolio_items')
            .update(updates)
            .eq('id', id);

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Veritabanı güncelleme süresi aşıldı')), 8000)
        );

        const { error } = await Promise.race([updatePromise, timeoutPromise]);
        return error;
    } catch (e) {
        console.error('updatePortfolioItem hatası:', e);
        return e;
    }
}

/**
 * portfolio_items tablosundan uygulama siler
 */
export async function deletePortfolioItem(id) {
    try {
        const deletePromise = supabase
            .from('portfolio_items')
            .delete()
            .eq('id', id);

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Veritabanı silme süresi aşıldı')), 8000)
        );

        const { error } = await Promise.race([deletePromise, timeoutPromise]);
        return error;
    } catch (e) {
        console.error('deletePortfolioItem hatası:', e);
        return e;
    }
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

        // Supabase Storage'a yüklemeyi dene (6sn timeout ile)
        const storagePromise = supabase.storage
            .from('portfolio')
            .upload(filePath, file);

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Storage yükleme süresi aşıldı')), 6000)
        );

        const { data, error } = await Promise.race([storagePromise, timeoutPromise]);

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
