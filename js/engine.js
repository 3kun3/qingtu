/* ============================================================
 *  engine.js —— 个性化路线规划引擎
 *  流程：问卷答案 → 用户画像 → POI 打分 → 地理聚类分组 → 时间轴编排
 * ============================================================ */

/* ============================================================
 *  情绪模型：本作品的核心创新
 *  市面产品回答「去哪」，我们回答「以什么状态去」。
 *  每个点位由标签推导：vibe（静/知/趣/燃/暖）+ arousal（激活度 0~1），
 *  行程编排的目标不是最短路径，而是贴合用户选择的「体验弧线」。
 * ============================================================ */

const clamp01 = v => Math.max(0, Math.min(1, v));

/* 原始激活度：夜生活/亲子/购物/摄影抬升，休闲躺平压低，体力强度小幅抬升。
 * 注意：这只是"原始分"，它的取值区间取决于该城点位的构成，
 * 直接使用会让激活度常年挤在 0.6~1.0，"松弛"与"撒欢"的目标曲线拉不开差距。 */
function rawArousal(poi) {
  const t = poi.tags;
  return 0.42
    + (t.night  || 0) * 0.42 + (t.family || 0) * 0.28 + (t.shop || 0) * 0.22
    + (t.photo  || 0) * 0.16 + (poi.intensity - 1) * 0.16
    - (t.relax  || 0) * 0.34 - (t.history || 0) * 0.1;
}

function vibeOf(poi) {
  const t = poi.tags;
  /* 自然点不是天然"静"：低强度（湖边散步）才是静，
   * 高强度（爬山徒步）是"燃"——用体力强度对 nature 的归属做衰减/转移 */
  const natCalm = (t.nature || 0) * Math.min(1, (3 - poi.intensity) / 2);
  const scores = {
    zen:    (t.relax  || 0) * 1.2 + natCalm * 0.9 + (t.history || 0) * 0.3,
    learn:  (t.history || 0) * 1.3 + (t.art    || 0) * 0.5,
    fun:    (t.family || 0) * 1.1 + (t.photo  || 0) * 0.7 + (t.food || 0) * 0.4 + (t.shop || 0) * 0.4,
    thrill: (t.night  || 0) * 1.1 + (poi.intensity - 1) * 0.35
              + (t.nature || 0) * ((poi.intensity - 1) / 2) * 0.6 + (t.shop || 0) * 0.3,
    warm:   (t.food   || 0) * 0.9 + (t.family || 0) * 0.6 + (t.relax || 0) * 0.5 + (t.art || 0) * 0.4
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

/* 城市内相对归一化：把该城所有点位的原始激活度按 min–max 拉伸到 0~1。
 * 这样"激活度"表达的是"在这座城市里，这个点算安静还是热烈"，
 * 而不是一个受数据构成影响的绝对分——弧线的调节幅度因此显著增大。
 * 归一化参数随城市预计算一次，缓存在 POI_DB[city]._arousalScale 上。 */
function buildArousalScale(city) {
  const raws = city.pois.map(rawArousal);
  const lo = Math.min(...raws), hi = Math.max(...raws);
  city._arousalScale = { lo, hi, span: (hi - lo) || 1 };
  return city._arousalScale;
}

function moodOf(poi, city) {
  const sc = (city && city._arousalScale) || { lo: 0, hi: 1, span: 1 };
  const arousal = clamp01((rawArousal(poi) - sc.lo) / sc.span);
  return { vibe: vibeOf(poi), arousal };
}

/* 目标体验弧线：由节奏决定「形状」，由体验目标决定「整体高低」和「中段峰值」。
 * u ∈ [0,1] 为当天时间进度，返回该时刻理想的激活度。
 *
 * 【v2 可计算化】不再只用 mood.shift 一个标量，而是用三个可量化维度：
 *   - lively - relax  决定整体偏移（热闹度高则整体上移，放松度高则下移）
 *   - explore          决定中段峰值（探索欲强则中午前后出现一个人文高峰）
 * 这样用户调节滑块时，目标曲线是可计算、可预测的，不再是黑箱装饰。 */
function targetArousal(u, p) {
  let v;
  switch (p.paceKey) {
    case 'blitz':    v = 0.72 + 0.22 * Math.sin(Math.PI * Math.min(1, u * 1.05)); break;              // 持续高燃
    case 'full':     v = 0.5 + 0.36 * Math.pow(u, 0.85) - (u > 0.82 ? (u - 0.82) * 1.15 : 0); break;  // 渐强收束
    case 'moderate': v = 0.48 + 0.24 * Math.sin(Math.PI * u * 0.9 + 0.3); break;                      // 双峰起伏
    case 'chill':    v = 0.3 + 0.24 * u; break;                                                       // 低平缓升
    default:         v = 0.5;
  }
  /* 体验目标驱动弧线（优先级高于 mood.shift）。
   * offset: 热闹度 - 放松度，范围 [-1, 1]，×0.4 后为 [-0.4, 0.4]
   * peak:   探索欲在 u=0.5 附近叠加一个正弦峰，×0.3 */
  const g = p.experienceGoals || { relax: 0.5, explore: 0.5, lively: 0.5 };
  const offset = (g.lively - g.relax) * 0.4;
  const peak = g.explore * 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.1));
  /* mood.shift 作为兜底微调（用户没动滑块时仍起作用） */
  const moodShift = p.mood ? p.mood.shift : 0;
  return clamp01(v + offset + peak + moodShift);
}

/* 取任务文案：兼容旧字符串格式和新对象格式，始终返回纯文本 */
function narrativeOf(poi) {
  const q = NARRATIVE_DB[poi.id];
  if (typeof q === 'string') return q;
  if (q && typeof q === 'object') return q.text;
  return poi.tip;
}

/* 取完整任务对象（含 type/difficulty/unlocks/chainTag）。
 * 旧字符串格式自动包装为 {text, type:'auto', difficulty:1, unlocks:[], chainTag:''}。 */
function questOf(poi) {
  const q = NARRATIVE_DB[poi.id];
  if (typeof q === 'string') return { text: q, type: 'auto', difficulty: 1, unlocks: [], chainTag: '' };
  if (q && typeof q === 'object') {
    return {
      text: q.text || poi.tip,
      type: q.type || 'auto',
      difficulty: q.difficulty || 1,
      unlocks: q.unlocks || [],
      chainTag: q.chainTag || ''
    };
  }
  return { text: poi.tip || '', type: 'auto', difficulty: 1, unlocks: [], chainTag: '' };
}

/* ---------- POI 富媒体：图片 + 地图导航链接（动态生成，不占存储） ---------- */

/* POI 封面图：优先用 poi 自带 image，其次按最高权重标签取分类精选图，
 * 都没有则降级为 SVG 渐变占位（data URI，无需网络）。 */
function imageOf(poi) {
  if (poi.image) return poi.image;
  // 1. 著名景点专属照片（按名称匹配）
  const sp = poiSpecificPhoto(poi.name);
  if (sp) return sp;
  // 2. 分类图
  const topTag = Object.entries(poi.tags || {}).sort((a, b) => b[1] - a[1])[0];
  if (topTag && POI_IMAGE_MAP[topTag[0]]) {
    const arr = POI_IMAGE_MAP[topTag[0]];
    if (Array.isArray(arr)) {
      let h = 0;
      const s = (poi.id || poi.name || '') + '';
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return arr[h % arr.length];
    }
    return arr;
  }
  return poiFallbackImage(poi);
}

/* 生成地图导航链接：用高德地图 URI，直接定位到 POI 坐标。
 * H5 端打开新窗口，小程序端用 wx.openLocation。 */
function mapUrlOf(poi) {
  if (poi.mapUrl) return poi.mapUrl;
  const name = encodeURIComponent(poi.name);
  return `https://uri.amap.com/marker?position=${poi.lng},${poi.lat}&name=${name}`;
}

/* 深度体验时段：值得把手机收起来的整块时间 */
function isOffline(poi) {
  return OFFLINE_IDS.has(poi.id) && poi.hours >= 1.2;
}

/* 行前记忆卡：把一天的要点压成"出发前看一眼"的短句列表（现场不必再翻手机） */
function memoryCards(day) {
  return day.timeline.map((t, i) => ({
    no: i + 1,
    name: t.poi.name,
    arrive: t.arrive,
    vibe: t.poi.mood.vibe,
    quest: narrativeOf(t.poi),
    offline: isOffline(t.poi)
  }));
}

/* 按当天的情绪序列自动生成「章节名」 */
function dayTitle(tl) {
  if (!tl || !tl.length) return '自由一日';
  const vs = tl.map(t => t.poi.mood.vibe);
  const first = vs[0], last = vs[vs.length - 1];
  const count = {};
  vs.forEach(v => { count[v] = (count[v] || 0) + 1; });
  const dom = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];

  if (first === 'zen' && (last === 'thrill' || last === 'warm')) return '白日静好 · 入夜有声';
  if (first === 'zen' && last === 'zen') return '慢煮时光';
  if (dom === 'learn' && last !== 'thrill') return '翻开一城的故事';
  if (dom === 'warm') return '烟火人间';
  if (dom === 'thrill') return '电量拉满的一天';
  if (dom === 'fun') return '撒欢进行时';
  if (first === 'learn' || first === 'zen') return '由静入闹';
  return '渐入佳境';
}

/* ---------- 体验节奏（改进①）：让情绪曲线可计算、可量化展示 ---------- */

/* 计算一天的「体验节奏」数据：每个点位的实际激活度 vs 该时刻的目标激活度，
 * 以及整段行程的弧线贴合度评分（0~100，越高越贴合用户设定的体验目标）。
 * 这是结果页「体验节奏」面板的数据源——情绪曲线不再只是装饰，而是可计算的指标。 */
function experienceRhythm(day, profile) {
  if (!day || !day.timeline || !day.timeline.length) return { points: [], fitScore: 0 };
  const pace = profile.pace;
  const points = day.timeline.map(t => {
    const u = Math.min(1, (t.startHour - pace.start) / Math.max(1, pace.endHour - pace.start));
    const target = targetArousal(u, profile);
    const actual = t.poi.mood ? t.poi.mood.arousal : 0.5;
    return {
      name: t.poi.name,
      vibe: t.poi.mood ? t.poi.mood.vibe : 'zen',
      target: +target.toFixed(3),
      actual: +actual.toFixed(3),
      diff: +(actual - target).toFixed(3),
      fit: Math.round(Math.max(0, 1 - Math.abs(actual - target)) * 100),
      hour: t.startHour
    };
  });
  // 贴合度：1 - 归一化均方误差，映射到 0~100
  const mse = points.reduce((s, p) => s + (p.diff * p.diff), 0) / points.length;
  const fitScore = Math.round(Math.max(0, 100 - mse * 400));
  return { points, fitScore };
}

/* ---------- 剧情任务链（改进②）：任务完成 → 解锁 → 路线变化 ---------- */

/* 返回整条行程的任务清单：每个点位的任务、类型、完成状态、解锁关系。
 * 供结果页渲染「任务清单」面板，用户勾选完成后可触发重排。 */
function questChain(plan, profile) {
  const completed = new Set(profile.completedQuests || []);
  const items = [];
  (plan.days || []).forEach(day => {
    (day.timeline || []).forEach(t => {
      const q = questOf(t.poi);
      const isDone = completed.has(t.poi.id);
      items.push({
        poiId: t.poi.id,
        name: t.poi.name,
        day: day.index + 1,
        text: q.text,
        type: q.type,
        typeLabel: (QUEST_TYPE_META[q.type] || {}).label || '探索',
        typeEmoji: (QUEST_TYPE_META[q.type] || {}).emoji || '📍',
        difficulty: q.difficulty,
        chainTag: q.chainTag,
        unlocks: q.unlocks,
        done: isDone
      });
    });
  });
  // 统计任务链进度
  const chainStats = {};
  items.forEach(it => {
    if (!it.chainTag) return;
    if (!chainStats[it.chainTag]) chainStats[it.chainTag] = { total: 0, done: 0 };
    chainStats[it.chainTag].total++;
    if (it.done) chainStats[it.chainTag].done++;
  });
  return { items, chainStats, total: items.length, done: items.filter(i => i.done).length };
}

/* 纯函数：标记某个任务完成，返回更新后的 completedQuests 列表。
 * 调用方用新列表重新 buildProfile → planItinerary，即可看到解锁 POI 的路线变化。 */
function completeQuest(profile, poiId) {
  const set = new Set(profile.completedQuests || []);
  set.add(poiId);
  return Array.from(set);
}

/* 根据已完成任务，计算任务类型分布，反哺兴趣权重（任务模式下生效）。
 * 例如完成了 3 个 history 任务，则 weights.history += 0.3 * (3 / 总任务数)。 */
function questWeightBoost(profile) {
  if (!profile.questMode) return {};
  const completed = profile.completedQuests || [];
  if (!completed.length) return {};
  const typeCount = {};
  completed.forEach(qid => {
    const q = NARRATIVE_DB[qid];
    if (q && typeof q === 'object' && q.type && q.type !== 'auto') {
      typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    }
  });
  const boost = {};
  Object.entries(typeCount).forEach(([type, cnt]) => {
    const qm = QUEST_TYPE_META[type];
    if (qm) boost[qm.tag] = (boost[qm.tag] || 0) + 0.15 * cnt;
  });
  return boost;
}

/* ---------- 自定义添加 POI（会话级，不污染官方数据） ---------- */

/* 用户手动添加一个宝藏地到某座城市的 POI 池。
 * 输入：cityKey, {name, lat, lng, tags:{}, hours, cost, intensity, ...}
 * 返回新 POI 的 id（格式 u_时间戳）。
 * 不写入官方分片，但持久化到 localStorage（qt_custom_pois_v1），
 * 刷新后经 injectCustomPOIs 注回，跨会话保留。 */
function addCustomPOI(cityKey, poiData) {
  const city = POI_DB[cityKey];
  if (!city) return null;
  const id = 'u_' + Date.now();
  const poi = Object.assign({
    id,
    name: poiData.name || '自定义地点',
    area: poiData.area || '自定义',
    lat: poiData.lat || 0,
    lng: poiData.lng || 0,
    tags: poiData.tags || {},
    hours: poiData.hours || 2,
    cost: poiData.cost || 1,
    intensity: poiData.intensity || 1,
    indoor: !!poiData.indoor,
    best: poiData.best || ['morning', 'afternoon', 'evening'],
    crowd: poiData.crowd || 2,
    tip: poiData.tip || '你添加的宝藏地',
    src: '用户投稿（待审核）',
    _custom: true
  }, poiData);
  city.pois.push(poi);
  // 重新计算该城激活度归一化（新增点可能改变 min/max）
  buildArousalScale(city);
  city.pois.forEach(p => { p.mood = moodOf(p, city); });
  // 持久化：刷新 / 重新进入城市后仍然在
  if (typeof Store !== 'undefined' && Store.saveCustomPOI) Store.saveCustomPOI(cityKey, poi);
  return id;
}

/* 城市分片加载完成后，把用户持久化的自定义点位注回 POI 池（按 id 去重）。 */
function injectCustomPOIs(cityKey, city) {
  if (typeof Store === 'undefined' || !Store.listCustomPOIs) return;
  const saved = Store.listCustomPOIs(cityKey);
  if (!saved || !saved.length) return;
  let added = 0;
  saved.forEach(sp => {
    if (!sp || !sp.id) return;
    if (city.pois.some(p => p.id === sp.id)) return;
    city.pois.push(Object.assign({ _custom: true }, sp));
    added++;
  });
  if (added) {
    buildArousalScale(city);
    city.pois.forEach(p => { p.mood = moodOf(p, city); });
  }
}

/* 删除一个自定义点位（内存 + 持久化），并重算激活度。 */
function removeCustomPOI(cityKey, id) {
  const city = POI_DB[cityKey];
  if (city) {
    const i = city.pois.findIndex(p => p.id === id && p._custom);
    if (i >= 0) {
      city.pois.splice(i, 1);
      buildArousalScale(city);
      city.pois.forEach(p => { p.mood = moodOf(p, city); });
    }
  }
  if (typeof Store !== 'undefined' && Store.deleteCustomPOI) Store.deleteCustomPOI(cityKey, id);
}

/* 重命名一个自定义点位（内存 + 持久化）。 */
function renameCustomPOI(cityKey, id, name) {
  const city = POI_DB[cityKey];
  if (city) {
    const p = city.pois.find(x => x.id === id && x._custom);
    if (p) p.name = name;
  }
  if (typeof Store !== 'undefined' && Store.renameCustomPOI) Store.renameCustomPOI(cityKey, id, name);
}

/* ---------- 用户投稿（本地队列，待审核） ---------- */

/* 投稿一条宝藏地信息，存入本地队列（不直接入库）。
 * 实际项目中会上传到服务端审核，这里用 Store 本地存储模拟。 */
function submitGem(gemData) {
  try {
    if (typeof Store !== 'undefined' && Store.submitGem) {
      return Store.submitGem(gemData);
    }
  } catch (e) { }
  // Store 不可用时返回模拟结果
  return { ok: true, id: 'gem_' + Date.now(), status: 'pending', msg: '已记录，待审核' };
}

/* ---------- 1. 画像构建 ---------- */

/* 读取用户设置的出发地（Store 不可用时返回空，下游自动跳过首末天联动） */
function readHomeKey() {
  try {
    if (typeof Store !== 'undefined' && Store.getHome) return Store.getHome() || '';
  } catch (e) { }
  return '';
}

function buildProfile(ans) {
  // 兴趣权重：第一个选中的（主兴趣）1.0，其余 0.72 递减其影响力，
  // 未选中保留 0.12 基线（避免完全错杀）。
  // 设计意图：9 选 4 的勾选顺序本身表达偏好强度——
  // 「美食+夜生活」和「夜生活+美食」应当走出两条不同的路线（千人千面）。
  const weights = {};
  Object.keys(TAG_META).forEach(k => { weights[k] = 0.12; });
  (ans.interests || []).forEach((k, i) => { weights[k] = i === 0 ? 1.0 : 0.72; });

  const company = COMPANY_CFG[ans.company];
  // 同行者偏好叠加到兴趣权重上。
  // 用户明确勾选的兴趣：company 加成打四折——
  // 否则「朋友同行」的夜生活加成会把所有路线拉向夜市，淹没用户主诉（千人千面）。
  Object.entries(company.boost).forEach(([k, v]) => {
    if (weights[k] !== undefined) {
      const damp = (ans.interests || []).includes(k) ? 0.4 : 1;
      weights[k] += v * damp;
    }
  });
  Object.entries(company.penalty).forEach(([k, v]) => {
    if (weights[k] !== undefined) weights[k] = Math.max(0.02, weights[k] - v);
  });

  /* 任务模式反哺：已完成的任务类型会强化对应兴趣权重（做任务改变路线偏好）。
   * 例如完成 2 个 history 任务 → weights.history += 0.3，后续更倾向人文点位。 */
  if (ans.questMode && ans.completedQuests && ans.completedQuests.length) {
    const typeCount = {};
    ans.completedQuests.forEach(qid => {
      const q = NARRATIVE_DB[qid];
      if (q && typeof q === 'object' && q.type && q.type !== 'auto') {
        typeCount[q.type] = (typeCount[q.type] || 0) + 1;
      }
    });
    Object.entries(typeCount).forEach(([type, cnt]) => {
      const qm = QUEST_TYPE_META[type];
      if (qm && weights[qm.tag] !== undefined) {
        weights[qm.tag] += 0.15 * cnt;
      }
    });
  }

  const moodKeys = (ans.mood && ans.mood.length) ? ans.mood : ['healed'];
  /* 体验目标：优先用用户显式设置的滑块值；没设则用所选心情的默认值。
   * 三个维度取均值（多心情时平均），保证 0~1 区间。 */
  const defaultGoals = moodKeys.reduce((acc, k) => {
    const g = (MOOD_CFG[k] && MOOD_CFG[k].goals) || { relax: 0.5, explore: 0.5, lively: 0.5 };
    acc.relax += g.relax; acc.explore += g.explore; acc.lively += g.lively;
    return acc;
  }, { relax: 0, explore: 0, lively: 0 });
  Object.keys(defaultGoals).forEach(k => { defaultGoals[k] /= moodKeys.length; });
  const experienceGoals = Object.assign({}, defaultGoals, ans.experienceGoals || {});

  const profile = {
    city: ans.city,
    days: ans.days,
    interests: ans.interests || [],
    anchors: ans.anchors || [],   // 必去锚点（POI id 列表），透传给 planItinerary
    weights,
    moodKeys,
    mood: {
      vibes: [...new Set(moodKeys.flatMap(k => MOOD_CFG[k].vibes))],
      shift: moodKeys.reduce((s, k) => s + MOOD_CFG[k].shift, 0) / moodKeys.length,
      label: moodKeys.map(k => MOOD_CFG[k].label).join(' · ')
    },
    experienceGoals,              // 可量化体验目标 {relax, explore, lively}，驱动 targetArousal
    questMode: !!ans.questMode,   // 是否开启「做任务」模式
    completedQuests: ans.completedQuests || [],  // 已完成任务的 POI id 列表
    distanceOnly: !!ans.distanceOnly,  // 对比模式：纯距离+热度，忽略兴趣/心情/任务
    pace: PACE_CFG[ans.pace],
    paceKey: ans.pace,
    company: company,
    companyKey: ans.company,
    budget: BUDGET_CFG[ans.budget],
    budgetKey: ans.budget,
    stamina: STAMINA_CFG[ans.stamina],
    staminaKey: ans.stamina,
    /* 出发地（用于首末天与往返交通联动）。优先用 answers 里带的；
       没有则尝试读本地设置。同城/无出发地时下游会自动跳过联动。 */
    home: ans.home || readHomeKey()
  };

  /* 夜猫子作息：主兴趣是夜生活（或夜权重 ≥1.2）时，出发与收工整体后移 2 小时。
   * 「夜行生物上午 10 点出发」和「味觉猎人上午 10 点出发」是两份体感完全不同的行程——
   * 哪怕点位有重叠，时间轴与叙事也必须分叉（千人千面的可感知差异）。 */
  if ((weights.night || 0) >= 1.2) {
    profile.pace = Object.assign({}, profile.pace, {
      start: Math.min(12, profile.pace.start + 2),
      endHour: Math.min(24, profile.pace.endHour + 1.5),
      label: profile.pace.label
    });
    profile.nightOwl = true;
  }
  profile.persona = buildPersona(profile);
  profile.radar = buildRadar(weights);
  return profile;
}

function buildRadar(weights) {
  const max = Math.max(...Object.values(weights));
  return Object.keys(TAG_META).map(k => ({
    key: k,
    label: TAG_META[k].label,
    value: Math.round(Math.min(1, weights[k] / (max || 1)) * 100)
  }));
}

const PERSONA_RULES = [
  { key: 'family',  name: '遛娃总指挥',   desc: '一切以娃能玩、能坐、能吃为标准' },
  { key: 'food',    name: '味觉猎人',     desc: '地图在他眼里是一张菜单' },
  { key: 'nature',  name: '山海追随者',   desc: '宁可少一个景点，也要多一片风景' },
  { key: 'history', name: '考据派旅人',   desc: '不做功课不出门，讲解器全程在线' },
  { key: 'photo',   name: '光影捕手',     desc: '为了一个机位愿意多等四十分钟' },
  { key: 'art',     name: '街巷漫游者',   desc: '专挑没有游客的小路走' },
  { key: 'night',   name: '夜行生物',     desc: '白天的行程只是热身' },
  { key: 'shop',    name: '购物车旅人',   desc: '行李箱永远去程半空、回程超重' },
  { key: 'relax',   name: '慢下来的人',   desc: '旅行不是打卡，是换个地方待着' }
];

function buildPersona(p) {
  let best = null;
  PERSONA_RULES.forEach(r => {
    const w = p.weights[r.key];
    if (!best || w > best.w) best = { w, r };
  });

  const paceWord = { blitz: '强度拉满', full: '密度可观', moderate: '张弛有度', chill: '极度松弛' }[p.paceKey];
  const extras = [];
  if (p.nightOwl) extras.push('中午才出发 · 深夜才收工');
  if (p.paceKey === 'blitz') extras.push('日均 5 个点起步');
  if (p.paceKey === 'chill') extras.push('每天只留两件事');
  if (p.staminaKey === 'low') extras.push('全程避开爬坡与长距离步行');
  if (p.companyKey === 'elder') extras.push('减少排队与人流密集区');
  if (p.companyKey === 'family') extras.push('优先室内备选与儿童友好设施');
  if (p.budgetKey === 'economy') extras.push('以免费与低消景点为主');
  if (p.budgetKey === 'premium') extras.push('门票与体验类项目不设上限');

  return {
    name: best ? best.r.name : '自由派旅人',
    desc: best ? best.r.desc : '什么都想看看，什么都不执着',
    paceWord,
    extras
  };
}

/* ---------- 2. 距离与工具 ---------- */

function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* "14:35" -> 14.583…；非法输入返回 null（首末天联动时容错用） */
function parseHHMM(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h + mi / 60;
}

/* 就近取半小时刻（排程地板/上限都按半小时对齐，跟其他节奏参数一致） */
function roundToHalf(v) { return Math.round(v * 2) / 2; }

/* 时段四级：
 *  -1 早鸟（错过就要看石头/睡熊猫）  0 仅上午  2 灵活（下午去也没问题）
 *   3 纯夜场（只有天黑了才有意思）
 * 「下午+傍晚皆宜」归入灵活级，避免被 17:00 的夜场地板卡出半天空档 */
function slotRank(poi) {
  if (poi.early) return -1;
  const b = poi.best || ['morning', 'afternoon', 'evening'];
  if (b.length === 1 && b[0] === 'morning') return 0;   // 错过上午就没了
  if (b.length === 1 && b[0] === 'evening') return 3;   // 天黑才有意思
  return 2;                                             // 其余一律灵活
}

/* 灵活项(rank 2)内部的次级排序：越偏「白天」的越靠前，
 * 避免「适合白天」的点被时间地板挤到晚上（晚上去厦大只能看校门） */
function subRank(poi) {
  const b = poi.best || ['morning', 'afternoon', 'evening'];
  if (b.includes('morning')) return 0;
  if (b.includes('afternoon') && !b.includes('evening')) return 1;
  return 2;
}

const SLOT_LABEL = { 0: '上午', 1: '下午', 2: '晚上' };

function slotOfHour(h) {
  if (h < 12) return 0;
  if (h < 17.5) return 1;
  return 2;
}

/* ---------- 3. POI 打分 ---------- */

function scorePOI(poi, p) {
  const reasons = [];

  /* 对比模式（纯距离版）：忽略兴趣/心情/任务，只看热度。
   * 这样 planItinerary 的贪心最近邻会走出「按距离就近 + 顺路热门」的路线，
   * 作为轻途版的 A/B 对照基线。 */
  if (p.distanceOnly) {
    const s = (poi.crowd || 1) * 1.2;
    return { score: s, base: s, interScore: 0, reasons: [`热度 ${poi.crowd || 1}/3`] };
  }

  let s = 0;

  // (a) 兴趣匹配 —— 权重最高
  // 分母用「所有维度的权重之和」而非该点自身标签的权重之和，
  // 否则标签少的点会被人为抬高，复合型景点反被稀释。
  const wAll = Object.values(p.weights).reduce((a, b) => a + b, 0) || 1;
  let interSum = 0;
  Object.entries(poi.tags).forEach(([tag, strength]) => {
    interSum += (p.weights[tag] || 0) * strength;
  });
  const interScore = interSum / wAll;
  s += interScore * 8;
  const topTags = Object.entries(poi.tags)
    .sort((a, b) => b[1] - a[1]).slice(0, 2)
    .filter(([t]) => (p.weights[t] || 0) > 0.5)
    .map(([t]) => TAG_META[t].label);
  if (topTags.length) reasons.push(`契合你关注的「${topTags.join('、')}」`);

  // (b) 体力契合：硬过滤在 planItinerary 里做，这里做梯度惩罚
  if (p.staminaKey === 'low') s -= (poi.intensity - 1) * 0.85;
  else if (p.staminaKey === 'normal') s -= Math.max(0, poi.intensity - 2) * 1.6;
  if (poi.intensity === 1 && p.staminaKey === 'low') s += 0.4;

  // (c) 预算契合
  const budgetGap = Math.abs(poi.cost - p.budget.costTarget);
  s -= budgetGap * 0.55;
  if (poi.cost === 0) s += 0.25;

  // (d) 同行人群硬规则
  if (p.companyKey === 'family' && poi.intensity === 3) s -= 2.2;
  if (p.companyKey === 'elder' && poi.intensity === 3) s -= 2.5;
  if (p.companyKey === 'elder' && poi.crowd === 3) s -= 1.0;
  if (p.companyKey === 'family' && (poi.tags.family || 0) > 0.6) s += 1.8;
  if (p.companyKey === 'couple' && (poi.tags.photo || 0) > 0.7) s += 0.9;
  // 带娃不进酒吧街夜场
  if (p.companyKey === 'family' && (poi.tags.night || 0) > 0.7) s -= 3.2;

  // (e) 节奏：躺平党不喜欢耗时大项目；特种兵不喜欢太小的点
  if (p.paceKey === 'chill' && poi.hours >= 4) s -= 1.4;
  if (p.paceKey === 'blitz' && poi.hours <= 1.2) s -= 0.45;

  // (f) 拥挤度惩罚（长辈/躺平更敏感）
  const crowdSens = (p.companyKey === 'elder' || p.paceKey === 'chill') ? 0.55 : 0.28;
  s -= (poi.crowd - 1) * crowdSens;

  // (g) 情绪偏好：作为「一级编排约束」，这里不做点缀，而是可感知的加权
  //     情绪契合 · 兴趣分获得 1.35 倍，明显相悖者打 0.75 折。
  //     系数经多画像 A/B 校准：低于此区间时"松弛/撒欢"两条路线难以区分。
  if (p.mood) {
    if (!poi.mood) { const c = POI_DB[p.city]; poi.mood = moodOf(poi, c); }
    if (p.mood.vibes.includes(poi.mood.vibe)) s += interScore * 8 * 0.35 + 0.6;
    // 情绪错配惩罚：但兴趣强匹配(interScore>0.8)的旗舰点位减半，
    // 避免出现"历史画像在敦煌错过莫高窟"这类本末倒置
    else s -= interScore * 8 * (interScore > 0.8 ? 0.11 : 0.22);
  }

  // (h) 剧情任务联动（改进②）：让"做任务"真正改变路线选择
  const quest = questOf(poi);
  // 解锁加分：若本 POI 被已完成任务的 unlocks 指向，+0.5（类似锚点保送）
  const unlocked = (p.completedQuests || []).some(qid => {
    const uq = NARRATIVE_DB[qid];
    return uq && typeof uq === 'object' && (uq.unlocks || []).includes(poi.id);
  });
  if (unlocked) { s += 0.5; reasons.push('完成前置任务后解锁'); }
  // 任务模式下：任务类型与用户兴趣对齐时加分（完成这类任务会强化对应偏好）
  if (p.questMode && quest.type && quest.type !== 'auto') {
    const qm = QUEST_TYPE_META[quest.type];
    if (qm && (p.weights[qm.tag] || 0) > 0.5) {
      s += 0.25;
      reasons.push(`「${qm.label}」契合你的偏好`);
    }
  }

  return { score: s, base: s, interScore, reasons };
}

function transitHours(a, b, pace) {
  if (!a) return 0;
  const d = haversine(a, b);
  // 城市平均通行速度约 22km/h（含等车、停车、步行找路）
  return Math.max(0.25, d / 22) * pace.transit;
}

/* ---------- 4. 行程编排 ---------- */

function planItinerary(profile) {
  /* 城市兜底：profile.city 可能是空、拼错，或该城分片尚未就绪。
     之前会直接抛 "Cannot read properties of undefined (reading 'pois')"，
     整页白屏——用户什么都看不到，比"没排出行程"更糟。
     这里退到「第一个可用城市」，实在没有就返回一份空壳计划，
     让上层照常渲染（天数=0，UI 会提示换城市）。 */
  let city = POI_DB[profile.city];
  if (!city || !city.pois) {
    const fallbackKey = Object.keys(CITY_INDEX || {}).find(k => {
      const c = POI_DB[k];
      return c && c.pois && c.pois.length;
    });
    city = fallbackKey ? POI_DB[fallbackKey] : null;
  }
  if (!city) {
    return {
      city: { name: '未知城市', pois: [], center: [0, 0] }, days: [], backups: [], anchorMiss: [],
      stay: { areas: [], per: [], switchNote: '' },
      stats: buildStats([], profile)
    };
  }
  const pace = profile.pace;
  // 用户点名的「必去锚点」（POI id 列表）。不传时为空集，行为与历史版本逐位一致。
  const anchors = new Set(profile.anchors || []);

  // 预计算每个点位的情绪属性（vibe + 城市内归一化的 arousal）
  // 先建立该城的激活度归一化参数，再逐点推导，保证 0~1 区间被真正用满
  buildArousalScale(city);
  city.pois.forEach(poi => { poi.mood = moodOf(poi, city); });

  // 4.1 打分排序，建立候选池
  const scored = city.pois.map(poi => {
    const r = scorePOI(poi, profile);
    return { poi, ...r };
  });

  // 体力硬约束：直接剔除无法承受的项目（华山、青城山等）
  const pool = scored.filter(x => {
    if (x.poi.intensity > profile.stamina.maxIntensity) return false;
    // 躺平 + 天数少时不安排远郊整日项目
    if (pace.maxHours <= 5 && x.poi.hours >= 6) return false;
    return true;
  });

  // 4.1.5 旗舰保底：与用户兴趣最契合的城内招牌，直接保送为当日种子。
  // 背景：距市中心 >15km 的点（莫高窟 19km、兵马俑 35km）拼不进任何一天
  // （距离惩罚 ≈4 分），只能靠种子位入程；而纯分数竞争时「免费、近、情绪
  // 对味」的普通点会把它们全部挤出（敦煌漏莫高窟事故）。
  // 规则：按 兴趣契合度 + 热度·0.2 排名，榜首必保送；两天以上再保送一个
  // 距榜首 >12km、契合度达标的第二组团招牌。其余点位全部交给自然编排——
  // 远郊前哨（雅丹/阳关级）保送反而会把每天摊薄成孤点。
  // 门槛：全城最高契合度 <0.3 说明兴趣与该城基本无关，不强行安插。
  const landmarks = [];
  // 热度倾斜 0.2：保送位应偏向「游客必到」的磁体级点位——
  // 敦煌鸣沙山（crowd 5）不该以 0.03 分之差把 lm1 输给博物馆（crowd 4）
  const lmVal = x => (x.interScore || 0) + (x.poi.crowd || 1) * 0.2;
  const maxInter = Math.max(...pool.map(x => x.interScore || 0));
  if (maxInter >= 0.3 && pool.length) {
    const rank = pool.slice().sort((a, b) => lmVal(b) - lmVal(a));
    const bar = Math.max(0.5, lmVal(rank[0]) * 0.55);
    // 锚点须能撑起半天（h≥2.5）：演出、街市这类 2h 点当不好锚，却常凭
    // 复合标签的契合度分抢先当选（北京什刹海挤掉故宫的事故）。榜首同样受限。
    const top = rank.find(x => x.poi.hours >= 2.5);
    if (top) {
      landmarks.push(top);
      if (profile.days >= 2) {
        const second = rank.find(x => x !== top && lmVal(x) >= bar && x.poi.hours >= 2.5
          && haversine(top.poi, x.poi) > 12);
        if (second) landmarks.push(second);
      }
      // 加分让旗舰在备选池/换点建议里同样排在普通填充点之前
      landmarks.forEach(x => { x.score += 1.5; x.base += 1.5; });
    }
  }

  // 4.1.6 必去锚点：用户明确点名的点位（如「三清山」「篁岭」），
  // 只要通过体力/节奏硬过滤，一律优先占种子位——排在最前，压过自然旗舰。
  // 锚点数以天数为上限由调用侧保证；多出的锚点仍会保送，但可能排不进前 d 天。
  const anchorPois = pool.filter(x => anchors.has(x.poi.id));
  anchorPois.forEach(x => { x.score += 100; x.base += 100; x._anchor = true; });
  // 被硬过滤（体力/节奏）剔除的锚点，回传供 UI 提示「因体力设置已跳过」
  const anchorMiss = (profile.anchors || []).filter(id => !pool.some(x => x.poi.id === id));
  // 保底序列 = 锚点优先 + 自然旗舰（去重），逐天消费
  const lmSeq = anchorPois.concat(landmarks.filter(x => !anchors.has(x.poi.id)));

  // 4.2 按天分组：以「最高分点」为种子做地理贪心扩散
  // 候选池放宽到全部合格点：天数多时也能填满，质量由下面的 gain 阈值把关
  const ranked = pool.slice().sort((a, b) => b.score - a.score);
  const seedPool = ranked;
  const used = new Set();
  const days = [];

  for (let d = 0; d < profile.days; d++) {
    const avail = seedPool.filter(x => !used.has(x.poi.id));
    if (!avail.length) break;
    // 优先选「能带动一片」的种子：邻域内可用候选越多，这一天越容易排满。
    // 孤立的远郊点（例如汉阳陵）因此会往后排，而不是独占一天。
    // 另加远离市中心的梯度惩罚：日月山这类本该顺路捎带的远点，
    // 若凭兴趣分硬抢种子位，会把一整天摊成 2 小时的孤点。
    const center = { lat: city.center[0], lng: city.center[1] };
    const seedValue = c => c.score + Math.min(1.2,
      avail.filter(o => o.poi.id !== c.poi.id && haversine(o.poi, c.poi) <= 12).length * 0.3)
      - Math.max(0, haversine(center, c.poi) - 20) * 0.03;
    // 旗舰保底：这一天轮到的招牌/锚点直接当种子（未被体力/节奏过滤、未重复用）
    const lm = lmSeq[d] && !used.has(lmSeq[d].poi.id) ? lmSeq[d] : null;
    const seed = lm || avail.reduce((a, b) => seedValue(b) > seedValue(a) ? b : a);
    used.add(seed.poi.id);
    const dayItems = [seed];
    let hours = seed.poi.hours;
    let count = 1;

    // 两轮填充：第一轮要求候选确实「值这个路」；
    // 若当天太空（例如远郊整日项目独占一天之外的半天空档），第二轮逐级放宽阈值补位。
    // 阈值随"空得有多厉害"递减——天数多、空闲大时更要保证每天排满。
    const thresholds = [0.6, -0.6, -1.6, -3.2];
    for (let pass = 0; pass < thresholds.length; pass++) {
      const threshold = thresholds[pass];
      while (count < pace.maxSpots && hours < pace.maxHours) {
        let best = null;
        for (const cand of seedPool) {
          if (used.has(cand.poi.id)) continue;
          const poi = cand.poi;
          if (hours + poi.hours > pace.maxHours + 0.5) continue;

          // 与当天已选点的最小距离
          const minD = Math.min(...dayItems.map(x => haversine(x.poi, poi)));
          // 距离惩罚：同城跑越远越劝退，跨城区（>15km）额外重罚
          let distPenalty = minD * 0.11;
          if (minD > 15) distPenalty += 1.6;
          // 远郊整日项目不与其他点拼
          if (poi.hours >= 6 && dayItems.length > 0) continue;
          if (dayItems.some(x => x.poi.hours >= 6)) continue;

          // 纯夜场项配额：一天最多 2 个「只有天黑才有意思」的点。
          // 否则夜场会扎堆到同一天傍晚后，白天留出大半空档。
          if (slotRank(poi) === 3) {
            const eve = dayItems.filter(x => slotRank(x.poi) === 3).length;
            if (eve >= 2) continue;
          }

        const gain = cand.score - distPenalty;
        // 弧线贴合：候选点在该"剧情进度"的理想激活度 vs 点位实际激活度
        const u = Math.min(1, hours / pace.maxHours);
        const arcPenalty = Math.abs(poi.mood.arousal - targetArousal(u, profile)) * 1.7;
        // 情绪一致项：点位 vibe 与「想带走的感觉」明显相悖时额外劝退
        // （例如一心求"松弛"，却把高燃夜场塞进上午）
        const vibeMiss = (profile.mood && !profile.mood.vibes.includes(poi.mood.vibe)) ? 0.55 : 0;
        // 末轮救场只看分数与距离：这一天已近空，情绪欠佳的远点也强过空一天
        // （否则阳关/玉门关这类 49km 组合永远凑不成"西线一日"）
        const g = pass === thresholds.length - 1 ? gain : gain - arcPenalty - vibeMiss;
        if (!best || g > best.gain) best = { cand, gain: g, minD };
        }
        if (!best || best.gain < threshold) break;

        used.add(best.cand.poi.id);
        dayItems.push(best.cand);
        hours += best.cand.poi.hours + transitHours(dayItems[dayItems.length - 2].poi, best.cand.poi, pace);
        count++;
      }
      // 已经够满就不必放宽。门槛至少 3 点：适中节奏 maxSpots=3 时，
      // 若凑够 2 点就停，第三轮阈值永远不跑，好点会被卡在门外（敦煌漏鸣沙山）
      const enoughCount = Math.min(pace.maxSpots, Math.max(3, Math.ceil(pace.maxSpots * 0.6)));
      if (count >= enoughCount || hours >= pace.maxHours * 0.7) break;
    }

    days.push({ index: d, items: dayItems, rawHours: hours });
  }

  // 4.2.9 首末天与往返交通联动
  // 有了出发地之后：
  //  · 到达日要「到达之后才开始玩」→ 给一个 floorHour（不能早于落地点开始）；
  //  · 离开日要「提前收工去赶车」 → 给一个 capHour（超过就不排了，记成 dropNote）。
  // 多城时由 multi.js 显式传 homeIn / homeOut：
  //  · homeIn = 本段从哪城过来（第 1 段=出发地，中段=上一城）
  //  · homeOut = 本段离开后去哪城（末段=返回出发地，中段=下一城）
  // 单城不传时两者都退回 profile.home。没有出发地或同城时不设约束，
  // 行为与历史版本逐位一致。
  const dayBounds = { first: null, last: null };
  let arrivalNote = null, departNote = null;
  (() => {
    const key = profile.city;
    if (!key) return;
    const homeIn = profile.homeIn || profile.home || '';
    const homeOut = profile.homeOut || profile.home || '';

    /* 到达侧：从 homeIn 过来，落地/落站 + 进市区通勤之后才开玩 */
    if (homeIn && homeIn !== key) {
      let t = null;
      try { t = cityTransport(homeIn, key); } catch (e) { t = null; }
      if (t && !t.sameCity && t.departPlan) {
        const arriveH = parseHHMM(t.departPlan.outbound.arriveTime);
        if (arriveH != null) {
          dayBounds.first = { floorHour: roundToHalf(arriveH + t.arrive.min / 60) };
          arrivalNote = {
            time: t.departPlan.outbound.arriveTime,
            text: `当天约 ${t.departPlan.outbound.arriveTime} 抵达${t.arrive.station}，`
                + `再花约 ${t.arrive.min} 分钟进市区，行程从这之后才开始排`
          };
        }
      }
    }

    /* 离开侧：末段=赶返程回家（用回程班次的动身时刻）；
       中段=转场去下一城（用去程班次的出发时刻）。 */
    if (homeOut && homeOut !== key) {
      const home = profile.home || '';
      if (homeOut === home) {
        let t = null;
        try { t = cityTransport(homeOut, key); } catch (e) { t = null; }
        if (t && !t.sameCity && t.departPlan) {
          const leaveH = parseHHMM(t.departPlan.inbound.leaveTime);
          if (leaveH != null) {
            dayBounds.last = { capHour: roundToHalf(leaveH - 0.5) };   // 留 30 分钟往车站收尾
            departNote = {
              time: t.departPlan.inbound.leaveTime,
              text: `当天约 ${t.departPlan.inbound.leaveTime} 要动身去${t.arrive.station}，`
                  + `当天的安排会提前收工`
            };
          }
        }
      } else {
        let t = null;
        try { t = cityTransport(key, homeOut); } catch (e) { t = null; }
        if (t && !t.sameCity && t.departPlan) {
          const leaveH = parseHHMM(t.departPlan.outbound.leaveTime);
          if (leaveH != null) {
            dayBounds.last = { capHour: roundToHalf(leaveH - 0.5) };
            departNote = {
              time: t.departPlan.outbound.leaveTime,
              text: `当天约 ${t.departPlan.outbound.leaveTime} 要动身去${t.to}（转场下一城），`
                  + `当天的安排会提前收工`
            };
          }
        }
      }
    }
  })();

  // 4.3 时间轴编排与时段排序
  days.forEach(day => {
    const bounds = {};
    if (day.index === 0 && dayBounds.first) bounds.floorHour = dayBounds.first.floorHour;
    if (day.index === days.length - 1 && dayBounds.last) bounds.capHour = dayBounds.last.capHour;
    /* 同一天既当到达日又当离开日（一段一城的一日游），且「到达时刻 + 进市区」
       已经晚于「动身赶车」时，两个约束互斥——物理上装不下。此时不要 floorHour
       （它是估算），只留 capHour（车次是硬约束）；并把到达提示改写成一条
       「这天是硬塞的一日游」的说明，而不是直接删掉——否则用户看到 10:45 动身、
       却不知道自己是几点到的，会以为漏排了。 */
    if (bounds.floorHour != null && bounds.capHour != null && bounds.floorHour >= bounds.capHour) {
      delete bounds.floorHour;
      dayBounds.first = null;
      /* 到达/离开的合并提示在这里做（见下方 IIFE 之后的处理），
         这里只留一个标记，避免在 IIFE 内改外层的 arrivalNote/departNote。 */
      dayBounds.conflict = true;
    }
    day.timeline = scheduleDay(day.items, profile, bounds);
    /* 时间窗太紧把整天排空了（如「14:35 到站、16:00 赶车」的一日游）：
       按「让步代价」从小到大依次放宽，宁可提示会赶得紧，也不给用户一张白纸。
       ① 先放宽抵达地板 floorHour —— 早于到达时刻开玩只是行程偏理想，
          最坏情况是少走一个点，不会误车；
       ② 实在还不够，才放宽赶车上限 capHour —— 这时必须显式提示用户核实车次。
       顺序不能反：capHour 是「必须赶上的车」，物理上不可让步；
       floorHour 只是「大概几点能到」的估算，先松它才符合现实。 */
    if (!day.timeline.length && (bounds.floorHour != null || bounds.capHour != null)) {
      let relaxed = [];
      if (bounds.floorHour != null) {
        delete bounds.floorHour;
        relaxed.push('floor');
        day.timeline = scheduleDay(day.items, profile, bounds);
      }
      if (!day.timeline.length && bounds.capHour != null) {
        delete bounds.capHour;
        relaxed.push('cap');
        day.timeline = scheduleDay(day.items, profile, bounds);
      }
      if (relaxed.length) {
        day.tightWindow = relaxed;                 // 供 UI 判断提示口径
        if (relaxed.indexOf('floor') >= 0 && arrivalNote && day.index === 0) {
          arrivalNote = Object.assign({}, arrivalNote, {
            text: arrivalNote.text + '（这天安排得偏满，到站后不便歇脚，落地就可开走）'
          });
        }
        if (relaxed.indexOf('cap') >= 0 && departNote && day.index === days.length - 1) {
          departNote = Object.assign({}, departNote, {
            text: departNote.text + '（这天时间太紧，先按能玩的排，车次建议再核实）'
          });
        }
      }
    }
    // 首末天的时间约束回落：统一在 forEach 之后挂载（合并提示需要先算完）

    // 4.3.1 空档填补（定向嵌入版）：夜场型点位被 15:30/17:00 地板集中推到傍晚后，
    // 白天可能出现 2~5 小时空档。此前「插入后全局重排」会让桥接点被 subRank 吸到
    // 上午，下午空档原样保留；现改为把桥接点精确嵌入 gap 位置——
    // 前站收工 + 转场 + 桥接时长 + 转场 ≤ 后站开工才嵌入，其余站点时间一律不动。
    for (let fill = 0; fill < 2; fill++) {
      const tl = day.timeline;
      let gapIdx = -1, gapSize = 0;
      for (let i = 1; i < tl.length; i++) {
        const g = tl[i].startHour - tl[i - 1].endHour;
        if (g > 2.5 && g > gapSize) { gapSize = g; gapIdx = i; }
      }
      if (gapIdx < 0) break;
      const prevT = tl[gapIdx - 1], nextT = tl[gapIdx];
      const usedIds = new Set(day.timeline.map(t => t.poi.id));
      // 候选：灵活项(rank 2)、含下午属性、时长+前后转场能被 gap 容纳；
      // 按「评分 - 距离惩罚」排序后逐个尝试，第一个放得下的即嵌入
      const cands = seedPool
        .filter(x => !usedIds.has(x.poi.id) && !used.has(x.poi.id) && slotRank(x.poi) === 2
          && x.poi.best && x.poi.best.includes('afternoon')
          && x.poi.hours >= 1 && x.poi.hours <= gapSize - 0.3)
        .map(x => {
          const minD = Math.min(...day.timeline.map(t => haversine(t.poi, x.poi)));
          return { x, v: x.score - minD * 0.11 };
        })
        .sort((a, b) => b.v - a.v);

      let done = false;
      for (const { x } of cands) {
        const tr1 = transitHours(prevT.poi, x.poi, pace);
        const start = prevT.endHour + tr1;
        const end = start + x.poi.hours;
        if (end + transitHours(x.poi, nextT.poi, pace) > nextT.startHour) continue; // 放不下，试下一个
        // 定向嵌入：只动 gap，其余站点保持原时间
        const entry = {
          ...x,
          slot: slotOfHour(start),
          transitFrom: tr1,
          distFrom: haversine(prevT.poi, x.poi),
          startHour: start,
          endHour: end,
          arrive: fmtHour(start),
          leave: fmtHour(end)
        };
        nextT.transitFrom = nextT.startHour - end;
        nextT.distFrom = haversine(x.poi, nextT.poi);
        tl.splice(gapIdx, 0, entry);
        used.add(x.poi.id);
        day.items = tl;              // 保持 items 与 timeline 同步
        done = true;
        break;
      }
      if (!done) {
        // 退路：试排——定向嵌入放不下时（如后站是带地板的夜场链），
        // 把候选并入当天全局重排，仅当「最大空档被压缩且收工不超标」才接受
        for (const { x } of cands) {
          const trial = scheduleDay([...tl, x], profile);
          let maxGap = 0;
          for (let i = 1; i < trial.length; i++) {
            maxGap = Math.max(maxGap, trial[i].startHour - trial[i - 1].endHour);
          }
          if (maxGap < gapSize && trial[trial.length - 1].endHour <= pace.endHour) {
            day.timeline = trial;
            used.add(x.poi.id);
            day.items = trial;
            done = true;
            break;
          }
        }
      }
      if (!done) break;
    }

    // 收工过晚会拖垮体验：超出该节奏的 endHour 就砍掉最后一站（通常是夜场项）
    // 末天有 capHour 时以 capHour 为界（要赶返程），否则用节奏的 endHour。
    const endLimit = (bounds.capHour != null) ? bounds.capHour : pace.endHour;
    let guard = 0;
    while (day.timeline.length > 1 && guard++ < 5) {
      if (day.timeline[day.timeline.length - 1].endHour <= endLimit) break;
      day.items = day.timeline.slice(0, -1);
      day.timeline = scheduleDay(day.items, profile, bounds);
    }
    /* 记录被末天 capHour 挤掉的项目，让用户知道「不是没排，是来不及」。
       口径用 departNote.time（真实动身时刻），而不是 bounds.capHour
       —— capHour 是「留了 30 分钟收尾」的内部值，写出来会和
       「当天约 10:45 要动身」互相打架，用户会以为排错了。 */
    if (bounds.capHour != null) {
      const cache = scheduleDay(day.items, profile, {});
      const kept = new Set(day.timeline.map(t => t.poi.id));
      const cut = cache.filter(t => !kept.has(t.poi.id)).map(t => t.poi.name);
      if (cut.length) {
        const capTime = (departNote && departNote.time) ? departNote.time : fmtHour(bounds.capHour);
        day.dropNote = { capTime, names: cut };
      }
    }
    day.items = day.timeline;   // 保持 items 与 timeline 同序，便于按索引替换
    day.title = dayTitle(day.timeline);
    day.arc = day.timeline.map(t => ({ h: t.startHour, a: t.poi.mood.arousal, vibe: t.poi.mood.vibe }));
    day.memory = memoryCards(day);
    day.offlineHours = day.timeline.filter(t => isOffline(t.poi)).reduce((s, t) => s + t.poi.hours, 0);
    day.endTime = day.timeline.length ? day.timeline[day.timeline.length - 1].endHour : pace.start;
    day.walkHours = day.timeline.reduce((s, t) => s + t.poi.hours, 0);
    day.driveHours = day.timeline.reduce((s, t) => s + t.transitFrom, 0);
    day.areas = [...new Set(day.timeline.map(t => t.poi.area))];
  });

  /* 到达日与离开日撞在同一天、且时间窗自相矛盾（到得比走得还晚）时，
     把两条提示合并成一条。分开写会在同一张卡上同时出现「约 14:00 落站」
     和「约 10:45 动身」，用户会以为引擎排错了。合并后把到达与动身时刻
     一起交代清楚，再撤掉 departNote（信息已含在合并文案里），只留一条。 */
  if (dayBounds.conflict && arrivalNote && departNote) {
    arrivalNote = {
      time: arrivalNote.time,
      text: `这天到得晚、走得也早：约 ${arrivalNote.time} 落站，又要赶 ${departNote.time} 的车，`
          + `所以只排得下最想去的一两处，其余留到下次`
    };
    departNote = null;
  } else if (dayBounds.conflict) {
    arrivalNote = null;
  }

  /* 首末天的时间约束回落：拿到就挂到 day 上，供 UI/导出显示。
     放在合并提示之后，保证 UI 拿到的是最终文案。 */
  if (days.length) {
    if (arrivalNote) days[0].arrivalNote = arrivalNote;
    if (departNote) days[days.length - 1].departNote = departNote;
  }

  // 4.4 备选池（未入选但分数不差的点）
  const allUsed = new Set(days.flatMap(d => d.items.map(x => x.poi.id)));
  const backups = pool
    .filter(x => !allUsed.has(x.poi.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const stay = stayPlan(days, profile.city, profile);
  days.forEach((d, i) => { d.stay = stay.per[i]; });

  return {
    city,
    days,
    backups,
    stay,
    anchorMiss,
    stats: buildStats(days, profile)
  };
}

/* 将一天的点位排序并排出时间轴（替换/删除站点后可复用重算）
 * 时段地板：上午项从出发时间起排，灵活项不早于 11:00，夜场项不早于 17:00。
 * 若一整天都是夜场型（例如纯美食/夜生活画像），则整体推迟到下午出门。 */
function scheduleDay(items, profile, bounds) {
  const pace = profile.pace;
  const sorted = items.slice().sort((a, b) => {
    const ra = slotRank(a.poi), rb = slotRank(b.poi);
    if (ra !== rb) return ra - rb;
    const sa = subRank(a.poi), sb = subRank(b.poi);
    if (sa !== sb) return sa - sb;
    return b.score - a.score;
  });

  const ranks = sorted.map(x => slotRank(x.poi));
  const allEvening = ranks.length > 0 && ranks.every(r => r === 3);
  const hasEarly = ranks.includes(-1);
  // 夜场型整天 → 下午再出门；含早鸟项 → 比常规节奏提前
  let cur = allEvening ? Math.max(pace.start, 14)
          : hasEarly ? Math.min(pace.start, 8.5)
          : pace.start;

  /* 首末天与交通联动：
     - floorHour：当天不能早于这个点开始（刚落地/刚出站，还在路上）
     - capHour  ：当天最晚排到这个点，超出的项目不硬塞，记为「来不及」 */
  const floorHour = bounds && typeof bounds.floorHour === 'number' ? bounds.floorHour : null;
  const capHour = bounds && typeof bounds.capHour === 'number' ? bounds.capHour : null;
  if (floorHour != null) cur = Math.max(cur, floorHour);

  const dropped = [];

  const timeline = sorted.map((x, i) => {
    const prev = i > 0 ? sorted[i - 1].poi : null;
    const rank = ranks[i];
    // 纯夜场项的地板：首项 15:00（夜市下午就开）；
    // 若上午就收工了，硬等到 17:00 会空出大半天，此时提前到 15:30 当作午休后的下午场。
    let floor = -1;
    if (rank === 3) floor = (i === 0 ? 15 : (cur < 13.5 ? 15.5 : 17));
    else if (rank === 2 && i > 0) floor = 11;   // 11:00 地板只约束非首项，别把上午空出来
    const tr = transitHours(prev, x.poi, pace);
    const dist = prev ? haversine(prev, x.poi) : 0;
    const arrive = Math.max(cur + tr, floor);
    const leave = arrive + x.poi.hours;
    const gap = arrive - cur;          // 实际间隔 = 转场时间 + 等待时间
    cur = leave;
    return {
      ...x,
      slot: slotOfHour(arrive),
      transitFrom: gap,
      distFrom: dist,
      startHour: arrive,
      endHour: leave,
      arrive: fmtHour(arrive),
      leave: fmtHour(leave),
      __ok: capHour == null || leave <= capHour
    };
  }).filter(t => {
    if (t.__ok) { delete t.__ok; return true; }
    dropped.push(t);
    return false;
  });

  /* 保底：capHour 卡得太死会把点全部丢光，整天变成一张白纸（比"赶不上车"
     更糟——用户看到的是"这天什么都没有"）。此时留一项：优先留原本排第一、
     最接近 capHour 能收尾的那个，让用户至少有个起点，剩余记为"来不及"。 */
  if (!timeline.length && dropped.length) {
    let rescue = 0;
    for (let i = 1; i < dropped.length; i++) {
      if (dropped[i].endHour < dropped[rescue].endHour) rescue = i;
    }
    const keep = dropped.splice(rescue, 1)[0];
    timeline.push(keep);
    if (keep.__ok !== undefined) delete keep.__ok;
  }

  if (dropped.length) {
    timeline.dropped = dropped.map(t => t.poi.name);
  }
  return timeline;
}

function buildStats(days, p) {
  const ticketMap = [0, 45, 110, 220];
  let tickets = 0, totalHours = 0, dist = 0, poiCount = 0, offline = 0;
  days.forEach(d => d.timeline.forEach(t => {
    tickets += ticketMap[t.poi.cost];
    totalHours += t.poi.hours;
    dist += t.distFrom;
    poiCount++;
    if (isOffline(t.poi)) offline += t.poi.hours;
  }));

  const dayCount = days.length;
  const base = p.budget.perDay * dayCount;
  const meals = Math.round(base * 0.5);
  const local = Math.round(base * 0.18 + dist * 1.6);
  const misc = Math.round(base * 0.12);

  return {
    poiCount,
    dayCount,
    ticket: tickets,
    meals,
    local,
    misc,
    total: tickets + meals + local + misc,
    totalHours: Math.round(totalHours * 10) / 10,
    dist: Math.round(dist * 10) / 10,
    offlineHours: Math.round(offline * 10) / 10
  };
}

/* ---------- 5. 单点替换 ---------- */

function suggestSwaps(plan, dayIndex, poiId, profile) {
  const day = plan.days[dayIndex];
  const used = new Set(plan.days.flatMap(d => d.timeline.map(t => t.poi.id)));
  const target = day.timeline.find(t => t.poi.id === poiId);
  if (!target) return [];

  const center = {
    lat: day.timeline.reduce((s, t) => s + t.poi.lat, 0) / day.timeline.length,
    lng: day.timeline.reduce((s, t) => s + t.poi.lng, 0) / day.timeline.length
  };

  /* 换站候选必须来自「这一天所属的那座城」，多城串联时不能用第一城的池子 */
  const dayCity = day.cityKey || profile.city;

  const altScored = (POI_DB[dayCity] ? POI_DB[dayCity].pois : [])
    .filter(poi => !used.has(poi.id) && poi.intensity <= profile.stamina.maxIntensity)
    .map(poi => ({ poi, ...scorePOI(poi, profile) }));

  /* plan.backups 理论上有值（单城由 planItinerary 填、多城由 multi.js 并集），
     但仍兜一层：缺字段时只靠本城 altScored，不要让「换一个」整个按钮报错。 */
  return (plan.backups || [])
    .concat(altScored)
    .filter((x, i, arr) => arr.findIndex(y => y.poi.id === x.poi.id) === i)
    .map(x => {
      const d = haversine(center, x.poi);
      return { ...x, distToDay: d, swapScore: x.score - d * 0.05 };
    })
    .sort((a, b) => b.swapScore - a.swapScore)
    .slice(0, 4);
}

/* ---------- 6. 导出文本 ---------- */

/* 行前记忆卡文本：打印或存图带走，路上不必再翻手机 */
function memoryText(plan) {
  const L = ['【出发前看一眼·行程要点】', ''];
  plan.days.forEach(d => {
    L.push(`第 ${d.index + 1} 天 · ${d.title}`);
    d.memory.forEach(m => {
      L.push(`${m.no}. ${m.name}（${m.arrive}${m.offline ? ' · 建议手机入袋' : ''}）`);
      L.push(`   ${m.quest}`);
    });
    L.push('');
  });
  L.push('提示：以上内容看一眼就够，路上不必再打开行程。');
  return L.join('\n');
}

function exportText(plan, profile) {
  const L = [];
  /* 多城串联时标题写「上饶 → 杭州」，单城写城市名（保持旧输出不变） */
  const title = (plan.multi && plan.trips && plan.trips.length > 1)
    ? plan.trips.map(t => t.city.name).join(' → ')
    : plan.city.name;
  L.push(`【${title} · ${profile.days}天个性化行程】`);
  L.push(`旅行人格：${profile.persona.name}（${profile.persona.desc}）`);
  L.push(`想带走的感觉：${profile.mood.label} ｜ 节奏：${profile.pace.label} ｜ 同行：${profile.company.label} ｜ 预算：${profile.budget.label} ｜ 体力：${profile.stamina.label}`);
  L.push('');

  /* 多城：每个城市段前插一个段头 + 段间大交通摘要 */
  const segHead = (trip, ti) => {
    L.push('');
    L.push(`════ 第 ${ti + 1} 城 · ${trip.city.name}（D${trip.startDayIndex + 1}~D${trip.startDayIndex + trip.dayCount}）════`);
    L.push('');
  };
  const legLine = leg => {
    if (!leg || !leg.transport || leg.transport.sameCity) return;
    const t = leg.transport;
    L.push(`🚄 ${leg.kind === 'enter' ? '出发' : '转场'}：${t.from} → ${t.to} · ${t.distance}km`);
    L.push(`   推荐 ${t.rec.name}（${t.rec.dur}，约 ¥${t.rec.price[0]}~${t.rec.price[1]}）｜ ${t.verdict}`);
    /* 班次密度 + 首末班 + 去哪儿查 */
    if (t.rec.headway) {
      L.push(`   ⏱ 班次：${t.rec.headway}（${t.rec.departWindow}）· ${t.rec.firstLast}`);
      if (t.rec.queryName) L.push(`   🔎 查具体车次/航班：${t.rec.queryName} ${t.rec.queryUrl}`);
    }
    /* 出发/返程时刻建议 */
    if (t.departPlan) {
      L.push(`   ▶ ${t.departPlan.outbound.text}`);
      L.push(`   ◀ ${t.departPlan.inbound.text}`);
    }
    L.push('');
  };

  const multi = !!(plan.multi && plan.trips && plan.trips.length > 1);
  if (multi) legLine(plan.enterLeg);

  plan.days.forEach(d => {
    if (multi && d.tripSeq != null) {
      const trip = plan.trips[d.tripSeq];
      if (trip && trip.startDayIndex === d.index) {
        segHead(trip, d.tripSeq);
      }
    }
    L.push(`—— 第 ${d.index + 1} 天 · ${d.title} ｜ ${d.areas.join(' / ')} ——`);
    d.timeline.forEach((t, i) => {
      L.push(`${t.arrive}-${t.leave}  ${i + 1}. ${t.poi.name}（约 ${t.poi.hours}h）${isOffline(t.poi) ? ' 📵' : ''}`);
      L.push(`        ✦ ${narrativeOf(t.poi)}`);
      if (i < d.timeline.length - 1) {
        const nxt = d.timeline[i + 1];
        L.push(`        ↓ 转场约 ${Math.round(nxt.transitFrom * 60)} 分钟`);
      }
    });
    if (d.stay) {
      L.push(`  🛏 今晚住：${d.stay.area}（${d.stay.price}）`);
      L.push(`        ${d.stay.why}｜${d.stay.walkTip}`);
      /* 用户选定住哪家：标到最前面，方便对照预订 */
      let picked = null;
      try {
        if (typeof Store !== 'undefined' && Store.getStay && plan.__sid) {
          picked = Store.getStay(plan.__sid, d.index);
        }
      } catch (e) { }
      if (picked) L.push(`        ✅ 已选定：${picked.name} ${picked.price || ''}`.trimEnd());
      (d.stay.hotels || []).slice(0, 4).forEach(h => {
        const star = h.rating ? ` ★${h.rating}` : '';
        const tg = (h.tags && h.tags.length) ? `［${h.tags.join('·')}］` : '';
        L.push(`        · [${h.kindLabel || '住宿'}] ${h.name} ${h.price}${star}${tg}${h.note ? '（' + h.note + '）' : ''}`);
      });
    }
    L.push('');
    /* 该段最后一天之后，插入「去下一城」的大交通 */
    if (multi && d.tripSeq != null && plan.legs) {
      const trip = plan.trips[d.tripSeq];
      if (trip && d.index === trip.startDayIndex + trip.dayCount - 1) {
        legLine(plan.legs[d.tripSeq]);
      }
    }
  });
  if (plan.stay && plan.stay.areas.length) {
    L.push(`住宿安排：${plan.stay.switchNote}`);
    L.push('');
  } else if (multi) {
    /* 多城时顶层没有单一 stay，改成逐城一句 */
    const stays = plan.trips
      .map(t => t.plan && t.plan.stay)
      .filter(s => s && s.areas && s.areas.length);
    if (stays.length) {
      L.push('住宿安排：');
      plan.trips.forEach(t => {
        const st = t.plan && t.plan.stay;
        if (st && st.areas.length) L.push(`  · ${t.city.name}：${st.switchNote}`);
      });
      L.push('');
    }
  }
  const s = plan.stats;
  L.push(`合计：${s.poiCount} 个地点 ｜ 游玩 ${s.totalHours} 小时 ｜ 市内移动约 ${s.dist} km`);
  L.push(`其中建议收起手机的深度体验 ${s.offlineHours} 小时（📵 标记站点）`);
  L.push(`预估花费：¥${s.total}（门票 ¥${s.ticket} + 餐饮 ¥${s.meals} + 市内交通 ¥${s.local} + 其他 ¥${s.misc}，不含住宿与往返大交通）`);
  L.push('');
  L.push(memoryText(plan));
  return L.join('\n');
}

/* ============================================================
 *  大交通规划引擎 —— cityTransport(fromKey, toKey)
 *  纯函数，无 DOM 依赖。给定出发城市与目的城市，输出三种方式的
 *  估算时长与票价，并给出推荐与到达后的接驳建议。
 *
 *  估算模型（基于经纬度直线距离 D，单位 km，Haversine）：
 *    高铁  D<500km 或 D 500~1000 时占优
 *          时长(h) = D/220 + 0.5      （220km/h 为含停站均速）
 *          票价(元) = D × 0.46         （二等座全网均价）
 *    飞机  飞行时长(h) = D/750 + 0.5     （750km/h 为 A320 巡航速度）
 *          票价(元) = 300 + D × 0.35
 *    自驾  里程(km) = D × 1.3            （高速绕行系数）
 *          时长(h) = 里程/90             （含服务区休息）
 *          油费 = 里程 × 0.6；过路费 = 里程 × 0.45
 *  误差约 ±15%。所有票价给出区间（下限×0.9，上限×1.1）。
 * ============================================================ */

/* 城市是否有机场（用于判断飞机方式的现实性） */
const AIRPORT_CITIES = {
  chengdu: true, xian: true, xiamen: true, nanchang: true, beijing: true,
  shanghai: true, chongqing: true, changsha: true, hangzhou: true, guangzhou: true,
  quanzhou: true, chaozhou: false, luoyang: true, liuzhou: true, shaoxing: false,
  datong: true, zhenjiang: false, linhai: false, jianshui: false, shantou: true,
  /* —— 华北扩充 —— */
  tianjin: true, shijiazhuang: true, chengde: false, qinhuangdao: true, zhengding: false,
  /* —— 东北扩充 —— */
  harbin: true, shenyang: true, dalian: true, changchun: true, yanbian: true,
  /* —— 华东/华中/华南/晋鲁扩充 —— */
  nanjing: true, suzhou: false, yangzhou: true, ningbo: true,
  wuhan: true, zhengzhou: true, kaifeng: false, zhangjiajie: true,
  guilin: true, nanning: true, haikou: true, sanya: true,
  qingdao: true, jinan: true, taiyuan: true, pingyao: false,
  /* —— 西南/西北/新疆西藏/闽赣扩充 —— */
  kunming: true, dali: true, lijiang: true, guiyang: true,
  lanzhou: true, dunhuang: true, xining: true, yinchuan: true,
  urumqi: true, kashgar: true, lhasa: true,
  fuzhou: true, huangshan: true, jingdezhen: true,
  /* —— 第1批扩充（内蒙古/宁夏/陕西/甘肃/新疆/河北/山东） —— */
  hohhot: true, baotou: true, zhongwei: true, yanan: true, zhangye: true,
  jiayuguan: true, turpan: true, kelamayi: true, yili: true, handan: true,
  weihai: true, qufu: false, zibo: false,
  /* —— 第2批扩充（华东/华中/华南） —— */
  wuxi: true, yichang: true, enshi: true, lushan: true, yueyang: true,
  shenzhen: true, zhuhai: true, beihai: true, taizhou: true, putuo: true,
  fenghuang: false, wuyuan: false, shunde: false,
  /* —— 第3批扩充（西南/青藏/皖赣/其他） —— */
  xishuangbanna: true, libo: true, tengchong: true, jinggangshan: true,
  jiuhua: true, mohe: true, nyingchi: true, shigatse: true, wutaishan: true,
  leshan: false, dujiangyan: false, zhenyuan: false
};

/* 是否需要跨海/特殊提示 */
const ISLAND_CITIES = { xiamen: true, shantou: true, haikou: true, sanya: true, putuo: true, beihai: true, zhuhai: true };

/* 无机场但可"飞邻城再高铁"的城市 → 中转枢纽名 + 就近参考城市（用于估算距离） */
const FLY_VIA = {
  chaozhou: { hub: '揭阳潮汕机场（潮汕共用）', ref: 'shantou' },
  jianshui: { hub: '昆明长水机场', ref: 'xian' },
  zhenjiang: { hub: '南京禄口机场', ref: 'nanchang' },
  linhai: { hub: '台州/宁波机场', ref: 'hangzhou' },
  /* —— 华北扩充 —— */
  chengde: { hub: '北京首都/大兴机场（转京承高铁）', ref: 'beijing' },
  zhengding: { hub: '石家庄正定国际机场（机场在正定境内）', ref: 'shijiazhuang' },
  /* —— 华东/华中/晋鲁扩充 —— */
  suzhou: { hub: '无锡苏南硕放机场或上海虹桥（高铁20~30分钟）', ref: 'shanghai' },
  kaifeng: { hub: '郑州新郑机场（城际铁路30分钟）', ref: 'zhengzhou' },
  pingyao: { hub: '太原武宿机场（高铁40分钟到平遥古城站）', ref: 'taiyuan' },
  /* —— 第1批扩充 —— */
  qufu: { hub: '济宁曲阜机场（嘉祥，距曲阜约70km）或济南遥墙机场（高铁约40分钟到曲阜东）', ref: 'jinan' },
  zibo: { hub: '济南遥墙机场（高铁约40分钟）或青岛胶东机场', ref: 'jinan' },
  /* —— 第2批扩充 —— */
  fenghuang: { hub: '铜仁凤凰机场（距古城约30km，机场大巴/打车）或张家界荷花机场（高铁约1小时）', ref: 'zhangjiajie' },
  wuyuan: { hub: '景德镇罗家机场（距婺源约50km，高铁约20分钟）或黄山屯溪机场', ref: 'jingdezhen' },
  shunde: { hub: '广州白云机场（高铁/地铁约1小时）或佛山沙堤机场', ref: 'guangzhou' },
  /* —— 第3批扩充 —— */
  leshan: { hub: '成都天府/双流机场（高铁约1小时到乐山）', ref: 'chengdu' },
  dujiangyan: { hub: '成都双流/天府机场（城际高铁约30分钟到都江堰）', ref: 'chengdu' },
  zhenyuan: { hub: '贵阳龙洞堡机场（高铁约1.5小时）或铜仁凤凰机场', ref: 'guiyang' },
  hongcun: { hub: '黄山屯溪机场（高铁约40分钟到黟县）或合肥新桥机场', ref: 'huangshan' }
};
/* 是否通高铁（地级市基本都通，个别县级需接驳） */
const HSR_CITIES = {
  quanzhou: true, chaozhou: true, luoyang: true, liuzhou: true, shaoxing: true,
  datong: true, zhenjiang: true, linhai: true, jianshui: true, shantou: true,
  /* —— 华北扩充 —— */
  tianjin: true, shijiazhuang: true, chengde: true, qinhuangdao: true, zhengding: true,
  /* —— 东北扩充 —— */
  harbin: true, shenyang: true, dalian: true, changchun: true, yanbian: true,
  /* —— 华东/华中/华南/晋鲁扩充 —— */
  nanjing: true, suzhou: true, yangzhou: true, ningbo: true,
  wuhan: true, zhengzhou: true, kaifeng: true, zhangjiajie: true,
  guilin: true, nanning: true, haikou: true, sanya: true,
  qingdao: true, jinan: true, taiyuan: true, pingyao: true,
  /* —— 西南/西北/新疆西藏/闽赣扩充（喀什/拉萨暂无动车高铁，普速与航空为主） —— */
  kunming: true, dali: true, lijiang: true, guiyang: true,
  lanzhou: true, dunhuang: true, xining: true, yinchuan: true,
  urumqi: true, kashgar: false, lhasa: false,
  fuzhou: true, huangshan: true, jingdezhen: true,
  /* —— 第1批扩充 —— */
  hohhot: true, baotou: true, zhongwei: true, yanan: true, zhangye: true,
  jiayuguan: true, turpan: true, kelamayi: true, yili: true, handan: true,
  qufu: true, zibo: true, weihai: true,
  /* —— 第2批扩充 —— */
  wuxi: true, yichang: true, enshi: true, lushan: true, yueyang: true,
  shenzhen: true, zhuhai: true, beihai: true, taizhou: true,
  fenghuang: true, wuyuan: true, shunde: true, putuo: false,
  /* —— 第3批扩充 —— */
  xishuangbanna: true, libo: true, leshan: true, dujiangyan: true, zhenyuan: true,
  jinggangshan: true, hongcun: true, jiuhua: true, nyingchi: true, shigatse: true,
  wutaishan: true, tengchong: false, mohe: false
};

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function round5(v) { return Math.round(v / 5) * 5; }
function roundHalf(v) { return Math.round(v * 2) / 2; }
function fmtDur(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  if (hh <= 0) return `${mm} 分钟`;
  if (mm === 0) return `${hh} 小时`;
  return `${hh} 小时 ${mm} 分`;
}

/* ------------------------------------------------------------------
 *  大交通「什么时候有车」—— 给班次建议与查询入口
 *  ----------------------------------------------------------------
 *  我们不接实时时刻表（那需要联网抓数据、且易失效），而是按交通方式
 *  给出「发车窗口 / 班次密度 / 首末班」的经验值，再配一个「去查」
 *  的官方入口链接，让用户自己挑具体车次。经验值按里程分档。
 * ------------------------------------------------------------------ */
const TP_SCHED = {
  hsr: {
    /* 里程档 -> 发车间隔（分钟）与运营时段 */
    bands: [
      { maxKm: 300,  headway: [10, 20], first: '06:00', last: '22:30' },
      { maxKm: 800,  headway: [15, 35], first: '06:30', last: '21:30' },
      { maxKm: Infinity, headway: [25, 60], first: '07:00', last: '20:30' }
    ],
    queryName: '12306 铁路购票',
    queryUrl: 'https://www.12306.cn/index/',
    tip: '高铁按车次发车，改签方便；推荐用 12306 或携程查具体班次'
  },
  fly: {
    bands: [
      { maxKm: 800,  headway: null, first: '07:00', last: '21:00' },   // 短途航线多为每日 1~3 班
      { maxKm: Infinity, headway: null, first: '06:30', last: '22:00' }
    ],
    queryName: '携程机票',
    queryUrl: 'https://flights.ctrip.com/online/channel/domestic',
    tip: '航班每天班次有限，务必先查再定；早班与晚班通常最便宜'
  },
  drive: {
    bands: [{ maxKm: Infinity, headway: null, first: '全天可走', last: '', freeway: true }],
    queryName: '高德地图路线',
    queryUrl: 'https://ditu.amap.com/',
    tip: '自驾时间自由，但避开早晚高峰与节假日首尾两天；出发前查一下实时路况'
  }
};

/** 给一个 option 注入发车窗口 / 班次密度 / 首末班 / 查询入口 */
function attachSchedule(opts, D) {
  opts.forEach(o => {
    const cfg = TP_SCHED[o.key];
    if (!cfg) return;
    const band = cfg.bands.find(b => D <= b.maxKm) || cfg.bands[cfg.bands.length - 1];

    o.firstLast = band.freeway
      ? '全天可走 · 建议早上出发'
      : `首班约 ${band.first} · 末班约 ${band.last}`;

    if (band.headway) {
      const [lo, hi] = band.headway;
      o.headway = `约每 ${lo}~${hi} 分钟一班`;
      o.departWindow = `${band.first}~${band.last}`;
    } else if (band.freeway) {
      o.headway = '时间自由';
      o.departWindow = '全天';
    } else {
      o.headway = '每日数班（需按航班查）';
      o.departWindow = `${band.first}~${band.last}`;
    }
    o.queryName = cfg.queryName;
    o.queryUrl = cfg.queryUrl;
    o.schedTip = cfg.tip;
  });
}

/** 出发时刻倒推：几点的车/航班才赶得上第一天下午的行程 */
function buildDepartPlan(rec, arrive, D, departAtHour) {
  /* 需要提前多久到站/到机场 */
  const bufferMin = rec.key === 'fly' ? 105 : (rec.key === 'hsr' ? 40 : 10);
  const bufferTxt = rec.key === 'fly' ? '提前约 1.5~2 小时到机场'
                    : (rec.key === 'hsr' ? '提前约 40 分钟到站' : '');
  /* 出发时刻 = 目标到达时刻 − 车程 − 到站缓冲 − 落地/落站到首站的通勤 */
  const totalMin = Math.round(rec.durH * 60) + arrive.min;
  const leaveH = departAtHour - (totalMin + bufferMin) / 60;

  const fmtH = h => {
    let hh = Math.floor(h % 24); let mm = Math.round((h - Math.floor(h)) * 60 / 5) * 5;
    if (mm === 60) { hh += 1; mm = 0; }
    return `${String((hh + 24) % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  const arriveH = departAtHour;
  return {
    leaveTime: fmtH(leaveH),
    arriveTime: fmtH(arriveH),
    bufferMin,
    bufferTxt,
    totalMin
  };
}

/* 大交通核心计算 */
function cityTransport(fromKey, toKey) {
  const from = (typeof POI_DB !== 'undefined') ? POI_DB[fromKey] : null;
  const to = (typeof POI_DB !== 'undefined') ? POI_DB[toKey] : null;
  if (!from || !to) return null;
  if (fromKey === toKey) {
    return { sameCity: true, from: from.name, to: to.name,
      note: '出发地与目的地是同一座城市，无需大交通；可直接看市内行程。' };
  }

  const A = { lat: from.center[0], lng: from.center[1] };
  const B = { lat: to.center[0], lng: to.center[1] };
  const D = haversineKm(A, B);

  /* ---- 高铁 ---- */
  const hsrH = D / 220 + 0.5;
  const hsrY = D * 0.46;
  const hsr = {
    key: 'hsr', name: '高铁 / 动车', icon: '🚄',
    dur: fmtDur(hsrH), durH: roundHalf(hsrH),
    price: [round5(hsrY * 0.9), round5(hsrY * 1.1)],
    note: '含停站均速约 220km/h；二等座均价约 0.46 元/公里',
    available: HSR_CITIES[toKey] !== false
  };

  /* ---- 飞机 ---- */
  const flyH = D / 750 + 0.5;
  const flyY = 300 + D * 0.35;
  const fly = {
    key: 'fly', name: '飞机', icon: '✈️',
    dur: fmtDur(flyH + 1.5),               // +1.5h 为往返机场与安检
    durH: roundHalf(flyH + 1.5),
    price: [round5(flyY * 0.6), round5(flyY * 1.1)],  // 淡季可低至 6 折
    note: '巡航 750km/h；时长已含往返机场与安检约 1.5 小时',
    available: AIRPORT_CITIES[toKey] !== false
  };

  /* ---- 自驾 ---- */
  const driveKm = D * 1.3;
  const driveH = driveKm / 90;
  const driveY = driveKm * (0.6 + 0.45);   // 油费 + 过路费
  const drive = {
    key: 'drive', name: '自驾', icon: '🚗',
    dur: fmtDur(driveH), durH: roundHalf(driveH),
    km: Math.round(driveKm),
    price: [round5(driveY * 0.9), round5(driveY * 1.1)],
    note: `里程约 ${Math.round(driveKm)}km（高速绕行系数 1.3）；含油费与过路费，不含租车`,
    available: true
  };

  /* ---- 各班次的时刻建议（我们不实时抓班次，只给「大概几点有车 + 去哪儿查」）---- */
  attachSchedule([hsr, fly, drive], D);

  /* ---- 推荐逻辑 ---- */
  const opts = [hsr, fly, drive].filter(o => o.available);
  opts.sort((a, b) => a.durH - b.durH);
  const hasAirport = AIRPORT_CITIES[toKey] !== false;
  let pick = 'hsr';
  if (!hasAirport) {
    pick = 'hsr';                                   // 目的城市无机场，只能高铁/自驾
  } else if (D < 500) {
    pick = 'hsr';                                   // 短途高铁绝对占优
  } else if (D < 1000) {
    pick = (hsrH <= flyH + 1.5) ? 'hsr' : 'fly';
  } else {
    pick = 'fly';                                   // 长途飞机胜出
  }

  /* 无机场 + 超长途：给一条"飞到邻近枢纽再高铁"的替代方案 */
  let transfer = null;
  if (!AIRPORT_CITIES[toKey] && D >= 900) {
    const via = FLY_VIA[toKey];
    const refKey = via && via.ref;
    if (refKey && POI_DB[refKey]) {
      const hub = POI_DB[refKey];
      const hubLabel = via.hub;
      const Dhub = haversineKm(A, { lat: hub.center[0], lng: hub.center[1] });
      const flyLegH = Dhub / 750 + 0.5 + 1.5;
      const flyLegY = 300 + Dhub * 0.35;
      const railD = haversineKm({ lat: hub.center[0], lng: hub.center[1] }, B);
      const railH = railD / 160 + 0.4;   // 城际/高铁短途，均速略低
      const railY = railD * 0.42;
      transfer = {
        hub: hubLabel,
        flyLeg: { dur: fmtDur(flyLegH), price: [round5(flyLegY * 0.6), round5(flyLegY * 1.1)] },
        railLeg: { dur: fmtDur(railH), price: [round5(railY * 0.9), round5(railY * 1.1)] },
        total: fmtDur(flyLegH + railH + 1),
        note: `先飞${hubLabel}，再乘城际高铁到${to.name}；全程约 ${fmtDur(flyLegH + railH + 1)}（含 1 小时换乘）`
      };
    }
  }

  const recommended = pick;
  const rec = { hsr, fly, drive }[pick];

  /* ---- 到达后接驳到首站 ---- */
  const firstPoi = to.pois && to.pois[0];
  const arrive = {
    station: pick === 'fly' ? `${to.name}机场` : (pick === 'hsr' ? `${to.name}站` : '市区'),
    toFirst: firstPoi ? `${firstPoi.name}（${firstPoi.area}）` : '第一个点位',
    how: pick === 'fly'
      ? `机场乘地铁/机场大巴进市区，再打车或公交前往${firstPoi ? firstPoi.name : '首站'}`
      : (pick === 'hsr'
        ? `高铁站乘地铁/公交或打车前往${firstPoi ? firstPoi.name : '首站'}`
        : `自驾直接导航至${firstPoi ? firstPoi.name : '首站'}附近的停车场`),
    min: pick === 'fly' ? 70 : (pick === 'hsr' ? 35 : 10)
  };

  /* ---- 一句话结论 ---- */
  let verdict;
  if (!hasAirport && transfer) {
    verdict = `全程约 ${D.toFixed(0)}km，${to.name}没有民航机场；高铁直达约 ${hsr.dur}、¥${hsr.price[0]}~${hsr.price[1]}，或${transfer.note}。`;
  } else if (!hasAirport) {
    verdict = `全程约 ${D.toFixed(0)}km，${to.name}没有民航机场，高铁直达约 ${hsr.dur}、¥${hsr.price[0]}~${hsr.price[1]}，是唯一省心的选择。`;
  } else {
    const verdictMap = {
      hsr: `全程约 ${D.toFixed(0)}km，高铁约 ${hsr.dur}、¥${hsr.price[0]}~${hsr.price[1]}，是这段距离最省心的选择。`,
      fly: `全程约 ${D.toFixed(0)}km，飞机含往返机场约 ${fly.dur}、¥${fly.price[0]}~${fly.price[1]}；这段距离坐高铁太久了，飞更划算。`,
      drive: `全程约 ${D.toFixed(0)}km，自驾约 ${drive.dur}、油费过路约 ¥${drive.price[0]}~${drive.price[1]}（多人同行更划算）。`
    };
    verdict = verdictMap[pick];
  }

  /* ---- 出发/返程时刻建议 ----
     默认假设：首日下午 14:00 开始在目的地游玩（下午到、当天就能玩半程），
     末天下午 17:00 前要往车站/机场走。这也是「去程不浪费一整天、
     回程不摸黑赶车」的折中。用户改「我的位置」后，第二天的
     到达时间会按实际车程重算。 */
  const arriveTargetH = 14;
  const departBackH = 17;
  const out = buildDepartPlan(rec, arrive, D, arriveTargetH);
  const inbound = (() => {
    /* 返程：从目的地出发的时刻 = 末天要动身的时刻 − 到站缓冲 */
    const backBuffer = rec.key === 'fly' ? 105 : (rec.key === 'hsr' ? 40 : 10);
    const fmtH = h => {
      let hh = Math.floor(h % 24); let mm = Math.round((h - Math.floor(h)) * 60 / 5) * 5;
      if (mm === 60) { hh += 1; mm = 0; }
      return `${String((hh + 24) % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };
    const leave = fmtH(departBackH - backBuffer / 60);
    /* 到家/回到出发地的大概时刻 */
    const homeH = departBackH + (Math.round(rec.durH * 60)) / 60;
    return {
      leaveTime: leave,
      arriveHomeTime: fmtH(homeH),
      bufferMin: backBuffer,
      fromName: arrive.station,
      text: `建议 ${leave} 前离开市区前往${arrive.station}（${rec.key === 'fly' ? '提前约 2 小时到机场' : (rec.key === 'hsr' ? '提前约 40 分钟到站' : '')}），大约 ${fmtH(homeH)} 回到${from.name}`
    };
  })();
  const departPlan = {
    outbound: {
      label: `去程 · ${from.name} → ${to.name}`,
      mode: rec.name, icon: rec.icon,
      leaveTime: out.leaveTime,
      arriveTime: out.arriveTime,
      bufferTxt: out.bufferTxt,
      text: `建议 ${out.leaveTime} 从${from.name}出发（${out.bufferTxt || '留足路上时间'}），乘${rec.name}约 ${rec.dur}，${out.arriveTime} 前后可抵达${arrive.station}`
    },
    inbound
  };

  return {
    sameCity: false,
    from: from.name, fromKey,
    to: to.name, toKey,
    distance: Math.round(D),
    options: opts,
    recommended,
    rec,
    prices: { hsr, fly, drive },
    arrive,
    transfer,
    departPlan,
    verdict,
    tips: [
      D < 500 ? '短途高铁班次密集，随到随走，无需提前太多订票'
              : (D < 1000 ? '建议提前 3~5 天订票，周五晚与周日返程最紧张'
                          : '长途建议提前 1~2 周订票，机票价格波动大，可关注特价'),
      AIRPORT_CITIES[toKey] === false ? `${to.name}无民航机场，只能选高铁或自驾` : null,
      ISLAND_CITIES[toKey] ? `${to.name}为滨海/海岛城市，旺季需留意船班与跨海交通` : null
    ].filter(Boolean)
  };
}

/* ============================================================
 *  住宿推荐 —— 把「住哪儿」排进路线
 *  ------------------------------------------------------------
 *  数据源：分片里的 mod.hotel（与景点一起按需加载）
 *
 *  ⚠️ 这里曾经读全局 HOTEL_DB，但城市数据拆分后 HOTEL_DB 已不存在
 *     （js/data.js 里只剩注释，实体被 split-data 搬进了各城分片）。
 *     结果就是 hotelsOf() 永远返回空数组 → day.stay 全为 null →
 *     结果页住宿卡整块消失（用户反馈「酒店怎么删了」）。
 *     现在改走 data-loader 的 hotelsOfCity()，它持有已加载分片的住宿数据。
 *
 *  取数前必须确保该城分片已加载（结果页一定会先 ensureCity，这里再兜一层）。
 * ============================================================ */
function hotelsOf(cityKey) {
  /* 首选：data-loader 的分片缓存（拆分后的唯一真实来源） */
  try {
    if (typeof DataLoader !== 'undefined' && DataLoader.hotelsOfCity) {
      const list = DataLoader.hotelsOfCity(cityKey);
      if (list && list.length) return list;
      /* 还没加载完 → 触发一次加载，本次先返回空；调用方下一轮就能拿到 */
      if (typeof DataLoader.ensureCity === 'function') DataLoader.ensureCity(cityKey).catch(() => { });
    }
  } catch (e) { /* 落到下面的兼容分支 */ }

  /* 兼容：老结构下若存在全局 HOTEL_DB 仍可用（单文件版 / 测试环境） */
  try { return (typeof HOTEL_DB !== 'undefined' && HOTEL_DB[cityKey]) || []; }
  catch (e) { return []; }
}

/* 单日住宿推荐：优先「near 命中当天点位」的片区，其次片区坐标离末站最近 */
function stayForDay(day, cityKey, profile) {
  const list = hotelsOf(cityKey);
  if (!list.length || !day.timeline.length) return null;
  const dayIds = new Set(day.timeline.map(t => t.poi.id));
  const last = day.timeline[day.timeline.length - 1].poi;
  const budgetTier = (profile.budget && profile.budget.label === '品质') ? 'premium'
    : (profile.budget && profile.budget.label === '经济') ? 'economy' : 'comfort';

  const scored = list.map(h => {
    const hit = (h.near || []).filter(id => dayIds.has(id)).length;
    const dist = (h.center && last.lat != null) ? haversine({ lat: h.center[0], lng: h.center[1] }, last) : 5;
    // 命中当天点位最优先，其次距离，再对档次匹配加成
    const tierBonus = h.tier === budgetTier ? 1.5 : 0;
    return { h, v: hit * 3 - dist * 0.12 + tierBonus };
  }).sort((a, b) => b.v - a.v);

  const best = scored[0].h;

  /* 住宿候选：把该片区所有选项按「口碑 + 与预算匹配」排个序交给 UI，
     由界面决定默认露几家、展开几家，以及按类型筛选。
     kindLabel 给中文名，避免每处渲染各写一套映射。 */
  const KIND_LABEL = { hotel: '酒店', minsu: '民宿', inn: '宾馆', hostel: '青旅' };
  const kindCount = {};
  const candidates = (best.hotels || []).map(h => {
    const kind = h.kind || 'hotel';
    kindCount[kind] = (kindCount[kind] || 0) + 1;
    return {
      name: h.name,
      price: h.price,
      note: h.note || '',
      kind,
      kindLabel: KIND_LABEL[kind] || '住宿',
      rating: h.rating || 0,
      tags: h.tags || []
    };
  }).sort((a, b) => {
    // 评分高的在前；同分时，符合本次预算档的类型优先
    if (b.rating !== a.rating) return b.rating - a.rating;
    const fav = budgetTier === 'economy' ? ['inn', 'hostel'] : budgetTier === 'premium' ? ['hotel', 'minsu'] : ['minsu', 'hotel'];
    return fav.indexOf(a.kind) - fav.indexOf(b.kind);
  });

  return {
    area: best.area,
    tier: best.tier,
    price: best.price,
    why: best.why,
    hotels: candidates,
    kinds: Object.keys(kindCount).map(k => ({ kind: k, label: KIND_LABEL[k] || '住宿', n: kindCount[k] })),
    lastStop: last.name,
    walkTip: `末站「${last.name}」收工后，${best.area}是这一片里最顺脚的落脚点`
  };
}

/* 多天住宿总览：判断是否需要在城市内换片区（决定行李寄存策略） */
function stayPlan(days, cityKey, profile) {
  const per = days.map(d => stayForDay(d, cityKey, profile));
  const areas = [...new Set(per.filter(Boolean).map(s => s.area))];
  const switchNote = areas.length > 1
    ? `本次行程会停 ${areas.length} 个片区（${areas.join(' / ')}），建议：第一晚住市中心，后半程按末站就近换，或把行李寄存在车站/酒店。`
    : (areas.length === 1 ? `全程固定住在「${areas[0]}」，不用换酒店，行李可就地存放。` : '');
  return { per, areas, switchNote };
}
