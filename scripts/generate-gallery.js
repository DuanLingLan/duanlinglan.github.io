const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'gallery.json');
const outputPath = path.join(rootDir, 'partials', 'gallery.html');
const outputTextPath = path.join(rootDir, 'data', 'gallery-output.html');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeGalleryData(data) {
    if (Array.isArray(data)) {
        return {
            imageBasePath: 'assets/pic/gallery_photos',
            groups: [
                {
                    id: 'dynamic-collection',
                    title: 'Dynamic Collection',
                    items: data.map(src => {
                        const parsed = path.parse(src);
                        return {
                            src,
                            title: parsed.name,
                            alt: parsed.name
                        };
                    })
                }
            ]
        };
    }

    return {
        imageBasePath: data.imageBasePath || 'assets/pic/gallery_photos',
        groups: Array.isArray(data.groups) ? data.groups : []
    };
}

function renderItem(item) {
    const src = escapeHtml(item.src);
    const title = escapeHtml(item.title || path.parse(item.src || '').name);
    const alt = escapeHtml(item.alt || item.title || path.parse(item.src || '').name);

    return `        <div class="slide">
            <img src="${src}" alt="${alt}">
            <div class="slide-name">${title}</div>
        </div>`;
}

function renderGroup(group) {
    const items = Array.isArray(group.items) ? group.items.filter(item => item && item.src) : [];
    if (items.length === 0) {
        return '';
    }

    return `    <h2 class="colorText">${escapeHtml(group.title || 'Gallery')}</h2>
    <div class="horizontal-scroll">
${items.map(renderItem).join('\n\n')}
    </div>`;
}

function generateGallery() {
    if (!fs.existsSync(dataPath)) {
        console.error('Gallery data does not exist:', dataPath);
        return;
    }

    const data = normalizeGalleryData(JSON.parse(fs.readFileSync(dataPath, 'utf8')));
    const content = `<div class="gallery-content">
${data.groups.map(renderGroup).filter(Boolean).join('\n\n')}
</div>
`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, 'utf8');
    fs.writeFileSync(outputTextPath, content, 'utf8');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');

    const imageCount = data.groups.reduce((total, group) => total + (group.items ? group.items.length : 0), 0);
    console.log(`partials/gallery.html updated with ${data.groups.length} group(s), ${imageCount} image(s).`);
}

generateGallery();
