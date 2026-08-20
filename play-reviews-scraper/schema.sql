-- App Reviews Tablosu
CREATE TABLE IF NOT EXISTS public.app_reviews (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    user_name TEXT,
    score INT2,
    text TEXT,
    review_date TIMESTAMPTZ,
    reply_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_app_reviews_app_id ON public.app_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_review_date ON public.app_reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_app_reviews_score ON public.app_reviews(score);

-- Row Level Security (RLS) Etkinleştirme
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

-- Okuma Politikası: Sadece oturum açmış yetkili admin kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Allow public read access to app_reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Allow authenticated admin read access to app_reviews" ON public.app_reviews;

CREATE POLICY "Allow authenticated admin read access to app_reviews"
    ON public.app_reviews
    FOR SELECT
    TO authenticated
    USING (true);

-- Yazma Politikası: Sadece Backend Node.js Service Role tam yetkilidir
DROP POLICY IF EXISTS "Allow service role full access to app_reviews" ON public.app_reviews;

CREATE POLICY "Allow service role full access to app_reviews"
    ON public.app_reviews
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
