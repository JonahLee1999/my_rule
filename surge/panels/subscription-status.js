/**
 * Surge 机场用量 / 到期总览。仅适配本仓库配套配置中的五个 provider。
 * 从 Surge 本机 API 读取当前配置的订阅地址；地址和账号信息不会上传到 GitHub。
 * 请求只发往配置已有的订阅服务；公共脚本不含订阅链接或用量快照。
 * 使用标准 subscription-userinfo；兼容 Miaona 的 SubscribeInfo 面板文字。
 * 成功数据缓存一小时，点击刷新可重查。失败时明确标注历史缓存及查询时间。
 * Nexitally 需要官网开启下载窗口；窗口关闭后保留最近一次成功结果。
 * [Script] subscription-status = type=generic,timeout=18,script-path=本脚本URL
 * [Panel] 机场余额与到期 = script-name=subscription-status,update-interval=3600
 */
(function () {
  'use strict';
  const providers = [
    { name: 'Nexitally', group: 'Nexitally' },
    { name: 'Tagss', group: '🚀 tagss' },
    { name: 'Crossgo', group: '🚀 crossgo' },
    { name: 'Miaona', group: '🚀 miaona' },
    { name: 'Bywave', group: '🚀 bywave' }
  ];
  const rows = new Array(providers.length);
  let remaining = providers.length, finished = false;
  function done() {
    if (finished) return;
    finished = true;
    $done({ title: '机场余额与到期', content: rows.map((x, i) => x || providers[i].name + '：查询超时').join('\n\n'), icon: 'chart.pie.fill', 'icon-color': '#30B0C7' });
  }
  function settle(i, text) { if (rows[i] !== undefined || finished) return; rows[i] = text; if (--remaining === 0) done(); }
  setTimeout(done, 16000);
  function date(t) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function stamp(t) { const d = new Date(t); return date(t) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function size(n) { const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++; } return n.toFixed(i ? 2 : 0) + ' ' + units[i]; }
  function clean(v) { return String(v || '').replace(/[\r\n\t]+/g, ' ').slice(0, 100); }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16); }
  function headerInfo(header) {
    const values = {};
    String(header).split(';').forEach(function (part) {
      const m = part.trim().match(/^(upload|download|total|expire)\s*=\s*(\d+(?:\.\d+)?)$/i);
      if (m) values[m[1].toLowerCase()] = Number(m[2]);
    });
    if (!['upload', 'download', 'total'].every(k => Number.isFinite(values[k]) && values[k] >= 0)) return null;
    return { kind: 'header', used: values.upload + values.download, total: values.total, expire: values.expire > 0 ? values.expire * 1000 : null };
  }
  function embeddedInfo(body) {
    const line = String(body || '').split(/\r?\n/).find(x => /^\s*SubscribeInfo\s*=/.test(x));
    if (!line) return null;
    const value = line.match(/\bcontent\s*=\s*(.*?)(?:,\s*(?:style|script-name|update-interval)\s*=|$)/i);
    if (!value) return null;
    const text = value[1].replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    function field(label) { const m = text.match(new RegExp(label + '[：:]\\s*([^\\n]+)')); return m ? clean(m[1]) : ''; }
    const up = field('上传流量'), down = field('下载流量'), left = field('剩余流量'), total = field('套餐流量'), expire = field('到期时间');
    if (!up && !down && !left && !total && !expire) return null;
    function amount(s) { const m = s.match(/^([\d.]+)\s*([KMGT]?i?B)$/i); return m ? { n: Number(m[1]), unit: m[2].toUpperCase() } : null; }
    const parts = [up, down, left, total].map(amount);
    const comparable = parts.every(Boolean) && parts.every(x => x.unit === parts[0].unit);
    const inconsistent = comparable && Math.abs(parts[0].n + parts[1].n + parts[2].n - parts[3].n) > Math.max(0.1, parts[3].n * 0.01);
    return { kind: 'embedded', up: up, down: down, left: left, total: total, expiryText: expire, inconsistent: !!inconsistent };
  }
  function render(provider, info, at, error) {
    let lines;
    if (info.kind === 'header') {
      const quota = info.total > 0 ? '剩余 ' + size(Math.max(0, info.total - info.used)) + ' / ' + size(info.total) : '总量标为 0（未判定为不限量）';
      const expiry = info.expire ? (info.expire <= Date.now() ? '已到期 ' : '到期 ') + date(info.expire) : '到期未提供';
      lines = [provider.name + ' · ' + quota, '已用 ' + size(info.used) + (info.total > 0 && info.used > info.total ? '（已超额）' : '') + ' · ' + expiry];
    } else {
      const balance = info.inconsistent ? '剩余无法确认（订阅数据矛盾）' : '剩余 ' + (info.left || '未提供');
      lines = [provider.name + ' · ' + balance, '上传 ' + (info.up || '未提供') + ' / 下载 ' + (info.down || '未提供'), '套餐 ' + (info.total || '未提供') + ' · 到期 ' + (info.expiryText || '未提供')];
    }
    lines.push((error ? '历史缓存 ' : '更新 ') + stamp(at) + (error ? ' · ' + error : ''));
    return lines.join('\n');
  }
  function readCache(key) { try { const v = JSON.parse($persistentStore.read(key) || 'null'); return v && Number.isFinite(v.at) && v.info && ['header', 'embedded'].includes(v.info.kind) ? v : null; } catch (_) { return null; } }
  function urls(profile) {
    const result = {}; let section = '';
    String(profile || '').split(/\r?\n/).forEach(function (line) {
      const s = line.trim();
      if (!s || /^[#;]/.test(s)) return;
      if (/^\[.*\]$/.test(s)) { section = s; return; }
      if (section !== '[Proxy Group]') return;
      const eq = s.indexOf('='); if (eq < 1) return;
      const name = s.slice(0, eq).trim().replace(/^"|"$/g, '');
      const m = s.slice(eq + 1).match(/(?:^|,)\s*policy-path\s*=\s*("[^"]*"|[^,]+)/i);
      if (m) result[name] = m[1].trim().replace(/^"|"$/g, '');
    });
    return result;
  }
  function fetchProvider(provider, url, i) {
    if (!/^https:\/\//i.test(url || '') || /\*{3,}/.test(url)) return settle(i, provider.name + '：未找到可用 HTTPS 订阅地址');
    const key = 'jonah-subscription-v1-' + hash(provider.group + '\n' + url);
    const cache = readCache(key);
    if (cache && Date.now() >= cache.at && Date.now() - cache.at < 3600000 && (typeof $trigger !== 'string' || $trigger !== 'button')) return settle(i, render(provider, cache.info, cache.at));
    function failure(message) { settle(i, cache ? render(provider, cache.info, cache.at, message) : provider.name + '：' + message + '\n暂无成功数据'); }
    function success(info) {
      const at = Date.now();
      $persistentStore.write(JSON.stringify({ at: at, info: info }), key);
      settle(i, render(provider, info, at));
    }
    function request(method) {
      $httpClient[method]({ url: url, policy: 'Proxy', timeout: 6, headers: { 'User-Agent': 'Surge/' + $environment['surge-version'], 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, 'auto-cookie': false }, function (error, response, body) {
        if (finished) return;
        if (error) return failure('网络请求失败');
        const status = Number(response && response.status);
        if (method === 'head' && status === 405) return request('get');
        if (status !== 200) return failure('HTTP ' + (status || '无响应') + (status === 401 ? '（订阅鉴权失败）' : ''));
        const headers = response.headers || {};
        const hk = Object.keys(headers).find(k => k.toLowerCase() === 'subscription-userinfo');
        const info = hk ? headerInfo(headers[hk]) : null;
        if (info) return success(info);
        if (method === 'head') return request('get');
        if (/订阅获取|10分钟|10 分钟|开启订阅|subscription.*disabled/i.test(body || '')) return failure('需官网开启订阅下载窗口');
        const embedded = embeddedInfo(body);
        if (embedded) return success(embedded);
        failure(hk ? '用量响应头无效' : '订阅未提供流量/到期信息');
      });
    }
    request('head');
  }
  $httpAPI('GET', '/v1/profiles/current', { sensitive: 1 }, function (result) {
    const profile = result && (result.originalProfile || result.profile);
    if (typeof profile !== 'string') return providers.forEach((p, i) => settle(i, p.name + '：无法读取当前配置'));
    const mapping = urls(profile);
    providers.forEach((p, i) => fetchProvider(p, mapping[p.group], i));
  });
}());
