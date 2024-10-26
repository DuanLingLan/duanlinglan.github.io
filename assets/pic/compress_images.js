const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 设置文件目录
const inputDir = path.join(__dirname, 'original_photos');
const outputDir = path.join(__dirname, 'gallery_photos');

// 检查输出目录是否存在，不存在则创建
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 读取目录下的所有图片文件
fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        const inputFile = path.join(inputDir, file);
        const outputFile = path.join(outputDir, file);

        // 使用 sharp 压缩图片
        sharp(inputFile)
            .resize({ width: 1000 })  // 调整图片宽度以压缩大小
            .jpeg({ quality: 80 })    // 设置 JPEG 压缩质量，调整到合适大小
            .toFile(outputFile, (err, info) => {
                if (err) {
                    console.error('Error processing file', file, err);
                } else {
                    console.log(`Compressed ${file} to ~${Math.round(info.size / 1024)} KB`);
                }
            });
    });
});
