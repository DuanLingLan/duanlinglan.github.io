// admin 页面共用工具：只有通过本地管理服务器（admin.bat）打开时才启用保存/上传/发布。
// 在线上（GitHub Pages）打开 admin 页面时这些按钮自动隐藏，页面退回「导出 JSON」老流程。
(function () {
    const isLocalAdmin = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    async function postJson(url, payload) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
            throw new Error(data.error || data.log || `Request failed: ${url}`);
        }
        return data;
    }

    const adminApi = {
        enabled: isLocalAdmin,

        // 把 JSON 数据写回 data/ 下的白名单文件
        save(file, content) {
            return postJson('/api/save', { file, content });
        },

        // 上传单个文件到 gallery / collections，返回 {path, name}
        async upload(dir, file) {
            const query = `dir=${encodeURIComponent(dir)}&name=${encodeURIComponent(file.name)}`;
            const response = await fetch(`/api/upload?${query}`, {
                method: 'POST',
                body: file
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.ok === false) {
                throw new Error(data.error || `Upload failed: ${file.name}`);
            }
            return data;
        },

        // 只跑生成脚本
        generate() {
            return postJson('/api/generate', {});
        },

        // 生成 + git 提交推送（message 可选：自定义提交信息，会出现在更新日志里）
        publish(message) {
            return postJson('/api/publish', message ? { message } : {});
        },

        // 把只在本地可用的控件显示出来（元素默认 style="display:none"）
        revealLocalControls() {
            if (!isLocalAdmin) return;
            document.querySelectorAll('[data-local-admin]').forEach(el => {
                el.style.display = '';
            });
        },

        // 简易状态提示：写入 id 为 adminStatus 的元素（若存在）
        setStatus(message, isError) {
            const el = document.getElementById('adminStatus');
            if (!el) return;
            el.textContent = message;
            el.style.color = isError ? '#b00020' : '#64002B';
        },

        // 发布按钮通用逻辑：确认 → 调用 → 展示日志
        // 页面上如果有 id="publishMessage" 的输入框，其内容会作为提交信息（显示在站点更新日志里）
        async publishWithFeedback() {
            if (!window.confirm('确定要发布吗？会运行生成脚本并 git push 到线上。')) {
                return;
            }
            const messageInput = document.getElementById('publishMessage');
            const message = messageInput ? messageInput.value.trim() : '';
            adminApi.setStatus('发布中……（第一次可能要十几秒）');
            try {
                const result = await adminApi.publish(message);
                if (messageInput && result.published) {
                    messageInput.value = '';
                }
                adminApi.setStatus(result.published ? '发布成功！🎉' : '没有需要发布的变更。');
                const logEl = document.getElementById('adminPublishLog');
                if (logEl) {
                    logEl.textContent = result.log || '';
                }
            } catch (error) {
                adminApi.setStatus(`发布失败：${error.message}`, true);
            }
        }
    };

    window.adminApi = adminApi;
    document.addEventListener('DOMContentLoaded', () => adminApi.revealLocalControls());
})();
