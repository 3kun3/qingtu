/* ============================================================
 *  provinces.js —— 省级行政区索引（城市 → 省份 归属表）
 *
 *  为什么单独一个文件：
 *    搜索框原本只能搜城市名。用户输入「江西」时，他要的不是某一座城，
 *    而是「江西这一片都收录了哪些地方」。这需要一张
 *    城市 → 省份 的归属表，以及「省 → 城市列表」的反向索引。
 *    省份是稳定的行政区划，不随城市数据扩充而变，所以放常驻（不拆分包）。
 *
 *  维护约定：
 *    新增城市时必须同时在 CITY_PROVINCE 里登记省份，
 *    scripts 注入新城市时有断言检查（漏了会直接报错，避免"查不到省"的哑巴 bug）。
 *
 *  覆盖范围：
 *    含直辖市（北京/上海/天津/重庆）、自治区（新疆/西藏/广西/内蒙古/宁夏）、
 *    以及港澳台（若后续收录）。省份 key 用规范中文简称（"内蒙古"而非"内蒙古自治区"）。
 * ============================================================ */

/* ---------- 城市 → 省份 ---------- */
const CITY_PROVINCE = {
  /* —— 直辖市 —— */
  beijing: '北京',
  shanghai: '上海',
  tianjin: '天津',
  chongqing: '重庆',

  /* —— 四川 —— */
  chengdu: '四川',
  leshan: '四川',
  dujiangyan: '四川',

  /* —— 陕西 —— */
  xian: '陕西',
  yanan: '陕西',

  /* —— 福建 —— */
  xiamen: '福建',
  quanzhou: '福建',
  fuzhou: '福建',

  /* —— 江西 —— */
  nanchang: '江西',
  jingdezhen: '江西',
  lushan: '江西',
  wuyuan: '江西',
  jinggangshan: '江西',
  jiujiang: '江西',
  guixi: '江西',
  fengcheng: '江西',
  zhangshu: '江西',
  poyang: '江西',
  longnan: '江西',
  ruijin: '江西',
  ganzhou: '江西',
  shangrao: '江西',
  jian: '江西',
  yichun: '江西',
  fuzhou_jx: '江西',
  pingxiang: '江西',
  xinyu: '江西',
  yingtan: '江西',

  /* —— 湖南 —— */
  changsha: '湖南',
  zhangjiajie: '湖南',
  fenghuang: '湖南',
  yueyang: '湖南',

  /* —— 浙江 —— */
  hangzhou: '浙江',
  shaoxing: '浙江',
  ningbo: '浙江',
  linhai: '浙江',
  putuo: '浙江',
  taizhou: '浙江',

  /* —— 广东 —— */
  guangzhou: '广东',
  chaozhou: '广东',
  shantou: '广东',
  shenzhen: '广东',
  zhuhai: '广东',
  shunde: '广东',

  /* —— 河南 —— */
  luoyang: '河南',
  zhengzhou: '河南',
  kaifeng: '河南',

  /* —— 广西 —— */
  liuzhou: '广西',
  guilin: '广西',
  nanning: '广西',
  beihai: '广西',

  /* —— 山西 —— */
  datong: '山西',
  taiyuan: '山西',
  pingyao: '山西',
  wutaishan: '山西',

  /* —— 江苏 —— */
  zhenjiang: '江苏',
  nanjing: '江苏',
  suzhou: '江苏',
  yangzhou: '江苏',
  wuxi: '江苏',

  /* —— 云南 —— */
  jianshui: '云南',
  kunming: '云南',
  dali: '云南',
  lijiang: '云南',
  xishuangbanna: '云南',
  tengchong: '云南',

  /* —— 河北 —— */
  shijiazhuang: '河北',
  chengde: '河北',
  qinhuangdao: '河北',
  zhengding: '河北',
  handan: '河北',

  /* —— 黑龙江 —— */
  harbin: '黑龙江',
  mohe: '黑龙江',

  /* —— 辽宁 —— */
  shenyang: '辽宁',
  dalian: '辽宁',

  /* —— 吉林 —— */
  changchun: '吉林',
  yanbian: '吉林',

  /* —— 湖北 —— */
  wuhan: '湖北',
  enshi: '湖北',
  yichang: '湖北',

  /* —— 贵州 —— */
  guiyang: '贵州',
  libo: '贵州',
  zhenyuan: '贵州',

  /* —— 海南 —— */
  haikou: '海南',
  sanya: '海南',

  /* —— 山东 —— */
  qingdao: '山东',
  jinan: '山东',
  qufu: '山东',
  zibo: '山东',
  weihai: '山东',

  /* —— 甘肃 —— */
  lanzhou: '甘肃',
  dunhuang: '甘肃',
  zhangye: '甘肃',
  jiayuguan: '甘肃',

  /* —— 青海 —— */
  xining: '青海',

  /* —— 宁夏 —— */
  yinchuan: '宁夏',
  zhongwei: '宁夏',

  /* —— 新疆 —— */
  urumqi: '新疆',
  kashgar: '新疆',
  turpan: '新疆',
  kelamayi: '新疆',
  yili: '新疆',

  /* —— 西藏 —— */
  lhasa: '西藏',
  nyingchi: '西藏',
  shigatse: '西藏',

  /* —— 安徽 —— */
  huangshan: '安徽',
  hongcun: '安徽',
  jiuhua: '安徽',

  /* —— 内蒙古 —— */
  hohhot: '内蒙古',
  baotou: '内蒙古'
};

/* ---------- 省份元信息（简称 / 别名，供搜索匹配） ---------- */
const PROVINCE_META = {
  '北京': { short: '京', alias: ['北京', '首都', '京城', '燕京', '帝都', '京'] },
  '上海': { short: '沪', alias: ['上海', '魔都', '申城', '沪', '沪上'] },
  '天津': { short: '津', alias: ['天津', '津门', '津'] },
  '重庆': { short: '渝', alias: ['重庆', '山城', '雾都', '渝'] },
  '四川': { short: '川', alias: ['四川', '川', '蜀', '天府'] },
  '陕西': { short: '陕', alias: ['陕西', '陕', '秦', '三秦'] },
  '福建': { short: '闽', alias: ['福建', '闽', '八闽'] },
  '江西': { short: '赣', alias: ['江西', '赣', '江右', '赣鄱'] },
  '湖南': { short: '湘', alias: ['湖南', '湘', '潇湘'] },
  '浙江': { short: '浙', alias: ['浙江', '浙', '之江'] },
  '广东': { short: '粤', alias: ['广东', '粤', '岭南'] },
  '河南': { short: '豫', alias: ['河南', '豫', '中原'] },
  '广西': { short: '桂', alias: ['广西', '桂', '八桂'] },
  '山西': { short: '晋', alias: ['山西', '晋', '三晋'] },
  '江苏': { short: '苏', alias: ['江苏', '苏', '江南'] },
  '云南': { short: '滇', alias: ['云南', '滇', '云', '彩云之南'] },
  '河北': { short: '冀', alias: ['河北', '冀', '燕赵'] },
  '黑龙江': { short: '黑', alias: ['黑龙江', '黑', '龙江', '东北'] },
  '辽宁': { short: '辽', alias: ['辽宁', '辽', '辽东'] },
  '吉林': { short: '吉', alias: ['吉林', '吉', '松江'] },
  '湖北': { short: '鄂', alias: ['湖北', '鄂', '荆楚'] },
  '贵州': { short: '贵', alias: ['贵州', '黔', '贵'] },
  '海南': { short: '琼', alias: ['海南', '琼', '椰岛'] },
  '山东': { short: '鲁', alias: ['山东', '鲁', '齐鲁'] },
  '甘肃': { short: '甘', alias: ['甘肃', '甘', '陇', '河西'] },
  '青海': { short: '青', alias: ['青海', '青'] },
  '宁夏': { short: '宁', alias: ['宁夏', '宁', '塞上'] },
  '新疆': { short: '新', alias: ['新疆', '新', '西域'] },
  '西藏': { short: '藏', alias: ['西藏', '藏', '雪域'] },
  '安徽': { short: '皖', alias: ['安徽', '皖', '江淮'] },
  '内蒙古': { short: '蒙', alias: ['内蒙古', '蒙', '内蒙'] }
};

/* ---------- 由上面两张表推导「省 → 城市列表」 ---------- */
const PROVINCE_CITIES = (() => {
  const m = Object.create(null);
  Object.keys(CITY_PROVINCE).forEach(k => {
    const p = CITY_PROVINCE[k];
    (m[p] = m[p] || []).push(k);
  });
  return m;
})();

/* ============================================================
 *  对外接口
 * ============================================================ */

/** 取某城所属省份（未登记返回 ''） */
function provinceOf(cityKey) {
  return CITY_PROVINCE[cityKey] || '';
}

/** 取某省已收录的城市 key 列表（按城市数据里的顺序，稳定可预期） */
function citiesOf(province) {
  return PROVINCE_CITIES[province] || [];
}

/**
 * 取某省的统计（用 CITY_INDEX 的轻量字段，无需加载任何分片）
 * @returns {{province, cities:string[], cityCount:number, poiCount:number, hotelCount:number}}
 */
function statsOf(province) {
  const cities = citiesOf(province);
  let poiCount = 0, hotelCount = 0;
  const hasIdx = (typeof CITY_INDEX !== 'undefined');
  cities.forEach(k => {
    const it = hasIdx ? CITY_INDEX[k] : null;
    if (it) {
      poiCount += it.poiCount || 0;
      hotelCount += it.hotelAreaCount || 0;
    }
  });
  return { province, cities, cityCount: cities.length, poiCount, hotelCount };
}

/** 全部已收录的省份列表（有城市且有元信息） */
function allProvinces() {
  return Object.keys(PROVINCE_CITIES).filter(p => PROVINCE_CITIES[p].length);
}

/**
 * 省份搜索匹配：输入「江西」「赣」「江右」都能命中
 * @param {string} kw
 * @param {number} [limit]
 * @returns {string[]} 命中的省份名，按匹配质量排序
 */
function matchProvinces(kw, limit) {
  kw = (kw || '').trim();
  if (!kw) return [];
  const out = [];
  allProvinces().forEach(p => {
    const meta = PROVINCE_META[p] || {};
    const names = [p].concat(meta.alias || []);
    let score = 0;
    if (p === kw) score = 100;                                   // 省名全等
    else if ((meta.short || '') === kw) score = 70;              // 简称全等（赣）
    else if (names.some(a => a === kw)) score = 60;              // 别名全等
    else if (p.indexOf(kw) === 0) score = 50;                    // 省名前缀
    else if (names.some(a => a.length > 1 && a.indexOf(kw) === 0)) score = 40; // 别名前缀
    else if (p.indexOf(kw) >= 0) score = 30;                     // 省名包含
    else if (kw.length > 1 && names.some(a => a.indexOf(kw) >= 0)) score = 20; // 别名包含
    if (score > 0) out.push({ p, score });
  });
  return out.sort((a, b) => b.score - a.score || a.p.localeCompare(b.p))
    .slice(0, limit || 3)
    .map(x => x.p);
}

/* ---------- 导出 ---------- */
const ProvinceDB = {
  CITY_PROVINCE, PROVINCE_META, PROVINCE_CITIES,
  provinceOf, citiesOf, statsOf, allProvinces, matchProvinces
};
if (typeof window !== 'undefined') window.ProvinceDB = ProvinceDB;
if (typeof module !== 'undefined' && module.exports) module.exports = ProvinceDB;
