// 访客计数器（GoatCounter：免费、无 cookie、不收集个人信息，很复古很环保）
//
// 启用步骤（一次性，2 分钟）：
//   1. 去 https://www.goatcounter.com 注册，取一个 code（比如 "arashi"，
//      对应统计后台 https://arashi.goatcounter.com）
//   2. 把下面的 GOATCOUNTER_CODE 改成你的 code
//   3. 发布。之后每个引入本脚本的页面都会计数；
//      页面里如果有 id="hit-counter" 的元素，还会显示总访问量（复古计数器！）
//
// code 留空时本脚本什么都不做，不会发出任何请求。
const GOATCOUNTER_CODE = 'arashi';

(function () {
    if (!GOATCOUNTER_CODE) {
        return;
    }

    const base = `https://arashi.goatcounter.com`;

    // 上报本次访问
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset.goatcounter = `${base}/count`;
    document.head.appendChild(script);

    // 显示全站访问总数（如果页面上有 hit-counter 元素）
    document.addEventListener('DOMContentLoaded', async () => {
        const el = document.getElementById('hit-counter');
        if (!el) {
            return;
        }

        try {
            const response = await fetch(`${base}/counter/TOTAL.json`);
            if (!response.ok) throw new Error('counter unavailable');
            const data = await response.json();
            el.textContent = data.count;
        } catch (error) {
            // 拉取失败（比如 GoatCounter 设置里还没开启公开计数）时保留占位符
        }
    });
})();
