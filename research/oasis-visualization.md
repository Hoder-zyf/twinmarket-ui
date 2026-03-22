# Step 4 — OASIS 框架可视化层调研

更新时间：2026-03-23 00:32

调研对象：`camel-ai/oasis`

## 结论先行

OASIS **没有一个像 MiroFish 那样现成可复用的完整前端产品层**。它更像是：
- 一组 simulation / experiment framework
- 加上一些 Python 可视化脚本
- 以及面向论文分析的 notebook / docs / chart generation 工具

所以：
> OASIS 不会直接给 TwinMarket 提供现成的 UI 组件库，但会给你提供“哪些数据值得可视化”的参考。

---

## 1. 仓库里到底有什么可视化内容

通过仓库树检索，OASIS 中能看到这些与 visualization 相关的内容：
- `docs/visualization/visualization.mdx`
- `examples/experiment/user_generation_visualization.md`
- `visualization/dynamic_follow_network/...`
- `visualization/twitter_simulation/...`

这类文件说明：
- 它确实重视可视化
- 但主要是 **研究分析与结果展示**
- 不是给终端用户操作的 dashboard 前端

---

## 2. 可视化主要形态：Python/研究脚本，而非前端应用

### 代码层面特征
我读到的可视化脚本主要是：
- Python 文件
- 依赖图分析/绘图库
- 面向 follow network / twitter simulation / alignment analysis

这说明 OASIS 的“可视化”更像：
- 生成图表
- 导出分析结果
- 对实验过程进行离线复盘

而不是：
- 一个浏览器中的可交互实时终端

### 对 TwinMarket 的意义
这意味着你不能指望“直接借一个 OASIS 前端”。
但你可以借它的：
- 指标体系
- 图结构分析方式
- 输出数据组织思路

---

## 3. 它关注哪些东西值得画出来

从目录命名和文档主题看，OASIS 比较关心：
- **动态关注网络 / follow network**
- **社会传播图结构**
- **用户生成与群体行为分布**
- **与真实世界数据对齐（align with real world）**

### 对 TwinMarket 的启发
TwinMarket 的 UI 不应该只画价格线。更应该画：

1. **社交影响网络**
2. **情绪扩散路径**
3. **agent 群体分布（风险偏好、策略类型）**
4. **simulation vs. real market 对齐结果**

也就是说，OASIS 的价值不在 UI 组件，而在“**研究展示应该展示什么结构**”。

---

## 4. 有没有现成的 agent 社交网络可视化

### 结论
**有思路和脚本，没有产品化前端组件。**

仓库里出现了：
- `dynamic_follow_network`
- 与 graph/network 对应的代码

这表明 OASIS 很明确地把“agent 间网络结构”作为核心分析对象。

### TwinMarket 可借鉴的具体点
- 网络不是静态背景图，而是可以被当成实验变量
- 可以做时间切片：t1 / t2 / t3 网络演化
- 可以比较不同 seed 或 scenario 下的 network change

### UI 建议
你后面可以借这套思路做：
- `Social influence network`
- `Belief diffusion network`
- `Trade co-movement network`

并支持：
- 节点筛选（只看 top influence）
- 边权过滤
- 时间回放

---

## 5. 有没有 simulation replay UI

### 结论
**没有像 MiroFish 那样完整的模拟回放产品界面。**

OASIS 更像是：
- 后端 simulation framework
- 输出实验结果
- 再由分析脚本生成图/统计

### 启发
这对 TwinMarket 反而是好事：
- 你不用被现成前端框架绑死
- 可以自己做更适合金融场景的 replay UI

### 推荐做法
TwinMarket 的 replay 应该做成：
- 时间轴
- 订单簿/成交流/新闻流联动
- 网络状态随时间变化
- 可切换单 agent 视角

这部分 MiroFish 比 OASIS 更值得借鉴；OASIS 更适合作为“分析指标来源”。

---

## 6. 数据导出格式有什么启发

虽然 OASIS 没有一个统一的前端 schema，但从其文档和脚本风格看，它倾向于：
- 将 simulation 结果拆成结构化中间产物
- 支持 network / user / timeline / experiment result 这些维度独立分析

### 对 TwinMarket 的建议
后端输出最好天然分层：

```ts
type TwinMarketExport = {
  meta: { seed: number; scenario: string; startDate: string; endDate: string };
  agents: AgentProfile[];
  networkSnapshots: NetworkSnapshot[];
  marketTimeline: MarketTick[];
  events: MarketEvent[];
  forumPosts: ForumPost[];
  trades: ExecutedTrade[];
  summaries: DailySummary[];
}
```

这会比“一个巨大的 simulation.json”更适合前端接入。

---

## 7. OASIS 对 TwinMarket 最有价值的 3 个思想

### 思想 1：图结构不是附件，是核心分析对象
在很多项目里，network graph 只是“好看”。
但 OASIS 的目录组织说明，网络本身就是研究对象。

### 思想 2：真实世界对齐值得作为独立视图
`align_with_real_world` 这类路径提醒了一个很重要的点：
- TwinMarket 不只要展示 simulation 本身
- 还可以展示 simulation 与真实市场数据的相似度 / 偏差

这很适合你后面做：
- real SSE50 vs simulated sector movement
- real news vs simulated belief updates

### 思想 3：可视化服务于分析，不只是展示
OASIS 的可视化更多是为了：
- 解释现象
- 支撑论文结论
- 比较实验设定

这对 TwinMarket 很关键。

---

## 8. 对 TwinMarket UI 的直接建议

### 可以借鉴的
1. **把 network 和 social diffusion 提升为一等公民**
2. **提供 simulation vs reality 对照视图**
3. **把实验输出拆成多层结构化数据**
4. **支持导出给离线分析脚本**

### 不用借鉴的
1. 不要照着 OASIS 做成大量分析脚本堆砌、没有产品界面的形态
2. 不要把可视化只留给离线 notebook
3. 不要忽略交互式 replay

---

## 最终结论

OASIS 提供的不是“现成前端”，而是：

> 一套告诉你“研究型多智能体系统里，哪些结构最值得被可视化”的思路。

因此在 TwinMarket 项目里：
- **前端交互模式** 更应该参考 MiroFish
- **分析对象与导出结构** 更应该参考 OASIS

这是更合理的组合。
