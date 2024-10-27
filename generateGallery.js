const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'assets/pic/gallery_photos');
const outputPath = path.join(__dirname, 'gallery.json');
const cachePath = path.join(__dirname, 'cache.json');
const outputTextPath = path.join(__dirname, 'gallery_output.txt');

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

// 加载缓存的文件列表
function loadCache() {
    if (fs.existsSync(cachePath)) {
        const data = fs.readFileSync(cachePath, 'utf-8');
        return data ? JSON.parse(data) : []; // 检查数据是否为空
    }
    return [];
}

// 保存新的缓存列表
function saveCache(files) {
    fs.writeFileSync(cachePath, JSON.stringify(files, null, 2), 'utf-8');
}

// 主生成函数
function generateGalleryJSON() {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error("Could not read the directory.", err);
            return;
        }

        const imageFiles = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));

        const cachedFiles = loadCache();
        
        const newFiles = imageFiles.filter(file => !cachedFiles.includes(file));

        if (newFiles.length === 0) {
            console.log("No new images to add.");
            return;
        }

        // 确保 gallery.json 存在并具有初始内容
        let galleryData = [];
        if (fs.existsSync(outputPath)) {
            const galleryContent = fs.readFileSync(outputPath, 'utf-8');
            galleryData = galleryContent ? JSON.parse(galleryContent) : []; // 检查数据是否为空
        }

        newFiles.forEach(file => {
            galleryData.push(`assets/pic/gallery_photos/${file}`);
        });

        fs.writeFileSync(outputPath, JSON.stringify(galleryData, null, 2), 'utf-8');
        saveCache(imageFiles);

        console.log(`Added ${newFiles.length} new image(s) to gallery.json.`);

        // 调用函数生成文本文件
        generateGalleryOutputFile(galleryData);
    });
}

// 生成 gallery_output.txt 文件
function generateGalleryOutputFile(galleryData) {
    let outputContent = '';

    galleryData.forEach((image) => {
        const fileName = path.basename(image, path.extname(image));

        // 生成 HTML 代码
        const imageHTML = `
        <div class="slide">
            <img src="${image}" alt="${fileName}">
            <div class="slide-name">${fileName}</div>
        </div>
        `;
        outputContent += imageHTML + '\n';
    });

    // 将生成的内容写入到 output 文件中
    fs.writeFile(outputTextPath, outputContent, (err) => {
        if (err) {
            console.error("Error writing to gallery_output.txt:", err);
            return;
        }
        console.log("Gallery HTML code generated in gallery_output.txt.");
    });
}

// 运行主生成函数
generateGalleryJSON();
