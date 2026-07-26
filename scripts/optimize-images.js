// 图片压缩脚本（需要 sharp：npm install 后可用）
// 用法：
//   node scripts/optimize-images.js           预览模式：只列出会被压缩的图片和预计效果，不改任何文件
//   node scripts/optimize-images.js --apply   实际压缩：先把原图备份到 _originals-backup/，再原地覆盖
// 规则：只处理 jpg/png、大于 500KB 的图片；最长边缩到 2000px、jpg 质量 80；文件名不变，页面引用零改动。
const fs = require('fs');
const path = require('path');

let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.error('需要先安装 sharp：在项目目录运行 npm install');
    process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, '_originals-backup');
const TARGET_DIRS = ['assets/pic', 'assets/pic/gallery_photos', 'collections'];
const SIZE_THRESHOLD = 500 * 1024;
const MAX_DIMENSION = 2000;
const APPLY = process.argv.includes('--apply');

function formatMB(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function listImages(relativeDir) {
    const dir = path.join(ROOT, relativeDir);
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs.readdirSync(dir)
        .filter(file => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()))
        .map(file => path.join(dir, file))
        .filter(filePath => fs.statSync(filePath).isFile() && fs.statSync(filePath).size > SIZE_THRESHOLD);
}

async function compress(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    // 先读进内存再处理：避免 sharp 占着文件句柄导致 Windows 上无法覆盖写回
    const input = fs.readFileSync(filePath);
    const image = sharp(input).rotate().resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true
    });

    return ext === '.png'
        ? image.png({ compressionLevel: 9, palette: true }).toBuffer()
        : image.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

async function main() {
    // 去重（assets/pic 的扫描不会递归，gallery_photos 单独列出）
    const files = [...new Set(TARGET_DIRS.flatMap(listImages))];

    if (!files.length) {
        console.log(`没有找到大于 ${formatMB(SIZE_THRESHOLD)} 的 jpg/png 图片，无需压缩。`);
        return;
    }

    console.log(`${APPLY ? '压缩中' : '预览模式（加 --apply 才会实际压缩）'}，共 ${files.length} 张：\n`);

    let totalBefore = 0;
    let totalAfter = 0;

    for (const filePath of files) {
        const relative = path.relative(ROOT, filePath);
        const before = fs.statSync(filePath).size;

        let buffer;
        try {
            buffer = await compress(filePath);
        } catch (error) {
            console.warn(`  跳过 ${relative}（${error.message}）`);
            continue;
        }

        if (buffer.length >= before) {
            console.log(`  跳过 ${relative}：已经足够小（${formatMB(before)}）`);
            continue;
        }

        totalBefore += before;
        totalAfter += buffer.length;
        console.log(`  ${relative}: ${formatMB(before)} -> ${formatMB(buffer.length)}`);

        if (APPLY) {
            const backupPath = path.join(BACKUP_DIR, relative);
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
            if (!fs.existsSync(backupPath)) {
                fs.copyFileSync(filePath, backupPath);
            }
            fs.writeFileSync(filePath, buffer);
        }
    }

    if (totalBefore > 0) {
        console.log(`\n合计：${formatMB(totalBefore)} -> ${formatMB(totalAfter)}（省 ${formatMB(totalBefore - totalAfter)}）`);
        if (APPLY) {
            console.log(`原图已备份到 ${path.relative(ROOT, BACKUP_DIR)}/（该目录不会进 git）`);
        } else {
            console.log('确认没问题后运行：node scripts/optimize-images.js --apply');
        }
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
