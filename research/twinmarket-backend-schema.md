# Step 5 — TwinMarket 后端数据结构调研

更新时间：2026-03-23 00:44

调研对象：
- `FreedomIntelligence/TwinMarket`（公开 repo）
- 说明：计划里写的是 `Hoder-zyf/TwinMarket`，但当前实际可公开访问并完成代码阅读的是 `FreedomIntelligence/TwinMarket`。若你的私有版 schema 与公开版有分叉，后续需要再做一次 diff。

---

## 结论先行

TwinMarket 后端不是一个“只吐一个大 JSON”的系统，而是由以下几层结构组成：

1. **Profiles / User DB**：用户画像、行为偏差、持仓、收益、prompt
2. **Forum DB**：帖子、点赞/转发/点踩、引用关系、belief
3. **Market Data**：行业指数级市场数据、技术指标、估值指标
4. **Simulation Runtime**：按天调度、对每个 agent 做决策、写出日志和对话记录
5. **Matching Engine Outputs**：日级 summary、详细成交、资金流、订单簿可视化
6. **Information Retrieval Layer**：公告/新闻/快讯向量检索

所以对 UI 来说，不应该只设计一个 `/simulation/result`，而应该天然按这几类数据分开接。

---

## 1. Agent profile / 用户画像层

### 来源
主要来自：
- `util/UserDB.py`
- 数据库表：`Profiles`

### `get_user_profile()` 实际读到的字段
代码里明确查询了这些字段：
- `gender`
- `location`
- `user_type`
- `bh_disposition_effect_category`
- `bh_lottery_preference_category`
- `bh_total_return_category`
- `bh_annual_turnover_category`
- `bh_underdiversification_category`
- `trade_count_category`
- `sys_prompt`
- `prompt`
- `self_description`
- `trad_pro`
- `fol_ind`
- `ini_cash`
- `initial_positions`
- `current_cash`
- `cur_positions`
- `total_value`
- `total_return`
- `return_rate`
- `stock_returns`
- `yest_returns`
- `created_at`
- `user_id`（代码中补上）

### UI 角度解读
这意味着一个 agent card 其实可以有四层信息：
1. **身份层**：性别、地区、用户类型、自我描述
2. **行为金融层**：处置效应、彩票偏好、投资集中度、换手倾向
3. **投资层**：关注行业、策略、组合总收益、持仓
4. **prompt 层**：sys_prompt / prompt

### 推荐 TypeScript 草案
```ts
export type TwinMarketAgentProfile = {
  userId: string;
  createdAt: string;
  gender?: string;
  location?: string;
  userType?: string;
  selfDescription?: string;
  sysPrompt?: string;
  prompt?: string;
  strategy?: string;
  tradPro?: string;
  followedIndustries: string[];
  behavior: {
    dispositionEffect?: string;
    lotteryPreference?: string;
    totalReturnCategory?: string;
    annualTurnoverCategory?: string;
    underdiversificationCategory?: string;
    tradeCountCategory?: string;
  };
  portfolio: {
    initialCash: number;
    currentCash: number;
    totalValue: number;
    totalReturn: number;
    returnRate: number;
    initialPositions?: Record<string, TwinMarketPosition>;
    currentPositions?: Record<string, TwinMarketPosition>;
    stockReturns?: Record<string, TwinMarketStockReturn>;
    yesterdayReturns?: Record<string, number>;
  };
};

export type TwinMarketPosition = {
  shares: number;
  ratio: number;
};

export type TwinMarketStockReturn = {
  market_value: number;
  profit: number;
};
```

---

## 2. Forum / 社交层

### 来源
主要来自：
- `util/ForumDB.py`

### 表结构
代码里明确创建了三个表：

#### `posts`
- `id`
- `user_id`
- `content`
- `score`
- `belief`
- `type`
- `created_at`

#### `reactions`
- `id`
- `user_id`
- `post_id`
- `type`：`repost | like | unlike`
- `created_at`

#### `post_references`
- `id`
- `reference_id`
- `repost_id`
- `created_at`

### UI 含义
TwinMarket 的 forum feed 不是简单文本列表，它至少支持：
- 原帖
- 转发
- 点赞/点踩
- 引用关系
- 帖子分数
- belief 文本

### 推荐 TypeScript 草案
```ts
export type TwinMarketForumPost = {
  id: number;
  userId: string;
  content: string;
  score: number;
  belief?: string;
  type?: 'post' | 'repost' | 'comment';
  createdAt: string;
};

export type TwinMarketReaction = {
  id: number;
  userId: string;
  postId: number;
  type: 'repost' | 'like' | 'unlike';
  createdAt: string;
};

export type TwinMarketPostReference = {
  id: number;
  referenceId: number;
  repostId: number;
  createdAt: string;
};
```

### 对 UI 的直接建议
前端最好把 forum 数据做成两层：
- `feed`（用户看到的帖子流）
- `interaction graph`（谁影响了谁）

---

## 3. Market data / 指数与技术指标层

### 来源
- `data/stock_data.csv`
- `data/stock_profile.csv`
- `trader/prompts.py`
- `trader/matching_engine.py`

### 交易标的不是单只股票，而是行业指数篮子
在 `stock_profile.csv` 能看到类似：
- `TTEI` 科技与通信指数
- `FSEI` 金融服务指数
- `EREI` 能源与资源指数
- `CGEI` 消费品指数
- `REEI` 房地产指数

也就是说，TwinMarket 后端当前更接近：
> **行业/主题指数级交易模拟**
而不是 50 只个股逐只订单簿。

### `prompts.py` 暴露的可查询指标
技术面：
- `vol_5`
- `vol_10`
- `vol_30`
- `ma_hfq_5`
- `ma_hfq_10`
- `ma_hfq_30`
- `macd_dif_hfq`
- `macd_dea_hfq`
- `macd_hfq`
- `elg_amount_net`

基本面：
- `pe_ttm`
- `pb`
- `ps_ttm`
- `dv_ttm`

### 推荐 TypeScript 草案
```ts
export type TwinMarketInstrumentSnapshot = {
  stockCode: string;
  date: string;
  closePrice: number;
  preClose?: number;
  change?: number;
  pctChg?: number;
  volume?: number;
  turnover?: number;
  peTtm?: number;
  pb?: number;
  psTtm?: number;
  dvTtm?: number;
  vol5?: number;
  vol10?: number;
  vol30?: number;
  ma5?: number;
  ma10?: number;
  ma30?: number;
  macd?: number;
  macdDea?: number;
  macdDif?: number;
  largeOrderNetInflow?: number;
};
```

---

## 4. Matching engine 输出层

### 来源
- `trader/matching_engine.py`

### 注释中明确给出的输出文件
#### `daily_summary_{date}.csv`
字段：
- `date`
- `stock_code`
- `closing_price`
- `volume`
- `transaction_count`
- `large_order_net_inflow`

#### `transactions_{date}.csv`
字段：
- `stock_code`
- `user_id`
- `direction`
- `executed_price`
- `executed_quantity`
- `original_quantity`
- `unfilled_quantity`
- `timestamp`

#### `large_order_flow_{date}.csv`
字段：
- `date`
- `stock_code`
- `large_order_net_inflow`

#### `order_book_{date}.png`
- 订单簿可视化图片

### 这对 UI 很关键
说明 TwinMarket 后端天然有四类很适合接前端的数据：
1. **日级 summary 卡片**
2. **逐笔成交流**
3. **大单资金流**
4. **订单簿/深度视图**

### 推荐 TypeScript 草案
```ts
export type TwinMarketDailySummary = {
  date: string;
  stockCode: string;
  closingPrice: number;
  volume: number;
  transactionCount: number;
  largeOrderNetInflow: number;
};

export type TwinMarketTransaction = {
  stockCode: string;
  userId: string;
  direction: 'buy' | 'sell';
  executedPrice: number;
  executedQuantity: number;
  originalQuantity: number;
  unfilledQuantity: number;
  timestamp: string;
};

export type TwinMarketLargeOrderFlow = {
  date: string;
  stockCode: string;
  largeOrderNetInflow: number;
};
```

---

## 5. Simulation runtime / 调度层

### 来源
- `simulation.py`

### 调度逻辑
`simulation.py` 会：
- 按日期推进
- 读取用户策略
- 获取前一日 profile
- 读取 belief
- 初始化 `PersonalizedStockTrader`
- 为每个用户调用 `input_info()`
- 收集：
  - `forum_args`
  - `decision_result`
  - `post_response_args`
  - `conversation_history`

### 对 UI 的含义
说明前端很适合接入这些“运行时对象”：
- 当前日期
- 今日是否交易日
- 当前激活用户
- agent 决策结果
- forum 动作
- 对话记录

### 推荐 TypeScript 草案
```ts
export type TwinMarketSimulationStep = {
  date: string;
  isTradingDay: boolean;
  activeUserIds: string[];
  decisions: TwinMarketDecision[];
  forumActions: TwinMarketForumAction[];
  postResponses: TwinMarketPostResponse[];
};

export type TwinMarketDecision = {
  userId: string;
  stockDecisions: Record<string, {
    action: 'buy' | 'sell' | 'hold';
    targetPosition?: number;
    currentPosition?: number;
    targetPrice?: number;
    reasoning?: string;
    subOrders?: { quantity: number; price: number }[];
  }>;
};
```

---

## 6. Information retrieval / 新闻公告检索层

### 来源
- `util/InformationDB.py`

### 结构特征
该模块会把不同类型的信息向量化并存 metadata，支持的 type 包括：
- `announcement`
- `cctv`
- `long_news`
- `short_news`

### metadata 字段（按代码推断）
通用字段：
- `content`
- `title`
- `type`
- `datetime`

部分类型额外字段：
- `ts_code`
- `stock_name`
- `industry`
- `source`

### 推荐 TypeScript 草案
```ts
export type TwinMarketInfoItem = {
  title: string;
  content: string;
  type: 'announcement' | 'cctv' | 'long_news' | 'short_news';
  datetime: string;
  tsCode?: string;
  stockName?: string;
  industry?: string;
  source?: string;
};
```

---

## 7. 配置输入参数

### 来源
- `simulation.py`
- `config/api_example.yaml`

### 已明确的配置/运行参数
`init_simulation()` 暴露了这些关键入参：
- `start_date`
- `end_date`
- `forum_db`
- `user_db`
- `debug`
- `max_workers`
- `user_graph_save_name`
- `checkpoint`
- `similarity_threshold`
- `time_decay_factor`
- `node`
- `log_dir`
- `prob_of_technical`
- `belief_init_path`
- `top_n_user`
- `config_path`
- `activate_prob`

### 对 UI 的意义
这说明 simulation control panel 后面完全可以做成真实参数控制器：
- 时间范围
- 激活比例
- top user 占比
- 技术面 trader 概率
- 图构建阈值
- 随机种子/并发数

### 推荐 TypeScript 草案
```ts
export type TwinMarketSimulationConfig = {
  startDate: string;
  endDate: string;
  debug: boolean;
  maxWorkers: number;
  similarityThreshold: number;
  timeDecayFactor: number;
  nodeCount: number;
  logDir: string;
  technicalTraderProbability: number;
  beliefInitPath: string;
  topUserRatio: number;
  activateProbability: number;
};
```

---

## 8. 对 TwinMarket UI 的直接接口建议

### 不建议
不要设计成：
```text
GET /api/simulation/result
```
把所有东西塞一起。

### 更建议
拆成：
```text
GET /api/twinmarket/agents
GET /api/twinmarket/agents/:id
GET /api/twinmarket/forum/posts
GET /api/twinmarket/forum/reactions
GET /api/twinmarket/market/snapshots?date=...
GET /api/twinmarket/market/transactions?date=...
GET /api/twinmarket/market/daily-summary?date=...
GET /api/twinmarket/events?date=...
GET /api/twinmarket/config/current
GET /api/twinmarket/simulation/step?date=...
```

如果后面做实时版：
```text
WS /api/twinmarket/stream
```
推送：
- trades
- forum posts
- agent actions
- event stream
- summary deltas

---

## 最终结论

TwinMarket 后端对 UI 来说，最值得抓住的是这五类核心实体：

1. **AgentProfile**
2. **ForumPost / Reaction**
3. **InstrumentSnapshot**
4. **Transaction / DailySummary**
5. **SimulationConfig / Step Runtime**

这意味着你后面的前端并不是“等一个统一后端接口”，而是已经可以提前按这些实体把页面和 types 设计出来。
