# TwinMarket UI — OpenClaw 任务计划

## 元规则
- **进度追踪**：每完成一个 Step，在本文件对应条目前打 `[x]`，并在该条目下方追加一行 `> 完成时间: YYYY-MM-DD HH:MM | 摘要: ...`
- **产出文件**：所有调研结果写入 `research/` 目录下对应的 markdown 文件
- **决策记录**：重要发现和技术选型决策追加到本文件底部的「决策日志」区域
- **异常处理**：如果某个数据源挂了 / repo 访问不了，记录原因后跳过，继续下一步

---

## Phase 1: 数据源调研

### Step 1: 调研上证50全部成分股的免费行情接口
- [x] 目标：找到一个**稳定、免费、可服务端调用**的数据源，能拿到上证50所有成分股（约50只）的实时/延迟行情（价格、涨跌幅、成交量）
> 完成时间: 2026-03-23 00:40 | 摘要: 完成 Eastmoney / Sina / Tushare / AKShare / 同花顺方向调研，验证了 Eastmoney 批量接口可用，形成了 `research/stock-data-sources.md`，当前推荐用 Eastmoney 批量行情为主、Sina 为 fallback。
- 调研范围（不限于）：
  - 当前项目已接的 Eastmoney push2 接口：能否批量查个股？频率限制？
  - Sina hq.sinajs.cn：能否批量查？返回格式？
  - Tushare（免费 tier）
  - AKShare（Python，看有没有 HTTP 接口或者能否包一层 API route）
  - 东方财富 Web API 其他端点
  - 同花顺 Web API
  - 其他你搜到的可用方案
- 评估维度：稳定性、频率限制、是否需要 token/注册、返回字段、是否有 CORS 问题（我们走服务端所以 CORS 不是问题）
- 产出：`research/stock-data-sources.md`，包含每个方案的优劣对比表 + 最终推荐方案 + 示例请求/响应

### Step 2: 调研免费可靠的金融/市场信息发布来源
- [x] 目标：找到一个能程序化获取的**新闻/公告/信息流**来源，用于给 agent 的 event stream 提供真实信息输入
> 完成时间: 2026-03-23 00:41 | 摘要: 完成 Eastmoney 7x24、Sina roll API、Cninfo 公告查询、财联社/同花顺/AKShare 方向调研，形成 `research/news-data-sources.md`，当前推荐用 Eastmoney 7x24 作为 event stream 主源、Cninfo 作为公告层、Sina 作为补充新闻层。
- 调研范围（不限于）：
  - 东方财富 7x24 快讯 API
  - 新浪财经新闻 API / RSS
  - 同花顺快讯
  - 财联社电报
  - 证监会/交易所公告（巨潮资讯 cninfo）
  - AKShare 新闻接口
  - 其他 RSS / 公开 API
- 评估维度：更新频率、内容质量、是否需要认证、返回格式（JSON/HTML/RSS）、反爬严格程度
- 产出：`research/news-data-sources.md`，包含对比表 + 推荐方案 + 示例

---

## Phase 2: 竞品/参考项目调研

### Step 3: 深度调研 MiroFish 的 UI 实现
- [x] 目标：搞清楚 MiroFish 的前端是怎么做的，哪些设计模式和组件可以借鉴
> 完成时间: 2026-03-23 00:42 | 摘要: 深读了 `666ghj/MiroFish`、`amadad/mirofish`、`nikmcfly/MiroFish-Offline` 的前端代码与关键组件，形成 `research/mirofish-ui-analysis.md`；当前结论是 MiroFish 更值得借鉴的是 workflow information architecture，而不是具体框架选型。
- 调研内容：
  - 去读 `666ghj/MiroFish` repo 的前端代码（找 frontend / web / ui 目录）
  - 也看 `amadad/mirofish`（英文 fork，有 npm run dev）和 `nikmcfly/MiroFish-Offline`
  - 重点关注：
    - 用了什么前端框架？（React / Vue / Streamlit / Gradio？）
    - 知识图谱怎么可视化的？用了什么图库？
    - 模拟过程中 agent 的帖子/互动怎么实时展示的？
    - 报告生成页面的交互设计
    - 和后端的通信方式（WebSocket / SSE / Polling / REST？）
    - "与 agent 对话"功能的 UI 实现
  - 截图或描述关键界面
- 产出：`research/mirofish-ui-analysis.md`

### Step 4: 调研 OASIS 框架的可视化层
- [x] 目标：MiroFish 底层用的是 CAMEL-AI 的 OASIS 框架，看看 OASIS 本身有没有前端/可视化组件
> 完成时间: 2026-03-23 00:43 | 摘要: 阅读了 `camel-ai/oasis` 的 visualization 相关文档与代码，形成 `research/oasis-visualization.md`；结论是 OASIS 更像提供分析对象与导出结构，不提供可直接复用的前端产品层。
- 调研 `camel-ai/oasis` repo
- 重点：有没有现成的 agent 社交网络可视化、模拟回放 UI、数据导出格式
- 产出：`research/oasis-visualization.md`

### Step 5: 调研 TwinMarket 后端 repo 的数据结构
- [x] 目标：搞清楚 TwinMarket 后端到底输出什么数据，UI 需要对接什么
> 完成时间: 2026-03-23 00:44 | 摘要: 深读 `FreedomIntelligence/TwinMarket` 的 `simulation.py`、`trading_agent.py`、`matching_engine.py`、`UserDB.py`、`ForumDB.py`、`InformationDB.py` 等代码，形成 `research/twinmarket-backend-schema.md`，并整理出 UI 可直接采用的 TypeScript 类型草案。
- 调研 `Hoder-zyf/TwinMarket` repo（如果是 private 就从 TwinMarket 论文和现有 README 推断）
- 重点关注：
  - Agent profile 的数据结构（字段、类型）
  - 论坛帖子的数据结构
  - 撮合引擎的输出格式（order book / trade log）
  - 日级 summary 的格式
  - 模拟配置的输入参数
- 产出：`research/twinmarket-backend-schema.md`，包含关键数据结构的 TypeScript 类型定义草案

---

## Phase 3: 横向补充调研

### Step 6: 调研其他多智能体模拟项目的 UI 实现
- [x] 目标：除了 MiroFish，看看还有什么多智能体社会模拟项目有好的前端可视化
> 完成时间: 2026-03-23 00:45 | 摘要: 完成对 Generative Agents / Smallville、AgentSims、ChatArena、MedAgentSim、multi-agent-social-simulation 的 UI/可视化形态调研，形成 `research/multi-agent-ui-survey.md`，并提炼出 replay、scenario builder、runtime/UI 解耦等可迁移 pattern。
- 调研范围：
  - Generative Agents（Stanford 的 "Smallville" 项目）的前端实现
  - AgentSims
  - ChatArena
  - 其他你搜到的有可视化界面的 multi-agent simulation
- 重点：交互设计亮点、技术选型、哪些 pattern 适合 TwinMarket
- 产出：`research/multi-agent-ui-survey.md`

### Step 7: 评估前端图可视化方案
- [ ] 目标：TwinMarket 有 agent influence network（社交图谱），需要选一个合适的图可视化库
- 评估范围：
  - D3.js force graph
  - vis.js / vis-network
  - Cytoscape.js
  - react-force-graph（基于 three.js 的 3D/2D）
  - sigma.js
- 评估维度：React 集成度、性能（100+ 节点）、交互能力（点击/hover/拖拽）、样式自定义、bundle size
- 产出：`research/graph-visualization-options.md`

---

## Phase 4: MVP 规划

### Step 8: 制定 TwinMarket UI 最小 MVP 方案
- [ ] 目标：基于所有调研结果，制定一个**具体可执行的最小 MVP**
- MVP 定义应包含：
  - **核心场景**：这个 UI 给谁看？解决什么问题？（论文 demo / 研究展示 / 实时监控）
  - **Must-have 功能清单**（按优先级排序）
  - **Nice-to-have 功能清单**
  - **数据流设计**：哪些用真实行情，哪些用 mock，哪些对接 TwinMarket 后端
  - **与 TwinMarket 后端对接方式**建议（REST / WebSocket / 读 JSON 文件）
  - **技术栈评估**：当前 Next.js + Tailwind 是否足够，是否需要加状态管理(zustand?)、图可视化库等
  - **关键组件架构图**（用 mermaid 或文字描述）
  - **从 MiroFish 借鉴的具体设计点**
  - **预估工作量**：拆成具体 step，标注每步预估耗时
- 产出：**直接 append 到本文件下方作为 Phase 5**，格式和上面一致，step 编号从 Step 9 开始继续

---

## Phase 5: MVP 实施计划

（由 Step 8 完成后自动 append 到这里，包含具体的编码步骤）

---

## 决策日志

（每次做出重要发现或技术选型时追加）

| 时间 | 决策/发现 | 依据 |
|------|-----------|------|
| 2026-03-23 00:40 | 上证50全量行情的当前主方案定为 Eastmoney 批量接口，Sina 作为 fallback；成分股名单建议静态快照 + 周期性更新。 | `research/stock-data-sources.md` 中对 Eastmoney `ulist.np/get`、Sina `hq.sinajs.cn`、Tushare、AKShare 的稳定性与接入成本对比。 |
| 2026-03-23 00:41 | 市场信息流分三层：Eastmoney 7x24 负责快讯流，Cninfo 负责高信号公告层，Sina roll API 负责补充新闻层。 | `research/news-data-sources.md` 中对 Eastmoney fastnews、Sina roll、Cninfo、财联社、同花顺、AKShare 的返回格式、稳定性与接入成本对比。 |
| 2026-03-23 00:42 | TwinMarket UI 不应只做单页大屏，更应借鉴 MiroFish 的“探索 → 运行 → 分析 → 追问”工作流信息架构。 | `research/mirofish-ui-analysis.md` 中对 GraphPanel、Step3Simulation、Step4Report、Step5Interaction 的代码阅读与结构分析。 |
| 2026-03-23 00:43 | OASIS 更适合作为 TwinMarket 的分析对象/数据导出参考，而不是前端 UI 组件来源。 | `research/oasis-visualization.md` 中对 OASIS visualization 目录、文档与 network/analysis 脚本的阅读。 |
| 2026-03-23 00:44 | TwinMarket 后端接口设计应按实体拆分：AgentProfile、Forum、InstrumentSnapshot、Transaction/DailySummary、SimulationConfig，而不是塞成一个大结果对象。 | `research/twinmarket-backend-schema.md` 中对 `simulation.py`、`matching_engine.py`、`UserDB.py`、`ForumDB.py`、`InformationDB.py` 的代码阅读与类型整理。 |
| 2026-03-23 00:45 | TwinMarket UI 应补齐 replay mode、scenario builder、runtime/UI 解耦与 analytics flow 视图，而不是只做首页大屏。 | `research/multi-agent-ui-survey.md` 中对 Smallville、AgentSims、ChatArena、MedAgentSim 等项目的横向比较。 |
