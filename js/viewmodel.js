import { fetchSiteContent, fetchPortfolioItems } from './supabase-client.js';

// DOM Elements
const heroTitleElement = document.getElementById('hero-title');
const heroDescElement = document.getElementById('hero-desc');
const portfolioGrid = document.getElementById('portfolio-grid');

async function updatePageContent() {
    const contentMap = await fetchSiteContent();
    
    if (contentMap) {
        // Eğer veritabanında hero_title varsa DOM'a bas
        if (heroTitleElement && contentMap.hero_title) {
            heroTitleElement.innerHTML = contentMap.hero_title;
        }
        
        // Eğer veritabanında hero_desc varsa DOM'a bas
        if (heroDescElement && contentMap.hero_desc) {
            heroDescElement.innerHTML = contentMap.hero_desc;
        }
    }

    // Portfolio Öğelerini Çek
    if (portfolioGrid) {
        let dbItems = [];
        try {
            dbItems = await fetchPortfolioItems();
        } catch(e) {}

        let localItems = [];
        const savedLocal = localStorage.getItem('mga_portfolio_projects');
        if (savedLocal) {
            try {
                localItems = JSON.parse(savedLocal);
            } catch(e) {}
        }

        const combinedMap = new Map();
        (dbItems || []).forEach(item => {
            const key = (item.title || '').toLowerCase().trim();
            if (key) combinedMap.set(key, item);
        });
        (localItems || []).forEach(item => {
            const key = (item.title || '').toLowerCase().trim();
            if (key) combinedMap.set(key, item);
        });

        const items = Array.from(combinedMap.values());
        if (items.length === 0) {
            portfolioGrid.innerHTML = '<p class="text-slate-500 font-medium col-span-full">Henüz proje eklenmemiş.</p>';
        } else {
            // Ana sayfada ilk 8 projeyi göster
            portfolioGrid.innerHTML = items.slice(0, 8).map(item => {
                const cleanDesc = (item.description || '').replace(/<!--META:[\s\S]*?-->/g, '').trim();
                let imgUrl = (item.image_url || '')
                    .replace('coocmatch_kart.jpeg', 'cookmatch_kart.jpeg')
                    .replace('ardeg_kart.jpeg', 'argep_kart.jpeg')
                    .replace('tripmimd_kart.jpeg', 'tripmind_kart.jpeg')
                    .replace('lemoraxl_kart.jpeg', 'lemoraxl-kart.jpeg')
                    .replace('Voxnoete_kart.jpeg', 'voxnote_kart.jpeg');

                // Etiketleri virgülle ayırıp modern badge haline getir
                const tagsHtml = item.category_tags 
                    ? item.category_tags.split(',').slice(0, 3).map(tag => `<span class="bg-sky-50 text-sky-700 border border-sky-200/80 px-2.5 py-0.5 rounded-md text-xs font-semibold">${tag.trim()}</span>`).join(' ')
                    : '';

                return `
                <div class="glass-card rounded-2xl overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all duration-300">
                    <div class="h-48 overflow-hidden bg-slate-100 relative">
                        <img alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="${imgUrl}"/>
                    </div>
                    <div class="p-5 space-y-3 flex flex-col flex-grow">
                        <div class="flex gap-1.5 flex-wrap">
                            ${tagsHtml}
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">${item.title}</h3>
                        <p class="text-xs text-slate-600 leading-relaxed flex-grow line-clamp-3">${cleanDesc}</p>
                        <div class="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between">
                            <a class="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold text-xs" href="${item.link}">
                                <span>İncele</span>
                                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    }
}

// Sayfa yüklendiğinde verileri çek
document.addEventListener('DOMContentLoaded', updatePageContent);
