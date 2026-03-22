# Step 2 — 免费金融/市场信息流来源调研

更新时间：2026-03-23 00:32

## 结论先行

如果目标是给 `TwinMarket UI` 的 **event stream / market narrative / forum trigger** 提供真实信息输入，当前最实用的组合是：

1. **主方案：东方财富 7x24 快讯**
2. **补充：新浪财经滚动新闻接口**
3. **公告层：巨潮资讯（cninfo）历史公告查询接口**
4. **后续增强：AKShare 作为统一采集层**

建议不要一开始就追求“一个接口全包”，而是分三层：
- **快讯层**：7x24 新闻流，用于 event feed
- **新闻层**：滚动新闻/专题新闻，用于 richer context
- **公告层**：交易所/上市公司公告，用于 high-signal event

---

## 评估表

| 方案 | 类型 | 是否需认证 | 返回格式 | 更新频率 | 稳定性 | 适合当前项目 | 备注 |
|---|---|---:|---:|---:|---:|---:|---|
| Eastmoney 7x24 | 快讯 | 否 | JSON | 高 | 高 | **强推荐** | 最适合 event stream |
| 新浪财经 roll API | 滚动新闻 | 否 | JSON | 中高 | 中高 | **推荐** | 文本质量可接受，字段易解析 |
| 巨潮资讯 cninfo | 公告 | 否（网页态） | JSON | 高 | 中高 | **推荐** | 公告信号强，但要按日期/市场查询 |
| 财联社电报 | 快讯 | 多数场景需网页/抓取 | HTML/JSON 混合 | 高 | 中 | 可研究 | 反爬与稳定性不如东财 |
| 同花顺快讯 | 快讯 | 否 | HTML/JSON 混合 | 中高 | 中 | 不建议主接入 | 接口形态不稳定 |
| AKShare 新闻接口 | 聚合层 | 否（库） | Python object | 中高 | 高 | 适合后端 worker | 不是直接 HTTP 公共接口 |

---

## 方案 1：东方财富 7x24 快讯（推荐主方案）

### 已验证 URL
```text
https://np-listapi.eastmoney.com/comm/web/getFastNewsList?client=web&biz=web_news_col&fastColumn=102&sortEnd=1&pageSize=3&req_trace=333D9AEBD0D64fa689008A742D4568C1
```

### 示例响应（截断）
```json
{
  "code": 0,
  "message": "success",
  "result": {
    "items": [
      {
        "infoType": 100,
        "title": "...",
        "content": "...",
        "showTime": "03-22 14:31",
        "digest": "..."
      }
    ]
  }
}
```

### 优点
- 更新频率高，天然适合“市场事件流”。
- JSON 返回，解析舒服。
- 无需 token。
- 和 A 股用户的阅读习惯一致。

### 缺点 / 风险
- 非正式开发者 API，`req_trace` 等参数风格偏网页接口。
- 文段有时偏短，需要二次清洗。
- 需要自己做去重、分类和 relevance ranking。

### 适合当前项目的用法
把它作为：
- dashboard 右侧 `Market event stream`
- agent event trigger（宏观/板块事件）
- intraday narrative feed

### 推荐标准化结构
```ts
type MarketNewsItem = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  publishedAt: string;
  source: 'eastmoney-fastnews';
  category?: string;
  relatedTickers?: string[];
}
```

---

## 方案 2：新浪财经滚动新闻接口（推荐补充）

### 已验证 URL
```text
https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&k=&num=3&page=1
```

### 示例响应（截断）
```json
{
  "result": {
    "status": {
      "code": 0,
      "msg": "success"
    },
    "data": [
      {
        "title": "...",
        "url": "https://finance.sina.com.cn/...",
        "intro": "...",
        "ctime": "1711091280"
      }
    ]
  }
}
```

### 优点
- JSON 化程度高。
- 适合作为 richer news feed，而不只是 7x24 快讯。
- 标题、URL、摘要更适合做“点击展开全文”。

### 缺点
- 页面分类参数 `pageid/lid` 语义不够直观，得自己整理。
- 资讯广而不一定聚焦市场最强信号。

### 适合当前项目的用法
- 给 event stream 加一个“查看更多 / 打开原文”能力。
- 作为东财快讯之外的二级信息源。
- 后续可配一个 relevance filter，只保留和成分股/行业指数相关的条目。

---

## 方案 3：巨潮资讯（cninfo）公告接口（推荐高信号层）

### 已验证接口
```text
POST http://www.cninfo.com.cn/new/hisAnnouncement/query
```

### 示例请求体
```text
pageNum=1&pageSize=2&tabName=fulltext&column=szse&plate=&stock=&searchkey=&secid=&category=&trade=&seDate=2026-03-20~2026-03-23&sortName=&sortType=&isHLtitle=true
```

### 示例响应（截断）
```json
{
  "announcements": [
    {
      "announcementId": "...",
      "announcementTitle": "...",
      "adjunctUrl": "finalpage/...PDF",
      "secCode": ["000001"],
      "secName": ["平安银行"],
      "announcementTime": 1711027200000
    }
  ],
  "totalpages": 123,
  "totalrecords": 2456
}
```

### 优点
- 公告是高信号信息，特别适合真正影响交易/agent 行为的 event。
- 可以精确到股票和日期范围。
- 返回字段足够结构化。

### 缺点
- 调用方式是表单 POST，不是简单 GET。
- 公告正文通常还要再拼接 PDF URL 抓全文。
- 如果你的 UI 当前重点是“盘中流”，公告频率可能没快讯那么实时。

### 适合当前项目的用法
- 用在“重大公告 / 公司事件” panel。
- 给 event stream 里高置信度事件打上 `announcement` 标签。
- 后续也适合喂给 TwinMarket 的 retrieval/event layer。

---

## 方案 4：财联社电报

### 观察
财联社的内容质量非常适合市场 event feed，但公开可稳定编程调用的接口不如东财和新浪好处理：
- 常见方案依赖网页抓取
- 参数签名/反爬策略变动概率更高
- 稳定性对 demo 不友好

### 结论
可以做“二期增强调研”，不建议当前项目先接。

---

## 方案 5：同花顺快讯

### 观察
- 有网页可见的数据流
- 但公开接口形态没有东财那样顺手
- HTML 抓取和接口逆向成本更高

### 结论
不建议作为首批接入源。

---

## 方案 6：AKShare 新闻接口

### 本质
AKShare 不是单个数据源，而是 Python 聚合层。

### 适合的角色
- 后端 ETL / worker
- 离线抓取新闻和公告
- 统一清洗不同来源后存 SQLite/Redis

### 不适合的地方
- 不是直接给 Next.js 前端 demo 调的公共 HTTP 接口

### 结论
作为后续“数据中台层”很合适，但不适合当前 UI MVP 直接依赖。

---

## 推荐架构

### 当前 MVP 最佳实践

#### A. 快讯流
- 主：Eastmoney 7x24
- 备：Sina roll API

#### B. 公告流
- 主：Cninfo historical announcement query

#### C. 标准化输出
```ts
type EventStreamItem = {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  source: 'eastmoney-fastnews' | 'sina-roll' | 'cninfo';
  publishedAt: string;
  importance: 'low' | 'medium' | 'high';
  eventType: 'news' | 'announcement' | 'macro' | 'company';
  relatedSymbols?: string[];
  url?: string;
}
```

---

## 实际产品建议

### 对 TwinMarket UI 的意义
你这个 UI 不是普通资讯 app，所以不要把所有新闻一股脑塞进去。更好的策略是：

1. **快讯做盘中 event ribbon**
2. **公告做高信号事件卡片**
3. **新闻正文只在展开态加载**
4. **给 agent feed 提供“可能影响谁”的 tagging**

例如：
- 宏观/政策 → 影响全市场情绪、金融/地产/消费板块
- 行业快讯 → 影响特定 sector index
- 公司公告 → 映射到成分股或相邻行业篮子

---

## 最终推荐方案

### 推荐顺序
1. **Eastmoney 7x24**：主 event stream
2. **Cninfo**：主公告层
3. **Sina roll API**：补充新闻层

### 不推荐当前就接
- 财联社（接入与稳定性成本更高）
- 同花顺（接口不够友好）
- 纯 RSS 作为唯一主源（太泛，金融结构化不够）

---

## 可直接用于实现的 API 清单

### Eastmoney 快讯
```text
GET https://np-listapi.eastmoney.com/comm/web/getFastNewsList?client=web&biz=web_news_col&fastColumn=102&sortEnd=1&pageSize=20&req_trace=333D9AEBD0D64fa689008A742D4568C1
```

### Sina 滚动新闻
```text
GET https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&k=&num=20&page=1
```

### Cninfo 公告查询
```text
POST http://www.cninfo.com.cn/new/hisAnnouncement/query
```

---

## 推荐落地项

下一步实现时，建议直接做：
1. `src/lib/news/eastmoney-fastnews.ts`
2. `src/lib/news/sina-roll.ts`
3. `src/lib/news/cninfo.ts`
4. `src/app/api/news/stream/route.ts`
5. UI 的 `event stream` 改为真实数据 + importance 标记 + source tag
