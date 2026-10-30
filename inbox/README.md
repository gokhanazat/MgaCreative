# Blog Inbox (agent taslakları)

Bu dal sitenin yayınına dahil DEĞİLDİR. İçerik agent'ları blog taslaklarını buraya bırakır;
www.mgacreative.com/admin açıldığında yeni taslaklar otomatik olarak **Taslak** durumunda
Supabase'e alınır. Gökhan okuyup "Yayınla"ya basar.

## Dosya biçimi

Her yazı için `inbox/` altında iki dosya (aynı ad):

- `YYYY-AA-GG-<slug>.json`  (zorunlu)
- `YYYY-AA-GG-<slug>.svg`   (kapak görseli, 1200x630, isteğe bağlı; .png/.jpg de olur)

JSON alanları:

```json
{
  "slug": "kucuk-harf-tireli-ascii",
  "title": "Başlık",
  "summary": "En fazla 155 karakterlik meta açıklama",
  "category": "Kategori",
  "author": "MGA Creative Ekibi",
  "link": "https://play.google.com/store/apps/details?id=... (isteğe bağlı)",
  "content": "Markdown gövde: ## ve ### başlıklar, - listeler, **kalın**, [metin](url). Paragraflar \\n\\n ile ayrılır."
}
```

Kurallar: mevcut dosyaları değiştirme/silme; her zaman yeni dosya ekle.
Bir dosya içe alındıktan sonra tekrar alınmaz (silinse bile).
