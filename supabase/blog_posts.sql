-- =====================================================================
-- MGA Creative — Blog yönetimi (Supabase)
-- Supabase panelinde: SQL Editor > New query > bu dosyanın tamamını yapıştır > Run
-- Birden fazla çalıştırılırsa sorun çıkarmaz.
-- =====================================================================

-- 1) Blog tablosu
create table if not exists public.blog_posts (
    id            uuid primary key default gen_random_uuid(),
    slug          text not null unique,
    title         text not null,
    summary       text not null default '',
    category      text not null default 'Mobil Yazılım',
    author        text not null default 'MGA Creative Ekibi',
    image         text not null default '',
    link          text not null default '',
    content       text not null default '',
    read_time     text not null default '',
    status        text not null default 'draft' check (status in ('draft', 'published')),
    published_at  timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
    on public.blog_posts (status, published_at desc);

create or replace function public.blog_posts_touch()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    if new.status = 'published' and new.published_at is null then
        new.published_at = now();
    end if;
    return new;
end $$;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
    before insert or update on public.blog_posts
    for each row execute function public.blog_posts_touch();

-- 2) Kimler yazı ekleyip düzenleyebilir: blog_admins listesindeki kullanıcılar
create table if not exists public.blog_admins (
    user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.blog_admins enable row level security;
-- (blog_admins'e bilerek hiç politika yok: dışarıdan okunamaz/değiştirilemez)

create or replace function public.is_blog_admin()
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.blog_admins where user_id = auth.uid());
$$;

-- Şu an Supabase Auth'ta kayıtlı kullanıcılar (admin panele giriş yaptığın hesap) admin olur.
insert into public.blog_admins (user_id)
select id from auth.users
on conflict do nothing;

-- 3) Güvenlik kuralları (RLS)
alter table public.blog_posts enable row level security;

drop policy if exists "blog: yayindakileri herkes okur" on public.blog_posts;
create policy "blog: yayindakileri herkes okur" on public.blog_posts
    for select using (status = 'published' or public.is_blog_admin());

drop policy if exists "blog: admin ekler" on public.blog_posts;
create policy "blog: admin ekler" on public.blog_posts
    for insert to authenticated with check (public.is_blog_admin());

drop policy if exists "blog: admin gunceller" on public.blog_posts;
create policy "blog: admin gunceller" on public.blog_posts
    for update to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

drop policy if exists "blog: admin siler" on public.blog_posts;
create policy "blog: admin siler" on public.blog_posts
    for delete to authenticated using (public.is_blog_admin());

-- 4) Kapak görselleri için depolama alanı (herkese açık okuma, sadece admin yükler)
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do update set public = true;

drop policy if exists "blog gorsel: admin yukler" on storage.objects;
create policy "blog gorsel: admin yukler" on storage.objects
    for insert to authenticated with check (bucket_id = 'blog' and public.is_blog_admin());

drop policy if exists "blog gorsel: admin gunceller" on storage.objects;
create policy "blog gorsel: admin gunceller" on storage.objects
    for update to authenticated using (bucket_id = 'blog' and public.is_blog_admin());

drop policy if exists "blog gorsel: admin siler" on storage.objects;
create policy "blog gorsel: admin siler" on storage.objects
    for delete to authenticated using (bucket_id = 'blog' and public.is_blog_admin());

-- 5) Mevcut 22 blog yazısının aktarımı (repodaki JSON dosyalarından)
insert into public.blog_posts (slug, title, summary, category, author, image, link, content, read_time, status, published_at) values
($mga$2027-tatil-takvimi-bayram-koprulerini-simdiden-planlamak$mga$, $mga$2027 Tatil Takvimi: Bayram Köprülerini Şimdiden Planlamanın Pratik Yolu$mga$, $mga$2027'de iki bayramı 2'şer gün izinle 9 günlük tatile çevirmek mümkün. Tarihleri, bütçeyi ve planı şimdiden hazırlamanın yolları.$mga$, $mga$Seyahat & Planlama$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/2027-tatil-takvimi-bayram-koprulerini-simdiden-planlamak.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mgacreative.tripmind&pcampaignid=web_share$mga$, $mga$Yıl bitmeden bir sonraki yılın tatil takvimine bakmak erken görünebilir. Ama tatil planlamada en pahalı şey çoğu zaman zamandır: son haftaya kalan kararlar hem seçenekleri daraltır hem de bütçeyi zorlar. 2027 takvimi bu açıdan dikkat çekici, çünkü iki dini bayram köprü izinle uzun bir araya çevrilmeye çok uygun.

## 2027'de öne çıkan iki uzun tatil

- Ramazan Bayramı: Bayram 9–11 Mart (Salı–Perşembe). 8 Mart arife. 8 ve 12 Mart için izin kullanırsanız 6–14 Mart arası 9 günlük bir ara oluşur.
- Kurban Bayramı: Bayram 16–19 Mayıs. 19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı da bu aralığa denk geliyor. 20 ve 21 Mayıs için izin kullanırsanız 15–23 Mayıs arası 9 gün.

Arife günleri yarım gün tatildir ve izin politikaları kuruma göre değişir. Planı kesinleştirmeden önce resmi takvimi ve işvereninizin izin kurallarını teyit edin.

## Erken planlamanın üç faydası

1. Tarih sabit, esneklik sizde. Gideceğiniz yeri, tempoyu ve bütçeyi düşünmek için aylarınız olur.
2. Bütçeyi yaymak kolaylaşır. Toplam maliyeti erkenden tahmin ederseniz aylık birikimi buna göre ayarlarsınız.
3. Karar yorgunluğu azalır. Son hafta "nereye gitsek" tartışması yerine hazır bir taslak üzerinde değişiklik yaparsınız.

## Adım adım: 9 günlük tatili planlamak

1. Tarihleri kesinleştirin. Plan bu izin günleri üzerine kurulur.
2. Tempoyu belirleyin. Dönüş öncesi bir dinlenme günü bırakmak işe dönüşü kolaylaştırır.
3. Bütçe seviyesini seçin. Konaklama ve ulaşım en çok etkileyen kalemlerdir; önce seviyeyi (ekonomik, orta, lüks) seçmek seçenekleri daraltır.
4. İlgi alanlarını yazın. Kültür, yemek, doğa, alışveriş… Grupla gidiyorsanız herkesin bir önceliği olsun.
5. Rezervasyonları tek yerde toplayın. Uçuş kodu, otel onayı ve araç kiralama saati aynı yerde durmalı.
6. Kontrol listesini erken başlatın. Pasaport geçerliliği, priz adaptörü, seyahat sigortası son güne kalmamalı.

## TripMind bu süreçte nasıl yardımcı olur?

TripMind, seçtiğiniz şehir için yapay zeka ile rotalar, aktiviteler ve günlük programlardan oluşan bir taslak plan çıkarır.

- Bütçe seviyesini Ekonomi, Orta veya Lüks olarak seçip tahmini maliyetleri görebilirsiniz.
- Tempoyu "Rahat" ile "Yoğun" arasında ayarlayabilir; Kültür, Yemek, Doğa, Alışveriş gibi ilgi alanlarını belirtebilirsiniz.
- Uçuş, otel ve araç kiralama bilgilerinizi rezervasyon takip bölümünde bir arada tutabilirsiniz.
- Tüm planı PDF olarak kaydedip seyahat arkadaşlarınızla paylaşabilirsiniz.

## Sonuç

2027 tatil takvimi, birkaç gün izinle uzun aralar yaratmaya elverişli. Tarihleri bugün işaretleyip kaba bir taslak çıkarmak, aylar sonra yapılacak işi büyük ölçüde hafifletir. Planın kusursuz olması gerekmiyor; var olması yeterli.

## Kaynaklar

- Kariyer.net — 2027 Resmi Tatil Takvimine Göre İzin Planlaması
- CNN Türk — 2027 resmi tatiller takvimi$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-26 09:00:00+03'),
($mga$agroplan-ile-tarla-ve-maliyet-takibi$mga$, $mga$AgroPlan ile Tarla ve Maliyet Takibi: Kağıt Defterden Cebinize$mga$, $mga$Sulama, ilaçlama, gübreleme ve mazot gibi giderleri tek yerden takip etmenin pratik yolu.$mga$, $mga$Tarım Teknolojileri$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/agroplan-ile-tarla-ve-maliyet-takibi.svg$mga$, $mga$$mga$, $mga$Tarla işi çoğu zaman tarlada bitmez. Hangi parselde ne ekildiği, hangi gün ilaçlama yapıldığı ve mazot ile gübreye ne kadar harcandığı, akşam defterine yazılmadığında kolayca unutulur.

## Tarla işinin dağınık yanı

Üretici için en zor kısım, verinin her yerde olmasıdır. Bir kayıt telefonda, bir fiş cebinde, bir hatırlatma kafadadır. Sezon sonunda gerçek kârı hesaplamaya çalışmak da bu yüzden zorlaşır.

## AgroPlan neyi kolaylaştırıyor?

AgroPlan, çiftçiler için tasarlanmış bir tarla yönetim uygulamasıdır. Uygulamanın temel özellikleri şunlardır:

- **Tarlalarınızı kaydedin:** Sahip olduğunuz ya da kiraladığınız tüm tarlaları tek listede tutun.
- **Bakım ve sulama takibi:** Sulama, ilaçlama ve gübreleme işlemlerini zamanında kaydedin.
- **Maliyet kaydı:** Mazot, tohum, gübre ve işçilik giderlerini girerek gelir ve gider dengesini görün.

## Ne zaman fark yaratır?

Sezon başında ekim planını yaparken, geçen yılın maliyetlerine bakmak işinizi kolaylaştırır. Sezon sonunda ise hangi tarlanın gerçekten kâr ettiğini görmek, bir sonraki yılın kararlarını daha sağlam verdirir.

## Sonuç

Defter tutmak hâlâ değerli bir alışkanlık. Ama dijital bir kayıt, verinin kaybolmasını engeller ve hesabı tarlanın her yerinden yapmanızı sağlar.$mga$, $mga$4 dk okuma$mga$, 'published', '2026-10-30 09:00:00+03'),
($mga$araci-kisa-hazirlamak-kontrol-listesi$mga$, $mga$Aracınızı Kışa Hazırlamak: 7 Maddelik Kontrol Listesi$mga$, $mga$Lastik, akü, antifriz, silecek… Aracınızı kışa hazırlamak için 7 maddelik kontrol listesi ve bakım tarihlerini kaçırmamanın pratik yolu.$mga$, $mga$Araç Bakımı$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/araci-kisa-hazirlamak-kontrol-listesi.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mga.mygarage&pcampaignid=web_share$mga$, $mga$Hava soğumaya başladığında aracınızın davranışı da değişir. Sabah ilk marşta zorlanan bir akü, buğusu kolay geçmeyen camlar, sertleşmiş silecek lastikleri… Bunların çoğu ani arızalar değil, sonbaharda yapılmayan küçük kontrollerin kışın ortaya çıkan sonuçlarıdır. Ekim ve kasım, bu kontrolleri acele etmeden yapmak için en uygun dönemdir.

Not: Aşağıdaki liste genel bir hatırlatmadır; aracınıza özel bakım aralıkları için kullanım kılavuzuna ve servisinize başvurun.

## 1. Lastikler: diş derinliği, yaş ve kış lastiği

Lastiklerin diş derinliğini ve üretim tarihini kontrol edin. 2026-2027 sezonunda ticari araçlar için zorunlu kış lastiği uygulamasının 15 Kasım 2026 – 15 Nisan 2027 tarihleri arasında geçerli olduğu bildiriliyor. Özel otomobiller için ülke genelinde bir zorunluluk yok; ancak valilikler bölgesel kararlar alabiliyor, bu yüzden yaşadığınız ilin duyurularını takip edin.

## 2. Akü

Soğuk hava aküyü en çok zorlayan koşuldur. Akünün kaç yaşında olduğunu ve en son ne zaman test edildiğini bilmiyorsanız servis ziyaretinde akü testini listeye ekleyin.

## 3. Antifriz

Motor soğutma sıvısının seviyesini ve donmaya karşı koruma durumunu kontrol ettirin. Kışın en ucuz ama en çok unutulan kontrollerden biridir.

## 4. Silecekler ve cam suyu

Sertleşmiş ya da iz bırakan silecek lastiklerini değiştirin; cam suyu deposuna kışa uygun cam suyu ekleyin. Görüş, kış sürüşünde güvenliğin temelidir.

## 5. Farlar ve aydınlatma

Günler kısalıyor. Tüm farların, sinyallerin ve fren lambalarının çalıştığından emin olun.

## 6. Yağ değişimi ve periyodik bakım

Son yağ değişiminden bu yana kaç kilometre yaptığınızı tahmin etmek yerine kayıttan kontrol edin. Periyodik bakım yaklaşıyorsa kış öncesine denk getirmek mantıklı olabilir.

## 7. Sigorta ve evrak tarihleri

Kasko ve trafik sigortası yenileme tarihlerini de bu listeye ekleyin. Kışın yolda kalmak istenmeyen bir durumdur.

## Listeyi unutmamak için: Garajım

Liste yapmak kolay; zor olan her yıl aynı dönemde hatırlamaktır. Garajım bu noktada yardımcı olur:

- Özel bakım türleri: "Kış kontrolü", "Lastik değişimi" ya da "Akü testi" gibi kendi bakım türlerinizi ve aralıklarını belirleyebilirsiniz.
- Akıllı gösterge paneli: Kilometre ve tarihleri izleyerek yaklaşan işleri aciliyet sırasıyla gösterir.
- Gecikmiş bakım hatırlatıcıları: Zamanı geçen bakımlar için hatırlatma.
- Bakım geçmişi: Her servis kaydını araç bazında tutar.
- Birden fazla araç: Plaka, kilometre ve araç fotoğrafıyla tüm araçları tek yerden takip edebilirsiniz.
- En yakın servis: Google Haritalar ile en yakın tamirciye yol tarifi alabilirsiniz.
- Arıza kodu açıklaması: Uyarı lambası yanarsa OBD-II kodunu girip belirtiler ve olası çözümleri görebilirsiniz.

## Sonuç

Aracı kışa hazırlamak, bir öğleden sonra ayıracağınız küçük bir iştir; ama zamanında yapılmazsa soğuk bir sabah büyük bir sorun haline gelebilir. Bu yedi maddeyi bu hafta kontrol edin ve bir sonraki kontrol için hatırlatıcı kurun.

Garajım'ı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mga.mygarage&pcampaignid=web_share

## Kaynaklar

- Milli Gazete, "Kış lastiği zorunluluğu 2026-2027 ne zaman başlayacak?" (28.09.2026)$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-15 09:00:00+03'),
($mga$araci-satarken-bakim-gecmisi-kaydi-neden-onemli$mga$, $mga$Aracınızı Satarken Elinizi Güçlendiren Şey: Düzenli Tutulmuş Bakım Geçmişi$mga$, $mga$İkinci el alıcı bakım geçmişini sorar. Servis kayıtlarınızı bugünden düzenli tutmanın pratik yolları.$mga$, $mga$Otomotiv$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/araci-satarken-bakim-gecmisi-kaydi-neden-onemli.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mga.mygarage&pcampaignid=web_share$mga$, $mga$Aracınızı aldığınız gün satacağınız günü pek düşünmezsiniz. Oysa o gün geldiğinde alıcının soracağı sorular bellidir: "Bakımları düzenli yapıldı mı? En son ne zaman yağ değişti? Kilometresi doğru mu?" Bu sorulara verilen cevap, pazarlığın tonunu belirler.

## Alıcılar artık daha fazla sorguluyor

İkinci el araç rehberleri alıcıları belgeye dayalı kontrol yapmaya yönlendiriyor. Yetkili serviste yapılan bakımların sisteme işlendiği, şasi numarası ya da plakayla servisten sorgulanabildiği belirtiliyor. Kilometre bilgisinin muayene kayıtlarıyla doğrulanabildiği de hatırlatılıyor. Kısacası alıcı, sizin sözünüzden çok kayda bakmak istiyor.

## Sorun: Bakımların bir kısmı kayıt dışında kalıyor

Garanti süresi bittikten sonra pek çok araç sahibi bağımsız servise ya da sanayiye gider. Bu bakımlar genellikle elle yazılmış bir fişte, bir WhatsApp fotoğrafında ya da yalnızca hafızada kalır. Satış günü "yaptırmıştık ama fişi bulamıyorum" demek alıcıya güven vermez.

## Bugünden başlayabileceğiniz 5 alışkanlık

1. Her bakımı aynı gün kaydedin. Tarih, kilometre ve yapılan işlem yeterli.
2. Kilometreyi düzenli güncelleyin. Hatırlatmaların doğru çalışması için kilometre temel veridir.
3. Küçük işleri de yazın. Lastik rotasyonu, silecek, akü değişimi… Bu detaylar "aracı önemsemiş" izlenimi bırakır.
4. Fişleri ve faturaları saklayın. Dijital kayıt fiziksel belgenin yerine geçmez; ikisini birlikte tutun.
5. Her araç için ayrı kayıt tutun. Ailede birden fazla araç varsa kayıtları karıştırmayın.

## Satış günü ne değişir?

Düzenli bir geçmişiniz varsa alıcının sorularına tarihle, kilometreyle cevap verirsiniz. Bu satışı garanti etmez; fiyatı tek başına belirlemez. Ama belirsizliği azaltır ve ekspertiz ile servis sorgusuyla tutarlı bir tablo ortaya koyar.

## Garajım bu süreçte nasıl yardımcı olur?

Garajım (My Garage), araç sahipleri için geliştirilmiş bir bakım takip uygulamasıdır.

- Bakım geçmişi: Servis kayıtlarını araç bazında gruplayıp takip edebilir, düzenleyebilir veya silebilirsiniz.
- Çoklu araç: Her araç kendi fotoğrafı, plakası ve kilometre takibiyle ayrı tutulur.
- Özel bakım türleri: Lastik rotasyonundan periyodik kontrollere kendi aralıklarınızı belirleyebilirsiniz.
- Gösterge paneli ve hatırlatıcılar: Kilometre ve tarihe göre yaklaşan ya da geciken bakımları gösterir.

## Sonuç

Bakım geçmişi, satış günü hazırlanan bir şey değil; yıllar içinde biriken bir kayıttır. En iyi başlangıç zamanı, bir sonraki bakımınız.

Garajım'ı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mga.mygarage&pcampaignid=web_share

## Kaynaklar

- Türkiye İş Bankası Blog, "İkinci El Araba Alırken Nelere Dikkat Edilmeli?" (23.03.2026)$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-22 09:00:00+03'),
($mga$cardly-ile-dijital-kartvizit$mga$, $mga$Kağıt Kartvizit Neden Kaybolur? Dijital Kartvizitin Pratik Avantajları$mga$, $mga$Tanıştığınız kişiye kartvizit vermek yerine NFC ya da QR ile bilgilerinizi anında paylaşmanın yolları.$mga$, $mga$Dijital Kartvizit$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/cardly-ile-dijital-kartvizit.png$mga$, $mga$$mga$, $mga$Bir fuarda ya da toplantıda cebinize bakarsanız, kartvizit yığınından çoğu zaman tek bir kart kalır. Verdiğiniz kartların ne kadarının geri döndüğünü de kimse bilmez.

## Kağıdın sorunları

Kağıt kartvizit üç nedenle kaybolur: unutulur, eskir ve değişir. Telefon numaranız ya da unvanınız değiştiğinde, elinizdeki yüzlerce kartın hepsi yanlış hale gelir.

## Dijital kartvizit nasıl çalışır?

Cardly, bilgilerinizi bir vCard olarak paylaşmanızı sağlar. Karşınızdaki kişi telefonunu kartın üzerine dokundurarak (NFC) ya da QR kodu okutarak bilgilerinizi rehberine ekler. Uygulamanın öne çıkan özellikleri:

- **Dinamik QR kodları:** Bilgilerinizi değiştirdiğinizde aynı kod yeni bilgileri gösterir.
- **NFC desteği:** Telefonu dokundurmak yeterlidir.
- **Tek yerden yönetim:** Birden fazla kartvizit oluşturup ihtiyaca göre paylaşabilirsiniz.

## Kime uygun?

Sık müşteri ve iş ortağıyla çalışan, şıklık ve hız isteyen profesyoneller için uygundur. Kağıt israfı da olmaz.

## Sonuç

İyi bir ilk izlenim hâlâ önemli. Dijital kartvizit, bu izlenimi kaybolmayan ve güncel kalan bir bilgiyle destekler.$mga$, $mga$3 dk okuma$mga$, 'published', '2026-10-30 09:00:00+03'),
($mga$chronosnap-ile-fotograflari-takvimde-bulmak$mga$, $mga$Binlerce Fotoğraf Arasında Kaybolmadan: Takvim Düzeninde Anı Yönetimi$mga$, $mga$Galeride dağılan fotoğrafları güne göre düzenleyip anıları tek bir takvimde toplamak.$mga$, $mga$Mobil Yazılım$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/chronosnap-ile-fotograflari-takvimde-bulmak.svg$mga$, $mga$$mga$, $mga$Telefonunuzda binlerce fotoğraf var ama belirli bir günü bulmak için kaydırmak zorunda kalıyorsunuz. Galeri, fotoğrafları çekildikleri tarihe göre gösterir, ama hangi anının hangi günün hikâyesi olduğunu göstermez.

## Sorun: Tarih var, bağlam yok

Bir gün içinde çekilen onlarca fotoğraf, ertesi gün başka fotoğraflarla karışır. Zamanla yalnızca en son çekilenler akılda kalır.

## ChronoSnap yaklaşımı

ChronoSnap fotoğraflarınızı bir takvim düzeninde gösterir. Her güne ait anılar, o günün altında toplanır. Uygulamanın öne çıkan özellikleri:

- **Akıllı takvim arayüzü:** Fotoğraflarınızı gün gün görüntüleyin.
- **Kategori yönetimi:** Anılarınızı konularına göre ayırın.
- **Güvenli yerel depolama:** Fotoğraflarınız cihazınızda saklanır.

## Kimin işine yarar?

Çocuklarının büyümesini takip etmek isteyen aileler, seyahat günlüğü tutanlar ve yıl sonunda kendi yılını gözden geçirmek isteyenler için uygundur.

## Sonuç

Fotoğraf çekmek kolay, ama onları anlamlı bir düzende bulmak zor. Takvim düzeni, anılarınızı yeniden bulmanın en doğal yollarından biridir.$mga$, $mga$3 dk okuma$mga$, 'published', '2026-10-30 09:00:00+03'),
($mga$cookmatch-ile-dolaptan-aksam-yemegi$mga$, $mga$Market Listesi Yerine Dolaptan Plan: Akşam Yemeğine Karar Vermenin Kolay Yolu$mga$, $mga$Evdeki malzemelerle ne pişireceğinize karar vermek, israfı azaltmanın ve stresi düşürmenin pratik bir yolu.$mga$, $mga$Yemek ve Tarif$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/cookmatch-ile-dolaptan-aksam-yemegi.svg$mga$, $mga$$mga$, $mga$Akşam olduğunda herkes aynı soruyu sorar: Bugün ne pişirsem? Dolapta bir şeyler vardır ama hangileriyle ne yapılacağı belli değildir. Sonuçta ya market alışverişi yapılır ya da sipariş verilir.

## Sorun: Çok seçenek, az karar

İnternette binlerce tarif var. Sonsuz kaydırma, karar vermeyi zorlaştırır ve çoğu zaman yemek yerine vazgeçilir.

## CookMatch ne yapar?

CookMatch, evde var olan malzemelerle yapılabilecek tarifleri önerir. Kullanım mantığı sadedir:

1. Evdeki malzemeleri seçin.
2. Bu malzemelerle yapılabilecek tarifleri keşfedin.
3. Beğendiklerinizi çevrimdışı favorilerinize ekleyin.

## Neden faydalı?

Dolapta duran malzemeler kullanılır, gereksiz alışveriş azalır. Ayrıca her akşam aynı yemeği yapma alışkanlığı da kırılır.

## Sonuç

Haftalık bir plan yapmak yerine, dolabınıza bakarak karar vermek hem zamandan hem paradan tasarruf ettirir. Bunu bir uygulamaya bırakmak da mümkün.$mga$, $mga$3 dk okuma$mga$, 'published', '2026-10-30 09:00:00+03'),
($mga$dailyleaf-ile-gunluk-aliskanlik$mga$, $mga$Günde Bir Satır: Küçük Bir Günlük Alışkanlığı Nasıl Kurarsınız?$mga$, $mga$Kısa günlük notları ve 21 günlük alışkanlık takibiyle gün sonunu sakin bir ritüele dönüştürmek.$mga$, $mga$Kişisel Gelişim$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/dailyleaf-ile-gunluk-aliskanlik.svg$mga$, $mga$$mga$, $mga$Günlük tutmak fikri güzeldir ama çoğu zaman uzun sürmez. Boş bir sayfa karşısında ne yazılacağını bilmemek, alışkanlığı bir haftada bitirebilir.

## Küçük başlamak neden işe yarar?

Her gün bir satır yazmak bile, zamanla bir arşive dönüşür. Önemli olan yazı uzunluğu değil, süreklilik.

## DailyLeaf nasıl yardımcı olur?

DailyLeaf, kişisel notlarınızı estetik bir günlük formatında tutmanızı sağlar. Öne çıkan özellikleri:

- **Kişisel notlar:** Günlük düşüncelerinizi kaydedin, bulut senkronizasyonu ile farklı cihazlarda erişin.
- **21 günlük alışkanlık takibi:** Bir alışkanlığı üç haftada kendinize kazandırmak için adım adım ilerleyin.
- **Görsel sadelik:** Vintage bir kağıt dokusuyla, yazmayı keyifli hale getirir.

## Nasıl başlanır?

İlk hafta yalnızca bir satır yazın. İkinci hafta, akşam beş dakikanızı ayırın. Üçüncü haftada alışkanlığın kendiliğinden oluştuğunu fark edebilirsiniz.

## Sonuç

Günün sonunda bir satır yazmak, yıl sonunda dönüp bakabileceğiniz bir hafıza bırakır.$mga$, $mga$3 dk okuma$mga$, 'published', '2026-10-30 09:00:00+03'),
($mga$dijital-tarimda-verimlilik-ve-tarla-yonetimi$mga$, $mga$Dijital Tarımda Verimlilik: AgroPlan ile Tarla ve Finans Yönetimi Nasıl Yapılır?$mga$, $mga$Geleneksel tarımsal üretim süreçlerinin dijitalleşmesi, gübreleme, sulama ve hasat maliyetlerinin akıllı telefonlardan takibinin getirdiği kâr artışı.$mga$, $mga$Tarım Teknolojileri$mga$, $mga$Gökhan Azat$mga$, $mga$images/aproplan_detay.png$mga$, $mga$$mga$, $mga$Tarım sektörü, artan girdi maliyetleri (mazot, tohum, gübre, ilaçlama) ve iklim koşulları nedeniyle her dönümün hesaplanmasını zorunlu kılmaktadır. Geleneksel defter tutma yöntemleri, sezon sonunda çiftçinin gerçek kâr/zarar durumunu görmesini engellemektedir.

### AgroPlan ile Neler Değişiyor?
1. **Arazi ve Parsel Dijitalleştirmesi:** Sahip olunan veya kiralanan tüm tarlalar dönüm ve ürün türüne göre haritalandırılır.
2. **Periyodik Bakım & Sulama Hatırlatıcıları:** İlaçlama ve sulama periyotları zamanında yapılarak ürün kaybı önlenir.
3. **Maliyet ve Kâr Analizi:** Sezon boyunca yapılan tüm harcamalar kaydedilir, hasat satışı yapıldığında net kâr grafiği anında elde edilir.
4. **Çevrimdışı (Offline) Çalışma:** Tarlada internet çekmese dahi kayıtlar yerel veritabanında güvenle tutulur, internet bağlantısı sağlandığında buluta senkronize edilir.

### Geleceğin Tarım Yönetimi
Dijital tarım araçları artık lüks değil; maliyetlerini kontrol altında tutmak ve kazancını artırmak isteyen her üretici için vazgeçilmez bir ihtiyaçtır.$mga$, $mga$4 dk okuma$mga$, 'published', '2026-08-15 09:00:00+03'),
($mga$doktor-kontrolune-giderken-ilac-takibi-hazirligi$mga$, $mga$Doktor Kontrolüne Giderken İlaç Takibinizi Nasıl Hazırlarsınız?$mga$, $mga$Kontrol randevusunda ilaç kullanım düzeninizi net anlatmak için pratik hazırlık adımları ve ilaç geçmişi tutmanın kolay yolu.$mga$, $mga$Sağlıklı Yaşam / Dijital Araçlar$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/doktor-kontrolune-giderken-ilac-takibi-hazirligi.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mga.ilacsaatim$mga$, $mga$Not: Bu yazı tıbbi tavsiye değildir. İlacınızı doktorunuzun önerdiği şekilde kullanın; ilacınızla ilgili her soruyu doktorunuza veya eczacınıza danışın.

Kontrol randevusundasınız. Doktorunuz soruyor: "İlaçlarınızı düzenli kullanabildiniz mi?" Çoğumuzun cevabı benzer: "Genelde evet… birkaç gün atlamış olabilirim." Bu belirsizlik kimsenin kusuru değil; günlük hayatın yoğunluğunda bir ilacı hangi gün ve saatte aldığımızı haftalar sonra hatırlamak zordur.

Dünya Sağlık Örgütü'nün 2003 yılında yayımladığı bir raporda, gelişmiş ülkelerde kronik hastalığı olan hastalarda tedaviye uyumun ortalama yalnızca %50 düzeyinde olduğu belirtiliyor. İlaçları önerildiği gibi kullanmak pek çok insan için günlük bir zorluk.

## 1. Kullandığınız ilaçların güncel listesini çıkarın

İlaçların adını ve size söylenen kullanım sıklığını bir yerde toplayın. Listeyi kendiniz değiştirmeyin; yalnızca size önerileni kaydedin.

## 2. Kayıt tutun, hafızaya güvenmeyin

"Hatırlıyorum" demek ile "kaydım var" demek arasında büyük fark vardır. Her dozun alındığı bilgisini bir yerde tutmak, geriye dönüp bakmanızı sağlar.

## 3. Atladığınız günleri gizlemeyin

Bazı günler doz atlanabilir; bu insani bir durumdur. Önemli olan bunu doktorunuzla açıkça paylaşmaktır. Doğru bilgi, doktorunuzun sizin için en uygun değerlendirmeyi yapmasına yardımcı olur.

## 4. Sorularınızı önceden not edin

Randevu sırasında aklınıza gelmeyen soruları evde not edin. Unuttuğunuzda ne yapmanız gerektiği gibi konuları doktorunuza veya eczacınıza sorun.

## 5. Bakım veren biri varsa onu da sürece katın

Ebeveyninizin ya da yakınınızın ilaç takibine yardım ediyorsanız, kontrol öncesinde onunla birlikte kayıtlara bakmak randevuda daha net bir tablo sunmanızı sağlar.

## İlaç Saatim bu süreçte nasıl yardımcı olur?

İlaç Saatim, kişisel bir ilaç saati hatırlatıcısı ve takip aracıdır; tıbbi teşhis veya tedavi tavsiyesi vermez.

- Kolay ilaç ve periyot ekleme: Doktorunuzun önerdiği sıklığa uygun periyodu seçersiniz.
- Tam ekran sesli alarm: Zamanı geldiğinde haber verir; o an müsait değilseniz erteleyebilirsiniz.
- Sıradaki ilaç kartı: Ana panelde bir sonraki dozunuzu görürsünüz.
- Detaylı geçmiş ve günlük raporlar: Kontrol öncesi en işe yarayan kısım burasıdır.

## Randevu öncesi 5 dakikalık kontrol listesi

- İlaç listem güncel mi?
- Son haftalardaki geçmişime baktım mı?
- Atladığım ya da ertelediğim günleri not ettim mi?
- Doktoruma soracağım soruları yazdım mı?
- Bakım veren bir yakınım varsa onunla konuştum mu?

## Sonuç

Kontrol randevusu birkaç dakikalık bir görüşmedir; bu dakikaları en verimli kullanmanın yolu doğru bilgiyle gitmekten geçer. Unutmayın: kararlar her zaman doktorunuzla birlikte verilir.

İlaç Saatim'i indirin: https://play.google.com/store/apps/details?id=com.mga.ilacsaatim

## Kaynaklar

- Dünya Sağlık Örgütü (WHO), "Failure to take prescribed medicine for chronic diseases is a massive, world-wide problem", 1 Temmuz 2003$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-19 09:00:00+03'),
($mga$fiyatlar-degisirken-teklifte-sik-yapilan-6-hata$mga$, $mga$Fiyatlar Her Ay Değişirken Teklifte Sık Yapılan 6 Hata (ve Kolay Çözümleri)$mga$, $mga$Geçerlilik süresi, KDV, kapsam… Fiyatların hızla değiştiği dönemde teklifte sık yapılan 6 hatayı ve pratik çözümlerini derledik.$mga$, $mga$B2B Çözümler$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/fiyatlar-degisirken-teklifte-sik-yapilan-6-hata.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mgacreative.modigo&pcampaignid=web_share$mga$, $mga$Bir teklif gönderdiğinizde müşteriye aslında şunu söylersiniz: "Bu işi, bu kapsamda, bu fiyata, şu koşullarla yaparım." Fiyatlar sabitken bu cümlenin bazı kısımları eksik kalsa da sorun çıkmayabilir. Ama fiyatların her ay değiştiği bir ortamda eksik bırakılan her satır, ileride bir tartışmaya dönüşebilir.

TÜİK'in açıkladığı verilere göre eylül ayında tüketici fiyatları aylık %1,84, yıllık %29,73 arttı. Malzeme, işçilik ve nakliye maliyetleri kısa aralıklarla güncelleniyor. Bu yazıda sahada çalışan esnaf ve küçük işletmelerin tekliflerinde en sık gördüğümüz altı hatayı topladık.

## Hata 1: Geçerlilik süresi yazmamak

İki ay önce verdiğiniz teklifle müşteri bugün geri dönüyor ve "Anlaştık, başlayalım" diyor. Arada malzeme fiyatınız değişti. Teklifte geçerlilik süresi yoksa, eski fiyatı kabul etmek ya da müşteriyi kırmak arasında kalırsınız.

Çözüm: Her teklifin altına net bir geçerlilik tarihi yazın. "Bu teklif X tarihine kadar geçerlidir" cümlesi müşteriye de karar vermesi için doğal bir çerçeve sunar.

## Hata 2: KDV durumunu belirtmemek

"Toplam 48.000 TL" yazan bir teklif, müşteri için KDV dahil, sizin için KDV hariç olabilir. Aradaki fark ödeme günü tatsız bir konuşmaya yol açar.

Çözüm: Toplamın yanında KDV'nin dahil mi hariç mi olduğunu açıkça yazın. Ara toplam, KDV ve genel toplamı ayrı satırlarda gösterin.

## Hata 3: Kapsamı yalnızca "dahil olanlarla" tanımlamak

Montaj, nakliye, söküm, moloz atımı, keşif ücreti… Bunlar yazılmadığında müşteri çoğunlukla "dahil" varsayar.

Çözüm: Teklifin sonuna kısa bir "Dahil olmayanlar" bölümü ekleyin. Üç beş maddelik bir liste, iş bitiminde çıkabilecek tartışmaları büyük ölçüde önler.

## Hata 4: Görsel eklememek

Tadilat, mobilya, tabela, doğrama gibi işlerde müşterinin kafasındaki resim ile sizin teklif ettiğiniz iş farklı olabilir. Yazıyla "beyaz PVC, çift cam" demek her zaman aynı şeyi anlatmaz.

Çözüm: Teklife ürün fotoğrafı ya da iş yapılacak alanın fotoğrafını ekleyin.

## Hata 5: Önceki teklifleri kaybetmek

Aynı müşteri altı ay sonra benzer bir iş için tekrar arıyor ve geçen seferki fiyatı hatırlamıyorsunuz.

Çözüm: Teklifleri müşteri kaydıyla birlikte saklayın. Bir müşteriye ne zaman, hangi fiyatı verdiğinizi birkaç saniyede görebilmek fiyat güncellemesini gerekçesiyle açıklamanızı kolaylaştırır.

## Hata 6: Onaylanan teklifi proforma için yeniden yazmak

Müşteri onay verdi; şimdi proforma fatura gerekiyor. Aynı kalemleri ikinci kez elle yazmak zaman kaybıdır ve rakam hatası riskini artırır.

Çözüm: Teklif ve proformayı aynı bilgilerden üretebileceğiniz bir düzen kurun.

## DealDraft bu hataları azaltmaya nasıl yardımcı olur?

- Dakikalar içinde logolu PDF teklif ve proforma fatura hazırlarsınız.
- Tekliflere ürün görselleri veya iş alanı fotoğrafları ekleyebilirsiniz.
- Müşteri bilgilerinizi tek merkezde tutarsınız; aynı müşteriye yeni teklif hazırlarken baştan başlamazsınız.
- Verileriniz bulutta senkronize edilerek saklanır.

## Sonuç

Fiyatların değiştiği dönemlerde en çok kaybettiren şey çoğu zaman yanlış fiyat değil, eksik yazılmış koşullardır. Geçerlilik süresi, KDV durumu, kapsam dışı kalemler, görsel ve teklif geçmişi… Bu altı maddeyi alışkanlık hâline getirin.

DealDraft'ı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mgacreative.modigo&pcampaignid=web_share

## Kaynaklar

- Anadolu Ajansı, "Enflasyon rakamları açıklandı" (TÜİK Eylül 2026 TÜFE)$mga$, $mga$6 dk okuma$mga$, 'published', '2026-10-06 09:00:00+03'),
($mga$google-play-kapali-test-12-test-kullanicisi-takip$mga$, $mga$Google Play Kapalı Test Süreci: 12 Test Kullanıcısını 14 Gün Boyunca Takip Etmek$mga$, $mga$Yeni kişisel geliştirici hesaplarında zorunlu kapalı testi düzenli yönetin: test kullanıcısı listesi, iletişim, görev şablonu ve takip ipuçları.$mga$, $mga$Mobil Uygulama Geliştirme$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/google-play-kapali-test-12-test-kullanicisi-takip.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mga.appflow&pcampaignid=web_share$mga$, $mga$Uygulamanızı bitirdiniz, mağaza görsellerini hazırladınız ve yayına almaya hazırsınız. Ama Google Play'de yeni bir kişisel geliştirici hesabıyla çalışıyorsanız, üretime geçmeden önce bir aşama daha var: kapalı test.

Google'ın Play Console yardım sayfasına göre, 13 Kasım 2023'ten sonra oluşturulan kişisel geliştirici hesapları, üretim erişimine başvurmadan önce en az 12 test kullanıcısının kesintisiz en az 14 gün boyunca katıldığı bir kapalı test yürütmek zorundadır. Test süresince ayrılan bir test kullanıcısı 12 kişiye sayılmaz; sonradan yeniden katılırsa 14 günün onun için ardışık olması gerekir.

## Kapalı test neden dağınıklaşır?

Test kullanıcıları farklı kanallardan gelir: arkadaşlar, iş çevresi, topluluk grupları. Birkaç gün sonra şu sorular birikir: Kimi davet ettim, kim gerçekten katıldı? Kim ayrıldı, kime hatırlatma yapmam lazım? Kimden geri bildirim geldi?

## Adım adım düzenli bir kapalı test

1. Listeyi önce oluşturun. Adaylarınızı adı ve iletişim bilgisiyle tek bir yerde toplayın. 12'nin biraz üzerinde aday belirlemek olası ayrılmalara karşı pay bırakır.
2. Davet ve katılım durumunu ayırın. "Davet edildi" ile "katıldı" aynı şey değildir.
3. Başlangıç tarihini işaretleyin. 14 günün ne zaman dolacağını bilmek başvuruyu planlamayı kolaylaştırır.
4. Ara hatırlatma planlayın. Testin ortasında kısa bir teşekkür ve hatırlatma mesajı kullanıcıların testte kalmasına yardımcı olabilir.
5. Geri bildirimi kayda geçirin. Gelen hata bildirimlerini görev olarak projeye ekleyin.
6. Süreci tekrar kullanılabilir yapın. Birden fazla uygulama geliştiriyorsanız aynı adımları her seferinde baştan yazmayın.

## Projexia bu süreçte nasıl yardımcı olur?

Projexia bir proje takip, görev ve finans yönetimi uygulamasıdır; kapalı test gibi süreçlerde özellikle iletişim ve görev tarafında işe yarar.

- Test kullanıcısı ve iletişim yönetimi: Projelerinizle ilgili kişileri projenin içinde kaydedebilir, WhatsApp üzerinden hızla iletişim kurabilir ve listeyi CSV olarak dışa aktarabilirsiniz.
- Görev listeleri ve şablonlar: Kapalı test adımlarını bir kez şablon olarak hazırlayıp sonraki uygulamada yeniden kullanabilirsiniz.
- İlerleme takibi: Her projenin ilerlemesini yüzdesel olarak görürsünüz.

## Örnek kapalı test şablonu

- Test kullanıcısı adaylarını listele
- Kapalı test kanalını Play Console'da hazırla
- E-posta listesini ekle ve davetleri gönder
- Katılımları teyit et
- Test başlangıç tarihini not et
- Ara hatırlatma mesajı gönder
- Geri bildirimleri görevlere dönüştür
- 14 gün dolduğunda üretim erişimine başvur

## Sonuç

Kapalı test, yeni geliştiriciler için zorunlu bir aşama; ama karmaşa olmak zorunda değil. Güncel şartlar zaman zaman değişebildiği için yayına çıkmadan önce Play Console yardım sayfasını kontrol edin.

Projexia'yı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mga.appflow&pcampaignid=web_share

## Kaynaklar

- Play Console Yardım — App testing requirements for new personal developer accounts$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-19 09:00:00+03'),
($mga$hassas-belgeleri-internete-yuklemeden-pdf-yapma$mga$, $mga$Kimliğinizi İnternete Yüklemeden PDF'e Çevirmek: Hassas Belgeler İçin Rehber$mga$, $mga$Kimlik, dekont, sözleşme gibi belgeleri online dönüştürücüye yüklemeden PDF'e çevirme, sıkıştırma ve boyutlandırma için pratik rehber.$mga$, $mga$Verimlilik / Dijital Güvenlik$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/hassas-belgeleri-internete-yuklemeden-pdf-yapma.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.inkvera.formex&pcampaignid=web_share$mga$, $mga$Bir iş başvurusu, kira sözleşmesi, okul kaydı ya da sigorta işlemi… Hepsinin ortak bir cümlesi var: "Belgeleri PDF olarak yükleyin." Çoğumuz arama motoruna "jpg pdf çevir" yazıp ilk çıkan siteyi kullanıyoruz. Dosya birkaç saniyede dönüşüyor, iş bitiyor. Ama genellikle sormadığımız bir soru var: Dönüştürmek için yüklediğim kimlik fotoğrafı şimdi nerede?

## Online dönüştürücüler nasıl çalışır?

Web tabanlı dönüştürme araçlarının büyük kısmı dosyanızı kendi sunucusuna alır, orada dönüştürür ve size bir indirme bağlantısı verir. Kullanıcı olarak dosyanın ne kadar süre saklandığını, kimin erişebildiğini çoğu zaman bilemezsiniz.

## Hangi belgeler hassas sayılmalı?

- Kimlik kartı, pasaport, ehliyet fotoğrafları
- Banka dekontları ve hesap özetleri
- Maaş bordrosu, iş sözleşmesi
- Kira ve satış sözleşmeleri
- Sağlık raporları
- Islak imzalı formların taranmış halleri

## Güvenli dönüştürme için 5 pratik alışkanlık

1. Önce soruyu sorun: Bu dosyayı bir sunucuya göndermem gerekiyor mu, yoksa telefonda halledebilir miyim?
2. Fotoğrafı düzgün çekin: Belgeyi düz bir zemine koyun, gölge düşürmeyin, dört köşesi kadrajda olsun.
3. Birden fazla sayfayı tek PDF'de toplayın: Kimliğin ön ve arka yüzü tek belgede birleşsin.
4. Boyutu yükleme öncesi kontrol edin: Birçok sistemin dosya boyutu sınırı vardır.
5. İş bittiğinde temizleyin: Galeri ve indirilenler klasöründe kalan kimlik fotoğraflarını gereksizse silin.

## Formex bu süreçte nasıl yardımcı olur?

Formex, dosya dönüştürme işini telefondan hiç çıkarmadan yapmanızı sağlar. Uygulama internet olmadan çalışır; dosyalarınız hiçbir sunucuya yüklenmez.

- Görüntüden PDF'ye: Birden fazla fotoğrafı tek PDF'e dönüştürebilirsiniz. Kimliğin ön ve arka yüzü tek dosyada.
- PDF sıkıştırma: Başvuru sistemi büyük dosyayı kabul etmiyorsa PDF'i küçültebilirsiniz.
- Görüntü sıkıştırma ve boyutlandırma: Kaliteyi koruyarak boyutu azaltabilirsiniz.
- JPG, PNG, WEBP dönüştürme: Sistem belirli bir format istiyorsa geçiş yapabilirsiniz.
- Dosya Bilgileri ve Dosya Türü Algılayıcı: Yüklemeden önce boyutu, türü ve gerçek formatı kontrol edersiniz.

## Sonuç

Dosya dönüştürmek birkaç saniyelik bir iş; ama dönüştürdüğümüz belgeler çoğu zaman hayatımızın en kişisel kayıtları. "Hangi siteye yükleyeyim?" sorusunu "Yüklemem gerekiyor mu?" sorusuyla değiştirmek küçük ama önemli bir alışkanlıktır.

Formex'i Google Play'den indirin: https://play.google.com/store/apps/details?id=com.inkvera.formex&pcampaignid=web_share$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-14 09:00:00+03'),
($mga$kiler-ve-dolap-stok-takibi-mukerrer-alisveris$mga$, $mga$"Evde Var mıydı?" Sorusuna Son: Kiler ve Dolap Stokunu Takip Ederek Mükerrer Alışverişi Önlemek$mga$, $mga$Aynı ürünü iki kez almak ve biteni fark etmemek bütçeyi zorluyor. Ev stokunu takip etmenin 6 pratik adımı.$mga$, $mga$Mobil Yazılım$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/kiler-ve-dolap-stok-takibi-mukerrer-alisveris.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mgacreative.familyos&pcampaignid=web_share$mga$, $mga$Hepimizin başına gelmiştir. Market rafının önünde durup deterjanın, salçanın ya da kâğıt havlunun evde olup olmadığını hatırlamaya çalışırız. Emin olamayınca ya "olsun, yine alayım" deriz ya da "vardır herhalde" deyip geçeriz. İlk durumda dolapta aynı üründen birkaç tane birikir; ikincisinde ise ürün tam ihtiyaç anında evde olmaz.

TÜİK'in açıkladığı verilere göre Eylül 2026'da gıda ve alkolsüz içecekler grubundaki yıllık artış %27,62 oldu. Fiyatların hızla değiştiği dönemlerde bu küçük kararlar bütçede fark edilir hale geliyor.

## Adım 1: Her şeyi değil, sık alınanları takip edin

Önce en sık aldığınız 10-15 ürünü seçin: deterjan, tuvalet kâğıdı, yağ, pirinç, makarna, salça gibi. Takibi kolay liste, uzun süre kullanılan listedir.

## Adım 2: Her ürün için bir "alt sınır" belirleyin

"Bitince alırım" yerine "şu miktara düşünce alırım" demek, ürünün tam ihtiyaç anında bitmesini önler. Örneğin tuvalet kâğıdında 4 rulo, deterjanda 1 şişe sınır olabilir.

## Adım 3: Kileri ve dolapları tek bir listeye bağlayın

Mutfak dolabı, banyo dolabı, balkondaki depo… Hepsini tek bir listede toplamak "balkonda da vardı" sürprizlerini önler.

## Adım 4: Alışveriş listesini hafızadan değil, stoktan yazın

Liste, alt sınırın altına düşen ürünlerden oluşsun. Böylece liste gerçek ihtiyacı yansıtır ve "indirimde görünce aldım" türü kararlar azalır.

## Adım 5: Listeyi evdeki herkesle paylaşın

Markete kim giderse gitsin aynı listeyi görmesi, aynı ürünün iki kişi tarafından alınmasını önler. Kalabalık ailelerde mükerrer alışverişin en yaygın sebebi budur.

## Adım 6: Ayda bir kısa kontrol yapın

Ayda bir kez 10 dakika ayırıp dolaplara bakın; kayıtlarla gerçek durumu eşitleyin.

## Sık yapılan üç hata

- İlk gün her şeyi kaydetmeye çalışmak: Uzun liste birkaç hafta sonra güncellenmez olur.
- Sınırları çok düşük belirlemek: Ürün listeye düştüğünde aslında bitmiş olur.
- Toplu alımları kayda geçirmemek: Sistem ürünün azaldığını sanır ve liste güvenilirliğini kaybeder.

## FamilyOS bu süreçte nasıl yardımcı olur?

- Temizlik malzemelerinizin ve mutfak ürünlerinizin miktarını izler.
- Miktar limitin altına düştüğünde sizi uyarır ve alışveriş listesi oluşturur.
- Evdeki her türlü eşyayı ekleyebilir, hangi odada durduğunu not edebilirsiniz.
- Kayıtlarınız hesabınıza bağlıdır; telefondan veya bilgisayardan erişebilirsiniz.

## Sonuç

Ev bütçesinde tasarruf çoğu zaman büyük kararlardan değil, tekrar eden küçük kararlardan gelir. En sık aldığınız ürünleri seçin, her biri için bir alt sınır belirleyin ve alışveriş listenizi stoktan oluşturun.

FamilyOS'u Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mgacreative.familyos&pcampaignid=web_share

## Kaynaklar

- Forbes Türkiye, "TÜİK Eylül enflasyonunu açıkladı" (gıda ve alkolsüz içecekler yıllık %27,62)$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-13 09:00:00+03'),
($mga$modern-mobil-uygulama-gelistirme-kotlin-jetpack-compose$mga$, $mga$2026'da Modern Mobil Uygulama Geliştirme: Kotlin & Jetpack Compose Neden Tercih Edilmeli?$mga$, $mga$Android ekosisteminde bildirimli UI (Declarative UI) devrimi, yüksek performanslı mimariler ve Clean Architecture standartlarının uygulama başarısındaki kritik rolü.$mga$, $mga$Mobil Yazılım$mga$, $mga$MGA Creative Mühendislik Ekibi$mga$, $mga$images/agroplan_detay.png$mga$, $mga$$mga$, $mga$Modern mobil yazılım dünyasında kullanıcı deneyimi, hız ve kararlılık her zamankinden daha belirleyicidir. Google'ın Android için geliştirdiği modern UI araç seti **Jetpack Compose**, klasik XML tabanlı arayüz geliştirme yaklaşımını tamamen geride bıraktı.

### Declarative UI (Bildirimli Arayüz) Gücü
Geleneksel arayüz geliştirmede görünüm durumunu (state) elle senkronize etmek zorundayken, Jetpack Compose ile durum değiştikçe arayüz otomatik olarak yeniden çizilir (recomposition). Bu mimari:
- **%40 daha az kod:** XML dosyaları ve boilerplate bağlama kodları ortadan kalkar.
- **Hızlı geliştirme döngüsü:** Canlı önizleme ve modüler bileşen yapısı sayesinde tasarım anında test edilir.
- **Daha az çökme (Crash-Free):** Kotlin'in Type Safety ve Null Safety özellikleri sayesinde çalışma zamanı hataları minimize edilir.

### Clean Architecture & StateFlow ile Kararlılık
MGA Creative olarak geliştirdiğimiz tüm Android projelerinde (Hotel OS, AgroPlan, Cardly) **Clean Architecture** prensiplerini uyguluyoruz. Veri katmanı (Data), iş mantığı (Domain) ve arayüz katmanı (Presentation) birbirinden bağımsız inşa edilerek uzun vadeli bakım kolaylığı sağlanır.

### Sonuç ve 2026 Vizyonu
2026 yılında kurumsal ölçekte bir mobil uygulama geliştirmeyi hedefliyorsanız, Kotlin & Jetpack Compose ikilisi hem performans hem de geliştirme hızı açısından altın standarttır.$mga$, $mga$5 dk okuma$mga$, 'published', '2026-08-18 09:00:00+03'),
($mga$pdf-imza-e-imza-mi-dijital-imza-guvenli-elektronik-imza-farki$mga$, $mga$PDF'e Çizdiğim İmza E-İmza mı? Dijital İmza ile Güvenli Elektronik İmza Arasındaki Fark$mga$, $mga$Telefonda PDF'e attığınız imza ile güvenli e-imza aynı şey mi? 5070 sayılı Kanun çerçevesinde fark ve günlük kullanım için pratik öneriler.$mga$, $mga$Dijital Belge$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/pdf-imza-e-imza-mi-dijital-imza-guvenli-elektronik-imza-farki.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.inkvera.app&pcampaignid=web_share$mga$, $mga$"Belgeyi imzalayıp PDF olarak gönderir misiniz?" Bu istek iş hayatında artık çok sık. Çoğumuzun ilk tepkisi ya yazıcıyı aramak ya da telefonda imzayı çizip göndermek oluyor. Peki bu çizilmiş imza, "e-imza" ile aynı şey mi?

Not: Bu yazı genel bilgilendirme amaçlıdır, hukuki danışmanlık değildir. Önemli işlemlerde bir hukukçuya danışın.

## Mit: "Dijital ortamda atılan her imza e-imzadır"

Günlük dilde "e-imza", "dijital imza", "elektronik imza" birbirinin yerine kullanılıyor. Ancak 5070 sayılı Elektronik İmza Kanunu özel bir kategori tanımlıyor: güvenli elektronik imza. Bu imza; imza sahibine münhasıran bağlı olmalı, yalnızca imza sahibinin tasarrufundaki araçla oluşturulmalı, nitelikli elektronik sertifikaya dayanarak kimliği tespit edilebilmeli ve imzalanmış veride sonradan değişiklik yapılıp yapılmadığını gösterebilmelidir.

## Gerçek: Islak imzaya eşdeğer olan güvenli elektronik imzadır

Kanunun 5. maddesine göre güvenli elektronik imza, elle atılan imza ile aynı hukuki sonucu doğurur. Ancak kanunların resmi şekle ya da özel bir merasime tabi tuttuğu işlemler ile banka teminat mektupları dışındaki teminat sözleşmeleri bu yolla yapılamaz.

Ekranda parmakla çizilen veya görsel olarak eklenen bir imza ise bu şartları tek başına karşılamaz. Bu, onun işe yaramadığı anlamına gelmez; yalnızca her belgede ıslak imza yerine geçeceğini varsaymamak gerekir.

## Çizilmiş dijital imza nerede işinizi görür?

- Kurum içi onay ve talep formları
- Teslim tutanakları, katılım ve başvuru formları
- Karşı tarafın "imzalı PDF gönderin" dediği günlük yazışmalar
- Taslak sözleşmelerde paraf ve not alma

Bu belgelerde yazdır–imzala–tara–gönder döngüsü yerine PDF'i doğrudan telefonda imzalamak ciddi zaman kazandırır.

## İmzalamadan önce 4 soru

1. Bu belge resmi şekle tabi mi? Noter, tapu gibi işlemlerde dijital imza yeterli değildir.
2. Karşı taraf hangi imza türünü istiyor? "Islak imzalı asıl", "güvenli e-imza" ve "imzalı PDF" farklı taleplerdir.
3. Belgenin son hali bu mu? İmzadan önce metni ve doldurulan alanları kontrol edin.
4. İmzalı kopyayı nerede saklayacaksınız? Hem kendinizde tutun hem de ilgili kişiyle paylaşın.

## Inkvera bu süreçte nasıl yardımcı olur?

Inkvera, Android cihazınızda PDF'lerle çalışmak için tasarlanmış bir PDF düzenleyici ve imza uygulamasıdır.

- İmzanızı bir kez oluşturup ihtiyaç duyduğunuzda yeniden kullanabilirsiniz.
- PDF formlarını doldurabilir, yeni metin kutuları ekleyebilirsiniz.
- Belge üzerinde çizim yapabilir, metinleri vurgulayabilir ve not ekleyebilirsiniz.
- Düzenlediğiniz PDF'i yüksek kalitede kaydedip e-posta, bulut depolama ya da mesajlaşma uygulamalarıyla paylaşabilirsiniz.

Inkvera'daki imza, günlük iş akışındaki belgeler içindir; nitelikli elektronik sertifikaya dayalı güvenli elektronik imzanın yerine geçmez. Belgenin bunu gerektirip gerektirmediğini karşı taraftan teyit etmek en sağlıklı yoldur.

## Sonuç

"E-imza" kelimesi günlük dilde geniş kullanılsa da hukuken ıslak imzaya eşdeğer olan, nitelikli sertifikaya dayanan güvenli elektronik imzadır. Bunu bilmek, hangi belgede hızlı bir dijital imzanın yeterli olduğunu ayırt etmenizi sağlar.

Inkvera'yı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.inkvera.app&pcampaignid=web_share

## Kaynaklar

- 5070 sayılı Elektronik İmza Kanunu (mevzuat.gov.tr), m.4 ve m.5
- Erdem & Erdem, "Türk ve Alman Hukukunda Elektronik İmza"$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-26 09:00:00+03'),
($mga$telefon-cekmiyorsa-gps-calisir-mi-rota-kaydi-yanilgilari$mga$, $mga$Telefon Çekmiyorsa GPS Çalışır mı? Rota Kaydıyla İlgili 5 Yanılgı$mga$, $mga$Çekim olmayan yolda GPS çalışır mı? Uydu ile internet farkını, rota kaydında sık yapılan hataları ve yola çıkmadan yapılacak kontrolleri öğrenin.$mga$, $mga$Seyahat & Mobil Uygulamalar$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/telefon-cekmiyorsa-gps-calisir-mi-rota-kaydi-yanilgilari.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.viano.route.tracer&pcampaignid=web_share$mga$, $mga$Dağ yoluna saptınız, ekranın köşesinde "Servis yok" yazısı belirdi. Çoğumuzun aklından aynı şey geçer: "Konum da gitti, rota kaydı da durdu." Bu düşünce yüzünden pek çok kişi en güzel rotalarını hiç kaydetmeden geçer. Oysa telefonunuzun konumu nasıl bulduğunu bilince tablo değişiyor.

## Yanılgı 1: "GPS internetle çalışır"

Gerçek: GPS alıcısı konumu uydulardan gelen sinyallerle hesaplar. Telefonunuzdaki GPS alıcısı da uydu sinyalini doğrudan alır. Yani çekim olmaması, konumun bulunamayacağı anlamına gelmez.

## Yanılgı 2: "İnternet hiçbir işe yaramıyor o zaman"

Gerçek: İnternetin iki önemli katkısı var. Birincisi A-GPS (destekli GPS): telefon, uyduların yörünge bilgisini mobil veri ya da Wi-Fi üzerinden alarak ilk konumu çok daha çabuk bulur. İkincisi harita görselleri: sokak adları ve arazi katmanları genellikle internetten yüklenir. Kısacası internet hız ve görüntü sağlar; konumun kendisi uydudan gelir.

## Yanılgı 3: "Çekim gidince kayıt da bozulur"

Gerçek: Bu, uygulamanın nasıl tasarlandığına bağlı. Her adımda sunucuya bağlanmaya çalışan uygulamalarda bağlantı kopunca kayıt aksayabilir. Çevrimdışı çalışacak şekilde tasarlanmış bir rota kaydedici ise bağlantıdan bağımsız olarak kaydı sürdürür.

## Yanılgı 4: "Dar vadide de aynı doğrulukta çalışır"

Gerçek: GPS uydu sinyaline gökyüzünü görerek ulaşır. Tünellerde, yoğun ağaçlık alanlarda ya da dar vadilerde sinyal zayıflayabilir ve konum sapabilir. Bu bir uygulama hatası değil, fiziğin doğal sonucudur. Açık alana çıkınca konum yeniden toparlanır.

## Yanılgı 5: "Uygulamayı açtım, gerisi kendiliğinden olur"

Gerçek: Konum izni kapalıysa ya da pil tasarrufu modu arka plandaki uygulamaları kısıtlıyorsa kayıt beklediğiniz gibi ilerlemeyebilir. Bu ayarların adı ve yeri telefon markasına göre değişir.

## Yola çıkmadan 4 adımlık kontrol listesi

1. Konum iznini kontrol edin. Rota uygulamasının konuma erişebildiğinden emin olun.
2. Pil tasarrufu ayarına bakın. Uzun kayıtlarda uygulamanın arka planda durdurulmadığından emin olun.
3. Kaydı çekim alanındayken başlatın. İnternet varken ilk konum daha hızlı bulunur; sonrasında çekim gitse de uydu sinyaliyle devam edilir.
4. Telefonu açık gökyüzü gören bir yerde taşıyın. Çanta dibinde ya da metal bir kutuda sinyal zayıflayabilir.

## Viano bu süreçte nasıl yardımcı olur?

- Çevrimdışı dostu: İnternetiniz olmasa bile rotanızı kaydetmeye devam eder.
- Canlı GPS takibi ve rota çizimi: Katettiğiniz mesafeyi ve süreyi anlık görürsünüz.
- Fotoğraf ve not: Yolda harita üzerine fotoğraf ekleyip notlarınızı kaydedebilirsiniz.
- Hız göstergesi ve sesli uyarı: Belirlediğiniz hız sınırı aşıldığında uyarı alırsınız.
- Arşiv ve isimle arama: Turlarınız arşivde listelenir, aylar sonra bile bulabilirsiniz.
- Tek dokunuşla paylaşım: Tamamladığınız turun haritasını paylaşabilirsiniz.

## Sonuç

"Telefon çekmiyor" demek "konum yok" demek değil. Konum uydudan gelir, internet ise işi hızlandırır ve haritayı güzelleştirir. Bir dahaki sefere sinyal çubukları sıfıra indiğinde kaydı durdurmayın.

Viano'yu Google Play'den indirin: https://play.google.com/store/apps/details?id=com.viano.route.tracer&pcampaignid=web_share

## Kaynaklar

- Wikipedia, "Assisted GNSS": https://en.wikipedia.org/wiki/Assisted_GNSS
- R-Tools Technology, "GPS vs AGPS": https://www.r-tt.com/technology-articles/gps-vs-agps.html$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-24 09:00:00+03'),
($mga$ustayi-cagirmadan-once-tesisat-krokisi-cizmek$mga$, $mga$Ustayı Çağırmadan Önce Evinizin Tesisat Krokisini Çıkarın$mga$, $mga$Kış öncesi arıza ya da tadilatta ustaya derdinizi hızlı anlatmak için su ve elektrik hattının basit krokisini telefonda çizin.$mga$, $mga$Ev & Yaşam$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/ustayi-cagirmadan-once-tesisat-krokisi-cizmek.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mgacreative.toolbox&pcampaignid=web_share$mga$, $mga$Kış yaklaşırken evlerde benzer sorunlar sıklaşır: kombi bağlantısında damlama, banyoda kaçak şüphesi, ısıtıcı takılınca atan sigorta, eklenmesi gereken bir priz. Hangisi olursa olsun, usta geldiğinde ilk soru genellikle aynıdır: "Bu hat nereden geçiyor?"

Bu yazıda, ustayı çağırmadan önce evinizin su ve elektrik hattının basit bir krokisini nasıl çıkarabileceğinizi anlatıyoruz. Amaç ustanın işini yapmak değil; derdinizi net anlatmak, zaman kaybını azaltmak ve evinizin bir "hafızasını" oluşturmak.

Önemli not: Bu tür krokiler resmi proje değildir. Elektrik tesisatına müdahale, yetkili bir elektrikçinin işidir.

## Neden kroki?

Sözle tarif yanlış anlaşılmaya açıktır. "Mutfağın arkasındaki duvar" iki kişi için farklı yerler olabilir. Basit bir çizim ise herkesin aynı şeye bakmasını sağlar. Ayrıca bir sonraki arızada aynı tarifi yeniden yapmanız gerekmez.

## Adım 1: Odaları kabaca yerleştirin

Mimari doğruluk aramayın. Odaları kutular halinde, kapı ve pencereleri yaklaşık yerleriyle çizin. Ölçü vermek isterseniz bir metre ya da cetvelle ana duvarları ölçmek yeterlidir.

## Adım 2: Su hattını işaretleyin

Ana vana, sayaç, kombi, lavabo, klozet, duş ve çamaşır makinesi bağlantılarını işaretleyin. Emin olmadığınız bölümleri kesik çizgi ya da soru işaretiyle bırakın; bu, usta için de değerli bir bilgidir.

## Adım 3: Elektrik noktalarını yerleştirin

Prizleri, anahtarları, buatları ve sigorta panosunu işaretleyin. Bilmiyorsanız tahmin yazmayın; "bilinmiyor" demek yanlış bilgiden iyidir.

## Adım 4: Sorunu not edin

Kaçak, ısınan priz, atan sigorta… Sorunu yaşandığı noktaya, tarihiyle birlikte not edin. Yanık plastik kokusu, pano kapağında kararma ve sık atan sigorta gibi işaretleri de bu notlara eklemek kontrole gelen kişiye yol gösterir.

## Adım 5: Paylaşın ve saklayın

Krokiyi görsel ya da PDF olarak ustaya gönderin. Usta gelmeden durumu görür, gerekirse doğru malzemeyle gelir. Aynı dosyayı ev evraklarınızın yanında saklayın.

## ToolBox bu süreçte nasıl yardımcı olur?

ToolBox, mühendislik ve tesisat için CAD tarzı çizim editörleri içeren bir araç kutusu uygulamasıdır.

- Sıhhi Tesisat Çizici: Su hatlarını çizebilir, birleştirebilir ve düğüm noktalarını yöneterek tesisat krokisi oluşturabilirsiniz.

- Elektrik Tesisatı Çizici: Buat, priz ve kablolarla elektrik düzenini görselleştirebilirsiniz.

- Dışa aktarma: Çizimlerinizi PDF veya PNG formatında anında dışa aktarıp paylaşabilirsiniz.

- Yardımcı araçlar: Su terazisi, iletki ve cetvel ile küçük ölçümleri kontrol edebilir, birim dönüştürücü ile uzunluk birimleri arasında geçiş yapabilirsiniz.

## Kısa kontrol listesi

- Odaları kutu halinde çizdim.
- Ana vana ve sigorta panosunun yerini işaretledim.
- Emin olmadığım hatları "bilinmiyor" olarak bıraktım.
- Sorunu yeri ve tarihiyle not ettim.
- Krokiyi PDF/PNG olarak ustaya gönderdim ve sakladım.

## Sonuç

Basit bir kroki, ustayla aranızdaki iletişimi hızlandırır ve evinize dair bilgiyi kalıcı hale getirir. Kışa girmeden bu krokiyi bir kez çıkarmak, sonraki her arızada işinizi kolaylaştırır.

ToolBox'ı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mgacreative.toolbox&pcampaignid=web_share

## Kaynaklar

- Ekonomi Gazetesi, "Elektrik yangınları ani değil, ihmalin sonucu" (16.02.2026): https://www.ekonomigazetesi.com/sehirler/elektrik-yanginlari-ani-degil-ihmalin-sonucu-72778$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-29 09:00:00+03'),
($mga$webp-jpg-cevirme-dosya-formati-desteklenmiyor$mga$, $mga$"Dosya Formatı Desteklenmiyor" Hatası: WEBP'yi JPG'ye Çevirme Rehberi$mga$, $mga$İndirdiğiniz görsel WEBP çıktı ve yükleme hata veriyor mu? Formatı çevirmenin ve dosyanın gerçek türünü bulmanın pratik yolları.$mga$, $mga$Verimlilik / Dijital Araçlar$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/webp-jpg-cevirme-dosya-formati-desteklenmiyor.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.inkvera.formex&pcampaignid=web_share$mga$, $mga$Bir ürün görselini web sitesinden indiriyorsunuz, bir başvuru formuna fotoğraf yüklemeye çalışıyorsunuz ya da bir arkadaşınızın gönderdiği resmi açmak istiyorsunuz. Ve ekranda o tanıdık mesaj: "Dosya formatı desteklenmiyor." Dosyaya yakından bakınca uzantının .webp olduğunu görüyorsunuz. Ya da daha kafa karıştırıcısı: Dosya .jpg görünüyor ama yine de yüklenmiyor.

## WEBP nedir, neden bu kadar sık karşımıza çıkıyor?

WebP, Google tarafından geliştirilen bir görüntü formatıdır. JPEG ve PNG'ye göre daha yüksek sıkıştırma sunduğu için dosyalar daha küçük olur ve sayfalar daha hızlı açılır. Bu yüzden birçok web sitesi görsellerini WebP olarak sunar. Sorun şu: Bazı başvuru formları, kurum içi sistemler ve e-ticaret panelleri yalnızca JPG ve PNG kabul eder.

## "Uzantısı .jpg ama açılmıyor" — ne oluyor?

Dosyanın adındaki uzantı, içeriğin ne olduğunu garanti etmez. Uzantı elle değiştirilmiş ya da yanlış verilmiş olabilir. Her dosya türünün başında onu tanımlayan küçük bir "imza" bulunur; gerçek formatı öğrenmenin en güvenilir yolu uzantıya değil bu imzaya bakmaktır.

## Adım adım çözüm

1. Gerçek formatı kontrol edin. Uzantı ile içerik farklıysa sorun buradadır.
2. Hedef sistemin ne istediğini okuyun. Form "JPG/PNG, en fazla X MB" diyorsa hem formatı hem boyutu buna göre hazırlayın.
3. Doğru formata çevirin. Fotoğraflar için genellikle JPG, şeffaf arka planlı logolar için PNG uygundur.
4. Boyutu kontrol edin. Sınırı aşıyorsa kaliteyi koruyarak sıkıştırın ya da ölçüleri küçültün.
5. Son kontrolü yapın. Yüklemeden önce boyutu ve türü bir kez daha görün.

## Formex bu süreçte nasıl yardımcı olur?

Formex, bu adımların hepsini tek uygulamada ve internet olmadan yapmanızı sağlar; dosyalarınız hiçbir sunucuya yüklenmez.

- Resim Dönüştürücü: JPG, PNG ve WEBP arasında geçiş yapabilirsiniz.
- Dosya Türü Algılayıcı: Bayt imzasından bir dosyanın gerçek formatını belirler.
- Dosya Bilgileri: Boyut, MIME türü ve son değiştirme tarihini gösterir.
- Sıkıştırma ve boyutlandırma: Dosya boyutunu azaltır, en-boy oranını bozmadan ölçüleri değiştirir.
- Görüntüden PDF'ye: Sistem görsel yerine PDF istiyorsa fotoğrafları PDF'e çevirir.

## Sonuç

"Dosya formatı desteklenmiyor" hatası çoğu zaman dosyanın bozuk olduğu anlamına gelmez; yanlış formatta ya da yanlış etiketlenmiş olduğu anlamına gelir. Önce gerçek formatı öğrenmek, sonra hedef sistemin istediği formata çevirmek sorunu büyük ölçüde çözer.

Formex'i Google Play'den indirin: https://play.google.com/store/apps/details?id=com.inkvera.formex&pcampaignid=web_share$mga$, $mga$4 dk okuma$mga$, 'published', '2026-10-21 09:00:00+03'),
($mga$yapay-zeka-ve-nlp-ile-is-akisi-otomasyonu$mga$, $mga$Yapay Zeka ve NLP ile Günlük İş Akışınızı Otomatize Edin: Akıllı Ajanda ve vCard Sistemleri$mga$, $mga$Doğal Dil İşleme (NLP) teknolojileriyle e-postalardan ve mesajlardan otomatik görev çıkarma ve yeni nesil temassız dijital kartvizit ekosistemi.$mga$, $mga$Yapay Zeka$mga$, $mga$MGA Creative AI Lab$mga$, $mga$images/cardly_detay.jpeg$mga$, $mga$$mga$, $mga$Günümüz iş dünyasında en büyük zaman kaybı, dağınık iletişim kanallarından (e-posta, WhatsApp, toplantı notları) çıkan görevleri elle takvime işlemektir.

### NLP ile Akıllı Ajanda Çıkarımı (MailMind Yaklaşımı)
Doğal Dil İşleme (Natural Language Processing) algoritmaları, gelen e-postalardaki tarih, saat ve görev ifadelerini otomatik olarak ayrıştırarak tek dokunuşla ajandanıza ekler.

### Ağ Oluşturmada Dijital Dönüşüm: Cardly
Kağıt kartvizitlerin %88'i ilk hafta içinde çöpe gitmektedir. **Cardly** vCard sistemiyle:
- **NFC ve Dinamik QR:** Telefonu dokundurarak veya QR okutarak rehbere anında kayıt.
- **Dinamik Güncelleme:** Telefon numarası veya unvan değiştiğinde tüm paylaşılan kartvizitler anında güncellenir.
- **Çevre Dostu & Prestijli:** Sıfır kağıt israfı ile modern kurumsal imaj.

### Sonuç: Akıllı Otomasyon
Yapay zeka ve akıllı paylaşım protokolleri, küçük işletmelerden küresel şirketlere kadar iş yapış biçimlerini temelden dönüştürmektedir.$mga$, $mga$6 dk okuma$mga$, 'published', '2026-08-10 09:00:00+03'),
($mga$yeni-eve-tasindiniz-evin-dijital-kaydini-ilk-30-gunde-kurun$mga$, $mga$Yeni Eve Taşındınız: Evin Dijital Kaydını İlk 30 Günde Kurmanın Yolu$mga$, $mga$Taşınmanın ilk ayı evinizi düzenli kurmak için en iyi zaman. Cihaz, eşya konumu ve bakım tarihleri için 4 haftalık pratik rehber.$mga$, $mga$Mobil Yazılım$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/yeni-eve-tasindiniz-evin-dijital-kaydini-ilk-30-gunde-kurun.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mgacreative.familyos&pcampaignid=web_share$mga$, $mga$Taşınmanın ilk haftaları genellikle koli açmak, perde takmak ve eksikleri tamamlamakla geçer. Ama bu dönem aynı zamanda evin "kayıt defterini" kurmak için en uygun zamandır. Cihazlar yeni yerleştirildiği için arkalarındaki etiketlere kolayca ulaşılır, eşyaların nereye konduğu henüz aklımızdadır.

Birkaç ay sonra bu bilgiler dağılır. Beyaz eşyanın arkası duvara dayanır, kışlıkların hangi dolapta olduğu unutulur, kombinin en son ne zaman bakıldığını kimse hatırlamaz. Aşağıdaki dört haftalık plan bu bilgileri dağılmadan kaydetmenize yardımcı olur.

## 1. hafta: Cihazları kaydedin

Buzdolabı, çamaşır ve bulaşık makinesi, fırın, kombi, klima… Her biri için marka ve model, seri numarası (genellikle cihazın arkasındaki etiket) ve servis numarasını not edin. Bir arıza olduğunda servise verilecek bilgilerin hepsi elinizin altında olur.

## 2. hafta: Eşyaların yerini kaydedin

Sık aranan ama nadiren kullanılan eşyaların konumunu kaydedin: yedek anahtarlar, alet çantası, mevsimlik kıyafetler, önemli belgelerin dosyası, yılbaşı süsleri. "Yatak odası – gardırop üst raf" gibi oda ve konum bilgisi yeterlidir. Böylece aradığınızı bulmak, tüm dolapları açmak yerine birkaç saniye sürer.

## 3. hafta: İlk bakım tarihlerini girin

- Kombi ve klima için yetkili servis bakımını planlayın. Son bakım tarihini bilmiyorsanız taşınma tarihinizi başlangıç kabul edin.
- Su arıtma ya da aspiratör filtresi gibi periyodik değişen parçalar için bir sonraki değişim aralığını belirleyin.
- Bahçe, balkon ya da teras varsa mevsimlik bakımları ekleyin.

Önemli olan her cihaz için bir "sonraki tarih" belirlemek. Gerisini hatırlatıcılar halleder.

## 4. hafta: Aileyi dahil edin

Kayıtlar tek bir kişinin telefonunda kaldığında ev, o kişinin hafızasına bağımlı hale gelir. Evde yaşayan herkesin bu bilgilere erişebildiğinden emin olun. Kimin hangi görevden sorumlu olduğunu netleştirin: filtre değişimi kimde, stokları kim kontrol ediyor?

## Sık yapılan üç hata

- Her şeyi bir hafta sonunda bitirmeye çalışmak. Küçük parçalara bölün.
- Sadece "pahalı" cihazları kaydetmek. Filtre, ampul tipi, süpürge torbası gibi küçük detaylar en sık aranan bilgilerdir.
- Kutuları hemen atmak. Kutunun üzerindeki model bilgisini kaydetmeden atmayın.

## FamilyOS bu süreçte nasıl yardımcı olur?

FamilyOS, MGA Creative olarak geliştirdiğimiz ev yönetimi ve aile organizasyonu uygulamasıdır.

- Dijital envanter: Cihazlarınızın model ve seri numaralarını kaydedip servis numaralarına anında erişebilirsiniz.
- Eşya konumu: Eşyalarınızın hangi odada olduğunu not edebilirsiniz.
- Bakım takibi: Son bakım tarihini ve bir sonraki aralığı girdiğinizde tarih yaklaştıkça bildirim alırsınız.
- Ortak yaşam alanı: Evdeki herkesin güncel bilgiye erişmesine yardımcı olur.

## Sonuç

Taşınma, bir evi sıfırdan düzenlemek için nadiren eline geçen bir fırsat. İlk ayı dört küçük adıma bölün: önce cihazlar, sonra eşyaların yeri, ardından bakım tarihleri ve en son aile.

FamilyOS'u Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mgacreative.familyos&pcampaignid=web_share$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-20 09:00:00+03'),
($mga$yil-sonu-teklif-arsivi-2027-fiyat-kontrolu$mga$, $mga$Yıl Bitmeden Teklif Arşivinize Bakın: 2027 Fiyatlarını Belirlemeden Önce 5 Kontrol$mga$, $mga$Yeni yıl fiyatınızı tahminle değil verinizle belirleyin. Bu yıl gönderdiğiniz tekliflerden çıkarabileceğiniz 5 pratik kontrol.$mga$, $mga$Mobil Yazılım$mga$, $mga$MGA Creative Ekibi$mga$, $mga$images/yil-sonu-teklif-arsivi-2027-fiyat-kontrolu.svg$mga$, $mga$https://play.google.com/store/apps/details?id=com.mgacreative.modigo&pcampaignid=web_share$mga$, $mga$Ekim ve Kasım, birçok küçük işletme ve serbest çalışan için yeni yıl fiyatlarının konuşulmaya başlandığı aylardır. Müşteriler gelecek yılın bütçesini yapıyor, siz de fiyat listenizi güncellemeyi düşünüyorsunuz. Çoğumuz aynı yöntemi kullanıyoruz: geçen yılki fiyatın üzerine tahmini bir oran eklemek.

Oysa elinizde çok daha somut bir veri var: bu yıl gönderdiğiniz teklifler. Hangi işe ne fiyat verdiğiniz, hangi müşteriyle ne sıklıkla çalıştığınız, hangi aylarda yoğunlaştığınız bu belgelerde yazılı. Tek sorun, bu belgelerin genellikle tek bir yerde durmamasıdır.

TÜİK'in açıkladığı verilere göre Eylül 2026'da tüketici fiyatlarındaki yıllık artış %29,73, aylık artış %1,84 oldu. Fiyatların bu hızla değiştiği bir dönemde, yıl içinde verdiğiniz fiyatları geriye dönüp görebilmek yeni yıl kararını daha sağlam kılar.

## Kontrol 1: Bu yıl kaç teklif gönderdiniz?

Teklif sayısını ay ay çıkarın. Yoğun ve sakin dönemleri görmek, gelecek yıl için nakit akışını ve iş yükünü planlamayı kolaylaştırır.

## Kontrol 2: En çok kime teklif verdiniz?

Teklifleri müşteri bazında gruplayın. Aynı müşteriye birden fazla teklif gönderdiyseniz, o müşteri sizin için düzenli bir ilişkidir. Yeni yıl fiyat güncellemesini bu müşterilere önceden ve açık bir dille iletmek ilişkiyi korur.

## Kontrol 3: Aynı kalemin fiyatı yıl içinde nasıl değişti?

Sık teklif verdiğiniz bir hizmet ya da ürünü seçin. Yılın başındaki teklif ile son teklifteki fiyatı yan yana koyun. Fiyatınızı hiç güncellemediyseniz, maliyetleriniz artarken kârınız sessizce azalmış olabilir.

## Kontrol 4: Hangi teklifler kayıp?

Muhtemelen bazı teklifleri bulamayacaksınız. Bir kısmı e-postanın derinlerinde, bir kısmı WhatsApp sohbetinde kalmıştır. Bulamadığınız her teklif eksik bir veri noktasıdır. Bu yıl sonunu, teklifleri tek bir yerde toplamaya başlamak için bir milat olarak kullanabilirsiniz.

## Kontrol 5: Teklifleriniz markanızı doğru yansıtıyor mu?

Yıl içinde farklı şablonlarla, farklı logolarla hazırlanmış teklifler varsa müşteri gözünde tutarsız bir görüntü oluşur. Yeni yıla tek bir şablon, güncel logo ve iletişim bilgileriyle girmek küçük ama etkili bir adımdır.

## Fiyat güncellemesini nasıl iletmeli?

Düzenli çalıştığınız müşterilere yeni fiyatları yıl başında sürpriz olarak değil, Kasım ya da Aralık ayında önceden bildirin. Değişimin nedenini kısaca açıklayın ve yeni fiyatların hangi tarihten geçerli olacağını net yazın. Önceden iletilen bir fiyat değişikliği, çoğu zaman son dakika yapılan bir artıştan daha kolay kabul görür.

## DealDraft bu süreçte nasıl yardımcı olur?

- Dakikalar içinde profesyonel PDF fiyat teklifi ve proforma fatura hazırlarsınız.
- Müşteri bilgilerinizi tek bir merkezde saklarsınız; teklifler dağınık kalmaz.
- Analiz ekranıyla teklif hacminizi takip edersiniz.
- Logonuzu ve bilgilerinizi ekleyerek markanıza özel PDF çıktılar alırsınız.
- Verileriniz bulutla senkronize kalır.

## Sonuç

Yeni yılı verinizle karşılayın. Yıl bitmeden 30 dakika ayırın: tekliflerinizi sayın, müşteri bazında gruplayın, fiyat değişimine bakın ve eksik kalanları not edin.

DealDraft'ı Google Play'den indirin: https://play.google.com/store/apps/details?id=com.mgacreative.modigo&pcampaignid=web_share

## Kaynaklar

- Forbes Türkiye, "TÜİK Eylül enflasyonunu açıkladı: Eylül 2026 Tüketici Fiyat Endeksi"$mga$, $mga$5 dk okuma$mga$, 'published', '2026-10-13 09:00:00+03')
on conflict (slug) do nothing;

-- Kontrol: aşağıdaki sorgu 22 (veya daha fazla) dönmeli
select count(*) as blog_yazisi from public.blog_posts;
