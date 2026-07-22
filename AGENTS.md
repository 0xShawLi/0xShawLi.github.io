# AGENTS.md

## 项目概览

纯静态个人主页，部署于 GitHub Pages。核心创意：伪终端交互 + 传统简介页（逃生舱）双路径并存。

## 技术栈

- 原生 HTML + CSS + JavaScript（零构建步骤）
- Google Fonts: JetBrains Mono (终端) + Inter (简介页) + Noto Sans SC (中文回退)
- 静态文件服务: Python http.server (开发预览) / GitHub Pages (生产)

## 目录结构

```
.
├── index.html              # 主页面（终端视图 + 简介页视图）
├── config/                 # 数据配置（每个模块独立 JSON，用户编辑这些文件）
│   ├── basic.json          # 基本信息、社交链接、关于我、简历路径
│   ├── skills.json         # 技能分组
│   ├── projects.json       # 项目列表
│   ├── experience.json     # 工作经历
│   └── education.json      # 教育背景
├── styles/
│   ├── main.css            # 全局样式、CSS 变量、重置
│   ├── terminal.css        # 终端视图样式
│   └── profile.css         # 简介页视图样式
├── js/
│   ├── data.js             # 数据加载器（从 config/*.json 异步加载并合并）
│   ├── typewriter.js       # 打字动画引擎（支持跳过）
│   ├── terminal.js         # 终端核心（命令解析、输出渲染、模糊匹配）
│   └── app.js              # 应用入口（视图切换、简介页渲染）
├── DESIGN.md               # 设计规范
└── AGENTS.md               # 本文件
```

## 定制指南

用户编辑 `config/` 目录下的 JSON 文件即可定制所有个人内容：
- `config/basic.json` — 基本信息（name, title, description, social, about, resumeUrl）
- `config/skills.json` — 技能分组（category + items）
- `config/projects.json` — 项目列表（name, description, tech, link）
- `config/experience.json` — 工作经历（company, title, period, bullets）
- `config/education.json` — 教育背景（school, degree, period, details）

每个模块独立文件，终端命令和简介页共用同一份数据。

## 终端命令

| 命令 | 功能 |
|------|------|
| `/help` | 列出所有命令 |
| `/whoami` | 展示基本信息（姓名、头衔、联系方式） |
| `/skills` | 展示技能栈 |
| `/education` | 展示教育背景 |
| `/projects` | 展示项目 |
| `/resume` 或 `/download` | 下载简历 PDF |
| `/ask` | 联系彩蛋 |
| `/exit` | 跳转到简介页 |
| `/clear` | 清屏 |

命令解析容错：不区分大小写，支持不带 `/` 前缀，未知命令会模糊匹配提示。

## 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 仓库 Settings → Pages → Source 选择 `main` 分支，目录选 `/ (root)`
3. 可选：放置 `resume.pdf` 到项目根目录以启用简历下载

## 开发预览

```bash
# 在项目根目录启动静态服务器
python -m http.server 5000 --bind 0.0.0.0
```

访问 `http://localhost:5000`
