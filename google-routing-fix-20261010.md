# Google 通用服务分流修正 — 2026-10-10

本机路由检查确认 Google 登录、Google Fonts、Google Pay、云存储及 Gerrit 主机被 Claude 完整版接管，选到了故障的 vircs。域名出现在某个 AI 产品的依赖清单中，不代表所有访问该域名的流量都应走 AI 分组。

本次移除以下共享规则，让它们按原有 Google 规则分流；保留各 AI 产品自身域名。

| 列表 | 移除的规则目标 | 数量变化 |
| --- | --- | --- |
| Claude | accounts.google.com、fonts.googleapis.com、fonts.gstatic.com、pay.google.com、payments.google.com、storage.googleapis.com、*-review.googlesource.com | 57 → 50 |
| OpenAI | accounts.google.com | 58 → 57 |
| Gemini | apis.google.com | 30 → 29 |

Google 通用服务从 AI 列表排除后，浏览器与 ChatGPT/Codex 进程均按 Google 分组处理这些目标。Gemini/AI Studio 的专用域名仍走 Gemini。其余共享服务保留现有配置范围。

未来合并上游列表时，不要重新全局收录 Google/GitHub 通用域名。网络放行清单和代理分流清单用途不同；若确实需要某个客户端独占出口，应另行限定进程及目标，不应扩大通用域名的全局匹配。

历史审计文档记录当时的收录依据；当前启用规则以 .list 文件为准。验证登录页面可访问不代表执行了账号登录。
