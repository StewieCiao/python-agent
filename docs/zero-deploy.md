# Stewie LearnOS 零部署使用指南

## 直接打开（最安全、无需安装）

下载仓库根目录的 `Stewie-个人学习站-离线版.html`，在任意现代浏览器中双击打开即可。文件内嵌课程、练习、提示、答案和项目说明，不加载外部脚本、不联网、不执行学习者代码，也不会请求或保存 API Key。

## GitHub Pages（无需下载）

访问公开站点：<https://stewieciao.github.io/python-agent/>。

Pages 版本适合浏览课程和离线学习内容。它与离线 HTML 使用同一份作者目录生成，因此不会出现课程内容分叉；浏览器端不提供模型密钥输入和本地服务能力。

## 桌面完整版（需要安装一次）

需要真实执行 Python、运行本地 RAG 或调用 OpenAI-compatible 模型时，安装 GitHub Release 中对应平台的桌面包。桌面包自带 Python、LangChain/LangGraph 和本地服务，用户不需要另装 Node.js 或 Python。

API Key 只在桌面端提交，并写入操作系统安全存储：macOS 使用钥匙串，Windows 使用 DPAPI。Key 不写入浏览器、SQLite、导出文件、日志或聊天历史；安全存储不可用时会明确失败，不会退回明文保存。

## 选择建议

| 需求 | 入口 |
| --- | --- |
| 只看课程、写笔记、查看答案 | 离线 HTML 或 GitHub Pages |
| 在浏览器直接运行 Python 练习 | 桌面完整版的内置 Worker |
| 导入本地资料做 RAG | 桌面完整版 |
| 使用个人模型 API | 桌面完整版，并在模型设置中保存 |

离线版和 Pages 版不会伪装成支持模型调用；如果页面没有桌面桥或本地运行时，相关入口会明确显示不可用原因。
