const fs = require('fs');
const path = require('path');

// 定义 Markdown 文件目录和 JSON 文件路径
const blogDir = path.join(__dirname, 'blog');
const jsonFilePath = path.join(__dirname, 'posts.json');

// 检查博客目录是否存在
if (!fs.existsSync(blogDir)) {
    console.error("Blog directory does not exist:", blogDir);
    return;
}

// 生成 JSON 文件
function generatePostsJson() {
    fs.readdir(blogDir, (err, files) => {
        if (err) {
            console.error("Error reading blog directory:", err);
            return;
        }

        // 过滤出 .md 文件并创建 JSON 数据
        const posts = files
            .filter(file => file.endsWith('.md'))
            .map(file => {
                const title = file.replace(/\.md$/, '').replace(/-/g, ' '); // 使用文件名作为标题
                return { title, file: `blog/${file}` };
            });

        if (posts.length === 0) {
            console.log("No Markdown files found in the blog directory.");
        }

        // 将数据写入 posts.json 文件
        fs.writeFile(jsonFilePath, JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                console.error("Error writing JSON file:", err);
            } else {
                console.log("posts.json updated successfully.");
            }
        });
    });
}

// 运行生成 JSON 文件函数
generatePostsJson();
