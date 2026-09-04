(function () {
  function text(id, value) { document.getElementById(id).innerHTML = value; }
  function percent(value) {
    value = Number(value);
    if (isNaN(value)) { return 0; }
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  function render(data) {
    var five = percent(data.five_hour && data.five_hour.used_percent);
    var week = percent(data.weekly && data.weekly.used_percent);
    text('plan', data.plan || 'Codex');
    text('five-percent', five + '%');
    text('week-percent', week + '%');
    text('five-reset', (data.five_hour && data.five_hour.resets_at) || '--');
    text('week-reset', (data.weekly && data.weekly.resets_at) || '--');
    text('updated', data.updated_at || '--');
    document.getElementById('five-bar').style.width = five + '%';
    document.getElementById('week-bar').style.width = week + '%';
  }
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
