# 零部署使用方式

## 本地文件

直接双击项目根目录的 `Stewie-个人学习站-离线版.html`。课程、讲解、题目、提示和答案都内嵌在文件中，不需要安装运行时或启动服务器。

## GitHub Pages

运行 `npm run build:pages`，它会先生成最新离线课程，再在 `dist-pages/index.html` 产出可直接发布的入口文件。

在仓库设置中启用 GitHub Pages，选择 `dist-pages` 作为发布目录即可。课程更新后再次运行同一命令，不需要手工复制或改名。

静态版只提供离线学习内容和本地草稿/进度。它不会加载模型配置、API Key、聊天服务或 RAG runtime；需要安全保存 Key、真实 Python 执行、模型对话和 RAG 检索时，请使用桌面版。
