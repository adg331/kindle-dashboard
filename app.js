(function () {
  if (/(^|[?&])rotate=180(&|$)/.test(window.location.search)) {
    document.documentElement.className += ' rotate-180';
  }
  function text(id, value) { document.getElementById(id).innerHTML = value; }
  function percent(value) {
    value = Number(value);
    if (isNaN(value)) { return 0; }
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  function pad(value) { return value < 10 ? '0' + value : String(value); }
  function updateClock() {
    var now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    var days = ['日', '一', '二', '三', '四', '五', '六'];
    text('clock-time', pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()));
    text('clock-date', (now.getUTCMonth() + 1) + '月' + now.getUTCDate() + '日 周' + days[now.getUTCDay()]);
  }
  function countdown(timestamp, fallback) {
    if (!timestamp) { return '重置：' + (fallback || '--'); }
    var seconds = Math.max(0, Number(timestamp) - Math.floor(new Date().getTime() / 1000));
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) { return days + '天' + hours + '小时后重置'; }
    if (hours > 0) { return hours + '小时' + minutes + '分后重置'; }
    return minutes + '分钟后重置';
  }
  function render(data) {
    var five = 100 - percent(data.five_hour && data.five_hour.used_percent);
    var week = 100 - percent(data.weekly && data.weekly.used_percent);
    text('plan', data.plan || 'Codex');
    text('five-percent', five + '%');
    text('week-percent', week + '%');
    text('five-reset', countdown(data.five_hour && data.five_hour.resets_at_epoch, data.five_hour && data.five_hour.resets_at));
    text('week-reset', countdown(data.weekly && data.weekly.resets_at_epoch, data.weekly && data.weekly.resets_at));
    text('updated', data.updated_at || '--');
    document.getElementById('five-bar').style.width = five + '%';
    document.getElementById('week-bar').style.width = week + '%';
    if (five <= 20) { document.getElementsByTagName('section')[0].className += ' low'; }
    if (week <= 20) { document.getElementsByTagName('section')[1].className += ' low'; }
    var age = data.updated_at_epoch ? Math.floor(new Date().getTime() / 1000) - data.updated_at_epoch : 999999;
    text('health', age <= 3600 ? '数据正常' : '数据已过期');
    if (age > 3600) {
      document.getElementsByTagName('footer')[0].className += ' stale';
      text('health-mark', '▲');
    }
  }
  updateClock();
  window.setInterval(updateClock, 60000);
  var request = new XMLHttpRequest();
  request.open('GET', 'data/quota.json?t=' + new Date().getTime(), true);
  request.onreadystatechange = function () {
    if (request.readyState !== 4) { return; }
    if (request.status >= 200 && request.status < 300) {
      try { render(JSON.parse(request.responseText)); }
      catch (e) { text('error', '数据格式错误'); }
    } else { text('error', '暂时无法读取配额'); }
  };
  request.send(null);
}());
