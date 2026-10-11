/**
 * Surge 本机网络状态：仅使用本机 $network 与只读 HTTP API，无外部请求。
 * 显示接口、Wi-Fi、IPv4/IPv6、网关、DNS、出站模式及 macOS 代理开关。
 * 字段不可读时显示“未提供/未知”，不把缺失值误报成关闭。
 * IPv6 地址只说明接口配置，不代表公网 IPv6 连通性。
 * [Script] network-status = type=generic,timeout=5,script-path=本脚本URL
 * [Panel] 本机网络状态 = script-name=network-status,update-interval=30
 */
(function () {
  'use strict';
  const network = typeof $network === 'object' && $network ? $network : {};
  const environment = typeof $environment === 'object' && $environment ? $environment : {};
  const mac = /mac/i.test(environment.system || '');
  const paths = ['/v1/outbound'].concat(mac ? ['/v1/features/system_proxy', '/v1/features/enhanced_mode'] : []);
  const state = {}; let pending = paths.length, finished = false;
  function clean(v) { return v === undefined || v === null || v === '' ? '未提供' : String(v).replace(/[\r\n\t]+/g, ' ').slice(0, 180); }
  function flag(path) { const r = state[path]; return r && typeof r.enabled === 'boolean' ? (r.enabled ? '开启' : '关闭') : '未知'; }
  function done() {
    if (finished) return;
    finished = true;
    const v4 = network.v4 || {}, v6 = network.v6 || {}, wifi = network.wifi || {};
    const mode = state['/v1/outbound'] && state['/v1/outbound'].mode;
    const modeName = { rule: '规则模式', proxy: '全局代理', direct: '全局直连' }[mode] || '未知';
    const lines = [
      '接口：' + clean(v4.primaryInterface || v6.primaryInterface) + ' · Wi-Fi：' + clean(wifi.ssid),
      'IPv4：' + clean(v4.primaryAddress) + ' · 网关：' + clean(v4.primaryRouter),
      'IPv6：' + clean(v6.primaryAddress),
      'DNS：' + clean(Array.isArray(network.dns) ? network.dns.join(' / ') : network.dns),
      '出站：' + modeName
    ];
    if (mac) lines.push('系统代理：' + flag('/v1/features/system_proxy') + ' · 增强模式：' + flag('/v1/features/enhanced_mode'));
    lines.push('更新：' + new Date().toLocaleTimeString('zh-CN', { hour12: false }));
    $done({ title: '本机网络状态', content: lines.join('\n'), icon: 'network', 'icon-color': '#007AFF' });
  }
  setTimeout(done, 3500);
  paths.forEach(function (path) {
    try { $httpAPI('GET', path, {}, function (r) { state[path] = r; if (--pending === 0) done(); }); }
    catch (_) { if (--pending === 0) done(); }
  });
}());
