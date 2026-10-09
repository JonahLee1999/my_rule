# Claude 登录与插件依赖补充：56 → 64

核验日期：2026-10-10。在原有 56 条基础上增加 **8 条精确域名规则**，总计 **64 条**。本轮补充的是有来源依据的登录和插件安装链路，并非又发现了 8 个 Claude API 主机。

## 新增项及一手依据

| 主机 | 功能与依据 |
| --- | --- |
| `accounts.google.com` | Claude 支持 [Continue with Google](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account)，Google 的[官方 OAuth 文档](https://developers.google.com/identity/protocols/oauth2/web-server)将此主机作为浏览器授权入口。它是对两份官方资料的交叉推导，不是本轮抓到的真实登录请求。 |
| `api.githubcopilot.com` | Anthropic 的[官方 GitHub 插件配置](https://github.com/anthropics/claude-plugins-official/blob/main/external_plugins/github/.mcp.json)直接指定 `https://api.githubcopilot.com/mcp/`；不是根据 Copilot 名称猜测。 |
| `ghcr.io` | Anthropic 的[官方 devcontainer feature](https://github.com/anthropics/devcontainer-features/blob/main/src/claude-code/README.md)在此分发；[GitHub 官方 MCP server](https://github.com/github/github-mcp-server)也提供容器运行方式。 |
| `pkg-containers.githubusercontent.com` | [GitHub 官方网络主机说明](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/runners/self-hosted-runners#accessible-domains-by-function)列出的容器/包下载主机，补齐 GHCR 的文件下载链路。 |
| `pypi.org` | Claude Code 支持以 uvx 启动[本地 MCP 进程](https://code.claude.com/docs/en/mcp#from-an-npx-uvx-or-binary-command)；MCP 的 [Fetch 参考实现](https://github.com/modelcontextprotocol/servers/blob/main/src/fetch/README.md)给出 uvx/pip 安装方法。[uv 官方说明](https://docs.astral.sh/uv/concepts/indexes/)确认默认使用 PyPI。 |
| `files.pythonhosted.org` | PyPI 包文件主机，由 [PyPI 官方索引 API](https://docs.pypi.org/api/index-api/)核实；本轮读取的 `mcp-server-fetch` PyPI 元数据也将其 wheel/sdist 指向该主机。 |
| `cdn.playwright.dev` | Anthropic 的[官方 Playwright 插件](https://github.com/anthropics/claude-plugins-official/blob/main/external_plugins/playwright/.mcp.json)运行 `@playwright/mcp`；[Microsoft 官方下载器源码](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/registry/index.ts)将此主机列入浏览器下载镜像。 |
| `playwright.download.prss.microsoft.com` | 同一官方 Playwright 下载器镜像列表中的另一主机。需下载受支持的浏览器时使用；已经安装所需浏览器时未必访问。 |

## 范围与影响

- 全部使用 `DOMAIN` 精确匹配；不把整个 Google、Microsoft、GitHub Copilot 或 Python 文档域名纳入。
- 规则是按目标主机分流。其他应用的 Google 登录、GHCR 拉取、pip 安装和 Playwright 下载访问同一主机时，也会走引用此列表的策略组。Google 登录补充仅覆盖授权入口，不宣称囊括 Google 登录的全部跨站资源。
- 这些主机用于相应功能：选择邮件登录时不需要 Google 授权；未使用 GitHub MCP、容器、Python MCP 或 Playwright 下载的会话不依赖它们。
- 本轮没有安装插件、拉取容器、运行下载脚本或修改 Claude 的身份认证设置。也没有把登录失败、插件认证错误都归因于分流。
- 未把云端 sandbox 的全量出站域名名单复制到本机规则。各自模型供应商、企业 SSO、自定义网关和 MCP 目标仍按实际使用判定。

## 修改前的路由检查

8 个主机均未命中原 Claude 规则：GitHub MCP/GHCR 链路走 Github 组，PyPI 和 Playwright CDN 走 Final，Microsoft 的 Playwright 下载端点走 Microsoft 组，Google 授权走 Google 组。这个结果只说明策略归属不同，不表示原路径一定无法访问。

## 校验

保留原 56 条，新增 8 条，无重复；原有官方主机覆盖表继续成立。规则总计 25 条后缀、35 条精确域名、1 条通配、2 条 IP 网段、1 条 ASN。完整列表展开为临时配置后通过 `surge-cli --check`。

发布时核对 GitHub Raw 内容，刷新 Surge 外部规则资源，并检查新增主机的路由匹配。路由命中不是登录、MCP 调用、pip 安装或浏览器下载的端到端功能测试。

当前清单仍由人工核验维护，不自动合并上游仓库。
