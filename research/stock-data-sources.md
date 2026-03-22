# Step 1 — 上证50成分股免费行情接口调研

更新时间：2026-03-23 00:32

## 结论先行

如果目标是给 `twinmarket-ui` 提供 **上证50全部成分股** 的服务端行情，当前最实用的组合是：

1. **主方案：Eastmoney Web API（批量行情）**
2. **兜底：Sina hq.sinajs.cn（批量字符串行情）**
3. **成分股名单来源：指数官网/静态快照 + 周期性更新**

原因：
- Eastmoney 能直接拿到较完整字段，JSON 格式最好处理。
- Sina 能一次批量拉一串股票，适合做 fallback。
- Tushare 免费层不适合“无需注册 + 直接在线 demo”。
- AKShare 更像 Python SDK，不是直接 HTTP 公共接口；可以作为离线采集层，但不适合当前 Next.js 直接接。

---

## 评估表

| 方案 | 可拿上证50全量 | 返回格式 | 是否需 token/注册 | 稳定性 | 字段完整度 | 适合当前项目 | 备注 |
|---|---|---:|---:|---:|---:|---:|---|
| Eastmoney `push2`/`ulist` | 是 | JSON | 否 | 高 | 高 | **强推荐** | 最适合作为 Next.js 服务端主源 |
| Sina `hq.sinajs.cn` | 是 | 文本/CSV-like | 否 | 中高 | 中 | **推荐作 fallback** | 格式丑，但批量方便 |
| Tushare | 是 | JSON / DataFrame | **是** | 高 | 高 | 不推荐直接接 | 免费层需 token，且速率/积分限制更明显 |
| AKShare | 间接是 | Python return | 否（库本身） | 中高 | 高 | 适合作后端采集层 | 不是公共 HTTP API |
| Eastmoney 其他列表接口 | 是 | JSON | 否 | 中高 | 高 | 可用 | 适合拉板块/成分列表 |
| 同花顺网页接口 | 部分可 | JSON/HTML 混合 | 否 | 中低 | 中 | 不推荐主接入 | 反爬/参数变化风险更高 |

---

## 方案 1：Eastmoney 批量行情接口（推荐主方案）

### 1.1 单只行情（当前项目已验证）

**URL**
```text
https://push2.eastmoney.com/api/qt/stock/get?ut=fa5fd1943c7b386f172d6893dbfba10b&invt=2&fltt=2&fields=f43,f44,f45,f46,f57,f58,f60,f169,f170,f47,f48,f168,f171&secid=1.600519
```

### 字段含义（常用）
- `f57`: 证券代码
- `f58`: 名称
- `f43`: 最新价（通常需 /100）
- `f44`: 最高价
- `f45`: 最低价
- `f46`: 开盘价
- `f60`: 昨收
- `f169`: 涨跌额
- `f170`: 涨跌幅（通常需 /100）
- `f47`: 成交量
- `f48`: 成交额
- `f168`: 换手率
- `f171`: 振幅

### 示例响应（截断）
```json
{
  "data": {
    "f57": "600519",
    "f58": "贵州茅台",
    "f43": 145600,
    "f44": 146280,
    "f45": 144900,
    "f46": 145200,
    "f60": 144880,
    "f169": 720,
    "f170": 49,
    "f47": 12345,
    "f48": 1792334000
  }
}
```

---

### 1.2 批量行情（推荐）

**已验证可访问的 URL 模式**
```text
https://push2.eastmoney.com/api/qt/ulist.np/get?ut=fa5fd1943c7b386f172d6893dbfba10b&fltt=2&invt=2&fields=f2,f3,f4,f12,f14,f15,f16,f17,f18,f5,f6&secids=1.600519,1.601318
```

### 字段含义
- `f12`: 代码
- `f14`: 名称
- `f2`: 最新价
- `f3`: 涨跌幅
- `f4`: 涨跌额
- `f15`: 最高
- `f16`: 最低
- `f17`: 开盘
- `f18`: 昨收
- `f5`: 成交量
- `f6`: 成交额

### 示例响应（截断）
```json
{
  "data": {
    "diff": [
      {
        "f12": "600519",
        "f14": "贵州茅台",
        "f2": 1456.00,
        "f3": 0.49,
        "f4": 7.20,
        "f15": 1462.80,
        "f16": 1449.00,
        "f17": 1452.00,
        "f18": 1448.80,
        "f5": 12345,
        "f6": 1792334000
      }
    ]
  }
}
```

### 优点
- JSON 结构干净，直接适配 TypeScript。
- 能批量取多只股票，最适合上证50 watchlist。
- 字段比较全，不用二次拼装太多。
- 无需 token，服务端 fetch 即可。

### 缺点 / 风险
- 不是官方公开文档 API，字段编码风格较“爬接口”。
- 参数和字段码未来有变动风险。
- 需要自己维护 `secid` 映射：上交所 `1.xxxxxx`、深交所 `0.xxxxxx`。

### 对当前项目的建议用法
- 在 Next.js 服务端实现 `getBatchQuotes(secids: string[])`。
- 前端做 15~30 秒 polling 或后续升级成 WebSocket fan-out。
- 对外暴露标准化结构：
  ```ts
  type StockQuote = {
    symbol: string;
    name: string;
    latestPrice: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    volume: number;
    turnover: number;
    source: 'eastmoney';
    timestamp: string;
  }
  ```

---

## 方案 2：Sina 批量行情（推荐 fallback）

### URL
```text
https://hq.sinajs.cn/list=sh600519,sh601318
```

### 示例响应（文本）
```text
var hq_str_sh600519="贵州茅台,1452.00,1448.80,1456.00,1462.80,1449.00,...";
var hq_str_sh601318="中国平安,52.31,51.80,52.45,52.70,51.93,...";
```

### 常用字段（按顺序解析）
以第一行逗号分隔值为例：
1. 名称
2. 开盘价
3. 昨收
4. 最新价
5. 最高价
6. 最低价
...
成交量、成交额、日期、时间在后续字段中

### 优点
- 批量很方便，一次可查多只。
- 不需要 token。
- 兼容性很好，历史上大量量化脚本都在用。

### 缺点
- 文本解析麻烦，编码/字段顺序要自己维护。
- 字段语义不如 Eastmoney 清晰。
- 偶尔会出现访问策略波动。

### 适合当前项目的用法
- 作为 Eastmoney 失败时的 fallback。
- 只保底生成：价格、涨跌幅、成交量、时间这些核心字段。

---

## 方案 3：Tushare

### 典型接口
- 股票实时数据：通常需要其 Python SDK / token 调用。
- 成分股：`index_weight`

### 优点
- 文档化更好。
- 字段规范，研究环境里很好用。
- 成分股、历史行情、财务数据很完整。

### 缺点
- **需要 token 注册**。
- 免费层受积分与速率约束。
- 不适合“开箱就跑”的公开 demo 前端。

### 结论
不适合作为 `twinmarket-ui` 当前阶段的直接数据源，但很适合作为后续“研究采集/离线 ETL 层”。

---

## 方案 4：AKShare

### 本质
AKShare 是 Python 数据 SDK，不是公开 HTTP 数据站本身。

### 常用思路
- 用 AKShare 在 Python 层抓 Eastmoney/Sina/交易所等数据。
- 再由你自己的服务端包一层 `/api/*`。

### 优点
- 封装面广，A 股数据生态成熟。
- 调研和离线分析非常方便。
- 适合做“行情 + 新闻 +公告”的统一采集层。

### 缺点
- 不是直接 HTTP 公共端点。
- 项目当前栈是 Next.js，直接引 AKShare 反而会增加 Python 运维复杂度。

### 结论
**适合作为后续独立 data worker / ingestion service**，不适合作为当前 MVP 的首选接入方式。

---

## 方案 5：同花顺网页接口

### 观察
存在一些网页端 JSON 或混合接口，但通常：
- 参数较隐式
- 反爬更敏感
- 文档缺失
- 稳定性不如 Eastmoney/Sina 的民间使用面

### 结论
不建议作为主方案。

---

## “上证50成分股名单”本身怎么来

这是一个单独问题：
- 行情源负责 quote
- 你还需要**成分股列表**

更稳的方案不是每次临时抓网页，而是：
1. 先维护一份 `sse50-constituents.json` 静态快照
2. 周期性（例如日更/周更）用 CSI 指数官网、Eastmoney 或 Tushare 更新
3. 运行时只对这 50 个证券代码批量拉 quote

### 推荐数据流
```text
constituents list (static snapshot / periodic refresh)
    -> normalize to secids
    -> Eastmoney batch quote
    -> Sina fallback
    -> Next.js API route
    -> UI polling / websocket
```

---

## 频率限制与调用建议

### Eastmoney
- 没有官方公开速率文档。
- 从公开网页接口使用习惯看，**10~30 秒一次、50 只批量**问题不大。
- 建议服务端做：
  - 10~15 秒缓存
  - 请求失败回退 Sina
  - 连续失败降级为旧缓存

### Sina
- 也没有官方开发者速率说明。
- 用于 fallback 或低频刷新更稳妥。

### 不建议
- 浏览器端每个组件单独请求
- 1~2 秒级高频硬刷
- 每只股票单独一请求

---

## 最终推荐方案

### 推荐架构

#### 方案 A（当前 MVP 最佳）
- **成分股名单**：项目内静态 JSON
- **主行情源**：Eastmoney 批量接口
- **兜底**：Sina 批量接口
- **接入方式**：Next.js server route

#### 方案 B（后续研究版）
- 独立 Python data worker（AKShare / Tushare / Eastmoney）
- 统一缓存进 Redis / SQLite
- Next.js 只读你自己的标准化 API

### 当前项目推荐
> 先做方案 A。

原因：
- 最少改动
- 不要求 token
- UI demo 最容易跑起来
- 后续也容易升级成 WebSocket

---

## 可直接用于实现的 API 清单

### Eastmoney 批量行情
```text
GET https://push2.eastmoney.com/api/qt/ulist.np/get?ut=fa5fd1943c7b386f172d6893dbfba10b&fltt=2&invt=2&fields=f2,f3,f4,f12,f14,f15,f16,f17,f18,f5,f6&secids=1.600519,1.601318
```

### Eastmoney 单只行情
```text
GET https://push2.eastmoney.com/api/qt/stock/get?ut=fa5fd1943c7b386f172d6893dbfba10b&invt=2&fltt=2&fields=f43,f44,f45,f46,f57,f58,f60,f169,f170,f47,f48,f168,f171&secid=1.600519
```

### Sina 批量行情
```text
GET https://hq.sinajs.cn/list=sh600519,sh601318
```

---

## 推荐落地项

下一步实现时，建议直接做：
1. `data/sse50-constituents.ts` 静态维护成分股代码
2. `src/lib/market/batch-quotes.ts` 封装 Eastmoney + Sina fallback
3. `src/app/api/market/sse50/constituents/route.ts` 输出 50 只标准化行情
4. UI 加一个 `Top movers / breadth / turnover ranking` 面板
