# DC-simlaw-town-frontend-v2

> v2.1.84 — 法律仿真系统 V2 前端

面向法律仿真场景的交互式前端应用，采用视觉小说（Visual Novel）风格，支持玩家以律师身份主动参与案件全流程。

## 技术栈

**Vite + TypeScript + React 18**，纯前端项目，需配合后端服务运行。

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # 生产构建（tsc + vite build）
npm run preview    # 预览生产构建 http://localhost:4174
```

前端通过 `public/runtime-config.js` 注入后端地址，部署时按环境替换。

## 运行模式

| 路由 | 模式 | 用途 |
|------|------|------|
| `/` | 主应用 | 正式运行态，连接真实后端案件流程 |
| `/demo` | 演示模式 | 前端独立演示，不依赖后端 |
| `/human-eval` | 人类评估 | 结构化用户研究 / 论文实验入口 |
| `?recording=live-simulation` | 仿真录播 | 实时仿真回放 |
| `?recording=frontend-demo` | 前端演示录播 | 纯前端演示录制 |

## 测试

共 20+ 专项测试，覆盖核心路径：

```bash
npm run test:demo                   # 演示路由
npm run test:human-eval             # 人类评估
npm run test:town-radar-model       # 小镇雷达模型
npm run test:town-radar-runtime     # 小镇雷达运行态
npm run test:town-radar-component   # 小镇雷达组件
npm run test:vn-character-rules     # VN 角色渲染规则
npm run test:vn-system-scene        # VN 系统场景
npm run test:dialogue-sequence      # 对话序列
npm run test:auto-draft             # 自动文书起草
npm run test:focus-regression       # 焦点回归
npm run test:closing-summary        # 结案摘要
npm run test:reset-state            # 状态重置
npm run test:unified-task-dialog    # 统一任务弹窗
npm run test:reception-scene        # 接待场景布局
npm run test:onboarding-guide       # 新手引导
npm run test:recording-live-simulation  # 仿真录播
npm run test:build-version          # 构建版本
```

## 项目架构

```
src/
├── main.tsx                       # 入口，多模式路由
├── App.tsx                        # 主应用
├── styles.css                     # 全局样式
├── config/
│   └── projectInfo.ts             # 项目信息配置
├── components/
│   ├── VisualNovelStage.tsx       # VN 主舞台（角色立绘 + 场景背景）
│   ├── DialogueBox.tsx            # 对话框（逐句展示）
│   ├── PlayerLawyerInputDialog.tsx # 律师玩家输入
│   ├── PlayerLawyerTaskPanel.tsx  # 律师任务面板
│   ├── TaskWorkbenchShell.tsx     # 任务工作台容器
│   ├── DocumentWorkbench.tsx      # 文书起草工作台
│   ├── CasePicker.tsx             # 案件选择器
│   ├── CaseTimeline.tsx           # 案件时间线
│   ├── CaseDocumentsPanel.tsx     # 案件文书面板
│   ├── CaseClosingSummaryDialog.tsx # 结案摘要
│   ├── TownRadar.tsx              # 小镇运行雷达
│   ├── TechLedger.tsx             # 技术展示面板
│   ├── CommandHud.tsx             # 指令面板
│   ├── MarkdownText.tsx           # Markdown 渲染
│   ├── AuthGate.tsx               # 登录鉴权
│   ├── LoginPanel.tsx             # 登录面板
│   ├── BuildVersionBadge.tsx      # 构建版本标识
│   ├── OnboardingCoach.tsx        # 新手引导教练
│   └── OnboardingGuideDialog.tsx  # 引导对话框
├── state/
│   ├── useSimulationRuntime.ts    # 仿真运行态
│   ├── usePlayerLawyerRuntime.ts  # 律师玩家运行态
│   ├── useTownRadarRuntime.ts     # 雷达运行态
│   └── vnEventReducer.ts          # VN 事件状态机
├── services/
│   ├── apiClient.ts               # API 客户端
│   ├── auth.ts                    # 认证服务
│   ├── webSocket.ts              # WebSocket 连接
│   ├── runtime.ts                 # 运行时服务
│   ├── playerLawyerApi.ts         # 律师玩家 API
│   ├── caseClosingApi.ts          # 结案 API
│   ├── caseDocumentsApi.ts        # 文书 API
│   ├── sandboxApi.ts              # 沙盒 API
│   ├── humanEvalApi.ts            # 人类评估 API
│   ├── eventBus.ts                # 事件总线
│   └── types.ts                   # 类型定义
├── data/
│   ├── runtimeScene.ts            # 场景数据
│   ├── caseArt.ts                 # 案件美术配置
│   └── townRadarModel.ts          # 雷达数据模型
├── demo/                          # 前端独立演示
├── humanEval/                     # 人类评估模块
├── recording/                     # 录播与回放
├── onboarding/                    # 新手引导
└── generated/
    └── buildInfo.ts               # 构建信息（自动生成）
```

## 核心贡献与创新

### 1. 视觉小说交互范式

抛弃传统 RPG 地图寻路交互，采用 VN 风格角色立绘 + 场景背景 + 逐句对话的叙事体验。主舞台同一时刻聚焦当前说话角色，暖色手绘美术风格——避免蓝色科技/科幻/3D 渲染，场景优先使用暖色室内光、纸张、木质、案卷等元素。

### 2. 玩家即律师的主动参与模式

不同于被动观察式仿真，用户以律师身份主动介入——起草法律文书、做出策略选择、参与庭审质证。对话系统保证角色对白完整展示后再进入用户输入，不打断叙事节奏。

### 3. 技术展示面板（Tech Ledger）

面向论文答辩和系统演示的可视化面板。动态展示后端 AI Agent 的工具调用（Tools）、专业技能（Skills）、记忆状态（Memory）和流程管线（Pipeline），以状态标签、调用日志、便签索引方式呈现代理内部运行态。

### 4. 小镇雷达（Town Radar）

将仿真运行状态空间化可视化，实时呈现当前流程阶段、参与角色位置关系和目标节点，提供超越文本对话的全局视图。

### 5. 文书工作台（Document Workbench）

内嵌法律文书起草与查阅工作台，支持在对话流程中弹窗处理专业文档，保持沉浸感的同时提供专业工具支持。

### 6. 多案件系统 + 人类评估框架

内置多案件场景支持（案件选择器、时间线、结案摘要），以及结构化人类评估（Human Eval）入口，可直接用于用户研究和论文实验。

### 7. 演示录播 + 新手引导

支持实时仿真录播回放和前端独立演示模式；内置步骤式新手引导，降低首次使用门槛。

### 8. 生产级工程实践

- 20+ 专项测试覆盖核心交互路径
- 自动构建版本号注入与版本标识组件
- 多环境路由（主应用 / Demo / Human Eval / 录播）
- WebSocket 适配器层，UI 不直接依赖原始 WS payload
- 事件总线解耦组件通信
