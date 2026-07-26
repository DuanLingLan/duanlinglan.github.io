const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const collectionsDir = path.join(rootDir, 'collections');
const notesFilePath = path.join(rootDir, 'data', 'notes.json');
const fileExtensions = {
    image: new Set(['.jpg', '.png', '.jpeg', '.gif']),
    markdown: new Set(['.md'])
};

function getFileHash(filePath) {
    return crypto
        .createHash('md5')
        .update(fs.readFileSync(filePath))
        .digest('hex');
}

function readExistingNotes() {
    if (!fs.existsSync(notesFilePath)) {
        return [];
    }

    const fileContent = fs.readFileSync(notesFilePath, 'utf8');
    return fileContent ? JSON.parse(fileContent) : [];
}

const notesData = readExistingNotes();

// 优先按文件路径去重（文件内容修改时更新原条目，不再重复追加）；
// 老条目没有 file 字段，依次退回图片路径 / 标题 / 内容 hash 匹配，避免重复入库。
function findExistingNote(relativePath, title, isImage, fileHash) {
    return notesData.find(note => note.file === relativePath)
        || (isImage && notesData.find(note => note.image === relativePath))
        || notesData.find(note => !note.file && !note.image && note.title === title)
        || notesData.find(note => !note.file && note.hash === fileHash);
}

fs.readdirSync(collectionsDir).forEach(file => {
    const filePath = path.join(collectionsDir, file);
    if (fs.statSync(filePath).isDirectory()) {
        return;
    }

    const ext = path.extname(file).toLowerCase();
    const isImage = fileExtensions.image.has(ext);
    const isMarkdown = fileExtensions.markdown.has(ext);
    if (!isImage && !isMarkdown) {
        return;
    }

    const relativePath = `collections/${file}`;
    const title = path.basename(file, ext);
    const fileHash = getFileHash(filePath);
    const existing = findExistingNote(relativePath, title, isImage, fileHash);

    if (existing) {
        // 回填路径字段，旧条目以后就按路径稳定匹配（标题改了也不会重复入库）
        existing.file = relativePath;
        // 图片条目：标题/内容可能被手动编辑过，不覆盖；md 条目：同步最新正文，保留原日期和标题
        if (isMarkdown && existing.hash !== fileHash) {
            existing.content = fs.readFileSync(filePath, 'utf8');
            existing.hash = fileHash;
        }
        return;
    }

    const noteData = {
        title,
        date: new Date().toISOString().split('T')[0],
        content: isMarkdown ? fs.readFileSync(filePath, 'utf8') : '',
        image: isImage ? relativePath : '',
        file: relativePath,
        hash: fileHash
    };

    notesData.push(noteData);
});

fs.mkdirSync(path.dirname(notesFilePath), { recursive: true });
fs.writeFileSync(notesFilePath, JSON.stringify(notesData, null, 4), 'utf8');
console.log(`data/notes.json updated with ${notesData.length} note(s).`);
