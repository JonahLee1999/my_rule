/**
 * Surge AI 解锁检测面板（iOS / macOS）。
 * 每项检测显式走对应策略组，不修改策略选择、不依赖域名分流规则。
 * argument: 逗号分隔的服务，默认 claude,openai,gemini,siri
 *   claude → ClaudeAI   openai → OpenAI   gemini → Gemini   siri → Siri AI（仅显示出口）
 * 判定依据：
 *   Claude：claude.ai 是否跳转到 app-unavailable-in-region
 *   ChatGPT：api.openai.com 合规接口是否返回 unsupported_country；ios.chat.openai.com 是否提示 VPN
 *   Gemini：gemini.google.com 页面里的地区开关 45631641 是否为 true
 *   出口国家：Cloudflare /cdn-cgi/trace 的 loc
 * 结果只说明当前出口能否进入服务，不代表账号状态。不含节点、订阅或密钥。
 *
 * [Script]
 * ai-unlock = type=generic,timeout=20,script-path=https://raw.githubusercontent.com/JonahLee1999/my_rule/main/surge/panels/ai-unlock.js,script-update-interval=86400
 * [Panel]
 * AI 解锁检测 = title=AI 解锁检测,content=打开面板后检测,script-name=ai-unlock,update-interval=1800
 */

(function () {
  'use strict';
  const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const SERVICES = {
    claude: { name: 'Claude', policy: 'ClaudeAI', trace: 'https://claude.ai/cdn-cgi/trace', check: checkClaude },
    openai: { name: 'ChatGPT', policy: 'OpenAI', trace: 'https://chatgpt.com/cdn-cgi/trace', check: checkOpenAI },
    gemini: { name: 'Gemini', policy: 'Gemini', trace: 'https://www.cloudflare.com/cdn-cgi/trace', check: checkGemini },
    siri: { name: 'Siri AI', policy: 'Siri AI', trace: 'https://www.cloudflare.com/cdn-cgi/trace', check: null }
  };
  const arg = typeof $argument === 'string' && $argument.trim() ? $argument : 'claude,openai,gemini,siri';
  const keys = arg.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(function (k) { return SERVICES[k]; });
  let finished = false;

  function finish(panel) { if (!finished) { finished = true; $done(panel); } }
  function stamp() { return new Date().toLocaleTimeString('zh-CN', { hour12: false }); }
  function flag(cc) {
    if (!/^[A-Z]{2}$/.test(cc || '')) return '';
    return String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65) + ' ';
  }
  function get(policy, url, cb) {
    $httpClient.get({
      url: url, policy: policy, timeout: 8,
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      'auto-redirect': false, 'auto-cookie': false
    }, function (err, resp, body) {
      if (err) return cb(String(err).slice(0, 60));
      cb(null, resp || {}, typeof body === 'string' ? body : '');
    });
  }
  function header(resp, name) {
    const h = resp.headers || {};
    for (const k in h) if (k.toLowerCase() === name) return String(h[k]);
    return '';
  }

  function checkClaude(policy, cb) {
    get(policy, 'https://claude.ai/', function (err, resp) {
      if (err) return cb('fail', err);
      const loc = header(resp, 'location');
      if (/app-unavailable-in-region/i.test(loc)) return cb('no', '地区不支持');
      const s = Number(resp.status);
      if (s === 200 || (s >= 300 && s < 400)) return cb('ok', '');
      if (s === 403) return cb('warn', 'HTTP 403，可能被 Cloudflare 拦截');
      cb('warn', 'HTTP ' + s);
    });
  }
  function checkOpenAI(policy, cb) {
    get(policy, 'https://api.openai.com/compliance/cookie_requirements', function (err, resp, body) {
      if (err) return cb('fail', err);
      if (/unsupported_country/i.test(body)) return cb('no', '地区不支持');
      get(policy, 'https://ios.chat.openai.com/', function (err2, resp2, body2) {
        if (err2) return cb('warn', 'App 检测失败：' + err2);
        if (/VPN/.test(body2)) return cb('warn', '网页可用，App 提示 VPN');
        cb('ok', '');
      });
    });
  }
  function checkGemini(policy, cb) {
    get(policy, 'https://gemini.google.com/', function (err, resp, body) {
      if (err) return cb('fail', err);
      // 可用标记：旧版 45631641,null,true；新版 45631641\":true
      if (/45631641(?:,null,|\\*"?:)true/.test(body)) return cb('ok', '');
      if (/45631641(?:,null,|\\*"?:)false/.test(body)) return cb('no', '地区不支持');
      const s = Number(resp.status);
      if (s >= 300 && s < 400) return cb('warn', '被重定向（HTTP ' + s + '）');
      cb('no', '未发现可用标记');
    });
  }

  function trace(svc, cb) {
    get(svc.policy, svc.trace, function (err, resp, body) {
      if (err) return cb('');
      const m = /^loc=([A-Z]{2})$/m.exec(body);
      cb(m ? m[1] : '');
    });
  }

  if (!keys.length) return finish({ title: 'AI 解锁检测', content: 'argument 无效，可用：claude,openai,gemini,siri', style: 'error' });

  const results = {};
  let pending = keys.length;
  keys.forEach(function (k) {
    const svc = SERVICES[k];
    const r = results[k] = { cc: '', state: svc.check ? '' : 'info', note: '' };
    let parts = svc.check ? 2 : 1;
    const done = function () { if (--parts === 0 && --pending === 0) render(); };
    trace(svc, function (cc) { r.cc = cc; done(); });
    if (svc.check) svc.check(svc.policy, function (state, note) { r.state = state; r.note = note; done(); });
  });

  function render() {
    const mark = { ok: '✅', no: '❌', warn: '⚠️', fail: '⛔️', info: '🌐' };
    let bad = 0;
    const lines = keys.map(function (k) {
      const svc = SERVICES[k], r = results[k];
      if (r.state === 'no' || r.state === 'fail') bad++;
      const where = r.cc ? flag(r.cc) + r.cc : '出口未知';
      const text = r.state === 'ok' ? '可用' : r.state === 'info' ? '仅出口' : r.note || '未知';
      return mark[r.state] + ' ' + svc.name + '：' + where + ' · ' + text;
    });
    lines.push('更新：' + stamp());
    finish({
      title: 'AI 解锁检测',
      content: lines.join('\n'),
      icon: bad ? 'exclamationmark.shield.fill' : 'checkmark.shield.fill',
      'icon-color': bad ? '#FF9500' : '#34C759'
    });
  }
  setTimeout(function () { if (!finished) render(); }, 18000);
}());
