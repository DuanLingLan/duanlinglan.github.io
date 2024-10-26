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
                const [year, month, day, ...rest] = file.replace(/\.md$/, '').split('-');
                const title = `${year}-${month}-${day} ${rest.join(' ').replace(/_/g, ' ')}`; // 使用文件名作为标题并替换下划线为空格
                return { title, date: `${year}-${month}-${day}`, file: `blog/${file}` };
            });

        if (posts.length === 0) {
            console.log("No Markdown files found in the blog directory.");
        }

        // 处理每个 Markdown 文件，替换图片引用
        posts.forEach(post => {
            const filePath = path.join(__dirname, post.file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${post.file}:`, err);
                    return;
                }

                // 查找 Obsidian 的图片引用，并将其转换为标准 Markdown 格式
                const updatedContent = data.replace(/!\[\[(.*?)\]\]/g, (match, p1) => {
                    // 构造相对路径，确保指向 blog 目录下的图片
                    let imageName = p1.trim();

                    // 检查是否符合 image<日期>.png 的格式
                    if (imageName.startsWith('Pasted image')) {
                        // 替换为符合 image<日期>.png 的格式
                        imageName = imageName.replace('Pasted image', 'image').trim();
                    }

                    const imagePath = `${imageName}`;
                    return `![Image](${imagePath})`;
                });

                // 写回更新后的 Markdown 文件
                fs.writeFile(filePath, updatedContent, (err) => {
                    if (err) {
                        console.error(`Error writing file ${post.file}:`, err);
                    } else {
                        console.log(`Updated Markdown file: ${post.file}`);
                    }
                });
            });
        });

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
