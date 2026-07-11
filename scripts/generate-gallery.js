const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const directoryPath = path.join(rootDir, 'assets', 'pic', 'gallery_photos');
const outputPath = path.join(rootDir, 'data', 'gallery.json');
const cachePath = path.join(rootDir, 'cache', 'cache.json');
const outputTextPath = path.join(rootDir, 'data', 'gallery-output.html');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif']);

function readJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) {
        return fallback;
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : fallback;
}

function writeJson(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function generateGalleryOutputFile(galleryData) {
    const outputContent = galleryData.map(image => {
        const fileName = path.basename(image, path.extname(image));

        return `        <div class="slide">
            <img src="${image}" alt="${fileName}">
            <div class="slide-name">${fileName}</div>
        </div>`;
    }).join('\n\n');

    fs.writeFileSync(outputTextPath, `${outputContent}\n`, 'utf8');
}

function generateGalleryJSON() {
    if (!fs.existsSync(directoryPath)) {
        console.error('Gallery directory does not exist:', directoryPath);
        return;
    }

    const imageFiles = fs.readdirSync(directoryPath)
        .filter(file => imageExtensions.has(path.extname(file).toLowerCase()));
    const cachedFiles = readJson(cachePath, []);
    const newFiles = imageFiles.filter(file => !cachedFiles.includes(file));
    const galleryData = readJson(outputPath, []);

    newFiles.forEach(file => {
        galleryData.push(`assets/pic/gallery_photos/${file}`);
    });

    writeJson(outputPath, galleryData);
    writeJson(cachePath, imageFiles);
    generateGalleryOutputFile(galleryData);

    console.log(`data/gallery.json updated. Added ${newFiles.length} new image(s).`);
}

generateGalleryJSON();
