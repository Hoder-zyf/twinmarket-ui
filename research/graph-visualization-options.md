# Step 7 — 前端图可视化方案评估

更新时间：2026-03-23 00:46

目标：为 TwinMarket 的 `agent influence network` 选择合适的图可视化方案。

评估范围：
- D3.js force graph
- vis-network
- Cytoscape.js
- react-force-graph
- sigma.js

---

## 结论先行

如果只给一个当前推荐：

> **TwinMarket MVP 阶段优先用 `Cytoscape.js`（配合 React 封装）**。

如果要做更炫、更偏 demo 的版本：

> **可以在后续加 `react-force-graph` 做第二视图**。

原因很简单：
- 你现在要的是 **研究展示 + 交互分析**
- 不只是看着会动
- 还要支持点选、hover、筛选、固定布局、样式编码、后续和 forum/trade state 联动

`Cytoscape.js` 在这个平衡点上最稳。

---

## 评估维度

我按这几个维度看：
- React 集成度
- 100+ 节点性能
- 点击/hover/拖拽/选中等交互能力
- 样式自定义能力
- 布局可控性
- Bundle size / 复杂度
- 是否适合 TwinMarket 当前场景

---

## 1. D3.js force graph

### 定位
最原始、最自由的方案。

### 优点
- 自由度最高
- 几乎所有视觉效果都能自己定义
- 如果你要做非常定制化的金融网络视觉，理论上天花板最高

### 缺点
- React 集成最麻烦
- 交互和状态同步要自己管很多
- 布局、拖拽、tooltip、选中状态、动画都容易变成维护负担
- 不适合现在这个项目的开发节奏

### 性能
- 100+ 节点没问题
- 但你要自己处理很多优化细节

### 是否推荐
**不推荐作为 MVP 主方案。**

### 适合什么时候用
- 你后面真的要做非常独特的 graph aesthetic
- 或者 Cytoscape/sigma 都满足不了你

---

## 2. vis-network

### 定位
一个老牌、相对省心的 network visualization 库。

### 优点
- 上手快
- 默认交互丰富
- 拖拽、缩放、选中都开箱即用
- 适合快速搭 demo

### 缺点
- 视觉风格会比较“传统 network tool”
- React 生态整合感一般
- 自定义程度不如 Cytoscape / D3 灵活
- 想做高级 styled graph 容易碰天花板

### 性能
- 100+ 节点没问题
- 中小规模图表现稳定

### 是否推荐
**可以用，但不是最优。**

### 对 TwinMarket 的判断
如果你只是想“先把图做出来”，它行。  
但你后面要做：
- belief diffusion
- influence edge styling
- node detail drill-down
- 多种 graph mode

它会比较快撞墙。

---

## 3. Cytoscape.js

### 定位
面向复杂关系图 / network analysis 的成熟库。

### 优点
- 图模型成熟
- 选择、过滤、类样式、节点/边数据驱动很强
- 适合做多个 graph view（社交图、传播图、共振图）
- 布局插件多
- 和“分析型前端”很匹配

### 缺点
- 视觉上默认不如 force graph 那么“炫”
- 需要花点时间整理样式系统
- 如果要做非常强的物理感动画，不如 react-force-graph 直接

### React 集成
- 有成熟方案，如 `react-cytoscapejs`
- 集成成本可接受

### 性能
- 100+ 节点非常稳
- 数百节点级别依然是可用区间

### 为什么特别适合 TwinMarket
因为 TwinMarket 的图不是“展示一下关系”，而是要承载分析：
- 按影响力给节点编码
- 按情绪/信念给边和节点上色
- 允许 click → open side panel
- 允许 filter by agent type / sector / belief strength
- 允许切换 layout / subgraph

这些正是 Cytoscape 擅长的。

### 是否推荐
**强推荐，作为 MVP 主方案。**

---

## 4. react-force-graph

### 定位
偏 demo、偏动态效果、偏“看起来很活”的 network graph。

### 优点
- 视觉冲击力强
- force layout 动感很好
- React 集成相对直接
- 2D / 3D 都能做
- 很适合做演示场景

### 缺点
- 精细分析交互不如 Cytoscape 系统化
- 图一复杂就容易变成“好看但不好读”
- 对于需要严肃读图的研究展示，不一定始终是最佳主视图

### 性能
- 100+ 节点完全够用
- 3D 模式会增加复杂度和性能负担

### 对 TwinMarket 的判断
它非常适合做：
- 首页 hero network
- live influence animation
- demo 时吸引眼球的 graph view

但不一定适合当唯一图引擎。

### 是否推荐
**推荐作为第二视图 / 增强视图，而不是唯一主方案。**

---

## 5. sigma.js

### 定位
偏大规模网络可视化、图分析社区常用。

### 优点
- 性能不错
- 适合中大型图
- 和 graphology 生态搭配较强

### 缺点
- React 开发体验没有 Cytoscape 那么直接
- 样式和业务交互封装成本较高
- 更偏 network science / data viz，而不是产品化 dashboard 集成

### 性能
- 100+ 节点肯定没问题
- 往上扩展空间也不错

### 是否推荐
**可选，但不是当前最优。**

### 对 TwinMarket 的判断
如果你后面真的把图做成：
- 500~1000 节点的大型社交网络
- 强 graph analytics

sigma.js 会更值得考虑。  
但当前 TwinMarket UI 还没到那个规模。

---

## 横向对比表

| 方案 | React 集成 | 100+ 节点性能 | 交互能力 | 样式自定义 | 适合分析型 UI | 适合炫 demo | 当前推荐度 |
|---|---|---:|---:|---:|---:|---:|---:|
| D3.js force graph | 低 | 高 | 中 | 极高 | 中 | 高 | ★★☆☆☆ |
| vis-network | 中 | 高 | 中高 | 中 | 中 | 中 | ★★★☆☆ |
| Cytoscape.js | 中高 | 高 | **高** | **高** | **高** | 中 | **★★★★★** |
| react-force-graph | 高 | 高 | 中高 | 中高 | 中 | **高** | **★★★★☆** |
| sigma.js | 中 | 高 | 中高 | 中高 | 高 | 中 | ★★★☆☆ |

---

## 推荐方案

### MVP 阶段
**主选：Cytoscape.js**

原因：
- 最平衡
- 最适合研究展示与分析操作
- 最容易和 TwinMarket 的 side panel / filter / entity model 接起来

### 第二阶段
**增强视图：react-force-graph**

原因：
- 做一个更动态、更“有生命力”的 influence network 版本
- 用于 demo / presentation / hero section

---

## 对 TwinMarket 的落地建议

### Graph 数据结构建议
```ts
export type AgentGraphNode = {
  id: string;
  label: string;
  type: 'event-driven' | 'value' | 'macro' | 'social-follower' | 'contrarian';
  influenceScore: number;
  pnl: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sectorBias?: string[];
};

export type AgentGraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: 'follow' | 'quote' | 'belief-influence' | 'trade-co-move';
  weight: number;
  sentimentImpact?: number;
};
```

### Cytoscape 主视图建议
做这几个交互：
1. 节点 hover：显示 agent quick card
2. 节点 click：右侧打开详情抽屉
3. 边 hover：显示 influence weight / relation type
4. filter：按策略、风险、盈亏、情绪过滤
5. view mode：
   - Social influence
   - Forum propagation
   - Trade co-movement

### 后续再加 react-force-graph 的地方
- 首页中间大图
- 实时动态扩散效果
- 答辩/demo 时的动画视图

---

## 最终结论

如果你问“现在 TwinMarket UI 的社交图谱到底选谁”，我的答案是：

> **先上 Cytoscape.js 做严肃主图，再视需要补一个 react-force-graph 做动态展示层。**

这是当前最稳、最不像走弯路的组合。
