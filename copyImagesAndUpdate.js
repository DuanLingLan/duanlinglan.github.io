const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 定义 Markdown 文件目录和图片目标目录
const blogDir = path.join(__dirname, 'blog');
const imagesDir = path.join(__dirname, 'blog');

// 创建目标图片目录（如果不存在）
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 复制图片并更新 Markdown 文件的函数
function copyImagesAndUpdateMarkdown() {
    fs.readdir(blogDir, (err, files) => {
        if (err) {
            console.error("Error reading blog directory:", err);
            return;
        }

        files.filter(file => file.endsWith('.md')).forEach(file => {
            const filePath = path.join(blogDir, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${filePath}:`, err);
                    return;
                }

                // 正则匹配 Markdown 中的图片引用
                const imageRegex = /!\[.*?\]\((.*?)\)/g;
                let match;

                let updatedContent = data;

                while ((match = imageRegex.exec(data)) !== null) {
                    const imagePath = match[1];
                    if (fs.existsSync(imagePath)) {
                        const imageFileName = path.basename(imagePath);
                        const destImagePath = path.join(imagesDir, imageFileName);

                        // 复制图片到目标目录
                        fs.copyFile(imagePath, destImagePath, (err) => {
                            if (err) {
                                console.error(`Error copying image ${imagePath}:`, err);
                            } else {
                                console.log(`Image ${imagePath} copied to ${destImagePath}`);
                            }
                        });

                        // 更新 Markdown 中的图片路径
                        const newImagePath = `blog/${imageFileName}`;
                        updatedContent = updatedContent.replace(imagePath, newImagePath);
                    }
                }

                // 写回更新后的 Markdown 文件
                fs.writeFile(filePath, updatedContent, (err) => {
                    if (err) {
                        console.error(`Error writing updated file ${filePath}:`, err);
                    } else {
                        console.log(`Updated Markdown file: ${filePath}`);
                    }
                });
            });
        });
    });
}

// 运行函数
copyImagesAndUpdateMarkdown();
