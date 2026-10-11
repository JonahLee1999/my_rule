/**
 * Surge 出口 IP 面板（macOS / iOS）。
 * argument: residential | proxy | claude | openai | gemini
 * 每次查询显式指定策略，不修改策略组选择、不依赖域名分流规则。
 * 显示查询端点看到的出口；不代表 AI 服务解锁或账号可用性。
 * 主查询：ip-api.com；失败后使用 HTTPS ipify + Surge 本地 GeoIP/ASN。
 * 不含节点、订阅、密码或个人 IP；无需密钥。
 *
 * [Script]
 * landing-ip = type=generic,timeout=15,argument=residential,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/egress-ip.js,script-update-interval=86400
 * proxy-ip = type=generic,timeout=15,argument=proxy,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/egress-ip.js,script-update-interval=86400
 * claude-ip = type=generic,timeout=15,argument=claude,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/egress-ip.js,script-update-interval=86400
 * openai-ip = type=generic,timeout=15,argument=openai,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/egress-ip.js,script-update-interval=86400
 * gemini-ip = type=generic,timeout=15,argument=gemini,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/egress-ip.js,script-update-interval=86400
 *
 * [Panel]
 * 住宅落地 = script-name=landing-ip,update-interval=600
 * 默认代理 = script-name=proxy-ip,update-interval=600
 * Claude 出口 = script-name=claude-ip,update-interval=600
 * OpenAI 出口 = script-name=openai-ip,update-interval=600
 * Gemini 出口 = script-name=gemini-ip,update-interval=600
 *
 * Surge 在打开面板菜单时检查刷新间隔；数据是最近一次查询的结果。
 * 更改策略后，手动刷新面板即可重新查询。备用查询的归属地来自本地数据库，可能不同。
 */

(function () {
  'use strict';
  const presets = {
    residential: { policy: '🏠 Residential', title: '住宅落地', icon: 'house.fill', color: '#5AC8FA' },
    proxy: { policy: 'Proxy', title: '默认代理', icon: 'network', color: '#007AFF' },
    claude: { policy: 'ClaudeAI', title: 'Claude 出口', icon: 'sparkles', color: '#D97757' },
    openai: { policy: 'OpenAI', title: 'OpenAI 出口', icon: 'bubble.left.and.bubble.right.fill', color: '#10A37F' },
    gemini: { policy: 'Gemini', title: 'Gemini 出口', icon: 'star.fill', color: '#8866EE' }
  };
  const key = typeof $argument === 'string' ? $argument.trim() : 'residential';
  const config = Object.prototype.hasOwnProperty.call(presets, key) ? presets[key] : null;
  let finished = false;
  function finish(panel) {
    if (finished) return;
    finished = true;
    $done(panel);
  }
  if (!config) {
    finish({ title: '出口面板配置错误', content: 'argument 应为 residential、proxy、claude、openai 或 gemini', style: 'error' });
    return;
  }

  function clean(value, limit) {
    return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, limit || 100);
  }
  function stamp() {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false });
  }
  function selection() {
    try {
      const choice = $surge.selectGroupDetails().decisions[config.policy];
      return config.policy + (choice ? ' → ' + clean(choice) : '');
    } catch (_) { return config.policy; }
  }
  function fail(reason) {
    finish({
      title: config.title + ' · 查询失败',
      content: '策略：' + selection() + '\n' + clean(reason, 180) + '\n检查于 ' + stamp(),
      icon: 'exclamationmark.triangle.fill',
      'icon-color': '#FF3B30'
    });
  }
  function show(ip, location, isp, asn, source) {
    finish({
      title: config.title + ' ' + clean(ip, 64),
      content: [
        '策略：' + selection(),
        '位置：' + clean(location || '未知'),
        'ISP：' + clean(isp || '未知', 70),
        'ASN：' + clean(asn || '未知', 70),
        '更新：' + stamp() + ' · ' + source
      ].join('\n'),
      icon: config.icon,
      'icon-color': config.color
    });
  }
  function request(url, callback) {
    $httpClient.get({
      url: url, policy: config.policy, timeout: 6,
      headers: { 'Cache-Control': 'no-cache' },
      'auto-redirect': false, 'auto-cookie': false
    }, function (error, response, data) {
      if (error) return callback(clean(error, 100));
      if (!response || Number(response.status) !== 200) {
        return callback('HTTP ' + (response ? response.status : '无响应'));
      }
      let json;
      try { json = JSON.parse(data); } catch (_) { return callback('返回内容不是 JSON'); }
      if (!json || typeof json !== 'object') return callback('返回数据为空');
      callback(null, json);
    });
  }
  function localGeo(method, ip) {
    try { return $utils[method](ip) || ''; } catch (_) { return ''; }
  }
  function fallback(primaryError) {
    request('https://api.ipify.org?format=json', function (error, data) {
      if (error || !data || typeof data.ip !== 'string' || !/^[0-9a-fA-F:.]+$/.test(data.ip)) {
        return fail('主查询：' + primaryError + '；备用查询：' + (error || '缺少有效 IP'));
      }
      const ip = data.ip;
      const asn = localGeo('ipasn', ip);
      show(ip, localGeo('geoip', ip), localGeo('ipaso', ip), asn ? 'AS' + asn : '', '备用查询 / 本地归属地');
    });
  }
  request('http://ip-api.com/json/?lang=zh-CN&fields=status,message,country,regionName,city,isp,as,query', function (error, data) {
    if (error) return fallback(error);
    if (data.status !== 'success' || typeof data.query !== 'string' || !/^[0-9a-fA-F:.]+$/.test(data.query)) {
      return fallback(clean(data.message || '缺少有效 IP'));
    }
    show(data.query, [data.country, data.regionName, data.city].filter(Boolean).join(' '), data.isp, data.as, 'ip-api');
  });
}());
