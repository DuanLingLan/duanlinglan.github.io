// 从 git log 生成站点更新日志 data/changelog.json
// 同一天的相同提交信息会合并（显示 xN），通用的提交信息统一显示为「内容更新」。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const outputPath = path.join(rootDir, 'data', 'changelog.json');

// 这些机械提交信息在日志里统一显示为「内容更新」
const GENERIC_PATTERNS = [
    /^update posts and posts\.json$/i,
    /^update site content$/i,
    /^update$/i
];

function displayMessage(message) {
    const trimmed = message.trim();
    return GENERIC_PATTERNS.some(pattern => pattern.test(trimmed)) ? '内容更新' : trimmed;
}

let raw;
try {
    raw = execFileSync('git', ['log', '--date=short', '--pretty=format:%ad|%s'], {
        cwd: rootDir,
        encoding: 'utf8',
        windowsHide: true
    });
} catch (error) {
    console.error('无法读取 git log:', error.message);
    process.exit(1);
}

// 按日期分组，同一天相同信息合并计数
const days = new Map();
raw.split('\n').forEach(line => {
    const separator = line.indexOf('|');
    if (separator === -1) return;

    const date = line.slice(0, separator);
    const message = displayMessage(line.slice(separator + 1));
    if (!message) return;

    if (!days.has(date)) {
        days.set(date, new Map());
    }
    const messages = days.get(date);
    messages.set(message, (messages.get(message) || 0) + 1);
});

const changelog = [...days.entries()].map(([date, messages]) => ({
    date,
    items: [...messages.entries()].map(([message, count]) => ({ message, count }))
}));

// git log 本身就是新到旧，这里再按日期稳妥排一次
changelog.sort((a, b) => (a.date < b.date ? 1 : -1));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(changelog, null, 2), 'utf8');
console.log(`data/changelog.json updated with ${changelog.length} day(s).`);
