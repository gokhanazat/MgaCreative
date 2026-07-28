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

const pFileInput = document.getElementById('p_file');
const pImageInput = document.getElementById('p_image');
const pPreviewContainer = document.getElementById('p_preview_container');
const pPreview = document.getElementById('p_preview');
const removePreviewBtn = document.getElementById('removePreviewBtn');
const fileSelectLabel = document.getElementById('fileSelectLabel');

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

let cachedProjects = [];

// --- OTURUM DURUMU KONTROLÜ ---
async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            if (loginSection) loginSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            if (statAdminEmail) statAdminEmail.textContent = session.user.email || 'Admin';
            
            loadDashboardData();
        } else {
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (loginSection) loginSection.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Session check error:', e);
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (loginSection) loginSection.classList.remove('hidden');
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

// --- PORTFÖY LİSTESİNİ ÇEK VE RENDER ET ---
async function renderPortfolioList() {
    if (!portfolioList) return;
    
    portfolioList.innerHTML = `
        <div class="text-center py-12 text-[#c6c6cd]">
            <span class="material-symbols-outlined text-3xl animate-spin mb-2">sync</span>
            <p class="text-sm">Projeler çekiliyor...</p>
        </div>
    `;

    cachedProjects = await fetchPortfolioItems();
    if (statTotalProjects) statTotalProjects.textContent = cachedProjects.length;

    filterAndDisplayProjects();
}

function filterAndDisplayProjects() {
    const query = searchPortfolio ? searchPortfolio.value.toLowerCase().trim() : '';
    
    const filtered = cachedProjects.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const tagMatch = (item.category_tags || '').toLowerCase().includes(query);
        return titleMatch || descMatch || tagMatch;
    });

    if (projectCountBadge) projectCountBadge.textContent = `${filtered.length} Proje`;

    if (filtered.length === 0) {
        portfolioList.innerHTML = `
            <div class="text-center py-12 text-[#c6c6cd] bg-[#101415] rounded-2xl border border-[#45464d]">
                <span class="material-symbols-outlined text-4xl mb-2 text-[#45464d]">folder_off</span>
                <p class="text-sm font-medium">Proje bulunamadı.</p>
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

        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1 min-w-0">
                <img src="${item.image_url || 'https://placehold.co/100x100?text=Proje'}" alt="${item.title}" class="w-16 h-16 rounded-xl object-cover border border-[#45464d] flex-shrink-0 bg-[#101415]">
                <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h4 class="text-white font-semibold text-base truncate">${item.title}</h4>
                    </div>
                    <p class="text-xs text-[#c6c6cd] line-clamp-2">${item.description || ''}</p>
                    <div class="flex flex-wrap gap-1 pt-1">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-[#45464d]/40 pt-2 sm:pt-0">
                <button type="button" class="edit-btn p-2 bg-[#1d2022] hover:bg-[#4cd7f6]/20 text-[#4cd7f6] rounded-lg transition-all flex items-center gap-1 text-xs font-medium" data-id="${item.id}">
                    <span class="material-symbols-outlined text-base">edit</span>
                    <span>Düzenle</span>
                </button>
                <button type="button" class="delete-btn p-2 bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffdad6] rounded-lg transition-all flex items-center gap-1 text-xs font-medium" data-id="${item.id}">
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
            const targetProj = cachedProjects.find(p => String(p.id) === String(id));
            const projTitle = targetProj ? targetProj.title : 'Bu projeyi';
            
            if (confirm(`"${projTitle}" projesini silmek istediğinize emin misiniz?`)) {
                e.currentTarget.disabled = true;
                e.currentTarget.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span>';
                const err = await deletePortfolioItem(id);
                if (err) alert('Silme hatası: ' + err.message);
                else renderPortfolioList();
            }
        });
    });
}

// Arama Girişi Dinleyicisi
if (searchPortfolio) {
    searchPortfolio.addEventListener('input', filterAndDisplayProjects);
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

        const item = {
            title: document.getElementById('p_title').value.trim(),
            description: document.getElementById('p_desc').value.trim(),
            category_tags: document.getElementById('p_tags').value.trim(),
            image_url: imageUrl,
            link: document.getElementById('p_link').value.trim()
        };

        const err = await addPortfolioItem(item);
        if (err) {
            alert('Ekleme hatası: ' + err.message);
        } else {
            addPortfolioForm.reset();
            if (removePreviewBtn) removePreviewBtn.click();
            renderPortfolioList();
        }

        addPortfolioBtn.disabled = false;
        addPortfolioBtn.innerHTML = '<span class="material-symbols-outlined text-xl">add</span><span>Projeyi Ekle</span>';
    });
}

// --- DÜZENLEME MODALI FONKSİYONLARI ---
function openEditModal(id) {
    const proj = cachedProjects.find(p => String(p.id) === String(id));
    if (!proj) return;

    editIdInput.value = proj.id;
    editTitleInput.value = proj.title || '';
    editDescInput.value = proj.description || '';
    editTagsInput.value = proj.category_tags || '';
    editImageInput.value = proj.image_url || '';
    editPreview.src = proj.image_url || 'https://placehold.co/100x100?text=Proje';
    editFileInput.value = '';
    editFileSelectLabel.textContent = 'Yeni Görsel Seç (İsteğe bağlı)';

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

        const updates = {
            title: editTitleInput.value.trim(),
            description: editDescInput.value.trim(),
            category_tags: editTagsInput.value.trim(),
            image_url: imageUrl,
            link: document.getElementById('edit_p_link').value.trim()
        };

        const err = await updatePortfolioItem(id, updates);
        if (err) {
            alert('Güncelleme hatası: ' + err.message);
        } else {
            closeEditModal();
            renderPortfolioList();
        }

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

// --- SAYFA YÜKLENDİĞİNDE BAŞLAT ---
document.addEventListener('DOMContentLoaded', checkSession);
