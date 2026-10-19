/* ============================================================
 *  geo.js —— 「我的位置」定位
 *
 *  三级降级（用户确认的方案）：
 *    1) GPS 高精度成功    → 精确蓝点 + 精度圈
 *    2) 拒绝 / 失败 / 超时 → 允许用户手动在地图上点一下（手选兜底）
 *    3) 浏览器不支持       → 用「出发城市」的 center 兜底（城市级，会明说）
 *
 *  坐标处理：
 *    navigator.geolocation 给的是 WGS84（GPS 原始坐标），
 *    而高德 / 国内底图用 GCJ-02（火星坐标），差 300~600 米。
 *    这里一律转成 GCJ-02 再交给地图，避免「定位到了隔壁街」。
 *    地图本身展示的是我们自己的相对坐标，所以只要转换口径统一即可。
 * ============================================================ */

const GEO_KEY = 'qt_my_loc_v1';     // localStorage 缓存
const GEO_TTL = 5 * 60 * 1000;      // 5 分钟内不重复定位（省电、避免频繁弹权限）

/* 高精度优先的定位参数 */
const GEO_OPTS = {
  enableHighAccuracy: true,   // GPS 优先，别用 WiFi 粗定位
  timeout: 12000,
  maximumAge: 30000           // 30 秒内的缓存位置可直接用
};

/** 读缓存（未过期才返回） */
function readGeoCache() {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || v.lng == null || v.lat == null) return null;
    if (Date.now() - (v.ts || 0) > GEO_TTL) return null;
    return v;
  } catch (e) { return null; }
}

function writeGeoCache(v) {
  try { localStorage.setItem(GEO_KEY, JSON.stringify(v)); } catch (e) { }
}

/** 清掉缓存（用户主动重新定位时用） */
function clearGeoCache() {
  try { localStorage.removeItem(GEO_KEY); } catch (e) { }
}

/* 浏览器是否具备定位能力（非 HTTPS 的 http 域名下 geolocation 可能不存在） */
function geoSupported() {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

/**
 * 发起定位
 * @param {object} [opt] { force:true } 强制重新定位（忽略缓存）
 * @returns {Promise<{lng,lat,accuracy,ts,source,label}>}
 *   source: 'gps' 精确定位 | 'manual' 手动点选 | 'city' 城市级兜底
 */
function locate(opt) {
  opt = opt || {};

  return new Promise((resolve, reject) => {
    // 有未过期缓存直接用，不打扰用户
    if (!opt.force) {
      const c = readGeoCache();
      if (c) { resolve(c); return; }
    }

    if (!geoSupported()) {
      reject(Object.assign(new Error('当前环境不支持定位（需 HTTPS）'), { code: 'unsupported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = pos.coords;
        // WGS84 → GCJ-02：交给 navi.js 的转换，保证与导航口径一致
        const g = (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02)
          ? Navi.wgs84ToGcj02(c.longitude, c.latitude)
          : { lng: c.longitude, lat: c.latitude };

        const v = {
          lng: g.lng,
          lat: g.lat,
          accuracy: Math.round(c.accuracy || 0),   // 精度半径（米）
          ts: Date.now(),
          source: 'gps',
          label: '我的位置'
        };
        writeGeoCache(v);
        resolve(v);
      },
      err => {
        // 1=用户拒绝 2=位置不可用 3=超时
        const code = err && err.code === 1 ? 'denied'
          : err && err.code === 3 ? 'timeout' : 'unavailable';
        reject(Object.assign(new Error(err && err.message || '定位失败'), { code }));
      },
      GEO_OPTS
    );
  });
}

/**
 * 手动设置「我的位置」（定位被拒时的兜底 / 地图点选 / 地址反查）
 *
 * ⚠️ 口径统一：入参一律视为 WGS84（GPS 原始坐标），
 *    内部转成 GCJ-02 再落缓存——与 locate() 的 GPS 路径完全一致。
 *    早前的版本原样存 WGS84，导致「手动标的位置」和「GPS 定的位置」
 *    相差 300~600 米，图上看着像标歪了，其实是两套坐标系混用。
 *
 * @param {number} lat WGS84 纬度
 * @param {number} lng WGS84 经度
 * @param {string} [label]
 * @param {number} [accuracy] 已知精度（米）。手选默认 800，地址反查可传更小值
 */
function setManualLocation(lat, lng, label, accuracy) {
  const g = (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02)
    ? Navi.wgs84ToGcj02(Number(lng), Number(lat))
    : { lng: Number(lng), lat: Number(lat) };
  const v = {
    lng: +Number(g.lng).toFixed(6),
    lat: +Number(g.lat).toFixed(6),
    accuracy: accuracy == null ? 800 : Math.round(accuracy),
    ts: Date.now(),
    source: 'manual',
    label: label || '手动选择的位置'
  };
  writeGeoCache(v);
  return v;
}

/**
 * 直接用「已是 GCJ-02」的坐标设置位置（地址反查得到的就是 GCJ-02，
 * 不能再转一次，否则会二次偏移）
 */
function setGcjLocation(lat, lng, label, accuracy) {
  const v = {
    lng: +Number(lng).toFixed(6),
    lat: +Number(lat).toFixed(6),
    accuracy: accuracy == null ? 200 : Math.round(accuracy),
    ts: Date.now(),
    source: 'manual',
    label: label || '手动选择的位置'
  };
  writeGeoCache(v);
  return v;
}

/**
 * 城市级兜底：拿出发城市的中心点当位置
 * @param {string} cityKey
 */
function cityFallback(cityKey) {
  const info = (typeof CITY_INDEX !== 'undefined') ? CITY_INDEX[cityKey] : null;
  if (!info || !info.center) return null;
  const v = {
    lng: info.center[1],
    lat: info.center[0],
    accuracy: 5000,              // 城市级 ≈ 5km 误差，图上要画大圈说明
    ts: Date.now(),
    source: 'city',
    label: info.name + '（城市中心）'
  };
  return v;
}

/**
 * 高精度定位：连续采样取最准的一次
 *
 * 为什么要采样：手机 GPS 冷启动时第一枪精度常常只有 500~2000m（基站/WiFi 粗定位），
 * 等 1~2 秒后设备锁星，精度会跳到 20~50m。只取一次就容易把用户"定"到两条街外。
 *
 * 策略：
 *   · accuracy ≤ GOOD（60m）→ 直接满意返回，不再等
 *   · 否则最多再试 (tries-1) 次，取 accuracy 最小的一次
 *   · 总时长由每次 timeout 封顶，不会无限等
 *
 * @param {object} [opt] { tries:最多采样次数(默认3), good:满意精度阈值(默认60) }
 * @returns {Promise<{lng,lat,accuracy,ts,source,label}>}
 */
function locateBest(opt) {
  opt = opt || {};
  const tries = Math.max(1, opt.tries || 3);
  const good = opt.good || 60;

  const once = opt2 => new Promise((resolve, reject) => {
    locate(Object.assign({ force: true }, opt2 || {})).then(resolve, reject);
  });

  return new Promise((resolve, reject) => {
    let best = null;
    let done = false;
    let left = tries;

    const finish = v => { if (!done) { done = true; resolve(v); } };
    const fail = e => { if (!done) { done = true; reject(e); } };

    const attempt = () => {
      left--;
      once()
        .then(v => {
          if (done) return;
          if (!best || (v.accuracy || 9999) < (best.accuracy || 9999)) best = v;
          if (best.accuracy && best.accuracy <= good) { finish(best); return; }
          if (left <= 0) { finish(best); return; }
          // 间隔 1.2s 给设备一点锁星时间
          setTimeout(attempt, 1200);
        })
        .catch(e => {
          // 一次都没成功才判失败；有成功结果就用它
          if (best) { finish(best); return; }
          fail(e);
        });
    };
    attempt();
  });
}

/**
 * 持续跟随定位（边走边更新）
 *
 * 与 locate() 的区别：
 *   locate() 是一锤子买卖（getCurrentPosition），适合"点一下知道我在哪"；
 *   watch() 是订阅（watchPosition），适合"想实时看着自己在地图上移动"。
 *
 * @param {(loc:object)=>void} onUpdate 每次位置更新回调
 * @param {(err:object)=>void} [onError]  出错回调（错误码同 locate）
 * @returns {() => void} stop 清理函数（务必在离开页面时调用，否则持续耗电）
 */
function watch(onUpdate, onError) {
  if (!geoSupported()) {
    if (onError) onError(Object.assign(new Error('当前环境不支持定位（需 HTTPS）'), { code: 'unsupported' }));
    return () => { };
  }
  let stopped = false;
  const id = navigator.geolocation.watchPosition(
    pos => {
      if (stopped) return;
      const c = pos.coords;
      const g = (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02)
        ? Navi.wgs84ToGcj02(c.longitude, c.latitude)
        : { lng: c.longitude, lat: c.latitude };
      const v = {
        lng: g.lng,
        lat: g.lat,
        accuracy: Math.round(c.accuracy || 0),
        ts: Date.now(),
        source: 'gps',
        label: '我的位置'
      };
      writeGeoCache(v);
      if (onUpdate) onUpdate(v);
    },
    err => {
      if (stopped) return;
      const code = err && err.code === 1 ? 'denied'
        : err && err.code === 3 ? 'timeout' : 'unavailable';
      if (onError) onError(Object.assign(new Error(err && err.message || '定位失败'), { code }));
    },
    // 持续跟随不用 maximumAge（要的就是"此刻"），但仍给一个宽松的 timeout
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
  return () => {
    stopped = true;
    try { navigator.geolocation.clearWatch(id); } catch (e) { }
  };
}

/* ---------- 地址 → 坐标（走高德搜索页中转，零 Key） ---------- */

/**
 * 生成高德搜索链接：让用户在高德里找到确切位置，再回来填坐标
 * @param {string} keyword 地址 / 地名
 * @param {string} [city] 限定城市，提高命中率
 */
function amapSearchUrl(keyword, city) {
  if (!keyword) return '';
  const q = [
    'keyword=' + encodeURIComponent(keyword),
    'src=qingtu',
    'coordinate=gaode',
    'callnative=1'
  ];
  if (city) q.push('city=' + encodeURIComponent(city));
  return 'https://uri.amap.com/search?' + q.join('&');
}

/**
 * 解析用户粘贴的经纬度文本
 * 兼容："116.397,39.908"（lng,lat）/ "39.908,116.397"（lat,lng）/
 *       带空格或中文逗号 / 高德复制出来的 "116.397441, 39.908901"
 * 判定规则：中国境内纬度必然 < 54 且经度 > 73，据此自动分辨顺序。
 * @returns {{lng:number, lat:number}|null}
 */
function parseLatLng(text) {
  if (!text) return null;
  const nums = String(text).match(/-?\d+(\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  const a = parseFloat(nums[0]), b = parseFloat(nums[1]);
  if (!isFinite(a) || !isFinite(b)) return null;
  // 中国经度 73~135，纬度 3~54。用纬度上限 60 来区分：
  // 第一个数 > 60 → 必是经度（lng,lat 顺序）；否则按 lat,lng 试
  if (Math.abs(a) > 60) {
    // 大概率是 lng,lat
    if (a > 73 && a < 136 && Math.abs(b) < 60) return { lng: a, lat: b };
  }
  // 默认按 lat,lng
  if (a > 3 && a < 54 && b > 73 && b < 136) return { lng: b, lat: a };
  // 再宽松兜底：按 lng,lat
  if (b > 3 && b < 54 && a > 73 && a < 136) return { lng: a, lat: b };
  return null;
}

/* ---------- 距离计算（地图上显示「离你多远」） ---------- */

/**
 * 两点间直线距离（米）—— 等距圆柱近似，城市尺度足够准
 * @param {number} lat1 @param {number} lng1 @param {number} lat2 @param {number} lng2
 */
function distanceM(lat1, lng1, lat2, lng2) {
  const midLat = (lat1 + lat2) / 2 * Math.PI / 180;
  const dLat = (lat2 - lat1) * 111320;
  const dLng = (lng2 - lng1) * 111320 * Math.cos(midLat);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** 距离友好化：<1km 显示米，否则一位小数的公里 */
function fmtDistance(m) {
  if (m == null || !isFinite(m)) return '';
  if (m < 1000) return Math.round(m / 10) * 10 + 'm';
  if (m < 10000) return (m / 1000).toFixed(1) + 'km';
  return Math.round(m / 1000) + 'km';
}

/* ---------- 导出 ---------- */
const Geo = {
  locate, locateBest, watch, setManualLocation, setGcjLocation, cityFallback,
  clearGeoCache, readGeoCache, geoSupported,
  amapSearchUrl, parseLatLng,
  distanceM, fmtDistance, GEO_KEY
};
if (typeof window !== 'undefined') window.Geo = Geo;
if (typeof module !== 'undefined' && module.exports) module.exports = Geo;
