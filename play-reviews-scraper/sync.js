import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchAppReviews } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env yükle
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLAY_CONSOLE_DEVELOPER_ID = process.env.PLAY_CONSOLE_DEVELOPER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Hata] SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env dosyasında tanımlanmalıdır.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Hedef uygulama listesini apps.json dosyasından okur.
 */
function loadAppList() {
  const configPath = join(__dirname, 'apps.json');
  if (!existsSync(configPath)) {
    console.warn('[Uyarı] apps.json bulunamadı, varsayılan liste kullanılıyor.');
    return ['com.mga.lemora'];
  }
  try {
    const rawData = readFileSync(configPath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('[Hata] apps.json okunamadı:', error.message);
    return [];
  }
}

/**
 * Tüm uygulamaların yorumlarını senkronize eden ana fonksiyon.
 */
export async function syncAllReviews() {
  console.log('=== Google Play Store Yorum Senkronizasyonu Başlatıldı ===');
  console.log(`Tarih: ${new Date().toISOString()}`);

  const apps = loadAppList();
  if (apps.length === 0) {
    console.log('[Bilgi] Senkronize edilecek uygulama bulunamadı.');
    return;
  }

  let totalProcessed = 0;
  let totalSaved = 0;

  for (const appId of apps) {
    console.log(`\n--> [${appId}] Yorumlar çekiliyor...`);
    try {
      const reviews = await fetchAppReviews(appId, PLAY_CONSOLE_DEVELOPER_ID, {
        num: 100
      });

      console.log(`    ${reviews.length} adet yorum bulundu.`);
      totalProcessed += reviews.length;

      if (reviews.length > 0) {
        const { data, error } = await supabase
          .from('app_reviews')
          .upsert(reviews, { onConflict: 'id' });

        if (error) {
          console.error(`    [Supabase Hata - ${appId}]:`, error.message);
        } else {
          totalSaved += reviews.length;
          console.log(`    [Başarılı] ${reviews.length} yorum Supabase'e kaydedildi/güncellendi.`);
        }
      }
    } catch (err) {
      console.error(`    [Hata - ${appId}]:`, err.message);
    }
  }

  console.log('\n=== Senkronizasyon Tamamlandı ===');
  console.log(`Toplam İncelenen Yorum: ${totalProcessed}`);
  console.log(`Toplam Aktarılan Yorum : ${totalSaved}`);
}

// Dosya doğrudan çalıştırıldığında senkronizasyonu başlat
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncAllReviews()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((err) => {
      console.error('[Kritik Hata]:', err);
      process.exitCode = 1;
    });
}

