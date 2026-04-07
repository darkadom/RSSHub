import Parser from 'rss-parser';
const parser = new Parser();

// 从环境变量读取 TG 配置
const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

// 定义你需要抓取的多个本地路由
const ROUTES = [
    '/bilibili/popular/all',
];

// 本地运行的 RSSHub 基础地址
const BASE_URL = 'http://localhost:1200';

async function sendTgMessage(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
        
        if (!response.ok) {
            console.error(`TG 发送失败: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('请求 TG API 发生异常:', error);
    }
}

async function main() {
    // 获取当前时间戳并计算 8 小时前的时间（以毫秒为单位）
    const now = Date.now();
    const eightHoursAgo = now - 8 * 60 * 60 * 1000;

    for (const route of ROUTES) {
        const fullUrl = `${BASE_URL}${route}`;
        console.log(`正在抓取数据源: ${fullUrl}`);

        try {
            const feed = await parser.parseURL(fullUrl);
            
            for (const item of feed.items) {
                // 将 RSS 条目的发布时间转换为时间戳
                const pubDateTimestamp = new Date(item.pubDate).getTime();

                // 判断：如果发布时间在最近 8 小时内，则推送
                // if (pubDateTimestamp > eightHoursAgo) {
                    const message = `<b>${item.title}</b>\n<a href="${item.link}">点击查看详情</a>`;
                    await sendTgMessage(message);
                    
                    // 增加 1 秒延迟，防止触发 Telegram API 发送频率限制 (Rate Limit)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                // }
            }
        } catch (error) {
            console.error(`抓取 ${fullUrl} 失败:`, error.message);
        }
    }
    console.log('所有数据源处理完毕。');
}

main();
