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
