const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'library.json');
const outputPath = path.join(rootDir, 'partials', 'library.html');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeLibrary(data) {
    const categories = (data && Array.isArray(data.categories)) ? data.categories : [];
    return {
        categories: categories.filter(cat => cat && typeof cat === 'object').map(cat => ({
            id: String(cat.id || ''),
            title: String(cat.title || ''),
            items: (Array.isArray(cat.items) ? cat.items : []).map(item => String(item || ''))
        })),
        lastUpdated: String(data && data.lastUpdated ? data.lastUpdated : '')
    };
}

function renderCategory(cat) {
    const itemsHtml = cat.items
        .filter(item => item.trim() !== '')
        .map(item => `                <li><strong>${escapeHtml(item)}</strong></li>`)
        .join('\n');

    return `        <div class="library-category">
            <h3 class="library-title">${escapeHtml(cat.title)}</h3>
            <ul>
${itemsHtml || '                <li></li>'}
            </ul>
        </div>`;
}

function generateLibrary() {
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Library data does not exist: ${dataPath}`);
    }
    const data = normalizeLibrary(JSON.parse(fs.readFileSync(dataPath, 'utf8')));

    const content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Library</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<style>
body {
    color: #64002B;
}
</style>
<body>

    <div class="library-content">

        <h2 class="colorText">Currently...</h2>

${data.categories.map(renderCategory).join('\n\n')}
        --------------------

        <p>last updated on ${escapeHtml(data.lastUpdated)}</p>

</body>

</html>
`;

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`partials/library.html updated with ${data.categories.length} categories.`);
}

generateLibrary();
