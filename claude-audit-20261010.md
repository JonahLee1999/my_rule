# Claude 分流覆盖审计：47 → 56

核验日期：2026-10-10。本轮重新搜索并读取 13 个社区规则项目，对照 Claude Code、Desktop 和 Artifacts 官方网络说明。保留原有 47 条，新增 9 条，共 **56 条**。

## 发现并补齐的项目

| 新增规则 | 用途 | 修改前的覆盖情况 |
| --- | --- | --- |
| `DOMAIN-SUFFIX,claude.app` | Desktop 的应用/预览域名，包括动态 `*.livepreview.claude.app` | 远程规则未列出；带 `claude` 关键词兜底的本机配置已经匹配。现在独立订阅本文件也能覆盖。 |
| `DOMAIN,fonts.googleapis.com` | Artifacts 字体样式 | 未归入 ClaudeAI，原匹配 Google。 |
| `DOMAIN,fonts.gstatic.com` | Artifacts 字体文件 | 未归入 ClaudeAI，原匹配 Google。 |
| `DOMAIN,cdnjs.cloudflare.com` | Artifacts 脚本 CDN | 未归入 ClaudeAI，原匹配 Final。 |
| `DOMAIN,cdn.jsdelivr.net` | Artifacts 脚本 CDN | 未归入 ClaudeAI，原匹配 Proxy。 |
| `DOMAIN,cdn.tailwindcss.com` | Artifacts 脚本 CDN | 未归入 ClaudeAI，原匹配 Final。 |
| `DOMAIN,code.jquery.com` | Artifacts 脚本 CDN | 未归入 ClaudeAI，原匹配 Final。 |
| `DOMAIN,unpkg.com` | Artifacts 脚本 CDN | 未归入 ClaudeAI，原匹配 Final。 |
| `DOMAIN-WILDCARD,*-review.googlesource.com` | Desktop Code 在 googlesource.com 仓库查询 Gerrit 变更时使用 | 未归入 ClaudeAI；以 `chromium-review.googlesource.com` 检查，原匹配 Google。 |

上述 7 个共享字体/CDN 主机采用精确域名，不扩展到整个 Google、Cloudflare 或 jsDelivr。Gerrit 规则仅匹配官方指定的 review 命名模式，不接管整个 googlesource.com。

这份完整版包含共享服务，因此其他应用访问同一目标也会匹配。**修改前未归入 ClaudeAI，不等于无法访问**：它们原先可能通过其他策略正常联网。字体属于可选美化；脚本只在页面引用相应库时需要；Gerrit 只在对应仓库工作流使用。

## 官方依据与覆盖

- [Claude Code 网络要求](https://code.claude.com/docs/en/network-config#network-access-requirements)：检查 CLI 表格中去重后的 17 个主机/模式；原 47 条仅缺 Gerrit review 模式，新增后覆盖全部。
- [Desktop 网络要求](https://code.claude.com/docs/en/desktop#network-access-requirements)：检查两份域名清单去重后的 21 个主机/模式；本轮用一条 `claude.app` 后缀补齐三个缺项。
- [Artifacts 查看器网络要求](https://code.claude.com/docs/en/artifacts#allowlist-the-viewer-domain)：核对上述 2 个字体主机和 5 个脚本 CDN。
- [Surge 域名规则语义](https://manual.nssurge.com/rules/domain.html)：Gerrit 使用 `DOMAIN-WILDCARD`，其余共享主机使用 `DOMAIN`。

这三组共 45 项检查、40 个唯一主机/模式；**56 条版本全部覆盖**。逐项对应规则见 [claude-official-coverage.csv](claude-official-coverage.csv)。API、OAuth、下载更新、Chrome bridge、MCP proxy、动态 Artifacts/MCP 内容域名仍由已有后缀覆盖，无需逐个子域名重复添加。

这里的覆盖只针对上述官方清单；不是所有第三方插件、MCP 服务器、企业 SSO 或自定义模型网关的无限域名集合。第三方云模型端点、用户自己的服务和工具任意访问的网站，需要按实际使用场景单独判断。云端执行环境的出站白名单也不能等同于本机 Surge 的分流清单。

## 本轮读取的社区项目

| 项目 / 文件 | 结论 |
| --- | --- |
| [Sor85/claude-ruleset](https://github.com/Sor85/claude-ruleset/blob/main/surge/claude.list) | 明确核心主机已覆盖；未扩宽 IP 范围或引入泛关键词。 |
| [windery/claude-proxy-rules](https://github.com/windery/claude-proxy-rules/blob/main/rules/claude.list) | 主要主机已覆盖；保留现有精确验证码/日志端点，没有照搬其更宽的后缀范围。 |
| [erwanjun/surge-claude-rules](https://github.com/erwanjun/surge-claude-rules/blob/main/Surge/Claude.list) | 已保留其主要服务；宽泛遥测关键词继续采用现有精确端点。 |
| [xyecc/claude-lane](https://github.com/xyecc/claude-lane/blob/main/templates/3-rules.yaml) | 域名部分已覆盖；进程、UDP 和系统 NTP 设置不作为域名缺漏补入。 |
| [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community/blob/master/data/anthropic) | 9 项全部被原 47 条覆盖。 |
| [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat/blob/meta/geo/geosite/anthropic.list) | 9 项全部被原 47 条覆盖；与 v2fly 同源，不当作独立的运行证据。 |
| [SukkaW/Surge](https://ruleset.skk.moe/List/non_ip/ai.conf) | Claude 核心已覆盖；混合 AI 文件中的其他产品不纳入 ClaudeAI。 |
| [kiki0-zz/QX_rules](https://github.com/kiki0-zz/QX_rules/blob/main/Qx/master/Claude.list) | 已覆盖明确核心；`anthropic.sh`、`anthropic-static` 关键词缺少足够的一手使用依据，未照搬。 |
| [qianchongyang/openclash-ai-rules](https://github.com/qianchongyang/openclash-ai-rules/blob/main/Rules/AI.list) | Claude 核心已覆盖；未混入其他 AI 产品或扩大 IP 范围。 |
| [crayonluffy/shadowrocket-rules](https://github.com/crayonluffy/shadowrocket-rules/blob/HEAD/extras/ai-extras.list) | 品牌相似域名 `anthropic.io`、`claudeai.uk`、`anthropicusercontent.com` 缺少足够的一手运行依据，未新增。 |
| [Aioneas/Surge](https://github.com/Aioneas/Surge/blob/HEAD/List/claude.list) 及 [补丁](https://github.com/Aioneas/Surge/blob/HEAD/List/claude.patch.list) | 明确域名全部已覆盖。 |
| [cutethotw/ClashRule](https://github.com/cutethotw/ClashRule/blob/HEAD/Rule/Claude.list) | 核心已覆盖；额外 `t0` 至 `t3.gstatic.com` 缺少明确 Claude 运行依据，未新增。 |
| [HexTTX/Hex-Clash](https://github.com/HexTTX/Hex-Clash/blob/HEAD/Ai/Claude.list) | `claude.app` 已通过官方文档确认并补入；其余缺少一手使用依据的品牌相似域名、泛关键词和更宽 IP 范围未照搬。 |

社区项目提供查漏线索，本轮实际新增项均有官方网络文档依据。未因名称像 Claude 就认定域名属于 Anthropic，也未把 `sift`、`datadog`、`sentry` 关键词扩展到所有包含该字符串的域名。

## 校验与维护

- 原有 47 条全部保留，新增 9 条，无重复规则。
- 总计 25 条后缀、27 条精确域名、1 条域名通配、2 条 IP 网段和 1 条 ASN。
- 全部 56 条展开为临时配置，已通过官方 `surge-cli --check` 解析。
- 发布后检查 Raw 文件与提交内容一致，并刷新 Surge 规则资源、核验新增目标命中 ClaudeAI。分流命中不代表全部业务已完成端到端测试。

规则仍为人工审阅版本；GitHub 托管用于分发，不会自动合并上游变更。后续实际请求若出现新主机，应记录其功能与依据后再补入。
