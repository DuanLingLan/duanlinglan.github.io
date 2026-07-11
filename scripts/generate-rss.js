const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const posts = require(path.join(rootDir, 'data', 'posts.json'));
const rssFilePath = path.join(rootDir, 'rss.xml');
const siteUrl = 'https://duanlinglan.github.io';

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function markdownForPost(post) {
    const filePath = path.join(rootDir, post.file);
    if (!fs.existsSync(filePath)) {
        return 'New post on my blog!';
    }

    return fs.readFileSync(filePath, 'utf8')
        .replace(/!\[\[(.*?)\]\]/g, (_, imageName) => {
            const cleanName = imageName.trim().replace(/^Pasted image\s*/, 'image ');
            return `![Image](${cleanName})`;
        })
        .replace(/]]>/g, ']]]]><![CDATA[>');
}

const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>Arashi's Blog</title>
        <link>${siteUrl}/blog.html</link>
        <description>Latest updates from my blog</description>
        <language>zh-cn</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

const rssFooter = `
    </channel>
</rss>`;

const items = posts.map(post => {
    const titleWithoutDate = post.title.replace(/^\d{4}-\d{2}-\d{2} /, '');
    const link = `${siteUrl}/${encodeURI(post.file)}`;
    const content = markdownForPost(post);

    return `
    <item>
        <title>${escapeXml(titleWithoutDate)}</title>
        <link>${link}</link>
        <guid>${link}</guid>
        <description><![CDATA[${content}]]></description>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`;
}).join('');

fs.writeFileSync(rssFilePath, `${rssHeader}${items}${rssFooter}`, 'utf8');
console.log('rss.xml updated successfully.');
