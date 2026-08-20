-- App Reviews Tablosu
CREATE TABLE IF NOT EXISTS public.app_reviews (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    user_name TEXT,
    score INT2,
    text TEXT,
    review_date TIMESTAMPTZ,
    reply_url TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolon zaten varsa ekleme güvencesi
ALTER TABLE public.app_reviews ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_app_reviews_app_id ON public.app_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_review_date ON public.app_reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_app_reviews_score ON public.app_reviews(score);
CREATE INDEX IF NOT EXISTS idx_app_reviews_is_completed ON public.app_reviews(is_completed);

-- Row Level Security (RLS)
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle
DROP POLICY IF EXISTS "Allow public read access to app_reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Allow authenticated admin read access to app_reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Allow all read access to app_reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Allow service role full access to app_reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Allow update is_completed on app_reviews" ON public.app_reviews;

-- 1. Okuma Politikası (Yönetim Panelinden Okuma İzni)
CREATE POLICY "Allow all read access to app_reviews"
    ON public.app_reviews
    FOR SELECT
    USING (true);

-- 2. Yazma Politikası (Node.js Scraper ve Panel İçin)
CREATE POLICY "Allow service role full access to app_reviews"
    ON public.app_reviews
    FOR ALL
    USING (true)
    WITH CHECK (true);
