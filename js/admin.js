import { 
    supabase, 
    fetchSiteContent, 
    fetchPortfolioItems, 
    addPortfolioItem, 
    updatePortfolioItem, 
    deletePortfolioItem,
    uploadPortfolioImage 
} from './supabase-client.js';

// DOM Elementleri - Login
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');

// DOM Elementleri - Dashboard & Header
const dashboardSection = document.getElementById('dashboardSection');
const logoutBtn = document.getElementById('logoutBtn');
const statTotalProjects = document.getElementById('statTotalProjects');
const statAdminEmail = document.getElementById('statAdminEmail');

// DOM Elementleri - Site İçerik
const heroTitleInput = document.getElementById('hero_title');
const heroDescInput = document.getElementById('hero_desc');
const saveContentBtn = document.getElementById('saveContentBtn');
const contentStatus = document.getElementById('contentStatus');

// DOM Elementleri - Portföy Ekleme
const addPortfolioForm = document.getElementById('addPortfolioForm');
const addPortfolioBtn = document.getElementById('addPortfolioBtn');
const portfolioList = document.getElementById('portfolioList');
const searchPortfolio = document.getElementById('searchPortfolio');
const projectCountBadge = document.getElementById('projectCountBadge');
const syncDefaultsBtn = document.getElementById('syncDefaultsBtn');

const pFileInput = document.getElementById('p_file');
const pImageInput = document.getElementById('p_image');
const pPreviewContainer = document.getElementById('p_preview_container');
const pPreview = document.getElementById('p_preview');
const removePreviewBtn = document.getElementById('removePreviewBtn');
const fileSelectLabel = document.getElementById('fileSelectLabel');
const pPlaystoreInput = document.getElementById('p_playstore');
const pYoutubeInput = document.getElementById('p_youtube');

// DOM Elementleri - Düzenleme Modalı
const editModal = document.getElementById('editModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editPortfolioForm = document.getElementById('editPortfolioForm');
const editSaveBtn = document.getElementById('saveEditBtn');
const editIdInput = document.getElementById('edit_p_id');
const editTitleInput = document.getElementById('edit_p_title');
const editDescInput = document.getElementById('edit_p_desc');
const editTagsInput = document.getElementById('edit_p_tags');
const editFileInput = document.getElementById('edit_p_file');
const editImageInput = document.getElementById('edit_p_image');
const editPreview = document.getElementById('edit_p_preview');
const editFileSelectLabel = document.getElementById('editFileSelectLabel');
const editPlaystoreInput = document.getElementById('edit_p_playstore');
const editYoutubeInput = document.getElementById('edit_p_youtube');

let cachedProjects = [];

// --- VARSAYILAN KAYITLI UYGULAMALAR (SEED DATA - 34 UYGULAMA) ---
export const DEFAULT_PROJECTS = [
    {
        id: 'def-1',
        title: 'Agro Plan',
        description: `Modern Çiftçiliğin Dijital Ortağı: AgroPlan\n\nKağıt defterleri bir kenara bırakın! AgroPlan, çiftçiler ve tarım üreticileri için özel olarak geliştirilmiş, kullanımı kolay ve kapsamlı bir tarla yönetim uygulamasıdır. Ekimden hasada kadar tüm süreçlerinizi cebinizden takip edin, veriminizi ve kazancınızı artırın.\n\n🚜 Tarlalarınız Kontrol Altında: Sahip olduğunuz veya kiraladığınız tüm tarlaları kaydedin.\n💧 Ekim ve Bakım Takibi: Sulama, ilaçlama ve gübreleme işlemlerini kolayca takip edin.\n💰 Finansal Yönetim: Mazot, tohum, gübre ve işçilik maliyetlerini girerek gelir/gider hesabı yapın.`,
        category_tags: 'Mobil, Tarım, Android, Kotlin',
        image_url: 'images/aproplan_kart.png',
        link: '/project?id=agro-plan',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.gkhnazat.agroplan.mobile&pcampaignid=web_share',
        youtube_id: 'F4ki_kJsFtQ'
    },
    {
        id: 'def-2',
        title: 'Cardly',
        description: `Cardly ile Ağ Oluşturma Deneyiminizi Yeniden Tanımlayın – Dijital Kartvizitlerin Altın Standardı.\n\nTükenen ya da kaybolan yığınla kağıt kartviziti taşımaya son verin. Cardly, şıklık, hız ve güvenilirlik arayan profesyoneller için tasarlanmış üst düzey bir vCard platformudur. Dinamik QR kodları ve NFC desteği.`,
        category_tags: 'Mobil, Dijital Kartvizit, NFC, QR',
        image_url: 'images/cardly_kart.jpeg',
        link: '/project?id=cardly',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.cardly.app&pcampaignid=web_share',
        youtube_id: '2mxEw26eeb0'
    },
    {
        id: 'def-4',
        title: 'ChronoSnap',
        description: `Galerinizdeki binlerce fotoğraf arasında kaybolmaktan yoruldunuz mu? ChronoSnap ile hayatınızı gün gün organize edin ve anılarınızı bir takvim düzeni içinde saklayın.\n\nAkıllı takvim arayüzü, kategori yönetimi ve güvenli yerel depolama.`,
        category_tags: 'Mobil, Takvim, Fotoğraf',
        image_url: 'images/chronosnap_kart.jpeg',
        link: '/project?id=chronosnap',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.chronosnap.photocalendar.app&pcampaignid=web_share',
        youtube_id: 'B2c6x18-x0Y'
    },
    {
        id: 'def-5',
        title: 'CookMatch',
        description: `CookMatch, bugün ne pişireceğinize karar vermenize yardımcı olur — stres, israf ya da sonsuz kaydırma olmadan.\n\nEvdeki malzemelerinizi seçin, özenle seçilmiş tarifleri keşfedin ve çevrimdışı favorilerinize ekleyin.`,
        category_tags: 'Mobil, Yemek, Tarif',
        image_url: 'images/cookmatch_kart.jpeg',
        link: '/project?id=cookmatch',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.cookmatch.app&pcampaignid=web_share',
        youtube_id: 'JRXR30jbL5w'
    },
    {
        id: 'def-6',
        title: 'DailyLeaf',
        description: `Hayatınızı vintage bir dokunuşla yakalayın. Estetik bir günlük, alışkanlıklar ve günlük anılar.\n\n📖 Dijital Nostalji: Antik kağıt dokusu.\n✍️ Kişisel Notlar: Firebase bulut senkronizasyonu.\n🌿 21 Günlük Alışkanlık Takibi.`,
        category_tags: 'Mobil, Günlük, Vintage',
        image_url: 'images/dailyleaf_kart.jpeg',
        link: '/project?id=dailyleaf',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.dailyleaf.app&pcampaignid=web_share',
        youtube_id: 'yTU_Gp9Np48'
    },
    {
        id: 'def-7',
        title: 'DealDraft',
        description: `DealDraft ile Teklif Süreçlerinizi Profesyonelleştirin!\n\nİşletmeniz için hızlı, şık ve detaylı teklifler hazırlamak hiç bu kadar kolay olmadı. Profesyonel PDF teklifleri, müşteri yönetimi ve performans grafikleri.`,
        category_tags: 'Mobil, Teklif, PDF',
        image_url: 'images/dealdraft_kart.jpeg',
        link: '/project?id=dealdraft',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-8',
        title: 'AppBridge',
        description: `AppBridge, Android uygulamalarını hızlıca açmak ve paylaşmak için tasarlanmış sade bir yardımcı araçtır.\n\nUygulamanın paket adını girin, doğrudan açan veya Play Store'a yönlendiren derin bağlantılar oluşturun.`,
        category_tags: 'Mobil, Yönlendirme, Araçlar',
        image_url: 'images/appbridge_kart.jpeg',
        link: '/project?id=appbridge',
        playstore_url: '',
        youtube_id: 'DcqLGR3-bVs'
    },
    {
        id: 'def-9',
        title: 'ARGEP',
        description: `ARGEP: Ar-Ge Proje Yönetiminizi Kolaylaştırın\n\nARGEP ile Araştırma ve Geliştirme (Ar-Ge) süreçlerinizi tam olarak kontrol altına alın. Kapsamlı proje takibi, bütçe denetimi ve kilometre taşı yönetimi.`,
        category_tags: 'Mobil, Ar-Ge, Yönetim',
        image_url: 'images/argep_kart.jpeg',
        link: '/project?id=argep',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-10',
        title: 'CRM XL',
        description: `ArchiveCRM: Hepsi Bir Arada İş İlişkileri Yöneticisi\n\nArchiveCRM ile iş organizasyonunuzu bir üst seviyeye taşıyın. Müşteri ilişkilerinizi yönetin, sözleşmelerinizi depolayın ve verilerinizi anında eşitleyin.`,
        category_tags: 'Mobil, CRM, Müşteri Takibi',
        image_url: 'images/lemoraxl-kart.jpeg',
        link: '/project?id=crm-xl',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-11',
        title: 'Felsefi Bakış',
        description: `Felsefi Bakış: Bilgeliğe Yolculuk\n\nHayatın anlamını, adaleti, özgürlüğü tarihin en büyük zihinlerine sormayı düşündünüz mü? Sokrates'ten Sartre'a 10 farklı filozofla soru-cevap ve antik parşömen tasarımı.`,
        category_tags: 'Mobil, Felsefe, Kültür',
        image_url: 'images/inkvera_kart.jpeg',
        link: '/project?id=felsefi-bakis',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.felsefibakis.app&pcampaignid=web_share',
        youtube_id: 'uuzPNZJJinY'
    },
    {
        id: 'def-12',
        title: 'Formex',
        description: `FORMEX: Profesyonel, Gizlilik Öncelikli Dosya Dönüştürme Araç Seti\n\nDosyalarınızı %100 çevrimdışı dönüştürün. JPG, PNG, WEBP, PDF, CSV, JSON ve XML formatları arasında hızlı ve güvenli dönüşüm.`,
        category_tags: 'Mobil, Dönüştürücü, PDF',
        image_url: 'images/formex_kart.jpeg',
        link: '/project?id=formex',
        playstore_url: '',
        youtube_id: 'ZMFwcEYxh3A'
    },
    {
        id: 'def-13',
        title: 'Greenova',
        description: `Greenova ile bitki bakımında yapay zeka dönemini başlatın!\n\nYapay zeka destekli bitki türü tanımlama, yaprak hastalık teşhisi, kişisel sulama hatırlatıcıları ve bakım ansiklopedisi.`,
        category_tags: 'Mobil, Bitki, Yapay Zeka',
        image_url: 'images/greenova_kart.jpeg',
        link: '/project?id=greenova',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mgacreative.greenova&pcampaignid=web_share',
        youtube_id: 'IO0fYSFT6-Y'
    },
    {
        id: 'def-14',
        title: 'GLOBAL TRADE',
        description: `GLOBAL TRADE: Küresel Ticaretin Dijital Merkezi\n\nTicaretinizi sınırların ötesine taşıyın! B2B global eşleşme, dijital showroom, dinamik PDF katalog üretimi ve 6 farklı dilde destek.`,
        category_tags: 'Mobil, B2B, Ticaret',
        image_url: 'images/globaltrade_kart.jpeg',
        link: '/project?id=global-trade',
        playstore_url: '',
        youtube_id: 'nIxGWnbOO8Q'
    },
    {
        id: 'def-15',
        title: 'InkVera',
        description: `Inkvera: Profesyonel PDF Düzenleyici ve İmza Aracı\n\nPDF belgeleri üzerine çizim yapın, metinleri vurgulayın, resmi sözleşmeleri saniyeler içinde e-imza ile imzalayın ve paylaşın.`,
        category_tags: 'Mobil, PDF, E-İmza',
        image_url: 'images/inkvera_kart.jpeg',
        link: '/project?id=inkvera',
        playstore_url: '',
        youtube_id: 'Qasly5-kSAo'
    },
    {
        id: 'def-16',
        title: 'Lemora XL',
        description: `Lemora XL: Hepsi Bir Arada Satış ve Sipariş Yönetimi Çözümünüz\n\nToptan satış işinizin tam kontrolünü elinize alın. Sipariş takibi, bayi/müşteri cari portalı ve envanter kontrolü.`,
        category_tags: 'Mobil, Satış, Sipariş',
        image_url: 'images/lemoraxl-kart.jpeg',
        link: '/project?id=lemora-xl',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-17',
        title: 'Medication Time',
        description: `Medication Time: Sağlığınız ve Sevdikleriniz Her Zaman Güvende!\n\nİlaç saatlerinizi kaçırmayın. Bakıcı ve aile takip köprü, yaşlı dostu büyük butonlu arayüz ve uykuda dahi çalan alarm sistemi.`,
        category_tags: 'Mobil, Sağlık, İlaç Takibi',
        image_url: 'images/medicationtime_kart.jpeg',
        link: '/project?id=medication-time',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mga.ilacsaatim&pcampaignid=web_share',
        youtube_id: 'IfF5dX6O3cw'
    },
    {
        id: 'def-18',
        title: 'MailMind',
        description: `MailMind: İş Hayatınızı Yapay Zeka ile Organize Edin\n\nGelen kutunuzda kaybolan toplantı davetlerine son verin! MailMind, karmaşık mesaj trafiğinizi saniyeler içinde düzenli bir iş planına dönüştüren yeni nesil asistanınızdır.`,
        category_tags: 'Mobil, E-posta, Yapay Zeka',
        image_url: 'images/mailmind_kart.jpeg',
        link: '/project?id=mail-mind',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mailmind.app&pcampaignid=web_share',
        youtube_id: '9OADP9f4w64'
    },
    {
        id: 'def-19',
        title: 'TripMind',
        description: `TripMind: Kişisel Yapay Zeka Seyahat Asistanınız\n\nYapay zeka ile size özel seyahat programları, bütçe/rezervasyon yönetimi ve gün gün PDF rota çıktısı.`,
        category_tags: 'Mobil, Seyahat, Yapay Zeka',
        image_url: 'images/tripmind_kart.jpeg',
        link: '/project?id=trip-mind',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-20',
        title: 'Viano',
        description: `Viano ile Maceraya Harita Üzerinde Yön Verin 🌍🚗\n\nCanlı GPS rota çizimi, akıllı hız uyarısı, konumsal fotoğraf iğneleme ve zümrüt yeşili nostaljik seyahat günlüğü.`,
        category_tags: 'Mobil, GPS, Rota Takibi',
        image_url: 'images/viano_kart.jpeg',
        link: '/project?id=viano',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.viano.route.tracer&pcampaignid=web_share',
        youtube_id: 'Gznog9h7fT8'
    },
    {
        id: 'def-21',
        title: 'My Garage',
        description: `My Garage: En Kapsamlı Dijital Araç Asistanınız\n\nAracınızın bakım tarihlerini, sigorta sürelerini takip edin, OBD-II motor arıza kodlarını uzman görüşüyle teşhis edin.`,
        category_tags: 'Mobil, Otomotiv, Araç Takibi',
        image_url: 'images/mygarage_kart.jpeg',
        link: '/project?id=my-garage',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mga.mygarage&pcampaignid=web_share',
        youtube_id: '2ClL1VqrBYI'
    },
    {
        id: 'def-22',
        title: 'MyCity',
        description: `MyCity ile İskenderun Avucunuzun İçinde!\n\nİskenderun'daki tarihi mekanlar, lezzet durakları, güncel şehir etkinlikleri ve gelişmiş çevrimdışı rehber.`,
        category_tags: 'Mobil, Şehir Rehberi, İskenderun',
        image_url: 'images/mycity_kart.jpeg',
        link: '/project?id=my-city',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.iskenderun&pcampaignid=web_share',
        youtube_id: 'D_oo5iAXpOg'
    },
    {
        id: 'def-23',
        title: 'Orbitalis',
        description: `Uzay keşfi ve astronomi için en iyi yardımcınız Orbitalis ile evreni keşfedin. NASA ve SpaceX roket fırlatma takibi, uzay takvimi ve ISS gözlemleri.`,
        category_tags: 'Mobil, Uzay, Astronomi',
        image_url: 'images/orbitalis_kart.jpeg',
        link: '/project?id=orbitalis',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.orbitalis.app&pcampaignid=web_share',
        youtube_id: '2AYMPCO-kyo'
    },
    {
        id: 'def-24',
        title: 'ProEvent',
        description: `ProEvent: Düğün ve Etkinlik Planlamanızda En İyi Yardımcınız\n\nBütçe takibi, konuk katılım teyitleri (RSVP), etkileşimli masa oturma planı ve tedarikçi yönetimi.`,
        category_tags: 'Mobil, Etkinlik, Planlama',
        image_url: 'images/proevent_kart.jpeg',
        link: '/project?id=proevent',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-25',
        title: 'Projexia',
        description: `Projexia: Proje, Görev ve Finans Yönetimi Artık Çok Kolay!\n\nSınırsız proje, yapılacaklar şablonları, kârlılık takibi ve test kullanıcısı yönetimi.`,
        category_tags: 'Mobil, Görev, Finans',
        image_url: 'images/projexia_kart.jpeg',
        link: '/project?id=projexia',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mga.appflow&pcampaignid=web_share',
        youtube_id: 'hJiEL5wl9cg'
    },
    {
        id: 'def-26',
        title: 'SubTrack',
        description: `SubTrack: Profesyonel Abonelik ve Müşteri Takip Sistemi\n\nToplam abone, aktif üyelik ve ciro takibi. Süresi dolan aboneler için otomatik hatırlatıcılar.`,
        category_tags: 'Mobil, Abonelik, Ciro Takibi',
        image_url: 'images/subtrack_kart.jpeg',
        link: '/project?id=subtrack',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mga.subtrack&pcampaignid=web_share',
        youtube_id: 'y2ctetoM3zo'
    },
    {
        id: 'def-27',
        title: 'Lemora',
        description: `Lemora – Profesyonel Satış ve Stok Yönetim Sistemi\n\nBarkod okuma destekli envanter yönetimi, nakit/kart tahsilatları, proforma fatura oluşturma ve CRM.`,
        category_tags: 'Mobil, Satış, Stok',
        image_url: 'images/lemoraxl-kart.jpeg',
        link: '/project?id=lemora',
        playstore_url: '',
        youtube_id: '4ij1BjNLcpo'
    },
    {
        id: 'def-28',
        title: 'MindWeave',
        description: `MindWeave: Fikirlerinizi Örgüleyin, Geleceğinizi Tasarlayın!\n\nSonsuz tuval, akıllı SWOT/yol haritası şablonları ve yüksek çözünürlüklü PDF/PNG dışa aktarma.`,
        category_tags: 'Mobil, Zihin Haritası, Not',
        image_url: 'images/mindwear_kart.jpeg',
        link: '/project?id=mindweave',
        playstore_url: '',
        youtube_id: '4O8Elik2Y4w'
    },
    {
        id: 'def-29',
        title: 'OneTake',
        description: `OneTake: Akıllı Teleprompter & Video Stüdyosu\n\nGelişmiş metin okuyucu teleprompter, WPM hız analizi, performans grafikleri ve video senaryo kütüphanesi.`,
        category_tags: 'Mobil, Teleprompter, Video',
        image_url: 'images/onetake_kart.jpeg',
        link: '/project?id=onetake',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-30',
        title: 'QuickBite',
        description: `QuickBite: SaaS Tabanlı Sipariş Yönetim Platformu\n\nKurye adrese teslimat veya Gel-Al seçenekleriyle reklamsız restoran ve kafe sipariş yönetim sistemi.`,
        category_tags: 'Mobil, Sipariş, SaaS',
        image_url: 'images/quickbite_kart.jpeg',
        link: '/project?id=quickbite',
        playstore_url: '',
        youtube_id: 'JRXR30jbL5w'
    },
    {
        id: 'def-31',
        title: 'VoxNote',
        description: `VoxNote: Sesle Etkinleştirilen Hatırlatıcı ve Konuşan Alarm\n\nYüksek hassasiyetli ses tanıma ile alarm kurun, zamanı geldiğinde notunuzu insan sesiyle sesli dinleyin.`,
        category_tags: 'Mobil, Sesli Alarm, Not',
        image_url: 'images/voxnote_kart.jpeg',
        link: '/project?id=voxnote',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-32',
        title: 'Wedoria',
        description: `Wedoria: En Kapsamlı Düğün Planlayıcısı ve Organizatörü\n\nDüğün sayacı, davetli katılım listeleri, bütçe karşılaştırması, koltuk düzeni ve zaman tüneli.`,
        category_tags: 'Mobil, Düğün, Organizasyon',
        image_url: 'images/wedoria_kart.jpeg',
        link: '/project?id=wedoria',
        playstore_url: '',
        youtube_id: ''
    },
    {
        id: 'def-33',
        title: 'Walletra',
        description: `Walletra: Kişisel Finans & Bütçe Yönetimi\n\nGelir ve gider harcamalarınızı kategorize edin, kredi kartı borçlarını takip edin ve finansal durumunuzu grafiklerle izleyin.`,
        category_tags: 'Mobil, Finans, Bütçe',
        image_url: 'images/walletra_kart.jpeg',
        link: '/project?id=walletra',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mywallet.finance.app&pcampaignid=web_share',
        youtube_id: 'HXdmPFMfFwQ'
    },
    {
        id: 'def-34',
        title: 'Bizora',
        description: `Bizora: İşletmeniz İçin Profesyonel Cari, Stok ve Fatura Yönetimi\n\nMüşteri/tedarikçi borç-alacak bakiyeleri, barkodlu stok takibi, PDF fatura ve ekstre oluşturma.`,
        category_tags: 'Mobil, Cari, Fatura, Stok',
        image_url: 'images/bizora_kart.png',
        link: '/project?id=bizora',
        playstore_url: 'https://play.google.com/store/apps/details?id=com.mgacreative.invixa',
        youtube_id: ''
    },
    {
        id: 'def-35',
        title: 'Hotel OS',
        description: `Hotel OS: Otel ve Konaklama Tesisleri İçin Akıllı Yönetim Platformu\n\nResepsiyon, oda servisi, rezervasyon ve müşteri ilişkilerinizi tek bir platformdan yönetin. Hızlı otel otomasyonu ve misafir deneyimi.`,
        category_tags: 'Mobil, Otel, Yönetim',
        image_url: 'images/hotelos_kart.jpeg',
        link: '/project?id=hotelos',
        playstore_url: '',
        youtube_id: ''
    }
];

// --- YARDIMCI METADATA FONKSİYONLARI ---
export function extractYoutubeId(str) {
    if (!str) return '';
    str = str.trim();
    if (str.includes('youtu.be/')) {
        return str.split('youtu.be/')[1].split('?')[0].split('&')[0];
    }
    if (str.includes('youtube.com/watch')) {
        const match = str.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
    }
    return str;
}

export function parseItemMeta(item) {
    let cleanDesc = item.description || '';
    let youtubeId = item.youtube_id || item.youtubeId || '';
    let playstoreUrl = item.playstore_url || item.playstoreUrl || '';
    let imageUrl = (item.image_url || item.imageUrl || '')
        .replace('coocmatch_kart.jpeg', 'cookmatch_kart.jpeg')
        .replace('ardeg_kart.jpeg', 'argep_kart.jpeg')
        .replace('tripmimd_kart.jpeg', 'tripmind_kart.jpeg')
        .replace('lemoraxl_kart.jpeg', 'lemoraxl-kart.jpeg')
        .replace('Voxnoete_kart.jpeg', 'voxnote_kart.jpeg');
    
    const metaMatch = cleanDesc.match(/<!--META:([\s\S]*?)-->/);
    if (metaMatch) {
        try {
            const metaObj = JSON.parse(metaMatch[1]);
            if (metaObj.youtube_id !== undefined) youtubeId = metaObj.youtube_id;
            if (metaObj.playstore_url !== undefined) playstoreUrl = metaObj.playstore_url;
        } catch (e) {
            console.warn('Meta JSON parse error:', e);
        }
        cleanDesc = cleanDesc.replace(/<!--META:[\s\S]*?-->/g, '').trim();
    }
    
    return {
        ...item,
        image_url: imageUrl,
        cleanDescription: cleanDesc,
        youtubeId: extractYoutubeId(youtubeId),
        playstoreUrl: playstoreUrl
    };
}

export function formatDescriptionWithMeta(desc, playstoreUrl, youtubeId) {
    const cleanDesc = (desc || '').replace(/<!--META:[\s\S]*?-->/g, '').trim();
    const ytId = extractYoutubeId(youtubeId);
    const pUrl = (playstoreUrl || '').trim();
    
    const metaObj = {
        playstore_url: pUrl,
        youtube_id: ytId
    };
    
    return `${cleanDesc}\n\n<!--META:${JSON.stringify(metaObj)}-->`;
}

// --- OTURUM DURUMU KONTROLÜ ---
async function checkSession() {
    try {
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');

        const { data: { session } } = await supabase.auth.getSession();
        if (session && statAdminEmail) {
            statAdminEmail.textContent = session.user.email || 'Admin';
        } else if (statAdminEmail) {
            statAdminEmail.textContent = 'Admin (Canlı Yönetim)';
        }
        
        loadDashboardData();
    } catch (e) {
        console.error('Session check error:', e);
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        loadDashboardData();
    }
}

// --- LOGİN İŞLEMİ ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">sync</span><span>Giriş Yapılıyor...</span>';
        loginError.classList.add('hidden');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailInput.value.trim(),
            password: passwordInput.value,
        });

        if (error) {
            loginError.textContent = 'Giriş başarısız: ' + error.message;
            loginError.classList.remove('hidden');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Giriş Yap</span><span class="material-symbols-outlined text-xl">login</span>';
        } else {
            checkSession();
        }
    });
}

// --- ÇIKIŞ İŞLEMİ ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        checkSession();
    });
}

// --- İÇERİK YÖNETİMİ (HERO TITLE & DESC) ---
if (saveContentBtn) {
    saveContentBtn.addEventListener('click', async () => {
        saveContentBtn.disabled = true;
        saveContentBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">sync</span><span>Kaydediliyor...</span>';
        
        const updates = [
            { id: 'hero_title', content: heroTitleInput.value },
            { id: 'hero_desc', content: heroDescInput.value }
        ];

        const { error } = await supabase.from('site_content').upsert(updates);

        if (error) {
            alert('Kaydetme hatası: ' + error.message);
        } else {
            if (contentStatus) {
                contentStatus.classList.remove('hidden');
                setTimeout(() => contentStatus.classList.add('hidden'), 3500);
            }
        }
        saveContentBtn.disabled = false;
        saveContentBtn.innerHTML = '<span class="material-symbols-outlined text-lg">save</span><span>Metin Değişikliklerini Kaydet</span>';
    });
}

// --- GÖRSEL DOSYA SEÇİMİ (Ekleme Formu) ---
if (pFileInput) {
    pFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileSelectLabel.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
                pPreview.src = evt.target.result;
                pPreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
}

if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', () => {
        pFileInput.value = '';
        pImageInput.value = '';
        pPreview.src = '';
        pPreviewContainer.classList.add('hidden');
        fileSelectLabel.textContent = 'Bilgisayardan Görsel Seç';
    });
}

// --- GÖRSEL DOSYA SEÇİMİ (Düzenleme Modalı) ---
if (editFileInput) {
    editFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            editFileSelectLabel.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
                editPreview.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// --- VARSAYILAN PROJELERİ VERİTABANINA YÜKLE / SENKRONİZE ET ---
async function syncDefaultProjects() {
    if (!syncDefaultsBtn) return;
    syncDefaultsBtn.disabled = true;
    syncDefaultsBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Veritabanına Aktarılıyor...</span>';
    
    let successCount = 0;
    for (const proj of DEFAULT_PROJECTS) {
        const fullDesc = formatDescriptionWithMeta(proj.description, proj.playstore_url, proj.youtube_id);
        const item = {
            title: proj.title,
            description: fullDesc,
            category_tags: proj.category_tags,
            image_url: proj.image_url,
            link: proj.link
        };
        const err = await addPortfolioItem(item);
        if (!err) successCount++;
    }
    
    alert(`${successCount} adet varsayılan uygulama veritabanına aktarıldı. (Lokal hafıza ile senkronize tutuldu)`);
    syncDefaultsBtn.disabled = false;
    syncDefaultsBtn.innerHTML = '<span class="material-symbols-outlined text-sm">cloud_sync</span><span>Tüm Uygulamaları Veritabanına Yükle</span>';
    renderPortfolioList();
}

if (syncDefaultsBtn) {
    syncDefaultsBtn.addEventListener('click', syncDefaultProjects);
}

// --- PORTFÖY LİSTESİNİ ÇEK VE RENDER ET ---
async function renderPortfolioList() {
    if (!portfolioList) return;
    
    portfolioList.innerHTML = `
        <div class="text-center py-12 text-[#c6c6cd]">
            <span class="material-symbols-outlined text-3xl animate-spin mb-2">sync</span>
            <p class="text-sm">Projeler çekiliyor...</p>
        </div>
    `;

    let rawItems = [];
    try {
        rawItems = await fetchPortfolioItems();
    } catch (e) {
        console.warn('Portfolio fetch error:', e);
    }

    let parsedLocal = [];
    const savedLocal = localStorage.getItem('mga_portfolio_projects');
    if (savedLocal) {
        try {
            const arr = JSON.parse(savedLocal);
            if (Array.isArray(arr) && arr.length > 0) {
                parsedLocal = arr;
            }
        } catch(e) {}
    }

    const combinedMap = new Map();

    // 1. Varsayılan Seed projeler
    DEFAULT_PROJECTS.forEach(proj => {
        const key = (proj.title || '').toLowerCase().trim();
        if (key) combinedMap.set(key, proj);
    });

    // 2. Yerel kaydedilmiş projeler
    parsedLocal.forEach(proj => {
        const key = (proj.title || '').toLowerCase().trim();
        if (key) combinedMap.set(key, proj);
    });

    // 3. Supabase DB verileri
    (rawItems || []).forEach(proj => {
        const key = (proj.title || '').toLowerCase().trim();
        if (key) combinedMap.set(key, proj);
    });

    cachedProjects = Array.from(combinedMap.values()).map(parseItemMeta);
    try {
        localStorage.setItem('mga_portfolio_projects', JSON.stringify(cachedProjects));
    } catch(e) {}

    if (statTotalProjects) statTotalProjects.textContent = cachedProjects.length;
    filterAndDisplayProjects();
}

function filterAndDisplayProjects() {
    const query = searchPortfolio ? searchPortfolio.value.toLowerCase().trim() : '';
    
    const filtered = cachedProjects.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.cleanDescription || item.description || '').toLowerCase().includes(query);
        const tagMatch = (item.category_tags || '').toLowerCase().includes(query);
        return titleMatch || descMatch || tagMatch;
    });

    if (projectCountBadge) projectCountBadge.textContent = `${filtered.length} Proje`;

    if (filtered.length === 0) {
        portfolioList.innerHTML = `
            <div class="text-center py-12 text-[#c6c6cd] bg-[#101415] rounded-2xl border border-[#45464d] p-6 space-y-4">
                <span class="material-symbols-outlined text-4xl text-[#45464d]">folder_off</span>
                <p class="text-sm font-medium">Arama kriterine uygun proje bulunamadı.</p>
            </div>
        `;
        return;
    }

    portfolioList.innerHTML = '';
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'glass-card p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#45464d]/60 hover:border-[#4cd7f6]/40 transition-all';
        
        const tagsHtml = (item.category_tags || '')
            .split(',')
            .map(t => `<span class="px-2 py-0.5 bg-[#4cd7f6]/10 text-[#4cd7f6] rounded text-[11px] font-medium">${t.trim()}</span>`)
            .join(' ');

        const playstoreBadge = item.playstoreUrl 
            ? `<a href="${item.playstoreUrl}" target="_blank" class="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[11px] font-medium inline-flex items-center gap-1 hover:underline"><span class="material-symbols-outlined text-xs">play_apps</span> Play Store</a>` 
            : '';

        const youtubeBadge = item.youtubeId 
            ? `<a href="https://www.youtube.com/watch?v=${item.youtubeId}" target="_blank" class="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[11px] font-medium inline-flex items-center gap-1 hover:underline"><span class="material-symbols-outlined text-xs">smart_display</span> YouTube (${item.youtubeId})</a>` 
            : '';

        const itemUniqueId = item.id || item.title;

        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1 min-w-0">
                <img src="${item.image_url || 'https://placehold.co/100x100?text=Proje'}" alt="${item.title}" class="w-16 h-16 rounded-xl object-cover border border-[#45464d] flex-shrink-0 bg-[#101415]">
                <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h4 class="text-white font-semibold text-base truncate">${item.title}</h4>
                    </div>
                    <p class="text-xs text-[#c6c6cd] line-clamp-2">${item.cleanDescription || item.description || ''}</p>
                    <div class="flex flex-wrap items-center gap-1.5 pt-1">
                        ${tagsHtml}
                        ${playstoreBadge}
                        ${youtubeBadge}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-[#45464d]/40 pt-2 sm:pt-0">
                <button type="button" class="edit-btn p-2 bg-[#1d2022] hover:bg-[#4cd7f6]/20 text-[#4cd7f6] rounded-lg transition-all flex items-center gap-1 text-xs font-medium" data-id="${itemUniqueId}">
                    <span class="material-symbols-outlined text-base">edit</span>
                    <span>Düzenle</span>
                </button>
                <button type="button" class="delete-btn p-2 bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffdad6] rounded-lg transition-all flex items-center gap-1 text-xs font-medium" data-id="${itemUniqueId}">
                    <span class="material-symbols-outlined text-base">delete</span>
                    <span>Sil</span>
                </button>
            </div>
        `;
        portfolioList.appendChild(div);
    });

    // Event Listener'ları bağla
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openEditModal(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const targetProj = cachedProjects.find(p => String(p.id) === String(id) || p.title === id);
            const projTitle = targetProj ? targetProj.title : 'Bu projeyi';
            
            if (confirm(`"${projTitle}" projesini silmek istediğinize emin misiniz?`)) {
                e.currentTarget.disabled = true;
                e.currentTarget.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span>';
                if (targetProj && targetProj.id && !String(targetProj.id).startsWith('def-')) {
                    await deletePortfolioItem(targetProj.id);
                }
                cachedProjects = cachedProjects.filter(p => String(p.id) !== String(id) && p.title !== id);
                if (cachedProjects.length === 0) {
                    cachedProjects = DEFAULT_PROJECTS.map(parseItemMeta);
                }
                localStorage.setItem('mga_portfolio_projects', JSON.stringify(cachedProjects));
                if (statTotalProjects) statTotalProjects.textContent = cachedProjects.length;
                filterAndDisplayProjects();
            }
        });
    });
}

// Arama Girişi Dinleyicisi
if (searchPortfolio) {
    searchPortfolio.addEventListener('input', filterAndDisplayProjects);
}

// Proje Adı yazıldığında Otomatik Detay Linki Oluşturucu
export function slugify(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

const pTitleInput = document.getElementById('p_title');
const pLinkInput = document.getElementById('p_link');

if (pTitleInput && pLinkInput) {
    pTitleInput.addEventListener('input', () => {
        pLinkInput.value = `/project?id=${slugify(pTitleInput.value)}`;
    });
}

// --- PORTFÖY EKLEME FORM İŞLEMİ ---
if (addPortfolioForm) {
    addPortfolioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        addPortfolioBtn.disabled = true;
        addPortfolioBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">sync</span><span>Ekleme Yapılıyor...</span>';

        let imageUrl = pImageInput.value.trim();

        // Eğer dosya seçilmişse yükle
        const selectedFile = pFileInput.files[0];
        if (selectedFile) {
            const uploadedUrl = await uploadPortfolioImage(selectedFile);
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        if (!imageUrl) {
            alert('Lütfen bir görsel yükleyin veya Görsel URL girin.');
            addPortfolioBtn.disabled = false;
            addPortfolioBtn.innerHTML = '<span class="material-symbols-outlined text-xl">add</span><span>Projeyi Ekle</span>';
            return;
        }

        const rawDesc = document.getElementById('p_desc').value.trim();
        const playstoreUrl = pPlaystoreInput ? pPlaystoreInput.value.trim() : '';
        const youtubeVal = pYoutubeInput ? pYoutubeInput.value.trim() : '';
        const fullDesc = formatDescriptionWithMeta(rawDesc, playstoreUrl, youtubeVal);

        const catSelect = document.getElementById('p_category');
        const mainCat = catSelect ? catSelect.value : 'Ticari Çözüm';
        const subTags = document.getElementById('p_tags').value.trim();
        const combinedTags = subTags ? `${mainCat}, ${subTags}` : mainCat;

        const item = {
            title: document.getElementById('p_title').value.trim(),
            description: fullDesc,
            category_tags: combinedTags,
            image_url: imageUrl,
            link: document.getElementById('p_link').value.trim()
        };

        // Supabase DB'ye eklemeyi dene
        const { data: dbData, error: dbError } = await addPortfolioItem(item);
        if (dbError) {
            console.error('Supabase Add Error:', dbError);
            alert('Veritabanına eklenirken bir hata oluştu: ' + dbError.message);
        } else if (dbData && dbData[0]) {
            item.id = dbData[0].id;
        } else {
            item.id = `def-${Date.now()}`;
        }

        // Lokal diziye de ekle ve kaydet
        cachedProjects.unshift(parseItemMeta(item));
        localStorage.setItem('mga_portfolio_projects', JSON.stringify(cachedProjects));

        addPortfolioForm.reset();
        if (removePreviewBtn) removePreviewBtn.click();
        if (statTotalProjects) statTotalProjects.textContent = cachedProjects.length;
        filterAndDisplayProjects();

        addPortfolioBtn.disabled = false;
        addPortfolioBtn.innerHTML = '<span class="material-symbols-outlined text-xl">add</span><span>Projeyi Ekle</span>';
    });
}

// --- DÜZENLEME MODALI FONKSİYONLARI ---
function openEditModal(id) {
    const proj = cachedProjects.find(p => String(p.id) === String(id) || p.title === id);
    if (!proj) return;

    editIdInput.value = proj.id || proj.title;
    editTitleInput.value = proj.title || '';
    editDescInput.value = proj.cleanDescription || proj.description || '';
    
    // Set category select & clean sub-tags
    const editCatSelect = document.getElementById('edit_p_category');
    if (editCatSelect) {
        const tagsLower = (proj.category_tags || '').toLowerCase();
        if (tagsLower.includes('kişisel') || tagsLower.includes('kisisel') || tagsLower.includes('asistan')) {
            editCatSelect.value = 'Kişisel Asistan';
        } else if (tagsLower.includes('araç') || tagsLower.includes('arac') || tagsLower.includes('diğer') || tagsLower.includes('diger')) {
            editCatSelect.value = 'Araç & Diğer';
        } else {
            editCatSelect.value = 'Ticari Çözüm';
        }
    }

    const rawTags = proj.category_tags || '';
    editTagsInput.value = rawTags.replace(/^(Ticari Çözüm|Kişisel Asistan|Araç & Diğer)[,\s]*/gi, '').trim();
    editImageInput.value = proj.image_url || '';
    editPreview.src = proj.image_url || 'https://placehold.co/100x100?text=Proje';
    editFileInput.value = '';
    editFileSelectLabel.textContent = 'Yeni Görsel Seç (İsteğe bağlı)';
    document.getElementById('edit_p_link').value = proj.link || '';

    if (editPlaystoreInput) editPlaystoreInput.value = proj.playstoreUrl || '';
    if (editYoutubeInput) editYoutubeInput.value = proj.youtubeId || '';

    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
}

if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

if (editPortfolioForm) {
    editPortfolioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        editSaveBtn.disabled = true;
        editSaveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">sync</span><span>Güncelleniyor...</span>';

        const id = editIdInput.value;
        let imageUrl = editImageInput.value.trim();

        // Eğer yeni dosya seçilmişse yükle
        const newFile = editFileInput.files[0];
        if (newFile) {
            const uploadedUrl = await uploadPortfolioImage(newFile);
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        const rawDesc = editDescInput.value.trim();
        const playstoreUrl = editPlaystoreInput ? editPlaystoreInput.value.trim() : '';
        const youtubeVal = editYoutubeInput ? editYoutubeInput.value.trim() : '';
        const fullDesc = formatDescriptionWithMeta(rawDesc, playstoreUrl, youtubeVal);

        const editCatSelect = document.getElementById('edit_p_category');
        const mainCat = editCatSelect ? editCatSelect.value : 'Ticari Çözüm';
        const subTags = editTagsInput.value.trim();
        const cleanSubTags = subTags.replace(/^(Ticari Çözüm|Kişisel Asistan|Araç & Diğer)[,\s]*/gi, '').trim();
        const combinedTags = cleanSubTags ? `${mainCat}, ${cleanSubTags}` : mainCat;

        const updates = {
            title: editTitleInput.value.trim(),
            description: fullDesc,
            category_tags: combinedTags,
            image_url: imageUrl,
            link: document.getElementById('edit_p_link').value.trim()
        };

        const targetIndex = cachedProjects.findIndex(p => String(p.id) === String(id) || p.title === id);
        if (targetIndex !== -1) {
            const targetProj = cachedProjects[targetIndex];
            if (targetProj.id && !String(targetProj.id).startsWith('def-')) {
                await updatePortfolioItem(targetProj.id, updates);
            }
            const updatedItem = parseItemMeta({
                ...targetProj,
                ...updates,
                playstore_url: playstoreUrl,
                playstoreUrl: playstoreUrl,
                youtube_id: youtubeVal,
                youtubeId: youtubeVal
            });
            cachedProjects[targetIndex] = updatedItem;
            localStorage.setItem('mga_portfolio_projects', JSON.stringify(cachedProjects));
        }

        closeEditModal();
        filterAndDisplayProjects();

        editSaveBtn.disabled = false;
        editSaveBtn.innerHTML = '<span class="material-symbols-outlined text-lg">save</span><span>Güncelle</span>';
    });
}

// --- DASHBOARD VERİLERİNİ YÜKLE ---
async function loadDashboardData() {
    const content = await fetchSiteContent();
    if (content) {
        if (heroTitleInput && content.hero_title) heroTitleInput.value = content.hero_title;
        if (heroDescInput && content.hero_desc) heroDescInput.value = content.hero_desc;
    }
    renderPortfolioList();
}

// --- SAYFA YÜKLENDİĞİNDE VEYA MODÜL YÜKLENDİĞİNDE ANINDA BAŞLAT ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSession);
} else {
    checkSession();
}
