# Admin 页面开发交接笔记

这份文档记录本项目本地 Admin 页面的工作方式、已踩过的坑，以及后续修改时必须核对的事项。面向人类维护者和后续 AI。

## 1. 架构概览

- 网站本身是静态站点；`admin.html` 及 `*-admin.html` 只是编辑界面。
- 只有通过 `admin.bat` 启动的 `http://127.0.0.1:4321` 本地服务，才可以上传、保存 JSON、生成页面和发布。
- `assets/js/admin-tools.js` 用 `window.location.hostname` 判断本地模式，并通过以下接口工作：
  - `POST /api/upload`：上传图片。
  - `POST /api/save`：保存白名单 JSON。
  - `POST /api/generate`：运行生成脚本。
  - `POST /api/publish`：生成、`git add`、提交、推送。
- 所有接口和允许保存的文件都在 `scripts/admin-server.js` 中白名单控制。新增可编辑数据文件时，必须同步更新这里。

## 2. 数据文件不是展示页面

Admin 保存的是 `data/*.json`。前台展示使用 `partials/*.html`，通常由 `scripts/generate-*.js` 从 JSON 生成。

当前相关链路：

| 内容 | 编辑数据 | 生成脚本 | 前台 partial |
| --- | --- | --- | --- |
| Gallery | `data/gallery.json` | `scripts/generate-gallery.js` | `partials/gallery.html` |
| Achievement Showcase | `data/achievements.json` | `scripts/generate-achievements.js` | `partials/achievements.html` |

新增一类可管理内容时，至少要完成四件事：

1. 新建/迁移 JSON 数据。
2. 新建生成脚本并加入 `package.json` 的 `generate` 脚本。
3. 把 JSON 加入 `SAVABLE_FILES`，把生成器加入 `GENERATE_SCRIPTS`。
4. 在前台页面引用生成的 partial，并在 `admin.html` 加入口。

漏掉任意一步都可能造成“Admin 显示已保存，但线上没变”。

## 3. 图片上传：最容易复发的 bug

### 必须先复制 FileList

不要把 `event.target.files` 直接传进异步函数后立刻写：

```js
addImages(event.target.files);
event.target.value = '';
```

清空 file input 后，`FileList.length` 可能变为 `0`。这曾导致图片已经上传成功，状态却显示“已上传 0 张”。正确写法：

```js
const selectedFiles = [...event.target.files];
event.target.value = '';
addImages(selectedFiles);
```

在 `addImages` 内也应继续使用 `const selectedFiles = [...files]`，并以该数组计算成功数和总数。

### 上传并不等于保存

本地上传只会把图片写入 `assets/pic/gallery_photos/`；还必须保存 JSON，图片才会被展示数据引用。状态文案应明确提醒“Remember to save”。

### 不要相信前端的 `accept="image/*"`

前端限制只是体验，不是安全边界。服务端已对 JPG/PNG/GIF/WebP/AVIF 做扩展名与文件签名检查。新增格式时必须同时更新：

- `IMAGE_EXTENSIONS`
- `hasExpectedImageSignature()`
- `MIME_TYPES`
- 前端说明/接受范围（如需要）

## 4. Gallery 的分组与移动逻辑

`Target group` 最初只在“新增图片”时生效，现有图片没有移动入口，造成“选择分组完全无作用”的误解。

目前 Gallery 提供两种移动方式：

- 每张卡片选择分组后点 `Move`。
- 勾选多张卡片，使用顶部 `Target group` 的 `Move selected here` 批量移动。

注意事项：

- 顶部目标分组必须用稳定的 `group.id` 作为 `<option>` 值，不能依赖数组 index。分组排序后，index 会指向另一组。
- 单卡片内部的临时下拉可以使用 index，因为点击后会立即重新渲染。
- 移动仅修改 JSON 中的归属，不移动硬盘上的图片文件。
- 删除图片/分组同样只删除 JSON 引用，不能悄悄删除真实文件；确认弹窗必须说清楚这一点。

## 5. 路径字段的语义

`imageBasePath` 是线上手动登记图片时的“目录前缀”，不是一张图片的完整路径。

- 本地 Admin 上传始终写入服务端白名单目录 `assets/pic/gallery_photos`。
- 早期数据曾把 `assets/pic/gallery_photos/R0009625.JPG` 这种完整文件路径存进目录字段。管理页面会兼容地将其归一化为目录。
- 不要允许 `..` 路径片段；路径字段应该在 blur/保存时规范为正斜杠目录。

## 6. 不要把可编辑数据直接插入 innerHTML

以下做法不安全，也容易因为引号导致界面损坏：

```js
card.innerHTML = `<input value="${item.title}">`;
```

JSON 可以由用户导入，因此标题、alt、路径都应视为不可信。创建管理卡片时优先：

```js
const input = document.createElement('input');
input.value = item.title || '';
```

生成前台 partial 时也必须 HTML escape。`generate-gallery.js` 和 `generate-achievements.js` 都应保持此规则。

## 7. 未保存状态与异步 UX

管理页应维护：

- `isDirty`：编辑、排序、导入、删除、移动后置为 `true`；成功保存或导出后清除。
- `isUploading`：上传中禁止重复点击 Add Images。
- `beforeunload`：`isDirty` 时提醒用户，防止误关页面。

上传多个文件时不要遇到第一个失败就丢弃其余文件。应继续处理，最后报告：成功数、总数和失败文件原因。

## 8. Achievement Showcase 的约定

`data/achievements.json` 的结构：

```json
{
  "items": [
    {
      "src": "assets/pic/gallery_photos/example.jpg",
      "title": "Achievement title",
      "date": "2026.07.28",
      "alt": "Accessible image description"
    }
  ]
}
```

Achievement Admin 的管理逻辑与 Gallery 类似，但目前没有分组：支持新增/上传、编辑、排序、删除、导入导出、保存和发布。生成器会跳过没有 `src` 的草稿项。

## 9. 修改后的最低验证清单

在提交前至少运行：

```powershell
node --check scripts/admin-server.js
node --check scripts/generate-gallery.js
node --check scripts/generate-achievements.js
node scripts/generate-gallery.js
node scripts/generate-achievements.js
git diff --check
```

还应手动确认：

1. 在 `admin.bat` 打开的本地管理站中上传一张小图片，确认计数不是 0。
2. 保存后刷新页面，确认新卡片仍在。
3. 对 Gallery 测试单张移动和批量移动，保存后刷新确认归属正确。
4. 点击发布后确认生成的 partial 发生预期变化。
5. 前台 `index.html` / `projects.html` 中没有重复加载或遗留的容器。

## 10. 发布操作的边界

`发布`会运行所有生成脚本、暂存工作区所有变更、创建 git commit 并推送 `origin/main`。因此在点击前必须确认工作区里没有不希望一并发布的改动。

不要把“仅做诊断”误当作“可以点击发布”的授权。
