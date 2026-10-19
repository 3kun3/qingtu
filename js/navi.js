/* ============================================================
 *  navi.js —— 高德导航接入（纯函数，无外部依赖，不必联网）
 *
 *  为什么要单独一个文件：
 *  1) 坐标系转换是「错了就全盘皆输」的一步 —— 我们的数据是 WGS84（GPS 原始
 *     坐标），国内地图服务用的是 GCJ-02（火星坐标）。不转换的话在国内会偏移
 *     50~500 米，导航到隔壁街是常态。
 *  2) 导航只依赖「坐标 + 名字」，与呈现层无关，放独立模块便于两种端复用，
 *     也便于单元测试（scripts/ 下有小程序端同构副本）。
 *
 *  高德 URI API 不需要 Key，直接用：
 *    https://uri.amap.com/marker?position=lng,lat&name=名称   —— 标点
 *    https://uri.amap.com/navigation?from=...&to=...&mode=car  —— 路线导航
 *  手机上优先唤起高德 App，未安装则自动落到网页版。
 * ============================================================ */

/* ---------- 常量 ---------- */
const GCJ_A = 6378245.0;              // 克拉索夫斯基椭球长半轴
const GCJ_EE = 0.00669342162296594323; // 偏心率平方

function _outOfChina(lng, lat) {
  // 中国境外不做偏移（港澳台及国外坐标本身就是标准值）
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
}

function _transformLat(lng, lat) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function _transformLng(lng, lat) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

/**
 * WGS84 → GCJ-02（国测局火星坐标）
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {{lng:number, lat:number}} 保留 6 位小数（约 0.1 米精度，够用且 URL 简洁）
 */
function wgs84ToGcj02(lng, lat) {
  if (_outOfChina(lng, lat)) return { lng: +lng.toFixed(6), lat: +lat.toFixed(6) };
  let dLat = _transformLat(lng - 105.0, lat - 35.0);
  let dLng = _transformLng(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic) * Math.PI);
  dLng = (dLng * 180.0) / (GCJ_A / sqrtMagic * Math.cos(radLat) * Math.PI);
  return { lng: +(lng + dLng).toFixed(6), lat: +(lat + dLat).toFixed(6) };
}

/**
 * GCJ-02 → WGS84（粗反解，迭代两次足够，误差 < 1 米）
 * 小程序端 wx.openLocation 用 GCJ-02，这里给的是「万一要转回来」的保障。
 */
function gcj02ToWgs84(lng, lat) {
  if (_outOfChina(lng, lat)) return { lng: +lng.toFixed(6), lat: +lat.toFixed(6) };
  let wLng = lng, wLat = lat;
  for (let i = 0; i < 3; i++) {
    const g = wgs84ToGcj02(wLng, wLat);
    wLng += lng - g.lng;
    wLat += lat - g.lat;
  }
  return { lng: +wLng.toFixed(6), lat: +wLat.toFixed(6) };
}

/* ---------- 内部：把各种形态的坐标统一成 GCJ-02 ---------- */

/** 数组形态 [lat, lng]（我们数据里的格式）→ GCJ-02 */
function fromPair(pair) {
  if (!pair || pair.length < 2) return null;
  return wgs84ToGcj02(pair[1], pair[0]);
}

/* ---------- 高德 URI 构造 ---------- */

const AMAP_HOST = 'https://uri.amap.com';

/**
 * 单点标注链接：在高德上打开这个位置
 * @param {object} p { name, lng, lat } lng/lat 已是 GCJ-02
 * @param {string} [city] 城市名，辅助检索
 */
function markerUrl(p, city) {
  if (!p || p.lng == null) return '';
  const q = [
    'position=' + p.lng + ',' + p.lat,
    'name=' + encodeURIComponent(p.name || '目的地'),
    'src=qingtu',
    'coordinate=gaode',
    'callnative=1'          // 手机上优先唤起高德 App
  ];
  if (city) q.push('city=' + encodeURIComponent(city));
  return AMAP_HOST + '/marker?' + q.join('&');
}

/**
 * 路线导航链接
 * @param {object} o
 *   from  {lng,lat,name}  起点（可空，空则用定位）
 *   to    {lng,lat,name}  终点（必填）
 *   via   [{lng,lat,name}] 途经点（最多 16 个）
 *   mode  'car' | 'bus' | 'walk' | 'ride'
 */
function navUrl(o) {
  const to = o && o.to;
  if (!to || to.lng == null) return '';
  const q = [];
  if (o.from && o.from.lng != null) {
    q.push('from=' + o.from.lng + ',' + o.from.lat + ',' + encodeURIComponent(o.from.name || '我的位置'));
  } else {
    q.push('from=我的位置,');   // 交给高德自己定位
  }
  q.push('to=' + to.lng + ',' + to.lat + ',' + encodeURIComponent(to.name || '目的地'));
  if (o.via && o.via.length) {
    const vs = o.via.slice(0, 16).map(v => v.lng + ',' + v.lat + ',' + encodeURIComponent(v.name || '途经点'));
    q.push('via=' + vs.join(';'));
  }
  q.push('mode=' + (o.mode || 'car'));
  q.push('src=qingtu');
  q.push('coordinate=gaode');
  q.push('callnative=1');
  return AMAP_HOST + '/navigation?' + q.join('&');
}

/* ---------- 对外：把「行程里的一个点」直接变成可点链接 ---------- */

/**
 * 把一个景点/城市点转成高德可用的点对象
 * @param {object} poi 需含 name、lng、lat（WGS84）
 *   若带 `__gcj: true` 标记，说明坐标已是 GCJ-02（如 Geo 模块的定位输出），
 *   此时不再转换——二次转换会造成新的偏移。
 */
function toAmapPoint(poi) {
  if (!poi) return null;
  const lng = poi.lng != null ? poi.lng : (poi.center ? poi.center[1] : null);
  const lat = poi.lat != null ? poi.lat : (poi.center ? poi.center[0] : null);
  if (lng == null || lat == null) return null;
  if (poi.__gcj) return { name: poi.name, lng: +(+lng).toFixed(6), lat: +(+lat).toFixed(6) };
  const g = wgs84ToGcj02(lng, lat);
  return { name: poi.name, lng: g.lng, lat: g.lat };
}

/**
 * 一天的行程 → 导航链接（第一个点是起点，其余顺次为途经点，最后一个是终点）
 * 高德会按传入顺序串线，正好贴合我们「就近串联、少走回头路」的编排结果。
 * @param {Array} stops [{name,lng,lat}] 按当日顺序
 * @param {string} mode
 */
function dayNavUrl(stops, mode) {
  const pts = (stops || []).map(toAmapPoint).filter(Boolean);
  if (pts.length < 2) return pts.length === 1 ? markerUrl(pts[0]) : '';
  return navUrl({
    from: pts[0],
    to: pts[pts.length - 1],
    // 途经点：去掉首尾，最多 16 个（高德上限）
    via: pts.slice(1, -1).slice(0, 16),
    mode: mode || 'car'
  });
}

/* ============================================================
 *  地图标星
 *
 *  为什么要绕这个弯：
 *    高德的 /marker 接口一次只能标一个点，官方没有「一次标多个星号」的能力。
 *    而 /navigation 会把 from / to / via 上的每一个点都渲染成图钉——
 *    于是「把当天所有景点标出来」可以用一条导航链接实现：
 *    首点当起点、末点当终点、其余全部塞进 via（上限 16）。
 *    用户在高德打开后看到的，就是整条路线 + 每个点的星标。
 *
 *  超过 17 个点怎么办：
 *    高德 via 硬上限 16，多了会被静默丢弃（用户看不到，最坑）。
 *    所以这里主动分段，并且相邻两段共享一个衔接点，
 *    保证分段之后仍然串成一条不断链的线。
 * ============================================================ */

/** 高德 via 上限（官方限制，超过会被丢弃） */
const VIA_MAX = 16;
/** 一条链接最多能承载的点数 = 起点 + 16 个途经 + 终点 */
const POINTS_PER_URL = VIA_MAX + 2;

/**
 * 多点标星：把一串坐标全部在高德地图上标出来
 * @param {Array} points  [{name,lng,lat}]，lng/lat 为 WGS84（内部会转 GCJ-02）
 * @param {object} [opts] { mode:'car'|'walk'..., city }
 * @returns {{urls:string[], chunks:number, total:number, single:boolean}}
 *   urls   —— 一条或多条可点击链接
 *   chunks —— 分段数（1 表示一条搞定）
 *   single —— 是否走了单点 marker（没有路线，只有一个星标）
 */
function starUrl(points, opts) {
  opts = opts || {};
  const pts = (points || []).map(toAmapPoint).filter(Boolean);
  if (!pts.length) return { urls: [], chunks: 0, total: 0, single: false };

  // 只有一个点：老老实实用 marker，标一个干净的星标
  if (pts.length === 1) {
    return { urls: [markerUrl(pts[0], opts.city)], chunks: 1, total: 1, single: true };
  }

  // 点数不超限：一条导航链接搞定
  if (pts.length <= POINTS_PER_URL) {
    return {
      urls: [navUrl({
        from: pts[0],
        to: pts[pts.length - 1],
        via: pts.slice(1, -1),
        mode: opts.mode || 'car'
      })],
      chunks: 1, total: pts.length, single: false
    };
  }

  // 点数超限：分段。每段最多 POINTS_PER_URL 个点，
  // 相邻段共享 1 个衔接点（上一段的末点 = 下一段的首点），保证不断链。
  const urls = [];
  const step = POINTS_PER_URL - 1;      // 每段前进的点数（留 1 个重叠）
  for (let i = 0; i < pts.length - 1; i += step) {
    const seg = pts.slice(i, Math.min(i + POINTS_PER_URL, pts.length));
    if (seg.length < 2) break;
    urls.push(navUrl({
      from: seg[0],
      to: seg[seg.length - 1],
      via: seg.slice(1, -1),
      mode: opts.mode || 'car'
    }));
  }
  return { urls, chunks: urls.length, total: pts.length, single: false };
}

/**
 * 「我的位置」单独标星：用户常想在高德上看自己在哪
 * @param {object} me {lng,lat,label,accuracy} —— 已是 GCJ-02（Geo 模块的输出）
 * @param {string} [city]
 */
function meStarUrl(me, city) {
  if (!me || me.lng == null) return '';
  return markerUrl({ name: me.label || '我的位置', lng: me.lng, lat: me.lat }, city);
}

/**
 * 把「我的位置 + 一串景点」一起标出来（首点是我的位置）
 * 用户点「标星」时若已定位，就把自己也带上——在地图上看见「我」和景点在一张图上，
 * 距离感最直观。
 */
function starUrlWithMe(me, points, opts) {
  const list = [];
  if (me && me.lng != null) {
    list.push({ name: me.label || '我的位置', lng: me.lng, lat: me.lat, __gcj: true });
  }
  return starUrl(list.concat(points || []), opts);
}

/* ---------- 导出 ---------- */
const Navi = {
  wgs84ToGcj02, gcj02ToWgs84, fromPair,
  toAmapPoint, markerUrl, navUrl, dayNavUrl,
  starUrl, meStarUrl, starUrlWithMe, VIA_MAX, POINTS_PER_URL
};
if (typeof module !== 'undefined' && module.exports) module.exports = Navi;
