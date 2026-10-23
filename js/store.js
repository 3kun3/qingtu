/* ============================================================
 *  store.js —— 本地存储封装（H5 版，全部本地模拟，无后端）
 *  与小程序端 utils/store.js 保持同构，仅把 wx.* 换成 localStorage
 *
 *  qt_favs      收藏的路线 [{sid, city, days, mode, time, personaName, answers}]
 *  qt_history   生成记录（同上结构），上限 50 条
 *  qt_visits    足迹 { cityKey: { time } } —— 用户手动打卡「我去过」才点亮
 *
 *  说明：存「答案快照」而非整份行程；回看时由纯函数引擎重算（同输入同输出）
 * ============================================================ */

const KEY_FAV = 'qt_favs';
const KEY_HISTORY = 'qt_history';
const KEY_VISIT = 'qt_visits';
const KEY_HOME = 'qt_home';
const KEY_STAY = 'qt_stays_v1';
const KEY_FEEDBACK = 'qt_feedback_v1';    // 路线反馈
const KEY_GEMS = 'qt_gems_v1';            // 投稿宝藏地（带照片）
const KEY_COMMUNITY = 'qt_community_v1';  // 社区动态（所有人可见）
const KEY_CUSTOM_POIS = 'qt_custom_pois_v1'; // 用户添加的宝藏地 { cityKey: [poi] }
const KEY_DENSITY_PREF = 'qt_density_pref_v1'; // 最近一次反馈的节奏偏好 'tight'|'ok'|'loose'
const HISTORY_LIMIT = 50;

/* ---------- 基础读写（带容错） ---------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 存储满等异常静默 */ }
}

/* ---------- 会话唯一标识：同一份答案 = 同一条路线 ---------- */
function sidOf(answers) {
  return JSON.stringify(answers);
}

/* ---------- 收藏 ---------- */
function listFavs() { return read(KEY_FAV, []); }

function isFav(sid) {
  return listFavs().some(x => x.sid === sid);
}

/** 收藏/取消收藏，返回收藏后的状态 true=已收藏 */
function toggleFav(meta) {
  const list = listFavs();
  const i = list.findIndex(x => x.sid === meta.sid);
  if (i >= 0) { list.splice(i, 1); write(KEY_FAV, list); return false; }
  list.unshift(meta); write(KEY_FAV, list); return true;
}

/* ---------- 生成记录 ---------- */
function listHistory() { return read(KEY_HISTORY, []); }

/** 写入历史记录（生成行程时调用；回看不调用）。
 *  注意：生成路线不再自动点亮足迹 —— 点亮 = 用户去过并手动打卡。 */
function addHistory(meta) {
  const list = listHistory().filter(x => x.sid !== meta.sid);
  list.unshift(meta);
  if (list.length > HISTORY_LIMIT) list.length = HISTORY_LIMIT;
  write(KEY_HISTORY, list);
}

function clearHistory() { write(KEY_HISTORY, []); }

/* ---------- 足迹打卡（去了才点亮） ---------- */
function getVisits() { return read(KEY_VISIT, {}); }

function isVisited(key) { return !!getVisits()[key]; }

/** 打卡/取消打卡，返回打卡后的状态 true=已点亮 */
function toggleVisit(key) {
  const v = getVisits();
  if (v[key]) { delete v[key]; write(KEY_VISIT, v); return false; }
  v[key] = { time: Date.now() };
  write(KEY_VISIT, v); return true;
}

/* ---------- 我的位置（出发城市） ---------- */
function getHome() { return read(KEY_HOME, null); }
function setHome(key) { write(KEY_HOME, key || null); return key; }

/* ---------- 每晚住宿选择 ----------
 * 结构：{ [sid]: { [dayIndex]: { name, kind, kindLabel, price, area, cityKey } } }
 * 为什么单开一个键而不是塞进 answers：
 *   sid = JSON.stringify(answers)，往 answers 里写东西会让 sid 变化，
 *   收藏/历史记录的对应关系就断了。所以按 sid 独立存。
 * 注意：键名带 _v1，将来结构变了可以直接升 v2，不做迁移也不会串味。 */
function getStays(sid) {
  if (!sid) return {};
  const map = read(KEY_STAY, {});
  return (map && map[sid]) || {};
}

function getStay(sid, dayIndex) {
  const s = getStays(sid);
  return s[String(dayIndex)] || null;
}

/** 写入/覆盖某天的选择；传 null/undefined 表示取消 */
function setStay(sid, dayIndex, hotel) {
  if (!sid) return null;
  const map = read(KEY_STAY, {}) || {};
  const one = map[sid] || {};
  if (hotel) one[String(dayIndex)] = hotel;
  else delete one[String(dayIndex)];
  if (Object.keys(one).length) map[sid] = one;
  else delete map[sid];               // 该行程没有选择了就整条清掉，别留空壳
  write(KEY_STAY, map);
  return hotel || null;
}

/** 清空整条行程的住宿选择 */
function clearStays(sid) {
  if (!sid) return;
  const map = read(KEY_STAY, {}) || {};
  delete map[sid];
  write(KEY_STAY, map);
}

/* ---------- 命名空间导出 ---------- */
const Store = {
  sidOf, listFavs, isFav, toggleFav,
  listHistory, addHistory, clearHistory,
  getVisits, isVisited, toggleVisit,
  getHome, setHome,
  getStays, getStay, setStay, clearStays,
  /* 反馈 / 宝藏地 / 社区 */
  addFeedback, getFeedback, listAllFeedback,
  addGem, listGems, listAllGems,
  addCommunityPost, listCommunity,
  /* 自定义点位持久化 + 节奏偏好 */
  listCustomPOIs, saveCustomPOI, deleteCustomPOI, renameCustomPOI,
  getDensityPref, setDensityPref,
  /* 照片处理 */
  fileToBase64
};
if (typeof module !== 'undefined' && module.exports) module.exports = Store;

/* ============================================================
 *  路线反馈：密度 + 星级 + 文字 + 照片
 *  结构：{ id, sid, city, days, density, rating, text, photos:[base64], time }
 * ============================================================ */
function addFeedback(fb) {
  const list = read(KEY_FEEDBACK, []);
  const item = Object.assign({ id: 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), time: Date.now() }, fb);
  list.unshift(item);
  if (list.length > 200) list.length = 200;
  write(KEY_FEEDBACK, list);
  return item;
}
function getFeedback(sid) {
  return read(KEY_FEEDBACK, []).filter(x => x.sid === sid);
}
function listAllFeedback() { return read(KEY_FEEDBACK, []); }

/* ============================================================
 *  投稿宝藏地：用户推荐的新点位（带照片、理由）
 *  结构：{ id, city, name, reason, photos:[base64], poiId, time }
 * ============================================================ */
function addGem(gem) {
  const list = read(KEY_GEMS, []);
  const item = Object.assign({ id: 'gem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), time: Date.now() }, gem);
  list.unshift(item);
  if (list.length > 500) list.length = 500;
  write(KEY_GEMS, list);
  return item;
}
function listGems(city) {
  const all = read(KEY_GEMS, []);
  return city ? all.filter(g => g.city === city) : all;
}
function listAllGems() { return read(KEY_GEMS, []); }

/* ============================================================
 *  社区动态：所有人可见的反馈与宝藏地投稿
 *  结构：{ id, type:'feedback'|'gem', data, time }
 *  注：纯前端项目，数据存本地模拟"社区"；实际部署可对接后端。
 * ============================================================ */
function addCommunityPost(post) {
  const list = read(KEY_COMMUNITY, []);
  const item = Object.assign({ id: 'cm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), time: Date.now() }, post);
  list.unshift(item);
  if (list.length > 500) list.length = 500;
  write(KEY_COMMUNITY, list);
  return item;
}
function listCommunity() { return read(KEY_COMMUNITY, []); }

/* ============================================================
 *  自定义宝藏地持久化：{ [cityKey]: [poi, ...] }
 *  刷新 / 重新进入城市时由 engine.injectCustomPOIs 注回 POI 池，
 *  让用户添加的点位跨会话保留。
 * ============================================================ */
function listCustomPOIs(cityKey) {
  const map = read(KEY_CUSTOM_POIS, {});
  return (map && map[cityKey]) || [];
}
function saveCustomPOI(cityKey, poi) {
  if (!cityKey || !poi || !poi.id) return;
  const map = read(KEY_CUSTOM_POIS, {}) || {};
  const list = map[cityKey] || [];
  if (list.some(p => p.id === poi.id)) return;
  list.push(poi);
  map[cityKey] = list;
  write(KEY_CUSTOM_POIS, map);
}
function deleteCustomPOI(cityKey, id) {
  const map = read(KEY_CUSTOM_POIS, {}) || {};
  const list = map[cityKey] || [];
  const next = list.filter(p => p.id !== id);
  if (next.length) map[cityKey] = next;
  else delete map[cityKey];
  write(KEY_CUSTOM_POIS, map);
}
function renameCustomPOI(cityKey, id, name) {
  const map = read(KEY_CUSTOM_POIS, {}) || {};
  const list = map[cityKey] || [];
  const p = list.find(x => x.id === id);
  if (!p) return false;
  p.name = name;
  write(KEY_CUSTOM_POIS, map);
  return true;
}

/* ---------- 节奏偏好：记住用户最近一次「太满/刚好/太空」反馈 ---------- */
function getDensityPref() { return read(KEY_DENSITY_PREF, null); }
function setDensityPref(d) { write(KEY_DENSITY_PREF, d || null); return d; }

/* ---------- 照片处理：File → base64（压缩到 maxDim 以内） ---------- */
function fileToBase64(file, maxDim) {
  maxDim = maxDim || 800;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = h * maxDim / w; w = maxDim; }
        else if (h > maxDim) { w = w * maxDim / h; h = maxDim; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
