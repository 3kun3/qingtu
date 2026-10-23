/* ============================================================
 *  data-loader.js —— 城市数据的「遍历走索引、深取才加载」兼容层
 *
 *  要解决的问题：
 *    城市数据拆成了 99+ 个分片（每个几十上百 KB）。但代码里有 8 处地方
 *    是「遍历所有城市」的（首页人气榜、搜索、问卷城市网格、快速规划、
 *    出发地选择器、「我的」页统计、足迹地图）。如果这些地方都必须先
 *    把全部分片下载完，那拆分就白拆了。
 *
 *  关键观察（这就是切分线能画干净的底气）：
 *    那 8 处遍历，没有一处需要景点的详细内容 —— 全都是要
 *    城市名 / slogan / 坐标 / 景点数量。真正需要完整 pois 的，只有
 *    「进入某一个城市」和「给某个城市生成路线」。
 *
 *  做法：把 POI_DB 换成一个 Proxy
 *    · Object.keys / values / entries / in  → 命中 CITY_INDEX，返回轻量占位对象
 *    · 深层属性访问（如 POI_DB.chengdu.pois[0].lat） → 触发 ensureCity() 加载真数据
 *    这样调用点一行都不用改，分流自动完成。
 *
 *  ⚠️ 小程序端不支持 Proxy —— 那边不用本文件，改走 ensureCity() 显式加载。
 *     见 scripts/build-miniprogram.js 的处理。
 * ============================================================ */

/* ---------- 已加载的分片缓存 ---------- */
const __cityCache = Object.create(null);
const __hotelCache = Object.create(null);
/* ---------- 加载中的 Promise，防止同一城并发重复请求 ---------- */
const __cityLoading = Object.create(null);

/* ---------- 由 CITY_INDEX 生成的轻量占位值 ----------
 * pois 这里只是「一个带 length 的占位」。真正取值时会经 makeLazyPois
 * 分流：只读 length 走索引，读下标才去加载分片。 */
const __liteCache = Object.create(null);
function liteOf(key) {
  if (__liteCache[key]) return __liteCache[key];
  const info = CITY_INDEX[key];
  if (!info) return null;
  return (__liteCache[key] = {
    __lite: true,
    name: info.name,
    slogan: info.slogan,
    center: info.center,
    pois: { length: info.poiCount },
    hasHotels: info.hasHotels
  });
}

/* ============================================================
 *  ensureCity(key) —— 按需把某个城市的完整数据加载进来
 *
 *  分片在浏览器里是 <script> 标签加载（而非 fetch），这样：
 *    1) 不需要服务器支持 CORS，file:// 直接打开也能用
 *    2) 加载完就是普通全局对象，没有解析开销
 *
 *  @returns {Promise<object>} 该城市的完整 { name, slogan, center, pois }
 * ============================================================ */
function ensureCity(key) {
  if (!key) return Promise.resolve(null);
  if (!CITY_INDEX[key]) return Promise.reject(new Error('未知城市: ' + key));
  if (__cityCache[key]) return Promise.resolve(__cityCache[key]);
  if (__cityLoading[key]) return __cityLoading[key];

  const p = new Promise((resolve, reject) => {
    const done = () => {
      const mod = window.CITY_MODULES && window.CITY_MODULES[key];
      if (!mod || !mod.city) { fail(new Error('分片内容为空: ' + key)); return; }
      __cityCache[key] = mod.city;          // 缓存城市本体
      __hotelCache[key] = mod.hotel || [];  // 住宿另存一份，取用更直接
      // 把用户持久化的自定义宝藏地注回该城 POI 池
      if (typeof injectCustomPOIs === 'function') injectCustomPOIs(key, mod.city);
      delete __cityLoading[key];
      resolve(mod.city);
    };
    const fail = err => {
      delete __cityLoading[key];
      reject(err);
    };

    // 同一城只插一次 script 标签，避免重复请求
    const existing = document.querySelector('script[data-city="' + key + '"]');
    if (existing) {
      if (window.CITY_MODULES && window.CITY_MODULES[key]) done();
      else existing.addEventListener('load', done);
      return;
    }

    const s = document.createElement('script');
    s.src = 'js/cities/' + key + '.js';
    s.async = true;
    s.dataset.city = key;
    s.onload = done;
    s.onerror = () => fail(new Error('分片加载失败: ' + key));
    document.head.appendChild(s);
  });

  __cityLoading[key] = p;
  return p;
}

/** 同步取已加载的城市数据（没加载过则返回 null，不触发加载） */
function peekCity(key) {
  return __cityCache[key] || null;
}

/** 某城是否已加载完成 */
function isCityLoaded(key) {
  return !!__cityCache[key];
}

/* ============================================================
 *  POI_DB —— 兼容旧代码的 Proxy 视图
 *
 *  get 陷阱的分流逻辑（这是整个兼容层的核心）：
 *    · 取 Symbol / then / inspect 之类 → 交回给真实对象，别干扰运行时
 *    · 取城市 key 且已加载       → 返回真数据
 *    · 取城市 key 但未加载       → 返回轻量占位（深层再取时才真加载）
 *    · 取内部标记（__lite 等）    → 透传
 * ============================================================ */
function makePoiProxy() {
  // 先尝试从已加载分片里补足（首次加载时就位）
  const real = Object.create(null);

  return new Proxy(real, {
    get(target, prop, receiver) {
      // 运行时/调试用的特殊属性，别拦
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
      if (prop === 'then' || prop === '__isProxy') return undefined;

      if (prop in target) return target[prop];

      // 已加载过 → 直接给真数据，不走轻量占位
      if (__cityCache[prop]) return __cityCache[prop];

      // 是个已知城市 → 返回轻量占位（真数据等深取时再加载）
      if (CITY_INDEX[prop]) {
        return makeLiteProxy(prop, liteOf(prop));
      }
      return undefined;
    },

    has(target, prop) {
      return prop in target || prop in CITY_INDEX;
    },

    ownKeys(target) {
      // 遍历时把所有城市都报出来（这是懒加载能成立的前提）
      return Array.from(new Set([...Object.keys(CITY_INDEX), ...Object.keys(target)]));
    },

    getOwnPropertyDescriptor(target, prop) {
      if (prop in target) return Reflect.getOwnPropertyDescriptor(target, prop);
      if (CITY_INDEX[prop]) {
        // 必须报 enumerable 才进得了 Object.keys / entries
        return { enumerable: true, configurable: true, writable: true, value: undefined };
      }
      return undefined;
    }
  });
}

/**
 * 轻量占位值的代理
 *
 * 这里是整个懒加载的成败关键，必须区分两种访问：
 *   · `c.pois.length`        → 只想数个数（8 处遍历点全是这种）→ 绝不能触发加载
 *   · `c.pois[0].lat`        → 真要元素了                  → 触发加载
 *
 * 所以 `pois` 不能直接给普通对象（那样 c.pois[0] 会静默 undefined），
 * 也不能一看 pois 就加载（那样首屏就全下载了）。做法是把它包成一个
 * 惰性数组：length 立刻给真值，索引访问时才补加载。
 */
function makeLazyPois(key, count) {
  const arr = [];
  Object.defineProperty(arr, 'length', { value: count, writable: false, enumerable: false });
  return new Proxy(arr, {
    get(t, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return Reflect.get(t, prop);
      if (prop === 'length') return count;                  // 数个数：免费
      if (prop === '__loaded') return !!__cityCache[key];
      if (prop === '__fake') return true;
      // 数字下标 / 遍历方法 → 用户真要内容了，先加载
      ensureCity(key).catch(() => { });
      const real = __cityCache[key];
      if (real) return real.pois[prop];
      return Reflect.get(t, prop);
    },
    has(t, prop) {
      if (prop === 'length') return true;
      return Reflect.has(t, prop);
    }
  });
}

function makeLiteProxy(key, lite) {
  return new Proxy(lite, {
    get(t, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return Reflect.get(t, prop);
      if (prop === 'pois') return makeLazyPois(key, t.pois.length);   // 只在被取时才包
      return Reflect.get(t, prop);
    }
  });
}

/* 全局安装：POI_DB 指向代理，旧的取值写法继续可用 */
var POI_DB = makePoiProxy();

/* ============================================================
 *  HOTEL_DB —— 住宿数据不必做成 Proxy
 *  它只在结果页用，而结果页一定已经加载过该城分片了，
 *  所以这里直接暴露一个「从已加载分片里取」的函数即可。
 * ============================================================ */
function hotelsOfCity(key) {
  return __hotelCache[key] || [];
}

/* 供 app.js 用：取某城住宿片区（会确保分片已加载） */
function ensureHotels(key) {
  return ensureCity(key).then(() => hotelsOfCity(key));
}

/* ---------- 导出 ---------- */
const DataLoader = {
  ensureCity, peekCity, isCityLoaded, hotelsOfCity, ensureHotels,
  get loadedCount() { return Object.keys(__cityCache).length; }
};
if (typeof module !== 'undefined' && module.exports) module.exports = DataLoader;
