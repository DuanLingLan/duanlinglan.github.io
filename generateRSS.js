const fs = require('fs');
const path = require('path');

const posts = require('./posts.json');  // 确保 `posts.json` 在当前目录中
const rssFilePath = path.join(__dirname, 'rss.xml');

// 生成 RSS feed 内容
const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>Arashi's Blog</title>
        <link>https://duanlinglan.github.io/blog.html</link>
        <description>Latest updates from my blog</description>
        <language>zh-cn</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

const rssFooter = `
    </channel>
</rss>`;

const items = posts.map(post => `
    <item>
        <title>${post.title}</title>
        <link>https://duanlinglan.github.io/${post.file}</link>
        <description><![CDATA[${post.content || 'New post on my blog!'}]]></description>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>
`).join('');

const rssContent = `${rssHeader}${items}${rssFooter}`;

// 写入 `rss.xml`
fs.writeFileSync(rssFilePath, rssContent, { encoding: 'utf8' });
console.log('RSS feed updated successfully.');
