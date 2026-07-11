const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const blogDir = path.join(rootDir, 'blog');
const jsonFilePath = path.join(rootDir, 'data', 'posts.json');

function createPostFromFile(file) {
    const name = file.replace(/\.md$/, '');
    const [year, month, day, ...rest] = name.split('-');
    const title = `${year}-${month}-${day} ${rest.join(' ').replace(/_/g, ' ')}`;

    return {
        title,
        date: `${year}-${month}-${day}`,
        file: `blog/${file}`
    };
}

function generatePostsJson() {
    if (!fs.existsSync(blogDir)) {
        console.error('Blog directory does not exist:', blogDir);
        return;
    }

    const posts = fs.readdirSync(blogDir)
        .filter(file => file.endsWith('.md'))
        .map(createPostFromFile)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });
    fs.writeFileSync(jsonFilePath, JSON.stringify(posts, null, 2), 'utf8');

    console.log(`data/posts.json updated with ${posts.length} post(s).`);
}

generatePostsJson();
