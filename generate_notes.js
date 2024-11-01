const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 指定文件夹和文件路径
const collectionsDir = path.join(__dirname, 'collections');
const notesFilePath = path.join(__dirname, 'notes.json');

// 初始化文件格式
const fileExtensions = {
    image: ['.jpg', '.png', '.jpeg', '.gif'],
    markdown: ['.md']
};

// 计算文件的哈希值
function getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

// 读取已有的 notes.json 文件
let notesData = [];
if (fs.existsSync(notesFilePath)) {
    const fileContent = fs.readFileSync(notesFilePath, 'utf-8');
    notesData = JSON.parse(fileContent);
}

// 获取已有的哈希值以防止重复
const existingHashes = new Set(notesData.map(note => note.hash));

// 获取 collections 文件夹中的所有文件
const files = fs.readdirSync(collectionsDir);

// 遍历文件，分类图片和 Markdown 文件
files.forEach(file => {
    const filePath = path.join(collectionsDir, file);

    // 添加文件类型检查，跳过文件夹
    if (fs.statSync(filePath).isDirectory()) {
        return; // 如果是目录，跳过此项
    }

    const ext = path.extname(file).toLowerCase();
    const fileHash = getFileHash(filePath);

    if (!existingHashes.has(fileHash)) {
        const noteData = {
            title: '',
            date: new Date().toISOString().split('T')[0],
            content: '',
            image: '',
            hash: fileHash
        };

        if (fileExtensions.image.includes(ext)) {
            // 处理图片文件，使用文件名作为标题
            noteData.title = path.basename(file, ext);
            // 转换为相对路径并替换路径分隔符为 /
            noteData.image = `collections/${file}`;
        } else if (fileExtensions.markdown.includes(ext)) {
            // 处理 Markdown 文件，使用文件名作为标题，读取文件内容作为内容
            noteData.title = path.basename(file, ext);
            noteData.content = fs.readFileSync(path.join(collectionsDir, file), 'utf-8');
        }

        // 添加新文件的数据
        notesData.push(noteData);
    }
});

// 写入或更新 notes.json 文件
fs.writeFileSync(notesFilePath, JSON.stringify(notesData, null, 4), 'utf-8');
console.log('notes.json 文件已生成/更新完成');
