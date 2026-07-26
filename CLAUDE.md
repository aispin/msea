# CLAUDE.md — 老房 3D 可视化工具

## 技术栈

- React 19 + TypeScript 7 + Vite 8
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin, no PostCSS config)
- Three.js 0.185 (native, no R3F)
- GitHub Pages 部署，GitHub Actions CI/CD

## 依赖规范

- 依赖版本保持最新。升级时直接改 `package.json` + `npm install`，不要手动编辑 `package-lock.json`
- Node 版本遵循 `deploy.yml` 中的 `node-version`（当前 26）
- **禁止未经明确命令执行 `git push`**——只在用户明确要求推送/部署时才 push
- Node 版本遵循 `deploy.yml` 中的 `node-version`（当前 26）

## 项目架构

```
src/
├── config/house.ts    # 所有尺寸、颜色、位置参数（修改参数即刷新）
├── materials/index.ts # MeshStandardMaterial 工厂函数
├── builders/          # 程序化几何体（墙体/屋顶/门窗/阁楼/环境/标签）
├── scene/             # Scene3D.tsx (Three.js 容器) + House.tsx (组装)
├── ui/                # Compass.tsx + LoadingScreen.tsx (2D overlay)
└── utils/webgl.ts     # WebGL 可用性检测
```

## Three.js 注意

- `Matrix4.lookAt(eye, target, up)` 中 `x = cross(up, normalize(eye - target))`
- **相机在 -Z 看向 +Z 时**：`eye-target ≈ -Z`，`cross(up, -Z) = -X`，导致**屏幕右 = 世界 -X**，左右颠倒
- 标准用法（相机在 +Z 看向原点）屏幕右 = 世界 +X，无此问题
- 本项目相机在西南(-Z)望向东北(+Z)，故环境元素（过道/邻居）位置已按视觉正确性调整

## 关键约定

- 世界坐标系: +Z=东北(远), -Z=西南(近), -X=西北, +X=东南
- 视觉映射: 相机在-Z看向+Z → 屏幕左=世界+X, 屏幕右=世界-X
- 所有材质程序生成，无外部纹理文件
- `npm run build` = `tsc -b && vite build`
- Tailwind 入口: `src/index.css` 中用 `@import "tailwindcss"`（无 `@tailwind` 指令）
- `@tailwindcss/vite` 插件在 `vite.config.ts` 中注册

## 3D 模型

- 建筑主体 `src/builders/` 下各 builder 纯函数，返回 `THREE.Group`
- House 组件用 `useEffect` 组装所有 builder 并挂载到 scene
- 组件卸载时清理 geometry/material/texture，覆盖 Mesh 和 Sprite
- OrbitControls 同时支持桌面（鼠标）和移动端（触摸）
