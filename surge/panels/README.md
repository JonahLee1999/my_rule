# Surge 面板

当前使用三个面板：Claude 出口、机场余额与到期、本机网络状态。

- `egress-ip.js`：通过 `argument=claude` 指定 ClaudeAI 查询出口。显示 IP、地区、ISP、ASN 和查询时间；不代表账号或服务解锁检测。脚本的其他预设仍可按需使用。
- `subscription-status.js`：按 Nexitally、Tagss、Crossgo、Miaona、Bywave 顺序展示订阅信息。从 Surge 本机 API 读取当前 `[Proxy Group]` 的 `policy-path`，使用 `Proxy` 策略访问现有订阅。标准数据来自 `subscription-userinfo`；兼容 Miaona 的内嵌 SubscribeInfo 面板。
- `network-status.js`：显示本机接口、Wi-Fi、IPv4/IPv6、网关、DNS、出站模式，以及 macOS 系统代理和增强模式；不发出外部网络请求。IPv6 地址存在不代表已测试公网连通性。

## 缓存与异常

订阅成功数据在 Surge 本机缓存一小时，点击刷新可重查。下载失败时显示历史缓存、采集时间和失败原因；没有成功数据时明确显示暂无数据。Nexitally 的限时订阅下载窗口关闭后，仍可查看最后成功数据；需要更新时先在官网开启下载。

订阅没有提供的数据不会当成 0。总流量为 0 不自动解释为不限量；缺少到期字段不解释为永不过期。Miaona 的内嵌用量如相互矛盾，显示“剩余无法确认”，不把推算当作官方余额。标准字节计数显示 KiB/MiB/GiB；内嵌文字保留供应商原始单位。

脚本不含订阅链接、账号密码、实际 IP、SSID 或个人用量快照。这些数据仅在 Surge 本机处理。配置本身包含私人凭据，请勿将完整配置上传到公共仓库。

## 配置示例

将以下条目合并到已有对应段落中，确保五个 provider 名称和 Proxy / ClaudeAI 策略存在。

```ini
[Script]
# GitHub 托管的面板脚本；每日检查脚本更新。
claude-ip = type=generic,timeout=15,argument=claude,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/egress-ip.js,script-update-interval=86400
subscription-status = type=generic,timeout=18,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/subscription-status.js,script-update-interval=86400
network-status = type=generic,timeout=5,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/network-status.js,script-update-interval=86400

[Panel]
Claude 出口 = title="Claude 出口",content="打开面板后查询出口",script-name=claude-ip,update-interval=600
机场余额与到期 = title="机场余额与到期",content="打开面板后读取各订阅状态",script-name=subscription-status,update-interval=3600
本机网络状态 = title="本机网络状态",content="打开面板后读取网络状态",script-name=network-status,update-interval=30
```

Surge 打开面板视图时检查刷新间隔；这不是持续后台监控。脚本更新间隔为一天。网络状态缺失字段显示“未提供”或“未知”，不会误报为关闭。脚本已在 Surge Mac 6.9.1 原生环境验证；手机端需单独安装与验证。

接口说明：[Surge JavaScript API](https://manual.nssurge.com/scripting/api.html)、[HTTP API](https://manual.nssurge.com/tools/http-api.html)、[Panel](https://manual.nssurge.com/tools/panel.html)。
