# AI 规则与客户端分流更新 — 2026-10-11

依据用户提供的 [Extra_AI.list](https://raw.githubusercontent.com/nexitallyy/ProxyRules/main/Extra_AI.list) 与 [OpenAI 当前官方网络要求](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 比对。本轮不将混合列表整体指向单一 AI 策略。

## Claude 客户端

本机原来是 Claude 应用目录与 claude.list 联合匹配，现在按用户要求改为纯进程全量走 ClaudeAI。匹配 `/Applications/Claude.app/`，并兼容 Extra_AI 列出的 Claude、四种 Claude Helper、claude CLI、Claude Code 和 Claude Code Helper 名称。纯进程规则位于普通域名规则之前。

Claude 进程内的 Google/GitHub/共享服务也走 ClaudeAI；独立浏览器仍使用 Google/GitHub 原有分组。外部子进程按自己的可执行文件匹配，不推断父进程，也没有把所有 node、git、curl 进程加入 AI 分流。Surge Mac 的 [目录/进程匹配方式](https://manual.nssurge.com/rules/process.html) 支持这一区分。

## OpenAI

57 条规则保持数量，将四个已有端点从 DOMAIN 扩展为 DOMAIN-SUFFIX：

- api.statsig.com
- client-api.arkoselabs.com
- openaiapi-site.azureedge.net
- openaicom.imgix.net

这是参考源的子域名兼容扩展，不宣称发现四个新运行时主机。官方当前列出的网络主机已由现有规则覆盖。auth0.com、segment.io 继续采用已知精确端点；不引入整个 AS20473、旧固定 IP 或缺少当前 OpenAI 使用依据的第三方服务。浏览器与客户端共享目标的优先级维持现有配置。

## Gemini

补充源列表的两个接口后缀：aisandbox-pa.googleapis.com、robinfrontend-pa.googleapis.com。它们在引用源中属于 Google AI 补充项，本轮未执行账号登录或端到端 Gemini 功能测试。

同时删除完全重复行和已被同名后缀覆盖的精确规则，原有匹配范围保留；从 29 行整理为 21 条（含新增两条）。Google 登录、Fonts 和通用 apis.google.com 保持在独立 Google 分组。

Nexitally 订阅与节点凭据仅保存在本机 Surge 配置，不写入此公开仓库。
