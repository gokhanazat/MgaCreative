// Blog verisini Supabase'den okur (blog.html ve blog-detail.html ortak kullanır).
// Sadece status = 'published' olan yazılar herkese görünür (RLS ile korunur).
(function () {
    var SUPABASE_URL = 'https://zfkkifzyzfwccohlbqpo.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpma2tpZnp5emZ3Y2NvaGxicXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzExMDMsImV4cCI6MjEwMDA0NzEwM30.a0f6n8NlzQKKjLKe7nJZER9nlnP8aNIGuFmgDD55Rl4';
    var LIST_FIELDS = 'slug,title,summary,category,author,image,link,read_time,published_at';

    function formatDate(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Sayfaların beklediği alan adlarına çevir (readTime, date)
    function normalize(row) {
        return {
            slug: row.slug,
            title: row.title || '',
            summary: row.summary || '',
            category: row.category || '',
            author: row.author || 'MGA Creative Ekibi',
            image: row.image || '',
            link: row.link || '',
            content: row.content,
            readTime: row.read_time || '',
            date: formatDate(row.published_at),
            publishedAt: row.published_at
        };
    }

    function request(query) {
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
        return fetch(SUPABASE_URL + '/rest/v1/blog_posts?' + query, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
            cache: 'no-store',
            signal: controller ? controller.signal : undefined
        }).then(function (r) {
            if (timer) clearTimeout(timer);
            if (!r.ok) throw new Error('Blog verisi alınamadı (' + r.status + ')');
            return r.json();
        });
    }

    window.MGABlog = {
        // Yayındaki tüm yazılar (içerik hariç), en yeni önce
        fetchIndex: function () {
            return request('select=' + LIST_FIELDS + '&status=eq.published&order=published_at.desc')
                .then(function (rows) { return rows.map(normalize); });
        },
        // Tek yazı (içerik dahil); bulunamazsa null
        fetchPost: function (slug) {
            if (!slug) return Promise.resolve(null);
            return request('select=*&status=eq.published&slug=eq.' + encodeURIComponent(slug) + '&limit=1')
                .then(function (rows) { return rows.length ? normalize(rows[0]) : null; });
        }
    };
})();
