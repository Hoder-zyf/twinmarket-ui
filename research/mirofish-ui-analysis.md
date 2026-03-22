# Step 3 — MiroFish UI 深度调研

更新时间：2026-03-23 00:32

调研对象：
- `666ghj/MiroFish`
- `amadad/mirofish`
- `nikmcfly/MiroFish-Offline`

## 结论先行

MiroFish 的前端不是普通 dashboard，而是一个**多阶段研究工作流 UI**。它不是把 simulation 结果平铺成几个 chart，而是把整个用户旅程拆成：

1. **Graph / persona exploration**
2. **Simulation playback / action stream**
3. **Report generation workflow**
4. **Deep interaction / interview**

这对 `TwinMarket UI` 很有启发：
> 不要把项目只做成一个“市场大屏”，而是要做成“探索 → 运行 → 分析 → 追问”的闭环研究工作台。

---

## 1. 技术栈

### 代码层面看到的事实
- `frontend/package.json` 显示其使用 **Vue 3 + Vite + Vue Router**。
- 不是 React、不是 Streamlit、也不是 Gradio。
- 离线版与英文 fork 基本沿用了同样的前端结构。

### 核心依赖特征
从前端目录与组件组织可以判断：
- Vue 组件化较重
- 页面状态由 Vue + Router 驱动
- 样式大量自定义，不是单纯套现成组件库
- UI 明显偏“research demo / productized prototype”，不是后台管理模板

### 对 TwinMarket 的启发
- 你当前 `Next.js + Tailwind` 没问题，不需要为了借鉴 MiroFish 换栈。
- 真正值得借鉴的是**信息架构**，不是 Vue 本身。

---

## 2. 页面结构：它怎么组织整个任务流程

MiroFish 的关键组件命名直接暴露了它的产品心智：

- `GraphPanel.vue`
- `Step3Simulation.vue`
- `Step4Report.vue`
- `Step5Interaction.vue`

这个命名方式说明它的 UI 核心不是单页，而是**多 step 线性工作流**。

### 对应含义
- **GraphPanel**：图谱/网络/节点信息浏览
- **Step3Simulation**：模拟过程展示
- **Step4Report**：报告生成过程与结果展示
- **Step5Interaction**：与单体 agent 或 report agent 的深聊

### 值得借鉴的点
对 TwinMarket 来说，这意味着你后续应该把产品拆成至少 3 个逻辑模式：

1. **Market Replay / Live Monitor**
2. **Research Report / Summary**
3. **Agent Deep Dive / Ask an Agent**

而不是只停留在首页 dashboard。

---

## 3. GraphPanel：图谱可视化怎么做的

### 从代码和组件结构看
GraphPanel 在 MiroFish 里承担的是：
- 图谱/人物/关系浏览
- 节点状态与上下文查看
- 后续 simulation / report 的入口

虽然我这轮没有完全拉到所有底层图可视化库的 import 细节，但从组件边界看，它不是“页面装饰”，而是一个**核心导航面板**。

### 设计特征
MiroFish 的图谱不是纯技术 demo 风格，而是：
- 有明确的 panel 边界
- 图与信息详情联动
- 节点不是匿名圆点，而是带身份语义

### TwinMarket 借鉴点
你的 `agent influence network` 不能只做成好看的 node cloud。更应该支持：
- 点击 agent → 右侧显示画像、持仓、近期发帖、PnL
- hover 边 → 显示 influence type / belief propagation strength
- 切换视图 → 社交图 / 交易共振图 / 信息传播图

---

## 4. Step3Simulation：模拟过程怎么展示

### 观察到的模式
Simulation 页面不是只给一张图，而是带**动作流/事件流**。

在 `Step3Simulation.vue` 里能看到大量动作类型模板分支，例如：
- `QUOTE`
- `REPOST`
- `LIKE_POST`
- `CREATE_COMMENT`
- `SEARCH_POSTS`

这意味着它在前端不是只显示最终结果，而是把 agent 行为当成**typed action stream** 展示。

### 这非常重要
这和很多 MAS demo 的区别很大：
- 不是一张最终 summary 图
- 而是把“agent 在过程中做了什么”明细化

### 对 TwinMarket 的启发
TwinMarket 后面非常适合用同样思路，把 action stream typed 化：

```ts
type AgentAction =
  | { type: 'PLACE_ORDER'; side: 'BUY' | 'SELL'; ticker: string; price: number; volume: number }
  | { type: 'POST_OPINION'; content: string; stance: 'bullish' | 'bearish' | 'neutral' }
  | { type: 'QUOTE_POST'; postId: string }
  | { type: 'LIKE_POST'; postId: string }
  | { type: 'READ_NEWS'; newsId: string }
  | { type: 'UPDATE_BELIEF'; factor: string; delta: number }
```

然后前端按 type 渲染不同卡片。

### 这比单纯日志文本强很多
因为它让 UI 可以：
- 做不同动作图标
- 做 filtering
- 做 replay
- 做统计（某类动作频率）

---

## 5. Step4Report：报告生成页的设计很值得学

### 代码中能看到的核心模式
`Step4Report.vue` 的布局是：
- 左侧：**报告正文 / section 列表**
- 右侧：**workflow timeline / 生成过程**

左边有：
- 标题、摘要
- section list
- 每节的 completed / active / pending 状态
- 折叠/展开
- markdown rendered output

右边有：
- workflow metrics
- step timeline
- 工具调用日志
- elapsed / tools / completed sections 等信息

### 这意味着什么
MiroFish 不是只展示“生成出的报告”，还把**报告是怎么生成出来的**也产品化了。

这对研究 demo 非常重要，因为：
- 用户能看到中间过程
- 评审会觉得系统更透明
- 有利于 debug 和可信度展示

### TwinMarket 借鉴点
你后面如果做：
- market daily summary
- regime shift explanation
- why-did-agent-buy-this

最好也不要只给最后那段文字，应该加：
- 生成步骤
- 引用的数据源
- 参与的 agent 子任务
- 相关事件链条

也就是一个“**analysis provenance panel**”。

---

## 6. Step5Interaction：与 agent 对话功能怎么做的

### 代码里直接能看到的形态
`Step5Interaction.vue` 明显不是单聊天框，而是两个模式：

1. **Chat with Report Agent**
2. **Chat with any individual**

并且 report agent 被包装成有多个工具的专业体，例如页面里明确展示：
- Deep Attribution
- Panoramic Tracking
- QuickSearch
- InterviewSubAgent

### 这说明 MiroFish 做了什么产品决策
它把“agent”分成至少两类：
- **系统级分析 agent**
- **世界中的个体 agent**

这非常聪明。

### TwinMarket 的直接映射
你后面也应该有：

#### A. 市场分析代理（system analyst）
- 回答“今天为什么科技板块拉升？”
- 回答“哪些 agent 触发了羊群效应？”

#### B. 单体交易代理（individual trader）
- 回答“你为什么加仓 TTEI？”
- 回答“你现在对市场的看法是什么？”

### UI 设计建议
这意味着 TwinMarket 后续可以做：
- `Ask Market Analyst`
- `Interview this Agent`

而不是把所有问答都塞进一个通用聊天框。

---

## 7. 与后端通信方式：更像事件驱动，不是纯静态渲染

虽然这轮没有把每个 API endpoint 全挖完，但从组件行为和状态设计可以明显看出：
- Simulation 页面依赖持续流入的 action / timeline 数据
- Report 页面依赖渐进式 section 生成状态
- Interaction 页面依赖会话上下文与 agent profile 拉取

这说明 MiroFish 的前端设计天然支持：
- polling / streaming
- typed action event
- long-running tasks with visible progress

### 对 TwinMarket 的启发
你的 UI 后续很适合分两种通信模式：

1. **低频查询**：REST
   - agent profile
   - order history
   - report result
2. **高频流**：WebSocket/SSE
   - market ticks
   - trades
   - forum events
   - agent actions
   - report generation progress

---

## 8. 视觉与交互风格：为什么它“像产品”

MiroFish 的一个强点是，它没有做成学术味很重的朴素可视化，而是：
- 有明显 panel 分层
- 大量状态 badge / pill / timeline
- 交互节奏清晰（不是一页塞满）
- 每个阶段有清晰任务感

### TwinMarket 可以直接借鉴的设计模式
- **timeline + main content 双栏**
- **step-based workflow**
- **typed action cards**
- **role-aware chat target selector**
- **报告 section 生成状态**
- **analysis trace / tool calls 可见化**

---

## 9. 哪些地方不适合直接照搬

### 不建议直接照搬的点
1. **过重的多 step 强流程**
   - TwinMarket 更偏 monitoring + replay，不一定要用户逐步点到 Step 5。
2. **太偏 narrative report 的信息中心**
   - 金融场景里还需要 market microstructure 与 quantitative surface。
3. **社交媒体 action 类型直接搬运**
   - 你要把它改成更金融化的动作语义，比如下单、撤单、成交、看多贴、引用快讯。

---

## 10. 最值得借鉴的设计点

### 我建议 TwinMarket 借的 5 个点
1. **把 UI 从“市场大屏”升级成“研究工作流”**
2. **把 agent 行为做成 typed action stream**
3. **把报告生成过程可视化，不只展示结论**
4. **区分 system analyst 和 individual agent 两类对话对象**
5. **给 graph/network 一个真正的交互语义，而不是背景装饰**

---

## 最终结论

MiroFish 最值得学的不是“它用了 Vue”，而是它的 **workflow information architecture**：

> 图谱探索 → 模拟运行 → 报告生成 → 深度追问

对 TwinMarket 来说，这几乎可以直接转译成：

> 市场回放/监控 → agent 行为流 → 市场解释报告 → 采访 agent / analyst

这会比“单一 dashboard”更像一个真正能用于研究展示和论文 demo 的产品。
