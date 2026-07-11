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
const existingHashes = new Set(notesData.map(note => note.hash));

fs.readdirSync(collectionsDir).forEach(file => {
    const filePath = path.join(collectionsDir, file);
    if (fs.statSync(filePath).isDirectory()) {
        return;
    }

    const ext = path.extname(file).toLowerCase();
    const fileHash = getFileHash(filePath);

    if (existingHashes.has(fileHash)) {
        return;
    }

    const noteData = {
        title: path.basename(file, ext),
        date: new Date().toISOString().split('T')[0],
        content: '',
        image: '',
        hash: fileHash
    };

    if (fileExtensions.image.has(ext)) {
        noteData.image = `collections/${file}`;
    } else if (fileExtensions.markdown.has(ext)) {
        noteData.content = fs.readFileSync(filePath, 'utf8');
    } else {
        return;
    }

    notesData.push(noteData);
});

fs.mkdirSync(path.dirname(notesFilePath), { recursive: true });
fs.writeFileSync(notesFilePath, JSON.stringify(notesData, null, 4), 'utf8');
console.log(`data/notes.json updated with ${notesData.length} note(s).`);
