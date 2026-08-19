import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase URL ve Anon Key
const SUPABASE_URL = 'https://zfkkifzyzfwccohlbqpo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpma2tpZnp5emZ3Y2NvaGxicXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzExMDMsImV4cCI6MjEwMDA0NzEwM30.a0f6n8NlzQKKjLKe7nJZER9nlnP8aNIGuFmgDD55Rl4'

// Client oluşturma
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// -- GENEL VERİ ÇEKME FONKSİYONLARI --

/**
 * site_content tablosundaki verileri çeker (3.5sn timeout korumalı)
 */
export async function fetchSiteContent() {
    try {
        const queryPromise = supabase.from('site_content').select('*');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (error || !data) return null;
        
        const contentMap = {};
        data.forEach(item => {
            contentMap[item.id] = item.content;
        });
        return contentMap;
    } catch (e) {
        return null;
    }
}

/**
 * portfolio_items tablosundaki tüm projeleri çeker (3.5sn timeout korumalı)
 */
export async function fetchPortfolioItems() {
    try {
        const queryPromise = supabase
            .from('portfolio_items')
            .select('*')
            .order('created_at', { ascending: false });

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (error) {
            console.warn('Portfolio fetch notice:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
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
            setTimeout(() => reject(new Error('Veritabanı yanıt süresi aşıldı')), 5000)
        );

        const { data, error } = await Promise.race([insertPromise, timeoutPromise]);
        return { data, error };
    } catch (e) {
        console.warn('addPortfolioItem notice:', e);
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
            setTimeout(() => reject(new Error('Veritabanı güncelleme süresi aşıldı')), 5000)
        );

        const { error } = await Promise.race([updatePromise, timeoutPromise]);
        return error;
    } catch (e) {
        console.warn('updatePortfolioItem notice:', e);
        return e;
    }
}

/**
 * portfolio_items tablosundan uygulama siler (ID veya Title bazlı)
 */
export async function deletePortfolioItem(id, title = null) {
    try {
        let deleteQuery = supabase.from('portfolio_items').delete();
        if (id && !String(id).startsWith('def-')) {
            deleteQuery = deleteQuery.eq('id', id);
        } else if (title) {
            deleteQuery = deleteQuery.eq('title', title);
        } else {
            return null;
        }

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Veritabanı silme süresi aşıldı')), 5000)
        );

        const { error } = await Promise.race([deleteQuery, timeoutPromise]);
        return error;
    } catch (e) {
        console.warn('deletePortfolioItem notice:', e);
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

        // Supabase Storage'a yüklemeyi dene (4sn timeout ile)
        const storagePromise = supabase.storage
            .from('portfolio')
            .upload(filePath, file);

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Storage timeout')), 4000)
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
    } catch (e) {}

    // Fallback: Resmi Base64 Data URL'e çevir
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}
