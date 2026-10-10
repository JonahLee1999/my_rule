# GitHub 分流修正（2026-10-10）

原先为了覆盖 Claude Code / Codex 插件和安装依赖，将通用 GitHub 主机收进了全局 AI 列表。Surge 按目标匹配，不知道普通浏览器访问 GitHub 与某个 AI 插件的关系。这导致 GitHub 网站和下载也使用 ClaudeAI 选择的住宅代理；住宅出口故障时，GitHub 随之不可用。

本次从 `claude.list` 移除 9 条，从 `openai.list` 移除其中 6 条。GitHub 服务恢复使用现有 GitHub 规则及策略组，不再由这两个 AI 列表或 OpenAI 进程联合规则接管。

| 主机 | 从 Claude 移除 | 从 OpenAI 移除 |
| --- | --- | --- |
| `github.com` | 是 | 是 |
| `api.github.com` | 是 | 是 |
| `raw.githubusercontent.com` | 是 | 是 |
| `codeload.github.com` | 是 | 是 |
| `objects.githubusercontent.com` | 是 | 是 |
| `release-assets.githubusercontent.com` | 是 | 是 |
| `api.githubcopilot.com` | 是 | 原本未收录 |
| `ghcr.io` | 是 | 原本未收录 |
| `pkg-containers.githubusercontent.com` | 是 | 原本未收录 |

当前数量：Claude 57 条，OpenAI 58 条域名规则，另有 23 条 OpenAI 语音 IP。此前的 66 / 64 条审计文件保留为历史记录，以当前 `.list` 为准。

Claude 和 OpenAI 的主站、API、认证及文件服务规则保留。GitHub 与插件下载依赖确实有关，但它属于共享基础服务，不需要随模型请求使用同一住宅出口。

本机原有 [GitHub 规则集](https://github.com/blackmatrix7/ios_rule_script/blob/master/rule/Surge/GitHub/GitHub.list)已覆盖上述目标。本次不更改 GitHub 策略组的节点选择，也不改 vircs 账号或中转配置。
