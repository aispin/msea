# CLAUDE.md — 老房 3D 可视化工具

## 技术栈

- React 19 + TypeScript 7 + Vite 8
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin, no PostCSS config)
- Three.js 0.185 (native, no R3F)
- GitHub Pages 部署，GitHub Actions CI/CD

## 依赖规范

- 依赖版本保持最新。升级时直接改 `package.json` + `npm install`
- Node 版本遵循 `deploy.yml` 中的 `node-version`（当前 26）
- **禁止自动 `git push` 到远程仓库**，仅在用户明确要求推送/部署时才执行。本地 commit 不受限制

## 项目架构

```
src/
├── config/house.ts    # 所有尺寸、颜色、位置参数
├── materials/index.ts # MeshStandardMaterial 工厂函数
├── builders/          # 程序化几何体（墙体/屋顶/门窗/阁楼/环境/标签）
├── scene/             # Scene3D.tsx + House.tsx + FirstPerson.ts
├── ui/                # Compass / LoadingScreen / MobileControls
└── utils/webgl.ts     # WebGL 可用性检测
```

## 关键约定

- 所有材质程序生成，无外部纹理文件
- `npm run build` = `tsc -b && vite build`
- Tailwind 入口: `src/index.css` 中用 `@import "tailwindcss"`
- OrbitControls 桌面 + 移动端触摸

## 技术文档

几何细节、坐标系、旋转映射、屋顶结构等见 **[docs/tech.md](docs/tech.md)**。
