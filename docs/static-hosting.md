# 零部署使用方式

## 本地文件

直接双击项目根目录的 `Stewie-个人学习站-离线版.html`。课程、讲解、题目、提示和答案都内嵌在文件中，不需要安装运行时或启动服务器。

## GitHub Pages

运行 `npm run build:pages`，它会先生成最新离线课程，再在 `dist-pages/index.html` 产出可直接发布的入口文件。

把仓库推送到 GitHub 后，在 Settings → Pages → Build and deployment 中选择 **GitHub Actions**；之后每次推送 `main` 都会自动构建并发布，不需要手工复制或改名。首次发布完成后，GitHub 会在 Pages 设置页显示访问链接。

工作流会固定使用 Node 22、锁定依赖和 `npm run build:pages`，最终只上传 `dist-pages/index.html`。如果不想启用自动发布，也可以在本地运行同一命令，再把 `dist-pages/` 作为静态主机目录。

静态版只提供离线学习内容和本地草稿/进度。它不会加载模型配置、API Key、聊天服务或 RAG runtime；需要安全保存 Key、真实 Python 执行、模型对话和 RAG 检索时，请使用桌面版。
