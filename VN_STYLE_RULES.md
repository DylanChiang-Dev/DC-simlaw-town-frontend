# SimAilaw Town Frontend V2 VN Style Rules

`frontend-v2` 是独立 Galgame / Visual Novel 演示前端，不继承旧 `frontend/` 的地图、寻路、HUD 和大 CSS 结构。

## Product Rules

- 第一目标是好看、可演示、能展示技术；美术方向必须偏暖色手绘 Galgame，不走真实照片或蓝色科技宣传片风格。
- 核心体验是角色对话、玩家律师选择、文书工作台、庭审质证和 Tool/Skill 可视化。
- 不把地图寻路、角色移动和碰撞作为核心玩法。
- 必须保留无后端 demo 模式，方便录屏、答辩和离线展示。
- 后端接入通过 adapter 做，不让 UI 直接依赖原始 WebSocket payload。

## Art Rules

- 场景使用 16:9 背景图。
- 角色使用 VN 立绘或半身像。
- 角色和背景资源统一放在 `frontend-v2/public/art/vn/`。
- 美术提示词必须同步保存到 `docs/frontend-v2-vn-image-prompts.md`。
- 不使用真实品牌、现成动漫/游戏角色或可读乱字。
- 不使用强蓝色科技感、全息屏堆叠、科幻控制室、3D 渲染或过度写实风格。
- 场景优先使用暖色室内光、纸张、木质、案卷、便签、柔和线稿。

## UI Rules

- 对话框优先级最高，文字必须清楚。
- 技术展示面板服务论文和答辩，不要做成普通后台看板。
- Tool / Skill / Memory 以状态标签、调用日志、便签、案卷索引、柔和节点线表达。
- 文书起草使用工作台弹窗。
- 移动端可以折叠技术面板，但不能破坏主对话体验。

## File Boundaries

- 允许修改 `frontend-v2/`。
- 允许新增 `docs/plans/` 与 `docs/frontend-v2-*.md`。
- 不要修改旧 `frontend/`，除非用户明确要求把 VN 前端接为正式入口。
- 不要新增 `frontend-v2/AGENTS.md`，项目级 Agent 说明只保留根目录 `AGENTS.md`。
