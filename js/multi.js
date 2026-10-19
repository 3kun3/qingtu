/* ============================================================
 *  multi.js —— 跨城多目的地「分段串联」规划（纯函数，无 DOM）
 *
 *  设计原则：引擎零重写。
 *    · 单城编排完全复用 engine.js 的 planItinerary(profile)；
 *    · 段间大交通完全复用 engine.js 的 cityTransport(fromKey,toKey)；
 *    · 本文件只做「拆分 → 逐段调用 → 拼接 + 重编号」。
 *
 *  数据结构（返回给呈现层）：
 *    {
 *      multi: boolean,               // 是否真·多城
 *      trips: [{ seq, cityKey, city, anchors, startDayIndex, dayCount, note, plan }],
 *      legs:  [{ fromKey, toKey, kind:'between', transport, dayIndex }],
 *      enterLeg: { fromKey, toKey, kind:'enter', transport } | null,
 *      days: [...],                  // = trips.flatMap(t=>t.plan.days)（已全局重编号）
 *      stats: {...},                 // 各段 stats 合并 + crossCost
 *      anchorMiss: [...],            // 被体力/节奏过滤掉的锚点（供 UI 提示）
 *      city: trips[0].city           // 兼容字段（旧渲染仍读 plan.city）
 *    }
 * ============================================================ */

/* 天数分配：用户可给定各段天数；未定段均分剩余。保证每段 ≥1 天、总和守恒。 */
function allocateDays(tripPlan, totalDays) {
  const n = tripPlan.length;
  const specified = tripPlan.map(t => Math.max(0, Math.round(t.days || 0)));
  let fixedSum = specified.reduce((a, b) => a + b, 0);
  /* 兜底：总天数缺失/非法时退回「各段指定之和」（都未指定则每段 1 天）。
     否则 NaN 会传染 dayCount/startDayIndex，把整份多城计划打空——
     表现恰好就是「只出段头与大交通，没有任何一天的行程」。 */
  if (typeof totalDays !== 'number' || !isFinite(totalDays) || totalDays <= 0) {
    totalDays = fixedSum || n;
  }
  const blankIdx = specified.map((d, i) => d ? -1 : i).filter(i => i >= 0);

  let out;
  if (!blankIdx.length) {
    // 全指定：按比例归一到 totalDays（保底 ≥1）
    const sum = fixedSum || n;
    out = specified.map(d => Math.max(1, Math.round(d / sum * totalDays)));
  } else {
    // 有未指定段：已指定占用后，剩余均分给未指定段
    const remain = Math.max(blankIdx.length, totalDays - fixedSum);
    const base = Math.floor(remain / blankIdx.length);
    let extra = remain % blankIdx.length;
    out = specified.slice();
    blankIdx.forEach(i => { out[i] = base + (extra-- > 0 ? 1 : 0); });
  }
  // 修正舍入误差：把差额补到最长段（或减自最长段）
  let diff = totalDays - out.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (diff !== 0 && guard++ < 200) {
    let idx = 0;
    for (let i = 1; i < out.length; i++) if (out[i] > out[idx]) idx = i;
    if (diff > 0) { out[idx]++; diff--; }
    else { // 从有 >1 天的段里减
      let j = out.findIndex(x => x > 1);
      if (j < 0) break;
      out[j]--; diff++;
    }
  }
  return out.map(d => ({ days: d }));
}

/* 合并各段统计 + 跨城大交通费用 */
function mergeStats(list, legs) {
  const keys = ['poiCount', 'dayCount', 'ticket', 'meals', 'local', 'misc', 'total', 'totalHours', 'dist', 'offlineHours'];
  const out = {};
  keys.forEach(k => out[k] = Math.round(list.reduce((s, x) => s + (x[k] || 0), 0) * 10) / 10);
  // 跨城大交通：各 leg 推荐方式的票价中值之和
  let cross = 0;
  (legs || []).forEach(l => {
    const r = l.transport && l.transport.rec;
    if (r && r.price) cross += Math.round((r.price[0] + r.price[1]) / 2);
  });
  out.crossCost = cross;
  out.total = Math.round((out.total + cross) * 10) / 10;
  return out;
}

/* ============================================================
 *  地理顺路排序 —— 多城「按位置自动选最合适的路线」
 *
 *  目标：把用户勾选的多座城市，按地理顺路重排，让城际奔波尽量短。
 *  代价函数（加权里程）：
 *    cost(σ) = D(h, c1)·w1 + Σ D(cᵢ, cᵢ₊₁)·wᵢ₊₁
 *    · D = 两城中心直线距离（复用 cityTransport().distance，即 haversine）
 *    · w = 该城停留天数
 *    · h = 出发地（homeKey）
 *
 *  权重挂在「到达某城的腿」上，语义是：**停得越久的城市，进入它时
 *  的路程越要短**——长途奔波之后紧接着长时间游玩最累人。
 *
 *  为什么用全排列穷举而不是最近邻+2-opt：多城 n 很小（2~7 座，
 *  最多 5040 种排列，含 memo 实测 <5ms），穷举能得到**精确最优**、
 *  无启发式参数、平手时保留原序因而**天然幂等**，代码也更短更好测。
 * ============================================================ */

/**
 * @param {Array<{cityKey:string, days?:number}>} tripPlan 原始顺序（不改动入参）
 * @param {string|null} homeKey 出发城市 key；可为 null/''/缺失
 * @param {{returnToHome?:boolean}} [opts] returnToHome 默认 false（末段不回起点）
 * @returns {{
 *   order: Array,          // 重排后的 tripPlan（新数组；项为原对象引用）
 *   optimized: boolean,    // 是否真的做了优化（段数<2 / 坐标缺失 → false）
 *   orderChanged: boolean, // 顺序是否与原输入不同
 *   before: string[], after: string[],
 *   totalKm: number,       // 优化后城际总里程（home→首城 + 段间；不含返程与市内步行）
 *   beforeKm: number,      // 原顺序同口径里程
 *   savedKm: number        // max(0, beforeKm - totalKm)
 * }}
 */
function optimizeCityOrder(tripPlan, homeKey, opts) {
  opts = opts || {};
  const returnToHome = !!opts.returnToHome;
  const list = tripPlan || [];
  const n = list.length;
  const beforeKeys = list.map(t => t.cityKey);

  /* 坐标校验：只要有一城取不到有效中心点，就整体放弃优化。
     硬算会让 NaN 顺着 cost 传染，最后可能排出一个乱序——
     还不如原样返回，交给上层按用户顺序渲染。 */
  const centersOk = n >= 2 && list.every(t => {
    const c = (typeof POI_DB !== 'undefined') ? POI_DB[t.cityKey] : null;
    return c && c.center && c.center.length === 2
      && isFinite(c.center[0]) && isFinite(c.center[1]);
  });
  const homeOk = !!(homeKey && typeof POI_DB !== 'undefined'
    && POI_DB[homeKey] && POI_DB[homeKey].center);
  /* 没有出发地时，用「用户排在第一位的城市」当起点。
     不用「首腿免费」那种做法 —— 起点免费会让 optimizer 为了省下半程的
     加权里程，把用户先选的城市甩到末尾（例如 [上饶1天, 杭州2天] 无家时
     会变成 [杭州, 上饶]，只因为把轻的段放前面更省）。用户没设出发地，
     不代表他不在乎先玩哪座城；以首选为锚更符合直觉，结果也稳定。 */
  const startKey = homeOk ? homeKey : (list[0] ? list[0].cityKey : null);

  if (!centersOk) {
    const km = _chainKm(list, startKey, returnToHome);
    return {
      order: list.slice(), optimized: false, orderChanged: false,
      before: beforeKeys, after: beforeKeys,
      totalKm: Math.round(km), beforeKm: Math.round(km), savedKm: 0
    };
  }

  // 权重 = 停留天数，缺失/非法按 1
  const w = list.map(t => {
    const d = Math.round(t.days);
    return (isFinite(d) && d >= 1) ? d : 1;
  });
  const key = list.map(t => t.cityKey);

  /* 距离 memo：全排列会反复查同一条腿，cityTransport 虽轻但没必要重算。 */
  const memo = {};
  const dist = (ka, kb) => {
    if (!ka || !kb || ka === kb) return 0;
    const mk = ka + '>' + kb;
    if (memo[mk] == null) {
      const t = cityTransport(ka, kb);
      memo[mk] = (t && isFinite(t.distance)) ? t.distance : 0;
    }
    return memo[mk];
  };

  let bestOrder = null, bestCost = Infinity, bestKm = Infinity;
  const perm = [], used = new Array(n).fill(false);
  (function dfs() {
    if (perm.length === n) {
      let cost = 0, km = 0, prev = startKey;
      for (let i = 0; i < n; i++) {
        const j = perm[i];
        const leg = prev ? dist(prev, key[j]) : 0;
        km += leg;
        cost += leg * w[j];          // 权重挂在到达腿
        prev = key[j];
      }
      if (returnToHome && startKey) {
        const back = dist(prev, startKey);
        km += back;
        cost += back * w[perm[n - 1]];
      }
      /* 严格小于才替换：平手时保留更早枚举到的排列。
         DFS 按 index 升序生成，已排序输入的原序最先被枚举 →
         平手保住原序 → 对同一输入再排一次结果不变（幂等）。 */
      if (cost < bestCost - 1e-9) { bestCost = cost; bestKm = km; bestOrder = perm.slice(); }
      return;
    }
    for (let i = 0; i < n; i++) if (!used[i]) {
      used[i] = true; perm.push(i); dfs(); perm.pop(); used[i] = false;
    }
  })();

  const order = bestOrder.map(i => list[i]);
  const afterKeys = order.map(t => t.cityKey);
  const beforeKm = _chainKm(list, startKey, returnToHome);
  return {
    order, optimized: true,
    orderChanged: afterKeys.join(',') !== beforeKeys.join(','),
    before: beforeKeys, after: afterKeys,
    totalKm: Math.round(bestKm),
    beforeKm: Math.round(beforeKm),
    savedKm: Math.max(0, Math.round(beforeKm - bestKm))
  };
}

/* 按「起点 + 顺序」串算纯城际里程（= cost 的里程部分，不含天数额权重）。
   口径：home→首城 + 段间；returnToHome 时才追加末城→home。不含市内步行。 */
function _chainKm(tripPlan, startKey, returnToHome) {
  let km = 0, prev = startKey;
  const keys = (tripPlan || []).map(t => t.cityKey);
  keys.forEach(k => {
    if (prev) {
      const t = cityTransport(prev, k);
      if (t && isFinite(t.distance)) km += t.distance;
    }
    prev = k;
  });
  if (returnToHome && startKey && keys.length) {
    const t = cityTransport(keys[keys.length - 1], startKey);
    if (t && isFinite(t.distance)) km += t.distance;
  }
  return km;
}

/* 取出发城市（用户设置的"我的位置"城市）*/
function _homeKey() {
  try {
    if (typeof Store !== 'undefined' && Store.getHome) return Store.getHome();
  } catch (e) { }
  return null;
}

/**
 * 多目的地分段串联规划
 * @param {object} profile  buildProfile(ans) 的产物（含 .city 作为兜底主城）
 * @param {object} opts     { tripPlan?: [{cityKey, days, anchors?:string[], note?}] }
 * @returns {object} 多城行程对象（见文件头结构说明）
 */
function planMultiCity(profile, opts) {
  opts = opts || {};
  let tripPlan = (opts.tripPlan && opts.tripPlan.length)
    ? opts.tripPlan
    : [{ cityKey: profile.city, days: profile.days, anchors: profile.anchors || [] }];

  /* —— 地理顺路排序 —— 必须赶在下面的 forEach 之前：
     等会儿每段的 homeIn/homeOut 是按「相邻段」算的，顺序先定下来，
     引擎才知道这一段从哪城来、往哪城去，首末天的到达/动身时刻才排得对。 */
  const home = _homeKey() || profile.home || '';
  let orderInfo = null;
  if (opts.optimize !== false && tripPlan.length > 1) {
    orderInfo = optimizeCityOrder(tripPlan, home || null, { returnToHome: false });
    tripPlan = orderInfo.order;      // 后续一律用排序后的顺序
  }

  const alloc = allocateDays(tripPlan, profile.days);
  const trips = [];
  const allAnchorMiss = [];
  let dayCursor = 0;

  tripPlan.forEach((seg, i) => {
    /* 首末天联动的作用域：本段从哪城来（homeIn）、离开后去哪城（homeOut）。
       第 1 段从出发地来、末段返回出发地；中段=上一城 → 本城 → 下一城。
       引擎据此给「到达日地板」和「离开日上限」，多城不再误用「从家出发」。 */
    const homeIn = (i === 0) ? (profile.home || '') : tripPlan[i - 1].cityKey;
    const homeOut = (i === tripPlan.length - 1) ? (profile.home || '') : tripPlan[i + 1].cityKey;
    const childProfile = Object.assign({}, profile, {
      city: seg.cityKey,
      days: alloc[i].days,
      anchors: seg.anchors || [],
      homeIn,
      homeOut
    });
    const plan = planItinerary(childProfile);
    // 重编号为全局天数序号，并打上所属段（供"按城取点"的地方使用）
    plan.days.forEach((d, k) => {
      d.index = dayCursor + k;
      d.tripSeq = i;
      d.cityKey = seg.cityKey;
    });
    if (plan.anchorMiss && plan.anchorMiss.length) {
      allAnchorMiss.push({ cityKey: seg.cityKey, ids: plan.anchorMiss });
    }
    trips.push({
      seq: i,
      cityKey: seg.cityKey,
      city: POI_DB[seg.cityKey],
      anchors: seg.anchors || [],
      startDayIndex: dayCursor,
      dayCount: alloc[i].days,
      note: seg.note || '',
      plan
    });
    dayCursor += alloc[i].days;
  });

  // 段间大交通
  const legs = [];
  for (let i = 1; i < trips.length; i++) {
    const t = cityTransport(trips[i - 1].cityKey, trips[i].cityKey);
    legs.push({
      fromKey: trips[i - 1].cityKey,
      toKey: trips[i].cityKey,
      kind: 'between',
      transport: t,
      dayIndex: trips[i].startDayIndex
    });
  }

  // 出发地 → 首段（home 在上面排序时已取好）
  let enterLeg = null;
  if (home && POI_DB[home] && home !== trips[0].cityKey) {
    enterLeg = {
      fromKey: home, toKey: trips[0].cityKey, kind: 'enter',
      transport: cityTransport(home, trips[0].cityKey)
    };
  }

  const days = trips.flatMap(t => t.plan.days);
  const stats = mergeStats(trips.map(t => t.plan.stats), legs);

  /* 备选池：各段 plan.backups 的并集（按 poi.id 去重）。
     换点候选（suggestSwaps）会 plan.backups.concat(...)，若这里是 undefined
     会直接抛 TypeError —— 多城时换点整个不可用。这里补齐。 */
  const backupSeen = new Set();
  const backups = [];
  trips.forEach(t => (t.plan.backups || []).forEach(b => {
    if (!b || !b.poi || backupSeen.has(b.poi.id)) return;
    backupSeen.add(b.poi.id);
    backups.push(b);
  }));

  return {
    multi: trips.length > 1,
    trips, legs, enterLeg,
    days, stats,
    backups,
    anchorMiss: allAnchorMiss,
    orderInfo,            // 地理顺路排序元信息（单城/关闭优化时为 null）
    city: trips[0].city   // 兼容字段
  };
}

/* ---------- 导出 ---------- */
const Multi = { planMultiCity, allocateDays, mergeStats, optimizeCityOrder };
if (typeof window !== 'undefined') window.Multi = Multi;
if (typeof module !== 'undefined' && module.exports) module.exports = Multi;
