const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'achievements.json');
const outputPath = path.join(rootDir, 'partials', 'achievements.html');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeAchievements(data) {
    const source = data && typeof data === 'object' ? data : {};
    const items = Array.isArray(data) ? data : source.items;
    return {
        items: (Array.isArray(items) ? items : [])
            .filter(item => item && typeof item === 'object' && item.src)
            .map(item => ({
                src: String(item.src),
                title: String(item.title || path.parse(String(item.src)).name),
                date: String(item.date || ''),
                alt: String(item.alt || item.title || path.parse(String(item.src)).name)
            }))
    };
}

function renderItem(item) {
    const date = item.date ? `\n            <div class="slide-name">${escapeHtml(item.date)}</div>` : '';
    return `        <div class="slide-achive">
            <img loading="lazy" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}">
            <div class="slide-name">${escapeHtml(item.title)}</div>${date}
        </div>`;
}

function generateAchievements() {
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Achievement data does not exist: ${dataPath}`);
    }
    const data = normalizeAchievements(JSON.parse(fs.readFileSync(dataPath, 'utf8')));
    const content = `<div class="gallery-content">
    <div class="horizontal-scroll">
${data.items.map(renderItem).join('\n\n')}
    </div>
</div>
`;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`partials/achievements.html updated with ${data.items.length} achievement(s).`);
}

generateAchievements();
