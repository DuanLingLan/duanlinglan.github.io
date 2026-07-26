// 本地管理服务器：零依赖（只用 Node 内置模块），仅监听 127.0.0.1，不部署到线上。
// 用法：node scripts/admin-server.js [--open]
// 提供：静态文件服务 + 保存 JSON / 上传图片 / 生成 / 一键发布 API。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.ADMIN_PORT) || 4321;
const MAX_BODY_SIZE = 100 * 1024 * 1024;

// 只允许写这几个数据文件，防止任意路径写入
const SAVABLE_FILES = new Set([
    'data/gallery.json',
    'data/notebook-content.json',
    'data/notes.json'
]);

// 上传目录白名单
const UPLOAD_DIRS = {
    gallery: 'assets/pic/gallery_photos',
    collections: 'collections'
};

const GENERATE_SCRIPTS = [
    'generate-posts.js',
    'generate-notes.js',
    'generate-rss.js',
    'generate-gallery.js',
    'generate-changelog.js'
];

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
};

// sharp 是可选依赖：装了就在上传时自动压缩大图，没装照常工作
let sharp = null;
try {
    sharp = require('sharp');
} catch (error) {
    sharp = null;
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_BODY_SIZE) {
                reject(new Error('Body too large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

function run(command, args) {
    return new Promise(resolve => {
        execFile(command, args, { cwd: ROOT, windowsHide: true }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                code: error ? error.code : 0,
                output: `${stdout || ''}${stderr || ''}`.trim()
            });
        });
    });
}

async function runGenerators(log) {
    for (const script of GENERATE_SCRIPTS) {
        const result = await run('node', [path.join('scripts', script)]);
        log.push(`> node scripts/${script}\n${result.output}`);
        if (!result.ok) {
            return false;
        }
    }
    return true;
}

// 文件名清洗：保留中文/空格/连字符等正常字符，去掉路径分隔符、Windows 非法字符和控制字符
function sanitizeFileName(name) {
    const base = path.basename(String(name || 'upload'));
    const forbidden = '\\/:*?"<>|';
    const cleaned = Array.from(base)
        .filter(ch => ch.charCodeAt(0) >= 32 && !forbidden.includes(ch))
        .join('')
        .trim();
    return cleaned || `upload-${Date.now()}`;
}

function uniqueFilePath(dir, fileName) {
    const parsed = path.parse(fileName);
    let candidate = fileName;
    let counter = 1;
    while (fs.existsSync(path.join(dir, candidate))) {
        candidate = `${parsed.name}-${counter}${parsed.ext}`;
        counter += 1;
    }
    return candidate;
}

async function compressIfLarge(filePath) {
    if (!sharp) {
        return null;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        return null;
    }

    const before = fs.statSync(filePath).size;
    if (before < 500 * 1024) {
        return null;
    }

    try {
        // 先读进内存再处理：避免 sharp 占着文件句柄导致 Windows 上无法覆盖写回
        const input = fs.readFileSync(filePath);
        const image = sharp(input).rotate().resize({
            width: 2000,
            height: 2000,
            fit: 'inside',
            withoutEnlargement: true
        });
        const buffer = ext === '.png'
            ? await image.png({ compressionLevel: 9, palette: true }).toBuffer()
            : await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

        if (buffer.length < before) {
            fs.writeFileSync(filePath, buffer);
            return { before, after: buffer.length };
        }
    } catch (error) {
        console.warn(`Compression skipped for ${filePath}: ${error.message}`);
    }
    return null;
}

async function handleSave(req, res) {
    const body = await readBody(req);
    let payload;
    try {
        payload = JSON.parse(body.toString('utf8'));
    } catch (error) {
        return sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
    }

    const file = String(payload.file || '');
    if (!SAVABLE_FILES.has(file)) {
        return sendJson(res, 403, { ok: false, error: `Saving to "${file}" is not allowed` });
    }
    if (payload.content === null || typeof payload.content !== 'object') {
        return sendJson(res, 400, { ok: false, error: 'content must be a JSON object/array' });
    }

    const targetPath = path.join(ROOT, file);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(payload.content, null, 2), 'utf8');
    console.log(`Saved ${file}`);
    return sendJson(res, 200, { ok: true, file });
}

async function handleUpload(req, res, query) {
    const dirKey = query.get('dir');
    const relativeDir = UPLOAD_DIRS[dirKey];
    if (!relativeDir) {
        return sendJson(res, 403, { ok: false, error: `Unknown upload dir "${dirKey}"` });
    }

    const fileName = sanitizeFileName(query.get('name'));
    const body = await readBody(req);
    if (!body.length) {
        return sendJson(res, 400, { ok: false, error: 'Empty file' });
    }

    const targetDir = path.join(ROOT, relativeDir);
    fs.mkdirSync(targetDir, { recursive: true });
    const finalName = uniqueFilePath(targetDir, fileName);
    const targetPath = path.join(targetDir, finalName);
    fs.writeFileSync(targetPath, body);

    const compressed = await compressIfLarge(targetPath);
    const relativePath = `${relativeDir}/${finalName}`;
    console.log(`Uploaded ${relativePath}${compressed ? ` (compressed ${(compressed.before / 1024 / 1024).toFixed(1)}MB -> ${(compressed.after / 1024 / 1024).toFixed(1)}MB)` : ''}`);
    return sendJson(res, 200, { ok: true, path: relativePath, name: finalName, compressed: Boolean(compressed) });
}

async function handleGenerate(res) {
    const log = [];
    const ok = await runGenerators(log);
    return sendJson(res, ok ? 200 : 500, { ok, log: log.join('\n\n') });
}

async function handlePublish(req, res) {
    let message = 'Update site content';
    try {
        const body = await readBody(req);
        if (body.length) {
            const payload = JSON.parse(body.toString('utf8'));
            const custom = String(payload.message || '').replace(/\s+/g, ' ').trim();
            if (custom) {
                message = custom.slice(0, 120);
            }
        }
    } catch (error) {
        // 提交信息解析失败就用默认值
    }

    const log = [];
    if (!(await runGenerators(log))) {
        return sendJson(res, 500, { ok: false, log: log.join('\n\n') });
    }

    const add = await run('git', ['add', '-A']);
    log.push(`> git add -A\n${add.output}`);
    if (!add.ok) {
        return sendJson(res, 500, { ok: false, log: log.join('\n\n') });
    }

    // diff --cached --quiet：退出码 1 = 有待提交变更
    const diff = await run('git', ['diff', '--cached', '--quiet']);
    if (!diff.ok) {
        const commit = await run('git', ['commit', '-m', message]);
        log.push(`> git commit\n${commit.output}`);
        if (!commit.ok) {
            return sendJson(res, 500, { ok: false, log: log.join('\n\n') });
        }
    } else {
        // 没有新变更，但可能有之前 push 失败留下的本地提交，照样推
        const ahead = await run('git', ['rev-list', '--count', 'origin/main..main']);
        if (ahead.ok && Number(ahead.output) === 0) {
            log.push('No changes to publish.');
            return sendJson(res, 200, { ok: true, published: false, log: log.join('\n\n') });
        }
        log.push(`发现 ${ahead.output.trim()} 个未推送的本地提交，继续推送……`);
    }

    const push = await run('git', ['push', 'origin', 'main']);
    log.push(`> git push origin main\n${push.output}`);
    return sendJson(res, push.ok ? 200 : 500, { ok: push.ok, published: push.ok, log: log.join('\n\n') });
}

function serveStatic(req, res, pathname) {
    const decoded = decodeURIComponent(pathname);
    const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
    const filePath = path.normalize(path.join(ROOT, relative));

    // 必须落在仓库根目录内，且不暴露 .git
    const relativeCheck = path.relative(ROOT, filePath);
    if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck) || relativeCheck.split(path.sep).includes('.git')) {
        res.writeHead(403);
        return res.end('Forbidden');
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        return res.end('Not found');
    }

    const mime = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    try {
        if (req.method === 'POST' && url.pathname === '/api/save') {
            return await handleSave(req, res);
        }
        if (req.method === 'POST' && url.pathname === '/api/upload') {
            return await handleUpload(req, res, url.searchParams);
        }
        if (req.method === 'POST' && url.pathname === '/api/generate') {
            return await handleGenerate(res);
        }
        if (req.method === 'POST' && url.pathname === '/api/publish') {
            return await handlePublish(req, res);
        }
        if (req.method === 'GET' || req.method === 'HEAD') {
            return serveStatic(req, res, url.pathname);
        }
        res.writeHead(405);
        res.end('Method not allowed');
    } catch (error) {
        console.error(error);
        sendJson(res, 500, { ok: false, error: error.message });
    }
});

server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
        console.error('----------------------------------------------');
        console.error(`  端口 ${PORT} 已被占用！`);
        console.error('  很可能已经有一个管理站窗口在运行了——');
        console.error(`  直接在浏览器打开 http://localhost:${PORT}/admin.html 即可，`);
        console.error('  或者关掉那个窗口后重新运行 admin.bat。');
        console.error('----------------------------------------------');
    } else {
        console.error(error);
    }
    process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
    const address = `http://localhost:${PORT}/admin.html`;
    console.log('----------------------------------------------');
    console.log('  Ashe Admin Server is running (local only)');
    console.log(`  ${address}`);
    console.log(`  Image compression: ${sharp ? 'ON (sharp installed)' : 'OFF (run "npm install" to enable)'}`);
    console.log('  Close this window / Ctrl+C to stop.');
    console.log('----------------------------------------------');

    if (process.argv.includes('--open')) {
        execFile('cmd', ['/c', 'start', '', address], { windowsHide: true }, () => {});
    }
});
