# Claude / Claude Code 规则维护说明

核验日期：2026-10-10。`claude.list` 当前有 **64 条规则**。文件是人工核验后的合并版，GitHub 托管不会自动合并其他仓库的新内容。

本轮继续补充 8 个精确主机：Google 登录、GitHub MCP、GHCR 容器下载、Python MCP 包下载，以及 Playwright 浏览器下载。详见 [登录与插件依赖审计](claude-workflow-audit-20261010.md)。这些属于按需功能依赖，不表示所有 Claude 会话都会连接。

前轮全网查漏新增 9 条：`claude.app` 后缀、7 个 Artifacts 字体/脚本 CDN 精确主机，以及可选的 Gerrit review 主机模式。详见 [56 条版本覆盖审计](claude-audit-20261010.md) 和 [官方域名逐项比对](claude-official-coverage.csv)。

## 使用

```ini
RULE-SET,https://raw.githubusercontent.com/JonahLee1999/my_rule/main/claude.list,ClaudeAI,extended-matching,update-interval=86400
```

将 `ClaudeAI` 换成自己的策略组。希望收录的服务统一使用该组时，应放在广告拦截及 GitHub/Google 等通用规则之前。本列表包含共享支付、验证码、遥测和下载服务；其他应用访问这些相同目标也会匹配。

## 前轮新增：40 → 47

| 规则 | 用途和依据 |
| --- | --- |
| `DOMAIN,api.github.com` | GitHub API。Claude Code 官方开发容器防火墙使用该主机；Claude Code 2.1.289 程序中也包含对应地址。 |
| `DOMAIN,codeload.github.com` | GitHub 源码归档下载。Claude Code sandbox 社区项目与 GitHub 官方网络说明均收录；CLI 中也有动态构造的 `codeload` 子域名。 |
| `DOMAIN,objects.githubusercontent.com` | GitHub 对象下载。Claude Code sandbox 项目收录，CLI 自身的网络主机列表也包含它。 |
| `DOMAIN,release-assets.githubusercontent.com` | GitHub Release 附件下载。GitHub 官方明确列出的发布附件主机，补充安装插件或开发依赖时的下载跳转链路。 |
| `DOMAIN-SUFFIX,statsig.com` | Statsig 兼容端点。官方开发容器防火墙及多个社区列表收录；现有 `statsigapi.net` 和 `anthropic.com` 无法覆盖它。 |
| `DOMAIN,cdn.segment.com` | Segment 网页分析 SDK/CDN。ma-wenqian 的列表及 www011215 的社区抓包记录提供使用线索，Twilio 官方文档核对精确主机。 |
| `DOMAIN,api.segment.io` | Segment 网页分析 API。将社区列表中的整个 `segment.io` 后缀收窄为 Twilio 官方列出的精确 API 主机。属于网页版兼容补充，不宣称 Claude Code CLI 必需。 |

原有 `DOMAIN,github.com` 只匹配裸域名，不包含 `api.github.com`、`codeload.github.com`。API、归档和 Release 下载可能跨域跳转，补齐这些端点能使相关下载链路使用同一策略。

这些端点不是每次 Claude 会话都会用到。程序中的静态字符串是辅助证据，不等于已观察到真实连接；GitHub 下载项服务于插件和开发工作流，Segment 项是社区提出的网页兼容补充。当前官方网络说明中的 `api.anthropic.com`、`platform.claude.com`、`downloads.claude.ai`、`bridge.claudeusercontent.com` 等已被原有后缀规则覆盖，无需重复添加。

## 新检查的社区项目

| 项目和核对文件 | 处理结果 |
| --- | --- |
| [AS9929/surge-rules](https://github.com/AS9929/surge-rules/blob/main/claude.list) | 核心域名已覆盖；进程规则未混入通用域名列表。 |
| [ma-wenqian/ai-proxy-rules](https://github.com/ma-wenqian/ai-proxy-rules/blob/main/rules/claude.list) | 参考 Segment 部分，采用两个精确主机。 |
| [kk66615/proxy-rules](https://github.com/kk66615/proxy-rules/blob/main/rules/anthropic.list) | 核心域名已覆盖；未照搬 NTP、整个 Datadog/Sentry/Sift 服务和缺少使用依据的功能开关域名。 |
| [xieyuanqing/claude-anthropic-ruleset](https://github.com/xieyuanqing/claude-anthropic-ruleset/blob/main/source/claude-full.yaml) | 核心已覆盖；未增加宽泛关键词和 NTP 类别。 |
| [waltli/claude-clash-ruleset](https://github.com/waltli/claude-clash-ruleset/blob/master/rules/anthropic.yaml) | 域名已覆盖；继续保留官方入站 IP 范围。 |
| [turinglambdaai/proxy-rules](https://github.com/turinglambdaai/proxy-rules/blob/master/surge/claude.list) | `anthropiccdn.com`、`anthropic-cdn.com` 缺少足够的一手归属/使用依据，本轮不加入。 |
| [cnsiming/ProxyRules](https://github.com/cnsiming/ProxyRules/blob/main/Claude.list) | Statsig 已补充；未因品牌相似而直接纳入其他未核实域名。 |
| [luzihang123/proxy-rules-kit](https://github.com/luzihang123/proxy-rules-kit/blob/main/rules/ai.list) | Claude 部分已覆盖；其他 AI 服务继续保持各自分流。 |
| [www011215/Surge_rule_list](https://github.com/www011215/Surge_rule_list/blob/main/Surge_AI.list) | 参考 Segment CDN 和 Statsig 线索；不照搬混合 AI 列表。未纳入作者明确标为未确认归属的 `claudecontent.com`。 |
| [imetn/SurgeToolkit](https://github.com/imetn/SurgeToolkit/blob/main/Rules/claude.list) | 明确域名、遥测和入站 IP 已覆盖。 |
| [patrickschmelter/claude-code-sandbox](https://github.com/patrickschmelter/claude-code-sandbox/blob/main/allowed-domains.txt) | 参考 GitHub 下载主机；未将其整个 Python/Java/Rust/Docker 开发环境白名单当作 Claude 运行时依赖。 |

前一轮合并的 Sor85、windery、xyecc、erwanjun、xiaolai、v2fly、blackmatrix7 来源保留在规则文件头部。

## 一手资料与范围

- [Claude Code 官方网络要求](https://code.claude.com/docs/en/network-config#network-access-requirements)：核对运行时主机及可选遥测。
- [Claude Code 官方开发容器防火墙](https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh)：核对 GitHub API 和 Statsig；该脚本包含开发容器依赖，并非每个端点都是 Claude CLI 的必需依赖。
- [GitHub 官方网络主机说明](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/runners/self-hosted-runners)：确认归档、对象和 Release 附件服务。这里仅用来确认 GitHub 主机用途，不将 Actions 专用端点全部加入。
- [Twilio Segment 官方代理说明](https://www.twilio.com/docs/segment/connections/sources/catalog/libraries/website/javascript/custom-proxy)：核对 `cdn.segment.com`、`api.segment.io`。它证明主机用途，不单独证明每个 Claude 版本都使用 Segment。
- [Anthropic 官方 IP 地址](https://platform.claude.com/docs/en/api/ip-addresses)：继续使用入站 `160.79.104.0/23` 和 `2607:6bc0::/48`。`160.79.104.0/21` 为 Anthropic 对外请求的源地址范围。

本轮未加入 `session-replay-datadoghq.com`：[Datadog 官方说明](https://docs.datadoghq.com/session_replay/troubleshooting/)其用于回放查看，而现有证据不足以把它认定为 Claude Code 的运行依赖。未改变进程规则、QUIC、系统时区或 NTP 路由。

## 前轮 47 条版本核验

- 原有 40 条全部保留；新增 7 条；共 47 条，无重复行，新增项没有被已有域名后缀覆盖。
- 全部规则展开到临时 Surge 配置，通过官方 `surge-cli --check` 解析。
- 发布后核对 GitHub Raw 返回的文件与提交内容一致，并刷新 Surge 外部资源、检查新增主机的路由匹配。

规则匹配验证不等于所有插件安装、登录或支付的端到端验证。若后续遇到具体请求未命中，可依据 Surge 请求记录补精确端点，并将依据记录到本文件。
