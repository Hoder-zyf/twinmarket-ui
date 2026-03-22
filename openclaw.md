# openclaw.md

项目：`twinmarket-ui`

这个文件记录我在该项目里每次完成的实际操作，方便后续连续接手和回溯。

---

## 2026-03-22

### 初始化 UI 原型
- 创建了 `Next.js + TypeScript + Tailwind` 前端项目。
- 完成了第一版单页 dashboard UI，主题为多智能体在 A 股市场上的交易可视化终端。
- 主要实现区域：
  - 顶部市场总览
  - 板块 tape
  - agent influence network
  - order book / latest prints
  - market event stream
  - agent profiles
  - forum / belief stream
  - simulation control panel
- 新增主要文件：
  - `src/components/dashboard.tsx`
  - `src/data/mock-data.ts`
  - `src/app/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/globals.css`
  - `README.md`
- 验证：`npm run lint`、`npm run build` 通过。

### 创建 GitHub 仓库并推送
- 将项目初始化为独立 git 仓库。
- 创建远端 GitHub 私有仓库：`Hoder-zyf/twinmarket-ui`
- 完成首次 push。

### 接入上证50实时行情
- 新增服务端行情聚合逻辑，接入上证50（`sh000016`）实时数据。
- 主数据源：Eastmoney
- 兜底数据源：Sina
- 新增 Next.js API route：`/api/market/sse50`
- 新增 live overview 组件，并将 dashboard 顶部概览替换为实时 SSE 50 卡片。
- 支持客户端 15 秒轮询刷新，并包含 loading / refreshing / error fallback。
- 新增主要文件：
  - `src/app/api/market/sse50/route.ts`
  - `src/lib/market/sse50.ts`
  - `src/lib/market/types.ts`
  - `src/components/live-sse50-overview.tsx`
- 修改文件：
  - `src/components/dashboard.tsx`
  - `README.md`
- 验证：
  - `npm run lint` 通过
  - `npx tsc --noEmit` 通过
  - `npm run build` 通过
  - 本地接口实测 `http://localhost:3000/api/market/sse50` 返回正常
- 已推送 commit：`d6c2739` (`feat: add live SSE 50 market data integration`)

### 新增项目计划文件
- 按用户提供的任务拆解，在项目根目录新增 `plan.md`。
- 内容包括：数据源调研、竞品/参考项目调研、横向补充调研、MVP 规划、后续实施计划占位、决策日志。
- 该文件将作为后续研究与开发的主计划板。
- 验证：文件已写入项目根目录。

### Step 1 调研：上证50免费行情接口
- 新增调研文件：`research/stock-data-sources.md`
- 调研并验证了以下方向：
  - Eastmoney `push2` 单只行情
  - Eastmoney `ulist.np/get` 批量行情
  - Sina `hq.sinajs.cn` 批量行情
  - Tushare 免费层适用性
  - AKShare 作为 Python 聚合层的适用性
  - 同花顺网页接口的可维护性风险
- 关键结论：
  - 当前最适合 `twinmarket-ui` 的主方案是 **Eastmoney 批量接口**
  - **Sina** 更适合作为 fallback
  - 上证50成分股名单建议采用 **静态快照 + 周期性更新**
- 同步更新：
  - `plan.md` 中 Step 1 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 1 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 2 调研：免费金融/市场信息流来源
- 新增调研文件：`research/news-data-sources.md`
- 调研并验证了以下方向：
  - Eastmoney 7x24 快讯接口
  - Sina `feed.mix.sina.com.cn` 滚动新闻接口
  - Cninfo 历史公告查询接口
  - 财联社 / 同花顺的可接入性
  - AKShare 在新闻采集层的适用性
- 关键结论：
  - **Eastmoney 7x24** 最适合作为 event stream 主源
  - **Cninfo** 最适合作为高信号公告层
  - **Sina roll API** 适合作为补充新闻层
- 同步更新：
  - `plan.md` 中 Step 2 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 2 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 3 调研：MiroFish UI 实现
- 新增调研文件：`research/mirofish-ui-analysis.md`
- 阅读了以下 repo/前端代码：
  - `666ghj/MiroFish`
  - `amadad/mirofish`
  - `nikmcfly/MiroFish-Offline`
- 重点分析了：
  - `frontend/package.json`（前端框架）
  - `GraphPanel.vue`
  - `Step3Simulation.vue`
  - `Step4Report.vue`
  - `Step5Interaction.vue`
  - `InteractionView.vue` / `SimulationRunView.vue`
- 关键结论：
  - MiroFish 前端核心是 **多 step 研究工作流**，不是普通 dashboard
  - 最值得借鉴的是 **探索 → 运行 → 分析 → 追问** 的信息架构
  - agent 行为流、报告生成过程、双层对话对象（report agent / individual agent）都很值得在 TwinMarket UI 里复用
- 同步更新：
  - `plan.md` 中 Step 3 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 3 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 4 调研：OASIS 可视化层
- 新增调研文件：`research/oasis-visualization.md`
- 阅读了以下内容：
  - `docs/visualization/visualization.mdx`
  - `examples/experiment/user_generation_visualization.md`
  - `visualization/dynamic_follow_network/code/vis_neo4j_reddit.py`
  - `visualization/twitter_simulation/align_with_real_world/code/graph.py`
- 关键结论：
  - OASIS 没有像 MiroFish 那样的完整前端产品层
  - 更像是 **实验分析脚本 + 网络/传播结构可视化工具**
  - 更适合拿来指导 TwinMarket 的 **数据导出结构、网络分析视角、simulation-vs-reality 对照视图**
- 同步更新：
  - `plan.md` 中 Step 4 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 4 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 5 调研：TwinMarket 后端数据结构
- 新增调研文件：`research/twinmarket-backend-schema.md`
- 阅读了以下核心代码：
  - `simulation.py`
  - `trader/trading_agent.py`
  - `trader/matching_engine.py`
  - `util/UserDB.py`
  - `util/ForumDB.py`
  - `util/InformationDB.py`
  - `trader/prompts.py`
  - `data/stock_profile.csv`
- 关键结论：
  - TwinMarket 后端天然分成 **Profiles / Forum / Market Data / Matching Outputs / Simulation Runtime / Information Retrieval** 六层
  - 交易标的当前更像**行业指数篮子**，不是逐只个股订单簿模拟
  - UI 后续应直接按实体拆分接口，而不是等一个统一大 JSON
  - 已整理出一版前端可直接采用的 TypeScript 类型草案
- 特别记录：
  - 计划中写的是 `Hoder-zyf/TwinMarket`，本轮实际完成代码阅读的是公开可访问的 `FreedomIntelligence/TwinMarket`
  - 如果你的私有版和公开版已经分叉，后续还要再补一次 schema diff
- 同步更新：
  - `plan.md` 中 Step 5 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 5 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 6 调研：其他多智能体模拟项目 UI 实现
- 新增调研文件：`research/multi-agent-ui-survey.md`
- 调研并横向比较了：
  - `joonspk-research/generative_agents`（Smallville）
  - `liubang1/AgentSims`
  - `Farama-Foundation/chatarena`
  - `MAXNORM8650/MedAgentSim`
  - `chrishokamp/multi-agent-social-simulation`
- 关键结论：
  - **Smallville** 最值得借 replay / 世界状态回放思路
  - **AgentSims** 最值得借 scenario builder / 实验配置器思路
  - **ChatArena** 更值得借后端抽象，不适合直接借前端
  - **MedAgentSim** 证明 runtime 与 UI 分离的多 agent 场景化客户端是成立的
  - TwinMarket UI 后续要补的不是更多卡片，而是 **replay mode + config mode + analytics flow**
- 同步更新：
  - `plan.md` 中 Step 6 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 6 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 7 调研：前端图可视化方案
- 新增调研文件：`research/graph-visualization-options.md`
- 评估了以下方案：
  - D3.js force graph
  - vis-network
  - Cytoscape.js
  - react-force-graph
  - sigma.js
- 关键结论：
  - **Cytoscape.js** 最适合作为 TwinMarket MVP 阶段的主图方案
  - **react-force-graph** 更适合作为后续增强视图/演示视图
  - D3 自由度最高但当前维护成本过高，vis-network 与 sigma.js 各有适用边界但都不是当前最优
- 同步更新：
  - `plan.md` 中 Step 7 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 7 结论
- 验证：调研文件已写入，计划文件已更新。

### Step 8 规划：TwinMarket UI 最小 MVP
- 在 `plan.md` 中补全了 Step 8 的正式结论，并直接把实施计划 append 到 Phase 5。
- 明确了 MVP 核心定位：
  - **研究展示优先的 market replay terminal**
  - 不是单纯交易大屏，也不是完整生产交易系统
- 明确了 MVP 的 Must-have：
  - 真实市场概览层
  - 真实 event stream
  - Cytoscape agent network 主图
  - agent detail drawer
  - forum / belief stream
  - microstructure panel
  - replay/time control
- 明确了技术路线：
  - 继续使用 `Next.js + Tailwind + TypeScript`
  - 增加 `zustand`、`Cytoscape.js`、`recharts`
- 在 Phase 5 中追加了 Step 9-16 的实施计划，覆盖：
  - types/adapters 重构
  - 多指数真实行情
  - 真实事件流
  - network 主图重做
  - agent detail drawer
  - forum / trades / summary 重构
  - replay 控制
  - demo polish
- 同步更新：
  - `plan.md` 中 Step 8 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 8 结论
- 验证：计划文件已更新，Phase 5 已展开为具体实施计划。

### Step 9 实施：统一数据层与类型系统
- 新增类型系统文件：`src/types/twinmarket.ts`
- 新增结构化 mock fixtures：
  - `src/data/fixtures/agents.ts`
  - `src/data/fixtures/forum.ts`
  - `src/data/fixtures/market.ts`
- 新增 adapter 层：
  - `src/lib/adapters/dashboard.ts`
  - `src/lib/adapters/index.ts`
- 重写 `src/data/mock-data.ts` 为兼容导出层：
  - 由 typed fixtures + adapters 生成当前 dashboard 所需数据
  - 保持现有组件基本无需修改
- 更新 `README.md`：
  - 补充 types / fixtures / adapters 的数据层说明
- 关键结论：
  - 现在 mock 数据和未来真实 API 数据已经有统一落点
  - 当前 UI 还保留原有外观，但底层数据组织已经从“单文件 mock”升级成“领域类型 + fixtures + adapter”结构
- 验证：
  - `npm run lint` 通过
  - `npm run build` 通过
- 同步更新：
  - `plan.md` 中 Step 9 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 9 结论

### Step 10 实施：上证50全部成分股真实市场概览
- 新增成分股静态快照文件：`src/data/sse50-constituents.ts`
  - 维护了 50 只上证50成分股的代码、名称、`secid`、`sinaSymbol`
  - 明确记录了快照版本与日期
- 重构市场类型：`src/lib/market/types.ts`
  - 从单一指数 quote 扩展到 constituent quote / breadth / turnover / movers / overview
- 重构市场服务：`src/lib/market/sse50.ts`
  - 主源：Eastmoney 批量接口
  - fallback：Sina 批量接口
  - 对 50 只成分股逐批抓取、校验、聚合
  - 生成统一 `Sse50MarketOverview`
- 更新 API route：`src/app/api/market/sse50/route.ts`
  - 从单一指数 quote 改为返回整套上证50成分股 overview
- 更新 UI：
  - `src/components/live-sse50-overview.tsx`
  - `src/components/dashboard.tsx`
  - 顶部概览现在显示：
    - breadth（上涨/下跌/平盘）
    - total / median turnover
    - top gainers / top losers
    - top 8 turnover snapshot
- 关键约束：
  - 按用户最新要求，本步只围绕 **上证50全部成分股**，没有接入其他股票池
- 验证：
  - `npm run lint` 通过
  - `npm run build` 通过
  - 本地 `npm run dev` 可起服务
  - 本地请求 `/api/market/sse50` 时，在当前环境下上游 Eastmoney/Sina 出现 fetch failed / timeout，因此返回的是**结构化 502 错误**；说明路由错误处理正常，但当前环境对上游数据源访问不稳定
- 同步更新：
  - `plan.md` 中 Step 10 已打勾并补充完成摘要
  - `plan.md` 决策日志已追加 Step 10 结论
