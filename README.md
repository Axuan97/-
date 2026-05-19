# 待办事项 (Todo App)

基于 **Tauri v2** 的桌面待办事项应用，使用 Vanilla JS + Rust 构建。

## 功能

- 添加、编辑、删除任务
- 任务属性：标题、优先级（低/普通/较高/紧急）、分类、截止日期
- 按状态筛选：全部 / 进行中 / 已完成
- 关键词搜索
- 智能排序：未完成优先 → 逾期置顶 → 优先级降序
- 本地数据持久化
- 键盘快捷键（`N` 新建任务，`Esc` 退出编辑）

## 技术栈

- **前端**: Vanilla JS + Vite
- **后端**: Rust + Tauri v2
- **UI**: 原生 CSS（Apple 风格设计）

## 开发

### 环境要求

- Node.js >= 18
- Rust >= 1.70
- Windows: Microsoft Visual Studio C++ Build Tools

### 启动

```bash
cd tauri
npm install
npx tauri dev
```

### 构建

```bash
cd tauri
npx tauri build
```

## 项目结构

```
├── tauri/
│   ├── index.html          # 入口 HTML
│   ├── app.js              # 应用逻辑
│   ├── style.css           # 样式
│   ├── vite.config.js      # Vite 配置
│   └── src-tauri/          # Rust 后端
│       ├── src/
│       │   ├── main.rs     # 入口
│       │   └── lib.rs      # Tauri 构建器
│       ├── Cargo.toml
│       └── tauri.conf.json # Tauri 配置
```
