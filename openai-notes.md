# OpenAI / ChatGPT / Codex 分流规则

核验日期：2026-10-10。`openai.list` 有 **57 条域名规则**；`openai-voice.list` 有 **23 条官方语音目的 IP 规则**。两者由本仓库托管，人工核验更新。不是所有条目都属于每次聊天的必需依赖。

Google 登录已从本列表移除，使用独立 Google 分组，即使来自 ChatGPT/Codex 进程也如此。详见 [Google 分流修正](google-routing-fix-20261010.md)。

## 配置和共享域名优先级

以下顺序用于同时启用本仓库 Claude 完整版的 Surge Mac 配置；把策略名换成自己的组名。`codex` 是 CLI 可执行文件名，应用目录匹配也覆盖应用内的网络辅助进程。联合规则只影响列表内的目标，不会把客户端访问的所有网站都交给 OpenAI。

```ini
# 可识别的 ChatGPT/Codex 进程：列表中的共享服务也归 OpenAI。
AND,((OR,((PROCESS-NAME,/Applications/ChatGPT.app/),(PROCESS-NAME,/Applications/Codex.app/),(PROCESS-NAME,codex))),(RULE-SET,https://raw.githubusercontent.com/JonahLee1999/my_rule/main/openai.list,extended-matching)),OpenAI
# Claude 完整版保留共享服务的默认优先级。
RULE-SET,https://raw.githubusercontent.com/JonahLee1999/my_rule/main/claude.list,ClaudeAI,extended-matching,update-interval=86400
DOMAIN-KEYWORD,claude,ClaudeAI,extended-matching
# OpenAI 主域名和独有端点：前置于广告、IDE 进程和通用服务规则。
RULE-SET,https://raw.githubusercontent.com/JonahLee1999/my_rule/main/openai.list,OpenAI,extended-matching,update-interval=86400
# 语音目的 IP：UDP 3478，以及官方说明的 TCP 443 回退端口。
AND,((OR,((DEST-PORT,3478),(DEST-PORT,443))),(RULE-SET,https://raw.githubusercontent.com/JonahLee1999/my_rule/main/openai-voice.list)),OpenAI
```

Surge 按顺序匹配。浏览器访问相同的 Stripe 或 Intercom 主机时，仅靠目标域名无法判断来自哪个网页，因此这些重叠目标仍优先归 ClaudeAI。这延续 Claude 完整版的配置选择；ChatGPT/Codex 客户端识别成功时，第一条联合规则使其走 OpenAI。CLI 启动的独立 npm、git、curl 等子进程不自动继承父进程的匹配。Surge iOS 不支持这些进程规则。

参见 [Surge 逻辑规则](https://manual.nssurge.com/rules/logical.html) 和 [进程规则](https://manual.nssurge.com/rules/process.html)。不需要开启 HTTPS 解密。规则集更新不会修改策略组当前选择。

## 覆盖内容与依据

| 内容 | 依据 |
| --- | --- |
| ChatGPT / Codex / API / OAuth / 文件 / WebSocket | [OpenAI 网络要求](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps)。官方域名表的 30 项全部覆盖，逐项记录见 [CSV](openai-official-coverage.csv)。 |
| WorkOS、设备校验、邮件、客服、Sentry 和 Datadog | 同上；采用官方列出的精确主机或明确的服务后缀。 |
| Codex 安装和更新 | [官方 Codex README](https://github.com/openai/codex/blob/main/README.md)：本表保留主下载站、npm 与 Homebrew；GitHub Releases 回退交给独立 GitHub 分组。GitHub 对象及发布附件主机由 [GitHub 官方网络说明](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/runners/self-hosted-runners)确认。 |
| 桌面端附加存储/遥测 | 安装的官方桌面应用公开程序资源包含 `oaisidekickupdates.blob.core.windows.net`、`openaiassets.z19.web.core.windows.net`、`openaiassets.blob.core.windows.net`、`o33249.ingest.us.sentry.io` 和 `openai.qualtrics.com`。静态代码出现不等于每次会连接；前者包含额外更新通道。 |
| Persona 年龄核验 | [OpenAI 官方说明](https://help.openai.com/en/articles/8411987-why-am-i-being-asked-to-verify-my-age)确认提供商；[Persona 网络域名表](https://docs.withpersona.com/security)确认 `withpersona.com` 域名范围。仅相关流程使用。 |
| Stripe / Link 支付 | [OpenAI 支付方式](https://help.openai.com/en/articles/10421635-multicurrency-billing)确认 Link；[Stripe 官方 CSP](https://docs.stripe.com/security/guide)确认 Link 结账和静态资源域名。Stripe 辅助域名保留共享支付兼容性。 |
| Google / Apple / Microsoft 登录入口 | [ChatGPT 登录说明](https://help.openai.com/en/articles/7426629-why-cant-i-log-in-to-chatgpt)及官方登录页面支持这些方式；提供商的 OAuth 文档确认入口。属于按需流程；Google 入口已交给独立 Google 分组，未实际登录或更改账号。 |
| LiveKit、WebPubSub、旧版 CDN / Arkose / Segment | 社区维护列表提供兼容性依据，见 [联合审计](ai-audit-20261010.md)。WebPubSub 使用限定 ChatGPT 名称的通配符，不覆盖整个 Azure。 |

GitHub 网站、API、Raw 和 Release 下载已从本表移除，交给独立 GitHub 分组；即使来自 ChatGPT/Codex 进程也不会被本表接管。官方列出 GitHub 下载依赖，不代表它应该全局走 AI 组。详见 [GitHub 分流修正](github-routing-fix-20261010.md)。

规则只覆盖本机需要连接的目的地址；没有把 OpenAI 爬虫、连接器、Codex Cloud 出站 IP 当作客户端目的地址，也没有纳入所有云端开发环境包管理器。

## 语音 IP 清单

来源为 [OpenAI 官方 chatgpt-voice.json](https://openai.com/chatgpt-voice.json)，本次取回 23 个 IPv4 `/32`，源文件 `creationTime` 为 `2026-03-26T20:12:45.451356+00:00`。官网说明语音使用 UDP 3478，可回退 TCP 443。此处按目的端口限定匹配；还需要节点本身支持相应协议，分流命中不等于语音通话成功。

这是有日期的人工维护快照。Surge 定期下载 GitHub 文件不会自动重建它，官方源变化后需重新核对更新。主列表未使用整个 LiveKit 后缀或云厂商 ASN 来兜底。

## 与旧 blackmatrix7 列表的差异

旧版为 35 条，新版主列表 57 条，另有 23 条语音 IP；不是简单叠加条目。补齐官方新增端点，并收窄旧表的 `auth0.com`、`sentry.io`、`segment.io` 为已知主机。未沿用 `DOMAIN-KEYWORD,openai`、整个 `IP-ASN,20473`、两个无当前官方语音依据的旧 IP、以及缺少当前使用依据的 `ai.com`、`algolia.net`、`featuregates.org`、`identrust.com`、`launchdarkly.com`、`observeit.net`。

同样没有按名称猜测加入 `crixet.com`、`chatgpt.site`、任意自定义网关或所有 `azure.com` / `blob.core.windows.net`。需要时应依据实际功能端点补充。
