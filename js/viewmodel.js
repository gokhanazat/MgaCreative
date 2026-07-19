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
        const items = await fetchPortfolioItems();
        if (items.length === 0) {
            portfolioGrid.innerHTML = '<p class="text-on-surface-variant font-body-md col-span-full">Henüz proje eklenmemiş.</p>';
        } else {
            portfolioGrid.innerHTML = items.map(item => {
                // Etiketleri (Tags) virgülle ayırıp span'lara dönüştür
                const tagsHtml = item.category_tags 
                    ? item.category_tags.split(',').map(tag => `<span class="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-label-sm text-label-sm">${tag.trim()}</span>`).join('')
                    : '';

                return `
                <div class="group relative glass-card rounded-[24px] overflow-hidden inner-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-full">
                    <div class="h-64 overflow-hidden">
                        <img alt="${item.title} Preview" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${item.image_url}"/>
                    </div>
                    <div class="p-8 space-y-4 flex flex-col flex-grow">
                        <div class="flex gap-2 flex-wrap">
                            ${tagsHtml}
                        </div>
                        <h3 class="font-headline-lg text-[24px] leading-tight">${item.title}</h3>
                        <p class="font-body-md text-body-md text-on-surface-variant flex-grow">${item.description}</p>
                        <a class="inline-flex items-center text-primary-fixed-dim font-label-md text-label-md pt-2 mt-auto" href="${item.link}">
                            Projeyi İncele <span class="material-symbols-outlined ml-2 text-[18px]">open_in_new</span>
                        </a>
                    </div>
                </div>
                `;
            }).join('');
        }
    }
}

// Sayfa yüklendiğinde verileri çek
document.addEventListener('DOMContentLoaded', updatePageContent);
