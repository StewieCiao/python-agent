# 零部署使用方式

## 本地文件

直接双击项目根目录的 `Stewie-个人学习站-离线版.html`。课程、讲解、题目、提示和答案都内嵌在文件中，不需要安装运行时或启动服务器。

## GitHub Pages

1. 将 `Stewie-个人学习站-离线版.html` 复制到仓库的静态发布目录，并重命名为 `index.html`。
2. 在仓库设置中启用 GitHub Pages，选择该目录作为发布源。
3. 用 Pages 地址打开即可浏览同一份课程内容；课程更新后重新运行 `npm run build:offline`，再替换 `index.html`。

静态版只提供离线学习内容和本地草稿/进度。它不会加载模型配置、API Key、聊天服务或 RAG runtime；需要安全保存 Key、真实 Python 执行、模型对话和 RAG 检索时，请使用桌面版。
