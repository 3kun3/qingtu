/* ============================================================
 *  app.js —— 《轻途》H5 端：路由 + 五页渲染
 *  页面：index（首页）/ question（8 题问卷）/ quickplan（快速规划）
 *        / result（路线详情）/ mine（个人中心）
 *
 *  硬性约定：8 题问卷逻辑与引擎（engine.js）完全复用，不改动；
 *            全部数据本地模拟（localStorage），无后端 / 登录 / 支付 / 联网 API。
 * ============================================================ */

/* ---------- 城市视觉（与小程序端 CITY_VISUAL 一致） ---------- */
const CITY_THEME = {
  /* —— 热门城市 —— */
  chengdu:   { emoji: '🐼', bg: 'linear-gradient(140deg,#9cc4a4,#3f7a5a)' },
  xian:      { emoji: '🏯', bg: 'linear-gradient(140deg,#e0c26a,#9c7a2f)' },
  xiamen:    { emoji: '🌊', bg: 'linear-gradient(140deg,#7fc3d8,#2b6f8f)' },
  nanchang:  { emoji: '🚩', bg: 'linear-gradient(140deg,#eb9e86,#a03535)' },
  beijing:   { emoji: '🏛', bg: 'linear-gradient(140deg,#d99a8a,#8c3b2f)' },
  shanghai:  { emoji: '🌃', bg: 'linear-gradient(140deg,#93a8d8,#3b4b8f)' },
  chongqing: { emoji: '🌶', bg: 'linear-gradient(140deg,#eb9e86,#8f2f2f)' },
  changsha:  { emoji: '🎆', bg: 'linear-gradient(140deg,#f0b46a,#b25c2f)' },
  hangzhou:  { emoji: '🍃', bg: 'linear-gradient(140deg,#a8d8b8,#2f7a5a)' },
  guangzhou: { emoji: '🥟', bg: 'linear-gradient(140deg,#f0cf8a,#b2832f)' },
  /* —— 华北扩充 —— */
  tianjin:      { emoji: '🎡', bg: 'linear-gradient(140deg,#8fb8d0,#2f5a7a)' },
  shijiazhuang: { emoji: '🍲', bg: 'linear-gradient(140deg,#c0b48a,#6f6440)' },
  chengde:      { emoji: '🏞', bg: 'linear-gradient(140deg,#a8c0a0,#4a6a4a)' },
  qinhuangdao:  { emoji: '⛵', bg: 'linear-gradient(140deg,#88c0d0,#2b6a8f)' },
  zhengding:    { emoji: '🗼', bg: 'linear-gradient(140deg,#d8b890,#8a6440)' },
  /* —— 东北扩充 —— */
  harbin:    { emoji: '⛪', bg: 'linear-gradient(140deg,#b8d0e0,#3a5a7a)' },
  shenyang:  { emoji: '🏰', bg: 'linear-gradient(140deg,#d8a888,#8a4a32)' },
  dalian:    { emoji: '⚓', bg: 'linear-gradient(140deg,#88c8d8,#266a8a)' },
  changchun: { emoji: '🎬', bg: 'linear-gradient(140deg,#a8c8b0,#3f6a52)' },
  yanbian:   { emoji: '🥘', bg: 'linear-gradient(140deg,#e0b088,#9a5a30)' },
  /* —— 华东/华中/华南/晋鲁扩充 —— */
  nanjing:     { emoji: '🐉', bg: 'linear-gradient(140deg,#8aa890,#3a5a48)' },
  suzhou:      { emoji: '🏞', bg: 'linear-gradient(140deg,#b8d8c8,#4a7a62)' },
  yangzhou:    { emoji: '🚣', bg: 'linear-gradient(140deg,#a8c8a0,#4f7a4a)' },
  ningbo:      { emoji: '📚', bg: 'linear-gradient(140deg,#98b8c8,#3a5a72)' },
  wuhan:       { emoji: '🌉', bg: 'linear-gradient(140deg,#d8a888,#8a4a3a)' },
  zhengzhou:   { emoji: '🚂', bg: 'linear-gradient(140deg,#c8b890,#7a6a44)' },
  kaifeng:     { emoji: '🏮', bg: 'linear-gradient(140deg,#e0b888,#9a6a3a)' },
  zhangjiajie: { emoji: '⛰', bg: 'linear-gradient(140deg,#a8c8a8,#3f6a4f)' },
  guilin:      { emoji: '🛶', bg: 'linear-gradient(140deg,#98c8b0,#2f6a55)' },
  nanning:     { emoji: '🌴', bg: 'linear-gradient(140deg,#a8d8a0,#3a7a4a)' },
  haikou:      { emoji: '🏖', bg: 'linear-gradient(140deg,#88c8d0,#2b6a80)' },
  sanya:       { emoji: '🐚', bg: 'linear-gradient(140deg,#78c8d8,#267a8f)' },
  qingdao:     { emoji: '🍺', bg: 'linear-gradient(140deg,#d8b890,#8a5a2f)' },
  jinan:       { emoji: '⛲', bg: 'linear-gradient(140deg,#98b8d0,#3a5a7a)' },
  taiyuan:     { emoji: '🥢', bg: 'linear-gradient(140deg,#c8a888,#7a5a3a)' },
  pingyao:     { emoji: '🧱', bg: 'linear-gradient(140deg,#d0b898,#8a6a44)' },
  /* —— 西南/西北/新疆西藏/闽赣扩充 —— */
  kunming:     { emoji: '🌸', bg: 'linear-gradient(140deg,#a8d8b0,#3f7a55)' },
  dali:        { emoji: '🌅', bg: 'linear-gradient(140deg,#98c8d8,#2f6a7a)' },
  lijiang:     { emoji: '🏔', bg: 'linear-gradient(140deg,#a8d0d8,#3a6a7f)' },
  guiyang:     { emoji: '⛅', bg: 'linear-gradient(140deg,#98c0a8,#3f6a52)' },
  lanzhou:     { emoji: '🐂', bg: 'linear-gradient(140deg,#d0b890,#7a6238)' },
  dunhuang:    { emoji: '🐫', bg: 'linear-gradient(140deg,#e0c890,#a67a3a)' },
  xining:      { emoji: '🦅', bg: 'linear-gradient(140deg,#a8c0d0,#4a6a85)' },
  yinchuan:    { emoji: '🏜', bg: 'linear-gradient(140deg,#d8c090,#8a6a3a)' },
  urumqi:      { emoji: '🍇', bg: 'linear-gradient(140deg,#c8a8c0,#7a4a6a)' },
  kashgar:     { emoji: '🕌', bg: 'linear-gradient(140deg,#e0b890,#9a6a3a)' },
  lhasa:       { emoji: '🙏', bg: 'linear-gradient(140deg,#d8b8a0,#8a5a3a)' },
  fuzhou:      { emoji: '🌳', bg: 'linear-gradient(140deg,#a8c8a0,#3f6a4a)' },
  huangshan:   { emoji: '🌲', bg: 'linear-gradient(140deg,#b8c8a0,#4a6a45)' },
  jingdezhen:  { emoji: '🏺', bg: 'linear-gradient(140deg,#c8d8e0,#5a7a8a)' },
  /* —— 宝藏城市 —— */
  quanzhou:  { emoji: '🛕', bg: 'linear-gradient(140deg,#e8c88a,#a6703a)' },
  chaozhou:  { emoji: '🍵', bg: 'linear-gradient(140deg,#b8c9a0,#5b7a45)' },
  luoyang:   { emoji: '🌺', bg: 'linear-gradient(140deg,#e8a8b8,#a04a62)' },
  liuzhou:   { emoji: '🍜', bg: 'linear-gradient(140deg,#c8d890,#6f8f3a)' },
  shaoxing:  { emoji: '🖋', bg: 'linear-gradient(140deg,#a8b8c8,#4a6274)' },
  datong:    { emoji: '🗿', bg: 'linear-gradient(140deg,#d8b890,#8f6a3a)' },
  zhenjiang: { emoji: '⛰', bg: 'linear-gradient(140deg,#9ec4b8,#3a6f60)' },
  linhai:    { emoji: '🏰', bg: 'linear-gradient(140deg,#e0b090,#9c6040)' },
  jianshui:  { emoji: '🏮', bg: 'linear-gradient(140deg,#e8b87a,#a05a32)' },
  shantou:   { emoji: '🦞', bg: 'linear-gradient(140deg,#90c8d0,#2f6f7a)' },
  /* —— 第1批扩充（内蒙古/宁夏/陕西/甘肃/新疆/河北/山东） —— */
  hohhot:    { emoji: '🐎', bg: 'linear-gradient(140deg,#a8d0a0,#3f7a4a)' },
  baotou:    { emoji: '🐫', bg: 'linear-gradient(140deg,#d8c090,#8a6a3a)' },
  zhongwei:  { emoji: '🏜', bg: 'linear-gradient(140deg,#e0c890,#a67a3a)' },
  yanan:     { emoji: '🚩', bg: 'linear-gradient(140deg,#eb9e86,#a03535)' },
  zhangye:   { emoji: '🌈', bg: 'linear-gradient(140deg,#e0a8c8,#9a4a7a)' },
  jiayuguan: { emoji: '🏯', bg: 'linear-gradient(140deg,#e0c26a,#9c7a2f)' },
  turpan:    { emoji: '🍇', bg: 'linear-gradient(140deg,#e0a888,#9a4a3a)' },
  kelamayi:  { emoji: '🛢', bg: 'linear-gradient(140deg,#c8b090,#7a6a44)' },
  yili:      { emoji: '🌿', bg: 'linear-gradient(140deg,#a8d8b0,#3f7a55)' },
  handan:    { emoji: '🏛', bg: 'linear-gradient(140deg,#d0b890,#7a6a44)' },
  qufu:      { emoji: '📜', bg: 'linear-gradient(140deg,#d8b890,#8a6a44)' },
  zibo:      { emoji: '🍢', bg: 'linear-gradient(140deg,#e0b088,#9a5a30)' },
  weihai:    { emoji: '⚓', bg: 'linear-gradient(140deg,#88c8d0,#266a8a)' },
  /* —— 第2批扩充（华东/华中/华南） —— */
  wuxi:      { emoji: '🌊', bg: 'linear-gradient(140deg,#7fc3d8,#2b6f8f)' },
  yichang:   { emoji: '🌊', bg: 'linear-gradient(140deg,#88c8d0,#266a8a)' },
  enshi:     { emoji: '⛰', bg: 'linear-gradient(140deg,#a8c8a8,#3f6a4f)' },
  lushan:    { emoji: '☁', bg: 'linear-gradient(140deg,#b8c8d8,#4a6a85)' },
  yueyang:   { emoji: '🏯', bg: 'linear-gradient(140deg,#e0c26a,#9c7a2f)' },
  fenghuang: { emoji: '🏘', bg: 'linear-gradient(140deg,#d8a888,#8a4a32)' },
  wuyuan:    { emoji: '🌼', bg: 'linear-gradient(140deg,#e8d890,#a6903a)' },
  shenzhen:  { emoji: '🌆', bg: 'linear-gradient(140deg,#93a8d8,#3b4b8f)' },
  zhuhai:    { emoji: '🌊', bg: 'linear-gradient(140deg,#88c8d0,#2b6a8a)' },
  shunde:    { emoji: '🍜', bg: 'linear-gradient(140deg,#c8d890,#6f8f3a)' },
  beihai:    { emoji: '🏖', bg: 'linear-gradient(140deg,#88c8d0,#2b6a80)' },
  taizhou:   { emoji: '⛰', bg: 'linear-gradient(140deg,#a8c0a0,#4a6a4a)' },
  putuo:     { emoji: '🛕', bg: 'linear-gradient(140deg,#e8c88a,#a6703a)' },
  /* —— 第3批扩充（西南/青藏/皖赣/其他） —— */
  leshan:        { emoji: '🗿', bg: 'linear-gradient(140deg,#d8b890,#8f6a3a)' },
  dujiangyan:    { emoji: '💧', bg: 'linear-gradient(140deg,#9cc4d8,#2f6a8a)' },
  xishuangbanna: { emoji: '🐘', bg: 'linear-gradient(140deg,#a8c8a0,#3f6a4a)' },
  libo:          { emoji: '💧', bg: 'linear-gradient(140deg,#98c8d8,#2f6a7a)' },
  tengchong:     { emoji: '♨', bg: 'linear-gradient(140deg,#e0b888,#9a6a3a)' },
  zhenyuan:      { emoji: '🏞', bg: 'linear-gradient(140deg,#9ec4b8,#3a6f60)' },
  jinggangshan:  { emoji: '🚩', bg: 'linear-gradient(140deg,#eb9e86,#a03535)' },
  hongcun:       { emoji: '🏘', bg: 'linear-gradient(140deg,#d8c0a0,#8a6a44)' },
  jiuhua:        { emoji: '🛕', bg: 'linear-gradient(140deg,#e8c88a,#a6703a)' },
  mohe:          { emoji: '❄', bg: 'linear-gradient(140deg,#b8d0e0,#3a5a7a)' },
  nyingchi:      { emoji: '🌸', bg: 'linear-gradient(140deg,#e8b8c8,#a04a6a)' },
  shigatse:      { emoji: '🏔', bg: 'linear-gradient(140deg,#c8d0d8,#4a6a7f)' },
  wutaishan:     { emoji: '⛰', bg: 'linear-gradient(140deg,#a8c8b0,#3f6a52)' },
  /* —— 江西地级市 —— */
  jiujiang:      { emoji: '🌊', bg: 'linear-gradient(140deg,#8fc0d8,#2f6a8a)' },
  ganzhou:       { emoji: '🏯', bg: 'linear-gradient(140deg,#d8bc8a,#8a6438)' },
  shangrao:      { emoji: '⛰', bg: 'linear-gradient(140deg,#a8c8a8,#3f6a48)' },
  jian:          { emoji: '📜', bg: 'linear-gradient(140deg,#c8b498,#6f5a3f)' },
  yichun:        { emoji: '♨', bg: 'linear-gradient(140deg,#e0c0a0,#9a6a44)' },
  fuzhou_jx:     { emoji: '🎭', bg: 'linear-gradient(140deg,#c8b4d0,#6a4a7a)' },
  pingxiang:     { emoji: '🌶', bg: 'linear-gradient(140deg,#e8a088,#9a3a2f)' },
  xinyu:         { emoji: '🧚', bg: 'linear-gradient(140deg,#9cd0d8,#2f6f7a)' },
  yingtan:       { emoji: '☯', bg: 'linear-gradient(140deg,#b8c8a8,#4a5f3f)' },
  /* —— 江西旅游强县 —— */
  ruijin:        { emoji: '🌟', bg: 'linear-gradient(140deg,#d8988a,#8a3a2f)' },
  longnan:       { emoji: '🏠', bg: 'linear-gradient(140deg,#c8b498,#6f5a3f)' },
  poyang:        { emoji: '🦢', bg: 'linear-gradient(140deg,#9cc8e0,#2f6a8a)' },
  zhangshu:      { emoji: '🌿', bg: 'linear-gradient(140deg,#a8c8a0,#3f6a48)' },
  fengcheng:     { emoji: '⚔', bg: 'linear-gradient(140deg,#b8b8c8,#4a4a6a)' },
  guixi:         { emoji: '📖', bg: 'linear-gradient(140deg,#c8b4d0,#6a4a7a)' },
  gongqing:      { emoji: '🌱', bg: 'linear-gradient(140deg,#a8d8a8,#3f7a4a)' }
};
const cityVisual = k => CITY_THEME[k] || { emoji: '🏙', bg: 'linear-gradient(140deg,#9aa5b1,#5a6672)' };

/* ---------- 搜索别名表（本地模糊匹配） ---------- */
const CITY_ALIAS = {
  chengdu: ['成都', '蓉城', '熊猫'], xian: ['西安', '长安', '古都'],
  xiamen: ['厦门', '鹭岛'], nanchang: ['南昌', '英雄城', '赣'],
  beijing: ['北京', '帝都', '京城'], shanghai: ['上海', '魔都', '申城'],
  chongqing: ['重庆', '山城', '雾都'], changsha: ['长沙', '星城'],
  hangzhou: ['杭州', '临安', '西湖'], guangzhou: ['广州', '羊城', '花城'],
  quanzhou: ['泉州', '鲤城', '海丝', '刺桐'], chaozhou: ['潮州', '潮汕', '工夫茶'],
  luoyang: ['洛阳', '神都', '牡丹', '十三朝'], liuzhou: ['柳州', '螺蛳粉', '龙城'],
  shaoxing: ['绍兴', '越城', '鲁迅', '黄酒'], datong: ['大同', '平城', '云冈', '北魏'],
  zhenjiang: ['镇江', '京口', '香醋', '金山'], linhai: ['临海', '台州', '江南长城'],
  jianshui: ['建水', '临安', '紫陶', '红河'], shantou: ['汕头', '潮汕', '鮀城', '南澳']
};

const CITY_ALIAS_EXTRA = {
  tianjin: ['天津', '津门', '津', '海河', '相声'],
  shijiazhuang: ['石家庄', '石门', '国际庄', '正太'],
  chengde: ['承德', '避暑山庄', '热河', '外八庙'],
  qinhuangdao: ['秦皇岛', '港城', '山海关', '北戴河'],
  zhengding: ['正定', '常山', '真定', '隆兴寺'],
  harbin: ['哈尔滨', '冰城', '东方莫斯科', '中央大街', '尔滨'],
  shenyang: ['沈阳', '盛京', '奉天', '大帅府'],
  dalian: ['大连', '滨城', '旅大', '星海'],
  changchun: ['长春', '春城', '汽车城', '电影城', '新京'],
  yanbian: ['延边', '延吉', '朝鲜族', '长白山'],
  nanjing: ['南京', '金陵', '建康', '石头城', '宁'],
  suzhou: ['苏州', '姑苏', '吴门', '平江'],
  yangzhou: ['扬州', '广陵', '江都', '维扬'],
  ningbo: ['宁波', '甬城', '四明', '明州'],
  wuhan: ['武汉', '江城', '汉口', '武昌', '黄鹤楼'],
  zhengzhou: ['郑州', '商都', '绿城'],
  kaifeng: ['开封', '汴梁', '汴京', '大梁'],
  zhangjiajie: ['张家界', '武陵源', '大庸'],
  guilin: ['桂林', '八桂', '漓江', '象鼻山'],
  nanning: ['南宁', '绿城', '邕城', '壮乡'],
  haikou: ['海口', '椰城', '琼州'],
  sanya: ['三亚', '鹿城', '天涯海角'],
  qingdao: ['青岛', '琴岛', '胶澳', '栈桥'],
  jinan: ['济南', '泉城', '历下'],
  taiyuan: ['太原', '晋阳', '龙城', '并州'],
  pingyao: ['平遥', '古陶', '平遥古城'],
  kunming: ['昆明', '春城', '滇池', '翠湖'],
  dali: ['大理', '苍山', '洱海', '南诏'],
  lijiang: ['丽江', '玉龙雪山', '纳西', '束河'],
  guiyang: ['贵阳', '筑城', '林城'],
  lanzhou: ['兰州', '金城', '牛肉面'],
  dunhuang: ['敦煌', '沙州', '莫高窟', '鸣沙山'],
  xining: ['西宁', '夏都', '湟中'],
  yinchuan: ['银川', '凤凰城', '西夏', '塞上江南'],
  urumqi: ['乌鲁木齐', '乌市', '红山'],
  kashgar: ['喀什', '喀什噶尔'],
  lhasa: ['拉萨', '日光城', '布达拉宫'],
  fuzhou: ['福州', '榕城', '闽都', '三坊七巷'],
  huangshan: ['黄山', '徽州', '屯溪', '汤口'],
  jingdezhen: ['景德镇', '瓷都', '陶溪川'],
  /* —— 第1批扩充 —— */
  hohhot: ['呼和浩特', '青城', '归绥', '塞外'],
  baotou: ['包头', '鹿城', '白云鄂博'],
  zhongwei: ['中卫', '沙坡头', '黄河', '腾格里'],
  yanan: ['延安', '宝塔山', '革命圣地', '窑洞'],
  zhangye: ['张掖', '甘州', '丹霞', '七彩丹霞'],
  jiayuguan: ['嘉峪关', '天下第一雄关', '长城'],
  turpan: ['吐鲁番', '火洲', '葡萄沟', '火焰山'],
  kelamayi: ['克拉玛依', '油城', '魔鬼城'],
  yili: ['伊犁', '伊宁', '那拉提', '杏花沟', '塞外江南'],
  handan: ['邯郸', '赵都', '成语典故', '武安'],
  qufu: ['曲阜', '孔子', '三孔', '孔庙', '儒家'],
  zibo: ['淄博', '齐都', '烧烤', '临淄'],
  weihai: ['威海', '威海卫', '刘公岛', '海滨'],
  /* —— 第2批扩充 —— */
  wuxi: ['无锡', '太湖', '梁溪', '锡城'],
  yichang: ['宜昌', '三峡', '夷陵', '葛洲坝'],
  enshi: ['恩施', '土家', '硒都', '鄂西'],
  lushan: ['庐山', '匡庐', '浔阳', '庐山云雾'],
  yueyang: ['岳阳', '巴陵', '洞庭', '岳阳楼'],
  fenghuang: ['凤凰', '凤凰古城', '苗疆', '湘西'],
  wuyuan: ['婺源', '徽州', '婺女', '油菜花'],
  shenzhen: ['深圳', '鹏城', '特区', '华强北'],
  zhuhai: ['珠海', '百岛之市', '香洲', '情侣路'],
  shunde: ['顺德', '凤城', '世界美食之都', '粤菜'],
  beihai: ['北海', '银滩', '涠洲岛', '珠城'],
  taizhou: ['台州', '临海', '天台', '台州府'],
  putuo: ['普陀山', '南海观音', '海天佛国', '舟山'],
  /* —— 第3批扩充 —— */
  leshan: ['乐山', '嘉州', '峨眉', '大佛'],
  dujiangyan: ['都江堰', '灌县', '天府源', '岷江'],
  xishuangbanna: ['西双版纳', '版纳', '傣族', '勐腊'],
  libo: ['荔波', '小七孔', '樟江', '黔南'],
  tengchong: ['腾冲', '和顺', '滇西', '热海'],
  zhenyuan: ['镇远', '镇远古城', '舞阳', '苗乡'],
  jinggangshan: ['井冈山', '茨坪', '红色', '黄洋界'],
  hongcun: ['宏村', '西递', '徽州', '黟县', '画里乡村'],
  jiuhua: ['九华山', '地藏', '佛教名山', '青阳'],
  mohe: ['漠河', '北极村', '北红村', '中国北极'],
  nyingchi: ['林芝', '八一', '桃花', '雅鲁藏布', '藏江南'],
  shigatse: ['日喀则', '扎什伦布', '珠峰', '后藏'],
  wutaishan: ['五台山', '文殊', '佛教名山', '台怀镇'],
  /* —— 江西地级市 —— */
  jiujiang: ['九江', '浔阳', '江州', '浔城', '鄱阳湖'],
  ganzhou: ['赣州', '虔城', '宋城', '客家摇篮', '章贡'],
  shangrao: ['上饶', '信州', '饶州', '三清山'],
  jian: ['吉安', '庐陵', '吉州', '文章节义'],
  yichun: ['宜春', '袁州', '月都', '温汤'],
  fuzhou_jx: ['抚州', '临川', '才子之乡', '汤显祖'],
  pingxiang: ['萍乡', '昭萍', '安源', '武功山'],
  xinyu: ['新余', '仙女湖', '钢城', '渝水'],
  yingtan: ['鹰潭', '道都', '月湖', '龙虎山'],
  /* —— 江西旅游强县 —— */
  ruijin: ['瑞金', '红都', '红色故都', '共和国摇篮', '沙洲坝'],
  longnan: ['龙南', '围屋之都', '客家围屋', '关西围', '南武当'],
  poyang: ['鄱阳', '波阳', '湖城', '鄱阳湖湿地公园', '饶州'],
  zhangshu: ['樟树', '药都', '清江', '四特酒', '阁皂山'],
  fengcheng: ['丰城', '剑邑', '洪州窑', '剑池'],
  guixi: ['贵溪', '象山书院', '信江', '塘湾'],
  gongqing: ['共青城', '共青', '耀邦', '富华山', '鄱阳湖']
};
Object.assign(CITY_ALIAS, CITY_ALIAS_EXTRA);

/* ---------- 快速规划的中性默认画像（其余 6 题缺省值） ---------- */
const QUICK_DEFAULTS = {
  interests: [], mood: [], pace: 'moderate',
  company: 'friend', budget: 'comfort', stamina: 'normal'
};

const DAY_COLORS = ['#7fae8a', '#c9a05a', '#8a7fb0', '#d98a6a', '#5b9ec9', '#b07d9a', '#6fae9c'];

/* ---------- 全局状态 ---------- */
const state = {
  page: 'index',
  step: 0,
  answers: {
    city: null, days: 3, interests: [], mood: [], pace: 'full', company: 'friend', budget: 'comfort', stamina: 'normal',
    destinations: [],   // 多目的地 [{cityKey, days, note?, matched?, emoji?}]
    anchors: []         // 必去锚点 [{cityKey, poiId, label, note?}]
  },
  profile: null,
  plan: null,
  session: null,      // 当前会话 { profile, plan, mode, answers }
  zoom: 1,            // 显示大小（1 = 100%）
  favs: [],
  history: [],
  /* 多城城市顺序模式：'smart' 按地理顺路自动排序（默认）｜'manual' 完全按用户排的。
     刻意放在 answers 之外 —— store.js 用 JSON.stringify(answers) 当收藏/历史的
     sid，往 answers 里塞字段会让所有历史记录对不上号。仅会话内有效，刷新回默认。 */
  destSortMode: 'smart'
};

const $ = id => document.getElementById(id);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

/* ============================================================
 *  路由
 * ============================================================ */
const PAGES = ['index', 'city', 'province', 'question', 'quickplan', 'result', 'mine', 'chat'];

/* 定位跟随的清理函数（null = 未跟随）。
   放在这里而不是"定位"那一节，是因为 route() 里要引用它——
   let 声明在函数定义之后没问题，但提前声明更不容易踩坑。 */
let geoWatchStop = null;
let geoWatchCount = 0;

function route(page, opts) {
  if (PAGES.indexOf(page) < 0) page = 'index';
  // 子页缺数据会白屏（state 不持久化）：渲染前兜底回首页
  if (page === 'result' && !state.plan && !(opts && opts.plan)) page = 'index';
  if (page === 'city' && !(opts && opts.city) && !state.lastCity) page = 'index';
  if (page === 'province' && !(opts && opts.province)) page = 'index';
  state.page = page;
  PAGES.forEach(p => { $('page-' + p).hidden = p !== page; });

  // 底部 tabBar：仅首页 / 我的 显示（与微信小程序一致）
  updateTabbar();
  // 手机壳内滚动区回顶
  const sc = document.querySelector('.screen');
  if (sc) sc.scrollTop = 0;
  window.scrollTo(0, 0);   // 手机端整页滚动在 body 上，切页时一并回到顶部
  // 离开首页收起搜索候选
  if (page !== 'index') { const sg = $('searchSuggest'); if (sg) sg.hidden = true; }

  if (page === 'index')     renderIndex();
  if (page === 'city')      enterCity(opts);
  if (page === 'province')  enterProvince(opts);
  if (page === 'question')  onEnterQuestion(opts);
  if (page === 'quickplan') onEnterQuick(opts);
  if (page === 'result')    /* 由 generate 后主动调用 renderResult */;
  if (page === 'mine')      renderMine();
  if (page === 'chat')      renderChat();

  /* 离开结果页就停掉定位跟随 —— 跟着走一直开着会很耗电，
     而且地图都不在了，更新也没意义。 */
  if (page !== 'result' && typeof geoWatchStop !== 'undefined' && geoWatchStop) {
    stopGeoWatch(false);
  }

  try { history.replaceState(null, '', '#' + page); } catch (e) {}
}

/* 底部 tabBar + 城市介绍页 CTA 显隐 + 选中态 */
function updateTabbar() {
  const bar = $('tabbar');
  if (bar) {
    bar.style.display = (state.page === 'index' || state.page === 'mine' || state.page === 'chat') ? 'flex' : 'none';
    bar.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.go === state.page));
  }
  // 城市介绍页底部规划条：物理固定，仅 city 页显示
  const cta = $('ciCta');
  if (cta) cta.classList.toggle('show', state.page === 'city');
}

/* ============================================================
 *  显示大小调节：用 transform:scale 整体缩放手机壳。
 *  为什么不用改 width/height：手机壳内部布局尺寸一变，SVG 地图、
 *  滚动位置、scroll-snap 全都要重排，且 CSS 的 max-width/max-height
 *  会把放大卡回去（只能缩不能放）。transform 只改视觉，内部
 *  坐标系 1:1 不变，稳。
 *  缩放基准 420×884；壳子外包一层 stage 负责占位，避免缩放后
 *  周围空白/遮挡。
 * ============================================================ */
const ZOOM_KEY = 'qt_zoom_v1';
const ZOOM_MIN = 0.8, ZOOM_MAX = 1.5, ZOOM_STEP = 0.05;
const BASE_W = 420, BASE_H = 884;

/* 视口可用尺寸：用一个 100dvh/100dvw 的探针元素实测，
   这样能反映手机地址栏收起/展开导致的高度变化（比 innerHeight 准）。 */
let _probe = null;
function vp() {
  if (!_probe) {
    _probe = document.createElement('div');
    // 先写 vw/vh 保底，再写 dvw/dvh 覆盖（不支持的浏览器会忽略后者）
    _probe.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;visibility:hidden;width:100vw;height:100vh';
    _probe.style.width = '100dvw';
    _probe.style.height = '100dvh';
    document.body.appendChild(_probe);
  }
  const r = _probe.getBoundingClientRect();
  return {
    w: Math.round(r.width) || window.innerWidth,
    h: Math.round(r.height) || window.innerHeight
  };
}

/* 手机壳的「1× 基准」不是死板的 420×884 —— 小屏手机上 884 高根本放不下。
   这里按视口反推基准：宽不超过 420（桌面看起来还是手机样），高不超过视口
   可用高度（手机上正好铺满一屏，和原生小程序观感一致）。
   缩放倍数 z 是叠在这个基准之上的「用户意愿」。 */
function baseSize() {
  const v = vp();
  // 桌面端壳子外有 11px 边框 + 26px 留白，手机上贴边只留几个像素
  const deskW = v.w > 560, deskH = v.h > 760;
  const chromeW = deskW ? 2 * (11 + 26) : 8;
  const chromeH = deskH ? 2 * (11 + 26) : 8;
  // 桌面端也是 420 宽（手机样），但视口不够时一并缩小；手机上贴满
  const maxW = Math.min(BASE_W, v.w - chromeW);
  const maxH = Math.min(BASE_H, v.h - chromeH);
  return { w: Math.floor(Math.max(280, maxW)), h: Math.floor(Math.max(400, maxH)) };
}

/* 把用户想要的倍数收进「放得下」的范围。
   baseSize() 已经按视口留过边框/留白余量，这里直接用基准比就行。 */
function fitZoom(z) {
  const b = baseSize();
  const v = vp();
  const maxZ = Math.min(v.w / b.w, v.h / b.h);
  return Math.max(ZOOM_MIN, Math.min(z, Math.max(1, Math.min(ZOOM_MAX, maxZ))));
}

function applyZoom(z, save) {
  // 手机端直接铺满屏幕，不走缩放逻辑，避免内联样式覆盖 CSS
  if (window.innerWidth < 560) {
    const phone = $('phone');
    if (phone) {
      phone.style.width = '';
      phone.style.height = '';
      phone.style.maxWidth = '';
      phone.style.maxHeight = '';
      phone.style.transform = '';
    }
    const stage = $('stage');
    if (stage) {
      stage.style.width = '';
      stage.style.height = '';
    }
    const zm = $('zoomer');
    if (zm) zm.style.display = 'none';
    return;
  }
  z = Math.round(z * 100) / 100;
  z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  state.zoom = z;

  // 基准随视口变，先同步壳子的真实尺寸
  const b = baseSize();
  const phone = $('phone');
  if (!phone) return;
  phone.style.width = b.w + 'px';
  phone.style.height = b.h + 'px';
  phone.style.maxWidth = b.w + 'px';
  phone.style.maxHeight = b.h + 'px';
  phone.style.transform = 'scale(' + z + ')';

  // 缩放后元素在文档流里仍占基准尺寸，用 stage 撑出缩放后的空间
  const stage = $('stage');
  if (stage) {
    stage.style.width = (b.w * z) + 'px';
    stage.style.height = (b.h * z) + 'px';
  }
  const zm = $('zoomer');
  if (zm) zm.style.display = 'flex';
  const val = $('zmVal');
  if (val) val.textContent = Math.round(z * 100) + '%';
  if (save) { try { localStorage.setItem(ZOOM_KEY, String(z)); } catch (e) { } }
  // 壳子尺寸变了，内部 SVG 地图要按新宽度重排
  if (typeof scheduleLayout === 'function') scheduleLayout();
}

function initZoomer() {
  let z = 1;
  try { const s = localStorage.getItem(ZOOM_KEY); if (s) z = parseFloat(s) || 1; } catch (e) { }
  applyZoom(fitZoom(z), false);

  const zmIn = $('zmIn'), zmOut = $('zmOut'), zmVal = $('zmVal');
  if (zmIn) zmIn.onclick = () => snapZoom(state.zoom + ZOOM_STEP, true);
  if (zmOut) zmOut.onclick = () => snapZoom(state.zoom - ZOOM_STEP, true);
  if (zmVal) zmVal.onclick = () => snapZoom(1, true);          // 点数字回到 100%

  // 滚轮 + 快捷键：Ctrl/⌘ + 滚轮，或 Ctrl/⌘ + 加减号
  window.addEventListener('wheel', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    snapZoom(state.zoom + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), true);
  }, { passive: false });
  window.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); snapZoom(state.zoom + ZOOM_STEP, true); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); snapZoom(state.zoom - ZOOM_STEP, true); }
    else if (e.key === '0') { e.preventDefault(); snapZoom(1, true); }
  });
  window.addEventListener('resize', () => {
    const fitted = fitZoom(state.zoom);
    if (fitted !== state.zoom) applyZoom(fitted, false);
    else applyZoom(state.zoom, false);
  });
}

/* 手动调节走这里：先按用户意愿放大，再受视口约束收回来 */
function snapZoom(z, save) {
  applyZoom(fitZoom(Math.round(z * 100) / 100), save);
}

/* ============================================================
 *  页面 1 · index —— 首页
 * ============================================================ */
const BANNERS = [
  { key: 'chongqing', title: '山城重庆', sub: '洪崖洞的夜 · 火锅的热' },
  { key: 'hangzhou',  title: '烟雨杭州', sub: '半城湖山半城茶' },
  { key: 'xiamen',    title: '海上厦门', sub: '鼓浪屿的风，咸咸的甜' }
];

/* 有实景封面图的城市（img/city/<key>.jpg）。
   只有这些城市才输出 <img> —— 114 座城里绝大多数还没有照片，
   全量写 src 会让浏览器批量发请求、控制台刷满 404（虽然 onerror 已兜底，
   但噪音会掩盖真问题，也会白耗用户流量）。缺图的城市走 cityVisual 的渐变色。 */
const CITY_PHOTOS = {
  beijing: 1, changsha: 1, chengdu: 1, chongqing: 1, guangzhou: 1,
  hangzhou: 1, nanchang: 1, shanghai: 1, xiamen: 1, xian: 1
};

/* WMO 天气代码 → emoji 图标 */
const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

/** 找离坐标最近的城市（用于显示地区名） */
function nearestCity(lat, lng) {
  // 定位坐标是 GCJ-02，CITY_INDEX 的 center 是 WGS84，
  // 必须把城市 center 转成 GCJ-02 再比较，否则坐标系不一致会有数百米偏差
  const wgs2gcj = (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02)
    ? Navi.wgs84ToGcj02
    : (lng, lat) => ({ lng, lat });
  let best = null, bestD = Infinity;
  Object.keys(CITY_INDEX).forEach(k => {
    const c = CITY_INDEX[k];
    if (!c.center) return;
    const g = wgs2gcj(c.center[1], c.center[0]);
    const d = Math.hypot(g.lat - lat, g.lng - lng);
    if (d < bestD) { bestD = d; best = c; }
  });
  return best;
}

/** 用坐标反查真实城市名：优先 OSM Nominatim（免费、无需 Key、中文优先）；失败返回空串，由调用方兜底 */
function reverseCityName(lat, lng) {
  // 入参是 GCJ-02，OSM 要 WGS84，转回再查
  const w = (typeof Navi !== 'undefined' && Navi.gcj02ToWgs84) ? Navi.gcj02ToWgs84(lng, lat) : { lng, lat };
  const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=zh&zoom=10&lat=' + w.lat + '&lon=' + w.lng;
  return fetch(url, { cache: 'no-store' })
    .then(r => r.json())
    .then(d => {
      const a = d && d.address;
      if (!a) return '';
      return a.city || a.town || a.county || a.state || '';
    })
    .catch(() => '');
}

/** 在本地城市库里按名字找中心点（用于国内 IP 接口只返回地区名的情况） */
function cityByName(name) {
  if (!name) return null;
  const raw = String(name).trim();
  const key = raw.replace(/[省市自治区特别行政区]/g, '');
  const latin = raw.toLowerCase().replace(/[^a-z]/g, '');   // ipwho.is / ipapi.co 常返回英文城市名
  let hit = null;
  Object.keys(CITY_INDEX).forEach(k => {
    if (hit) return;
    const c = CITY_INDEX[k];
    if (!c) return;
    if (latin && k.toLowerCase().replace(/[^a-z]/g, '') === latin) { hit = c; return; }
    if (!c.name) return;
    if (c.name === raw || (key && (c.name.indexOf(key) >= 0 || key.indexOf(c.name) >= 0))) hit = c;
  });
  return hit;
}

/** IP 粗定位兜底：多源依次尝试，均无需 Key（国内接口优先保证可用性） */
function ipLocate() {
  // IP 接口返回的是 WGS84，统一转成 GCJ-02 再交给 finish，与 GPS 路径口径一致
  const toGcj = (lat, lng) => {
    if (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02) {
      const g = Navi.wgs84ToGcj02(+lng, +lat);
      return { lat: g.lat, lng: g.lng };
    }
    return { lat: +lat, lng: +lng };
  };
  const fromIpwho = () => fetch('https://ipwho.is/', { cache: 'no-store' }).then(r => r.json()).then(d => {
    if (d && d.success !== false && d.latitude != null) { const g = toGcj(d.latitude, d.longitude); return { lat: g.lat, lng: g.lng, city: d.city || '' }; }
    throw new Error('ipwho');
  });
  const fromIpsb = () => fetch('https://api.ip.sb/geoip', { cache: 'no-store' }).then(r => r.json()).then(d => {
    if (d && d.latitude != null) { const g = toGcj(d.latitude, d.longitude); return { lat: g.lat, lng: g.lng, city: d.city || '' }; }
    throw new Error('ipsb');
  });
  const fromVore = () => fetch('https://api.vore.top/api/IPdata', { cache: 'no-store' }).then(r => r.json()).then(d => {
    const name = d && d.ipdata && (d.ipdata.info3 || d.ipdata.info2 || '');
    const hit = cityByName(name);
    if (hit) { const g = toGcj(hit.center[0], hit.center[1]); return { lat: g.lat, lng: g.lng, city: hit.name }; }
    throw new Error('vore');
  });
  const fromIpapi = () => fetch('https://ipapi.co/json/', { cache: 'no-store' }).then(r => r.json()).then(d => {
    if (d && d.latitude != null) { const g = toGcj(d.latitude, d.longitude); return { lat: g.lat, lng: g.lng, city: d.city || '' }; }
    throw new Error('ipapi');
  });
  return fromIpwho().catch(fromIpapi).catch(fromIpsb).catch(fromVore);
}

/** 加载首页问候卡的定位+天气：GPS → IP 定位 → 城市兜底，三级降级 */
function loadGreetWeather() {
  const locEl = $('greetLoc'), tempEl = $('greetTemp'), icoEl = $('greetIco'), rangeEl = $('greetRange');
  if (!locEl) return;
  locEl.textContent = '定位中…';

  // 用坐标拉 Open-Meteo 实时天气（免费、无需 Key）
  // 入参是 GCJ-02，open-meteo 要 WGS84，转回再传
  // 注意：Open-Meteo 是全球预报模型的网格值，与气象站实测可有 1~3° 出入，
  // 故同时给出今日最高/最低区间，让读数落在可解释范围内
  const showWeather = (lat, lng) => {
    const w = (typeof Navi !== 'undefined' && Navi.gcj02ToWgs84) ? Navi.gcj02ToWgs84(lng, lat) : { lng, lat };
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + w.lat +
      '&longitude=' + w.lng +
      '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';
    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const cur = d && d.current;
        if (!cur) return;
        tempEl.textContent = Math.round(cur.temperature_2m) + '°';
        icoEl.textContent = WMO_ICON[cur.weather_code] || '🌡️';
        const day = d.daily;
        if (rangeEl && day && day.temperature_2m_max && day.temperature_2m_min) {
          rangeEl.textContent = '今 ' + Math.round(day.temperature_2m_min[0]) + '~' + Math.round(day.temperature_2m_max[0]) + '°';
        }
        tempEl.title = '预报数据来自 Open-Meteo 全球模型，与气象站实测可能相差 1~3°';
      })
      .catch(() => { tempEl.textContent = '—°'; icoEl.textContent = '🌡️'; if (rangeEl) rangeEl.textContent = ''; });
  };

  // 拿到坐标后：优先用坐标算最近城市（比 IP 返回的城市名更精确），
  // IP 城市名和 OSM 反查只作为兜底
  // 此时 lat/lng 统一为 GCJ-02
  const finish = (lat, lng, knownName) => {
    showWeather(lat, lng);
    const local = nearestCity(lat, lng);
    locEl.textContent = (local ? local.name : '') || knownName || '当前位置';
    // OSM 反查结果必须匹配本地城市库才采用，避免返回上级地级市（如"庐山市"）覆盖掉更精确的共青城
    reverseCityName(lat, lng).then(n => {
      if (!n) return;
      const r = cityByName(n);
      if (r) locEl.textContent = r.name;
    });
  };

  // GPS：8 秒内没结果就放弃，交给 IP 兜底（避免一直卡在“定位中…”）
  const tryGps = () => new Promise((resolve, reject) => {
    if (typeof Geo === 'undefined' || !Geo.geoSupported || !Geo.geoSupported()) {
      reject(new Error('geolocation unsupported'));
      return;
    }
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; reject(new Error('gps timeout')); } }, 8000);
    Geo.locate().then(v => {
      if (done) return; done = true; clearTimeout(timer);
      resolve({ lat: v.lat, lng: v.lng });
    }).catch(e => {
      if (done) return; done = true; clearTimeout(timer);
      reject(e);
    });
  });

  const tryCity = () => new Promise((resolve, reject) => {
    const keys = Object.keys(CITY_INDEX);
    if (!keys.length) { reject(new Error('no city')); return; }
    const c = CITY_INDEX[keys[0]];
    // center 是 WGS84，转成 GCJ-02 与 finish 口径一致
    const g = (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02) ? Navi.wgs84ToGcj02(c.center[1], c.center[0]) : { lng: c.center[1], lat: c.center[0] };
    resolve({ lat: g.lat, lng: g.lng, city: c.name });
  });

  // 用户手动设过出发地 → 优先用它，不再信 IP。
  // 国内手机 IP（尤其走代理 / 校园网出口时）常被误判成北京等异地城市，
  // 而用户手选的「出发地」是明确意图，比 IP 可靠得多。
  const tryHome = () => new Promise((resolve, reject) => {
    if (typeof Store === 'undefined' || !Store.getHome) { reject(new Error('no store')); return; }
    const key = Store.getHome();
    const info = (typeof CITY_INDEX !== 'undefined') ? CITY_INDEX[key] : null;
    if (!key || !info || !info.center) { reject(new Error('no home')); return; }
    const g = (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02)
      ? Navi.wgs84ToGcj02(info.center[1], info.center[0])
      : { lng: info.center[1], lat: info.center[0] };
    resolve({ lat: g.lat, lng: g.lng, city: info.name });
  });

  tryGps()
    .then(pos => ({ ...pos, source: 'gps' }))
    .catch(() => tryHome().then(pos => ({ ...pos, source: 'home' })))
    .catch(() => ipLocate().then(pos => ({ ...pos, source: 'ip' })))
    .catch(() => tryCity().then(pos => ({ ...pos, source: 'city' })))
    .then(pos => {
      finish(pos.lat, pos.lng, pos.city);
      // IP 定位在手机上常误判（运营商/校园网出口在外地），
      // 给一次温和提示，引导用户手动选择出发城市
      if (pos.source === 'ip') {
        setTimeout(() => toast('网络定位可能不准，点击城市名可手动选择', 2600), 600);
      }
    })
    .catch(() => { locEl.textContent = '定位失败'; tempEl.textContent = '—°'; });
}

function renderIndex() {
  syncHomeCard();
  // 问候卡日期
  const gd = $('greetDate');
  if (gd) {
    const now = new Date();
    const week = ['日','一','二','三','四','五','六'][now.getDay()];
    gd.textContent = `${now.getMonth()+1}月${now.getDate()}日 · 星期${week}`;
  }
  // 加载定位+天气
  loadGreetWeather();
  // 轮播（已移除，保留兼容）
  const track = $('bannerTrack');
  if (track) {
    track.innerHTML = BANNERS.map(b => {
      const v = cityVisual(b.key);
      const photo = CITY_PHOTOS[b.key] ? `url('img/city/${b.key}.jpg'), ` : '';
      return `<div class="banner-slide" data-city="${b.key}" style="background-image:${photo}${v.bg}; background-size:cover; background-position:center">
         <div class="banner-shade"></div>
         <div class="banner-txt">
           <div class="banner-title">${b.title}</div>
           <div class="banner-sub">${b.sub}</div>
           <span class="banner-go">去看看 ›</span>
         </div>
       </div>`;
    }).join('');
    const dots = $('bannerDots');
    if (dots) dots.innerHTML = BANNERS.map((_, i) => `<i class="${i === 0 ? 'on' : ''}" data-i="${i}"></i>`).join('');
    startBanner();
  }
  bindBanner();

  // 人气城市排行（实景照片 + 名次角标，点击进快速规划）
  const all = Object.keys(POI_DB).map(k => {
    const c = POI_DB[k];
    return { key: k, name: c.name, slogan: c.slogan, count: c.pois.length };
  });
  $('cityCount').textContent = all.length + ' 座已收录';
  $('hotScroll').innerHTML = all.map((c, i) => `
    <div class="hot-card" data-city="${c.key}">
      <div class="hot-ph" style="background:${cityVisual(c.key).bg}">
        ${CITY_PHOTOS[c.key] ? `<img src="img/city/${c.key}.jpg" alt="${c.name}" loading="lazy" onerror="this.remove()">` : ''}
        <span class="hot-rank ${i < 3 ? 'top' : ''}">${i + 1}</span>
      </div>
      <div class="hot-body">
        <div class="hot-name">${c.name}</div>
        <div class="hot-slogan">${c.slogan}</div>
        <div class="hot-foot"><span class="hot-count">${c.count} 个精选地点</span><span class="hot-go">去规划 ›</span></div>
      </div>
    </div>`).join('');

  // 风格标签
  $('styleTags').innerHTML = Object.keys(TAG_META).map(k =>
    `<span class="tag">${TAG_META[k].icon} ${TAG_META[k].label}</span>`).join('');

  $('searchTip').textContent = '';
}

let bannerTimer = null, bannerIdx = 0;
function goBanner(i) {
  const n = BANNERS.length;
  bannerIdx = ((i % n) + n) % n;
  const track = $('bannerTrack');
  if (track) track.style.transform = `translateX(-${bannerIdx * 100}%)`;
  const dots = $('bannerDots');
  if (dots) dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === bannerIdx));
}
function startBanner() {
  clearInterval(bannerTimer);
  goBanner(0);
  bannerTimer = setInterval(() => goBanner(bannerIdx + 1), 4200);
}
function stopBanner() { clearInterval(bannerTimer); bannerTimer = null; }

/* 轮播交互：点进去 / 左右滑 / 点圆点 / 按住暂停自动播放 */
let bannerBound = false;
function bindBanner() {
  const box = $('banner');
  if (!box || bannerBound) return;
  bannerBound = true;

  let downX = 0, downY = 0, downT = 0, dragged = false, dragging = false;

  box.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; dragged = false;
    downX = e.clientX; downY = e.clientY; downT = Date.now();
    stopBanner();                                   // 手一碰就暂停，别跟手指抢
  }, { passive: true });

  box.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (Math.abs(e.clientX - downX) > 8 || Math.abs(e.clientY - downY) > 8) dragged = true;
  }, { passive: true });

  const finish = e => {
    if (!dragging) return;
    dragging = false;
    const dx = (e.clientX || 0) - downX;
    const dt = Date.now() - downT;
    /* 快速轻扫或明显位移都算翻页，否则算点击 */
    if (Math.abs(dx) > 44 || (Math.abs(dx) > 20 && dt < 300)) {
      goBanner(bannerIdx + (dx < 0 ? 1 : -1));
    } else if (!dragged) {
      /* 没滑动 → 视为点击，进当前这一张对应的城市介绍页 */
      const target = box.querySelectorAll('.banner-slide')[bannerIdx];
      const key = target && target.dataset.city;
      if (key) { route('city', { city: key }); return; }
    }
    setTimeout(() => { if (!bannerTimer) startBanner(); }, 2600);  // 松手一会儿后恢复自动播放
  };

  box.addEventListener('pointerup', finish);
  box.addEventListener('pointercancel', () => {
    dragging = false;
    setTimeout(() => { if (!bannerTimer) startBanner(); }, 2600);
  }, { passive: true });

  // 点圆点直接跳转那一张
  const dots = $('bannerDots');
  if (dots) {
    dots.addEventListener('pointerdown', e => e.stopPropagation());
    dots.addEventListener('click', e => {
      const d = e.target.closest('i[data-i]');
      if (!d) return;
      e.stopPropagation();
      goBanner(+d.dataset.i);
      stopBanner();
      setTimeout(() => { if (!bannerTimer) startBanner(); }, 4000);
    });
  }
}

/* ============================================================
 *  页面 1.5 · city —— 城市介绍（先了解，再决定要不要规划）
 * ============================================================ */
/* 从该城点位聚合出一段“这城是什么样”的介绍（零依赖、离线可算） */
function cityIntro(key) {
  const c = POI_DB[key];
  if (!c) return { desc: '—', tags: [], highlights: [] };
  const pois = c.pois;
  // 标签频次 → 该城气质关键词
  const catLabel = { food: '好吃', history: '有历史', nature: '自然山水', photo: '出片',
    shop: '好逛', family: '适合全家', art: '文艺', night: '夜生活', relax: '松弛' };
  const cnt = {};
  pois.forEach(p => Object.entries(p.tags || {}).forEach(([t, v]) => { if (v >= 0.6) cnt[t] = (cnt[t] || 0) + 1; }));
  const tags = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([t]) => catLabel[t] || t);
  // 介绍：slogan + 代表文化片段 + 类型概览
  const cultureLead = pois.filter(p => p.culture && p.culture.length > 20)
    .sort((a, b) => (b.crowd || 1) - (a.crowd || 1))[0];
  const desc = `${c.name}——${c.slogan}。` +
    (tags.length ? `这座城市的关键词是「${tags.join('、')}」。` : '') +
    (cultureLead ? `${cultureLead.name}一带，${cultureLead.culture.slice(0, 60)}` : `城内共收录 ${pois.length} 处值得走访的地点。`);
  // 必去：热度优先，兼顾类型多元
  const highlights = pois.slice().sort((a, b) => (b.crowd || 1) - (a.crowd || 1))
    .slice(0, 8);
  return { desc, tags, highlights, total: pois.length };
}

/* 城市页入口：分片是异步加载的，先取到完整数据再渲染，
   否则 renderCity 里 c.pois 会是空的（简介、必去、景点数全错）。 */
function enterCity(opts) {
  const key = (opts && opts.city) || state.lastCity || 'chengdu';
  state.lastCity = key;

  if (typeof DataLoader === 'undefined' || DataLoader.isCityLoaded(key)) {
    renderCity(Object.assign({}, opts, { city: key }));
    return;
  }

  // 加载期间先在壳里给个占位，避免白屏
  $('cityTitle').textContent = '加载中…';
  DataLoader.ensureCity(key)
    .then(() => renderCity(Object.assign({}, opts, { city: key })))
    .catch(() => {
      toast('这个城市的数据没加载成功，检查一下网络');
      route('index');
    });
}

/* ============================================================
 *  省份聚合页 —— 搜「江西」时看这一片都收录了什么
 *
 *  三层信息，从粗到细：
 *    1) 顶部统计条：多少城、多少景点、多少住宿片区（纯索引数据，秒出，不加载分片）
 *    2) 城市网格：每张卡一张城，点了进城市介绍页
 *    3) 可折叠景点清单：默认收起，点开某城才去加载那个分片（懒加载，别拖垮首屏）
 * ============================================================ */
function enterProvince(opts) {
  const pv = (opts && opts.province) || '';
  if (typeof ProvinceDB === 'undefined' || !pv) { route('index'); return; }
  const s = ProvinceDB.statsOf(pv);
  if (!s.cityCount) { toast('这个省份还没有收录的城市'); route('index'); return; }
  const meta = ProvinceDB.PROVINCE_META[pv] || {};

  state.lastProvince = pv;
  $('provTitle').textContent = pv;
  $('provName').textContent = pv;
  $('provFlag').textContent = '🏳';
  $('provSub').textContent = meta.short
    ? `简称「${meta.short}」 · ${s.cityCount} 座城市已收录`
    : `${s.cityCount} 座城市已收录`;
  $('provStats').innerHTML = [
    `<span class="prov-stat"><b>${s.cityCount}</b> 座城</span>`,
    `<span class="prov-stat"><b>${s.poiCount}</b> 个景点</span>`,
    `<span class="prov-stat"><b>${s.hotelCount}</b> 片住宿区</span>`
  ].join('');
  $('provCityNote').textContent = `共 ${s.cityCount} 座`;

  /* ---- 城市网格 ---- */
  $('provCities').innerHTML = s.cities.map(k => {
    const it = CITY_INDEX[k] || {};
    const v = cityVisual(k);
    return `<button class="city-card" data-city="${k}">
      <div class="city-ph" style="background:${v.bg}">${v.emoji}</div>
      <div class="city-nm">${it.name || k}</div>
      <div class="city-sub">${it.poiCount || 0} 个点</div>
    </button>`;
  }).join('');
  $('provCities').querySelectorAll('.city-card').forEach(b => {
    b.onclick = () => route('city', { city: b.dataset.city });
  });

  /* ---- 可折叠景点清单（懒加载） ---- */
  $('provPois').innerHTML = s.cities.map(k => {
    const it = CITY_INDEX[k] || {};
    const v = cityVisual(k);
    return `<details class="prov-poi-item" data-city="${k}">
      <summary>
        <span class="ppi-emoji">${v.emoji}</span>
        <span class="ppi-name">${it.name || k}</span>
        <span class="ppi-count">${it.poiCount || 0} 个点</span>
        <span class="ppi-caret">›</span>
      </summary>
      <div class="ppi-body"><div class="ppi-loading">正在加载…</div></div>
    </details>`;
  }).join('');

  const box = $('provPois');
  box.querySelectorAll('.prov-poi-item').forEach(d => {
    // 只在展开时加载一次（detail 的 toggle 事件），收起再展开不重复请求
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      const key = d.dataset.city;
      const body = d.querySelector('.ppi-body');
      if (!body || body.dataset.loaded === '1') return;

      const paint = (city) => {
        const pois = (city && city.pois) || [];
        if (!pois.length) { body.innerHTML = '<div class="ppi-loading">这城暂无可展示的景点</div>'; return; }
        body.innerHTML = pois.map(p => {
          const tag = Object.entries(p.tags || {}).sort((a, b) => b[1] - a[1])[0];
          const tm = tag && TAG_META[tag[0]];
          return `<button class="ppi-poi" data-poi="${p.id}" data-city="${key}">
            <span class="ppi-poi-name">${p.name}</span>
            ${tm ? `<span class="ppi-poi-tag" style="color:${tm.color}">${tm.icon} ${tm.label}</span>` : ''}
          </button>`;
        }).join('');
        body.dataset.loaded = '1';
        // 点某个景点 → 进这城的介绍页并高亮它
        body.querySelectorAll('.ppi-poi').forEach(pb => {
          pb.onclick = () => route('city', { city: pb.dataset.city });
        });
      };

      if (typeof DataLoader === 'undefined' || DataLoader.isCityLoaded(key)) {
        paint(typeof POI_DB !== 'undefined' ? POI_DB[key] : null);
      } else {
        body.innerHTML = '<div class="ppi-loading">正在加载…</div>';
        DataLoader.ensureCity(key)
          .then(() => paint(POI_DB[key]))
          .catch(() => { body.innerHTML = '<div class="ppi-loading">这城数据没加载成功，检查下网络</div>'; });
      }
    });
  });
}

/* 城市介绍页「值得去的几处」是否展开全部（false = 只看精选 Top 8） */
let _ciPoisOpen = false;

function renderCity(opts) {
  const key = (opts && opts.city) || state.lastCity || 'chengdu';
  state.lastCity = key;
  const c = POI_DB[key];
  if (!c) { route('index'); return; }
  const v = cityVisual(key);
  const info = cityIntro(key);
  _ciPoisOpen = false;   // 每次进新城都从「精选 Top 8」看起
  const bookCount = c.pois.filter(p => p.book).length;

  $('cityTitle').textContent = c.name;
  $('ciHero').style.background = v.bg;
  $('ciEmoji').textContent = v.emoji;
  $('ciName').textContent = c.name;
  $('ciSlogan').textContent = c.slogan;
  $('ciMeta').innerHTML = [
    `<span class="ci-chip">${c.pois.length} 处精选地点</span>`,
    bookCount ? `<span class="ci-chip warn">${bookCount} 处需预约</span>` : '',
    `<span class="ci-chip">坐标 ${c.center[0].toFixed(1)}°N ${c.center[1].toFixed(1)}°E</span>`
  ].filter(Boolean).join('');
  $('ciDesc').textContent = info.desc;
  $('ciTags').innerHTML = info.tags.map(t => `<span class="tag">${t}</span>`).join('');
  $('ciPoiCount').textContent = `共 ${c.pois.length} 处`;
  /* 「值得去的几处」列表：cityIntro.highlights 只取热度 Top 8（刻意精选），
     但计数写「共 20 处」，往下滚却只有 8 张卡——用户以为少了 12 个。
     这里改为折叠式：默认 Top 8 + 「展开全部」按钮，展开后列出全部并给「收起」。
     进城时重置为折叠态（每次看新城市都从精选看起）。 */
  const paintCiPois = () => {
    const list = _ciPoisOpen ? c.pois : info.highlights;
    const box = $('ciPois');
    box.innerHTML = list.map((p, i) => `
      <div class="ci-poi" data-poi="${p.id}">
        <span class="ci-poi-idx">${i + 1}</span>
        <div class="ci-poi-body">
          <div class="ci-poi-name">${p.name}${p.book ? '<span class="ci-poi-book">需预约</span>' : ''}</div>
          <div class="ci-poi-area">${p.area} · ${p.best.includes('morning') ? '建议上午' : p.best.includes('evening') || p.best.includes('night') ? '建议傍晚' : '随时可去'}</div>
          <div class="ci-poi-tip">${p.tip || ''}</div>
        </div>
      </div>`).join('');
    if (c.pois.length > info.highlights.length || _ciPoisOpen) {
      const btn = el('div', 'more-row ci-more',
        _ciPoisOpen ? '收起 ▲' : `展开全部 ${c.pois.length} 处 ▾`);
      btn.onclick = () => { _ciPoisOpen = !_ciPoisOpen; paintCiPois(); };
      box.appendChild(btn);
    }
    /* 点位卡点击 → 景点详情弹层（与原有行为保持一致的话需要看下方是否绑定过；没有就不加） */
  };
  paintCiPois();
  $('ciCtaName').textContent = c.name;
  $('ciPlanBtn').onclick = () => route('quickplan', { city: key });
  if ($('ciDeepBtn')) $('ciDeepBtn').onclick = () => route('question', { city: key });

  // 城市整体导航：已设出发地就导航「出发地 → 这座城市」，
  // 未设出发地就只标注这座城市的位置（由高德按用户定位给路线）
  const cnb = $('ciNavBtn');
  if (cnb) {
    const homeKey = Store.getHome();
    const hasHome = homeKey && POI_DB[homeKey] && homeKey !== key;
    cnb.onclick = () => openNavi(hasHome
      ? { cross: { fromKey: homeKey, toKey: key } }
      : { poi: { name: c.name, lng: c.center[1], lat: c.center[0] } });
  }

  // 足迹打卡：去了才点亮（点亮状态实时反映）
  const vb = $('ciVisitBtn');
  if (vb) {
    const paint = () => {
      const on = Store.isVisited(key);
      vb.classList.toggle('on', on);
      vb.textContent = on ? `✦ 已点亮 · ${c.name}去过啦` : '✦ 我去过 · 点亮这座城';
    };
    paint();
    vb.onclick = () => {
      const on = Store.toggleVisit(key);
      paint();
      toast(on ? `✦ 已点亮 ${c.name} · 记入你的足迹` : `已取消点亮 ${c.name}`);
      if (on && vb.animate) vb.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 320 });
    };
  }

  // 旅行者分享：所有用户的反馈 + 宝藏地投稿（对所有用户可见）
  const shareHead = $('ciShareHead');
  const shareBox = $('ciShare');
  const feedbacks = (typeof Store.listAllFeedback === 'function') ? Store.listAllFeedback() : [];
  const gems = (typeof Store.listGems === 'function') ? Store.listGems(key) : [];
  const cityFB = feedbacks.filter(f => f.cityKey === key || f.city === c.name);
  const shares = [...cityFB.map(f => ({...f, type:'feedback'})), ...gems.map(g => ({...g, type:'gem'}))];
  if (shareHead && shareBox) {
    if (shares.length === 0) {
      shareHead.hidden = true;
      shareBox.innerHTML = '';
    } else {
      shareHead.hidden = false;
      $('ciShareCount').textContent = `${shares.length} 条分享`;
      shareBox.innerHTML = shares.map(s => {
        const isFB = s.type === 'feedback';
        const photos = (s.photos && s.photos.length) ? s.photos.slice(0,3).map(p =>
          `<img class="ci-share-photo" src="${p}" alt="" onclick="window._previewPhoto&&window._previewPhoto('${p}')">`
        ).join('') : '';
        const more = (s.photos && s.photos.length > 3) ? `<span class="ci-share-more">+${s.photos.length - 3}</span>` : '';
        const title = isFB ? `${s.city || key} · ${s.days || 1}天` : (s.name || '宝藏地');
        const meta = isFB
          ? `${s.density || '😊'} ${s.stars ? '★'.repeat(s.stars) : ''} · ${s.time || ''}`
          : `📍 ${s.area || ''} · ${s.reason ? '推荐理由' : ''}`;
        return `<div class="ci-share-card">
          <div class="ci-share-head"><b>${title}</b><span class="ci-share-type ${isFB?'fb':'gem'}">${isFB?'行程反馈':'💎 宝藏地'}</span></div>
          ${s.text ? `<div class="ci-share-text">${s.text}</div>` : ''}
          ${s.reason ? `<div class="ci-share-text">${s.reason}</div>` : ''}
          ${photos ? `<div class="ci-share-photos">${photos}${more}</div>` : ''}
          <div class="ci-share-meta">${meta}</div>
        </div>`;
      }).join('');
    }
  }
}

/* ---------- 城市名匹配（带打分） ----------
 * ⚠️ 之前用「先匹配到的就是它」，会踩坑：搜「凤凰」命中的是银川
 *    （银川别名「凤凰城」→ "凤凰城".indexOf("凤凰")===0 先命中）,
 *    真正的凤凰古城反而找不到。所以这里按匹配质量打分取最优。
 * 分数：城市名完全相同 100 > 名字前缀 80 > 名字包含 60
 *     > 别名完全相同 50 > 别名前缀 40 > 别名包含 30 > 反向包含 20 */
function scoreCity(k, kw) {
  const c = POI_DB[k];
  if (!c) return 0;
  const name = c.name, low = kw.toLowerCase();
  if (name === kw) return 100;
  if (k === low) return 90;
  if (name.indexOf(kw) === 0) return 80;
  if (name.indexOf(kw) >= 0) return 60;
  const aliases = CITY_ALIAS[k] || [];
  if (aliases.some(a => a === kw)) return 50;
  if (aliases.some(a => a.indexOf(kw) === 0)) return 40;
  if (aliases.some(a => a.indexOf(kw) >= 0)) return 30;
  // 反向：关键词比名字长（比如输「凤凰古城」），也算命中，但优先级最低
  if (kw.indexOf(name) >= 0) return 25;
  if (aliases.some(a => kw.indexOf(a) >= 0)) return 20;
  if (k.indexOf(low) >= 0) return 15;
  /* 省份归属：城市名没直接命中，但搜的是它所在的省，也给一个分。
     这样搜「江西」时，九江、赣州等 14 城会一起出现在候选里——
     用户想找的是"这一片"，不是某座城。分数刻意低于城市名包含（60）：
     搜「南昌」时南昌（100）必须排在"它属于江西"这个弱信号（22）前面。 */
  if (typeof ProvinceDB !== 'undefined' && kw.length > 1) {
    const prov = ProvinceDB.provinceOf(k);
    if (prov) {
      const meta = ProvinceDB.PROVINCE_META[prov] || {};
      if (prov === kw || (meta.alias || []).indexOf(kw) >= 0) return 22;
      if (prov.indexOf(kw) >= 0 || (meta.short || '') === kw) return 20;
    }
  }
  return 0;
}

/* 返回按匹配度排序的命中的城市 key 列表 */
function matchCities(kw, limit) {
  kw = (kw || '').trim();
  if (!kw) return [];
  return Object.keys(POI_DB)
    .map(k => ({ k, v: scoreCity(k, kw) }))
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v || a.k.localeCompare(b.k))
    .slice(0, limit || 6)
    .map(x => x.k);
}

/* 搜索：命中先进「城市介绍页」看简介；搜的是省份则进「省份聚合页」 */
function doSearch() {
  const kw = ($('searchInput').value || '').trim();
  if (!kw) { $('searchTip').textContent = '输入城市名或省份名，比如「重庆」「江西」'; return; }

  /* 省份优先判定：用户输「江西」时，城市侧会有一堆 22 分的弱命中，
     如果先看城市，就会莫名跳到某一座城。所以先问省份。 */
  const prov = (typeof ProvinceDB !== 'undefined') ? ProvinceDB.matchProvinces(kw, 1)[0] : null;
  const cityHit = matchCities(kw, 1)[0];

  // 省名全等 / 简称全等 → 一定是想找省
  const provStrong = prov && (prov === kw ||
    ((ProvinceDB.PROVINCE_META[prov] || {}).short === kw));

  if (provStrong) {
    $('searchTip').textContent = '';
    $('searchInput').value = '';
    route('province', { province: prov });
    return;
  }
  if (cityHit) {
    $('searchTip').textContent = '';
    $('searchInput').value = '';
    route('city', { city: cityHit });
    return;
  }
  if (prov) {
    $('searchTip').textContent = '';
    $('searchInput').value = '';
    route('province', { province: prov });
    return;
  }
  $('searchTip').textContent = '还没收录「' + kw + '」，试试「江西」「四川」这类省份，或热门城市';
}

/* 搜索实时候选：边输边出城市卡片 + 省份卡片 */
function searchSuggest() {
  const kw = ($('searchInput').value || '').trim().toLowerCase();
  const box = $('searchSuggest');
  if (!kw) { box.hidden = true; box.innerHTML = ''; return; }

  /* 与 doSearch 共用同一套打分，保证「候选第一项」和「回车结果」是同一个 */
  const hits = matchCities(kw, 6);
  const provs = (typeof ProvinceDB !== 'undefined') ? ProvinceDB.matchProvinces(kw, 2) : [];

  if (!hits.length && !provs.length) { box.hidden = true; box.innerHTML = ''; return; }

  const provHtml = provs.map(pv => {
    const s = ProvinceDB.statsOf(pv);
    const meta = ProvinceDB.PROVINCE_META[pv] || {};
    return `<button class="sg-item sg-prov" data-province="${pv}">
       <span class="sg-emoji">🏳</span>
       <span class="sg-name">${pv}${meta.short ? `<i class="sg-short">${meta.short}</i>` : ''}</span>
       <span class="sg-slogan">已收录 ${s.cityCount} 城 · ${s.poiCount} 个景点</span>
     </button>`;
  }).join('');

  const cityHtml = hits.map(k =>
    `<button class="sg-item" data-city="${k}">
       <span class="sg-emoji">${cityVisual(k).emoji}</span>
       <span class="sg-name">${POI_DB[k].name}</span>
       <span class="sg-slogan">${POI_DB[k].slogan}</span>
     </button>`).join('');

  // 省份结果排在前面：搜「江西」时省卡片应该是第一条
  box.innerHTML = provHtml + cityHtml;
  box.hidden = false;

  /* ⚠️ 用 pointerdown 而不是 click：输入框 blur 会先于 click 触发并把列表隐藏，
     导致第一次点击永远打不开城市（要再点一次）。pointerdown 早于 blur。 */
  box.querySelectorAll('.sg-item').forEach(b => {
    b.onpointerdown = e => {
      e.preventDefault();                 // 阻止输入框失焦
      box.hidden = true;
      const inp = $('searchInput'); if (inp) inp.value = '';
      if (b.dataset.province) route('province', { province: b.dataset.province });
      else route('city', { city: b.dataset.city });
    };
  });
}

/* ============================================================
 *  页面 2 · question —— 8 题问卷（逻辑原样保留）
 * ============================================================ */
function onEnterQuestion(opts) {
  if (opts && opts.city && POI_DB[opts.city]) {
    state.answers.city = opts.city;
    /* 关键：第 1 题（城市）校验的是 destinations，只设 answers.city 不够 ——
       否则从城市介绍页点「深度定制」进来会卡在第 1 题（下一步是灰的）。
       与小程序端 pages/question/question.js 的处理保持一致。 */
    const already = (state.answers.destinations || []).some(d => d.cityKey === opts.city);
    if (!already) {
      state.answers.destinations = (state.answers.destinations || []).concat([{ cityKey: opts.city, days: 1, note: '' }]);
    }
  }
  if (opts && opts.days) state.answers.days = opts.days;
  state.step = 0;
  renderStep();
  refresh();
}

function renderStep() {
  const q = QUESTIONS[state.step];
  const box = $('quiz');
  box.innerHTML = '';

  box.appendChild(el('div', '', `<h2 class="q-title">${q.title}</h2><p class="q-sub">${q.subtitle}</p>`));

  if (q.type === 'city') {
    renderDestPicker(box);
  }

  if (q.type === 'days') {
    const row = el('div', 'days-row');
    [1, 2, 3, 4, 5, 6, 7].forEach(d => {
      const chip = el('button', 'day-chip' + (state.answers.days === d ? ' on' : ''));
      chip.innerHTML = `<b>${d}</b><span>天</span>`;
      chip.onclick = () => { state.answers.days = d; refresh(); };
      row.appendChild(chip);
    });
    box.appendChild(row);
  }

  if (q.type === 'multi') {
    const g = el('div', 'opt-grid');
    const picked = state.answers[q.key];
    const full = picked.length >= q.max;
    q.options.forEach(o => {
      const on = picked.includes(o.value);
      const btn = el('button', 'opt' + (on ? ' on' : '') + (!on && full ? ' opt-disabled' : ''));
      btn.innerHTML =
        `<span class="opt-icon">${o.icon}</span>
         <span class="opt-body"><span class="opt-label">${o.label}</span>
         <span class="opt-desc">${o.desc}</span></span>`;
      btn.onclick = () => {
        const i = picked.indexOf(o.value);
        if (i >= 0) picked.splice(i, 1);
        else if (picked.length < q.max) picked.push(o.value);
        refresh();
      };
      g.appendChild(btn);
    });
    box.appendChild(g);
    const counter = el('p', 'q-sub', `已选 ${picked.length} / ${q.max} 项${full ? '（想换请先取消一个）' : ''}`);
    counter.style.marginTop = '12px';
    box.appendChild(counter);

    /* 心情题下方：体验目标三维滑块 + 任务模式开关 */
    if (q.key === 'mood') {
      const eg = state.answers.experienceGoals || { relax: 0.5, explore: 0.5, lively: 0.5 };
      state.answers.experienceGoals = eg;
      /* 选了心情自动填默认值 */
      if (picked.length && typeof MOOD_CFG !== 'undefined') {
        const m = MOOD_CFG[picked[0]];
        if (m && m.goals) {
          if (!state.answers._goalsInited) {
            eg.relax = m.goals.relax; eg.explore = m.goals.explore; eg.lively = m.goals.lively;
            state.answers._goalsInited = true;
          }
        }
      }
      const sliders = [
        { key: 'relax', label: '放松度', icon: '🍃', hint: '低=刺激感强，高=松弛慢节奏' },
        { key: 'explore', label: '探索欲', icon: '🔍', hint: '低=熟悉舒适，高=新奇未知' },
        { key: 'lively', label: '热闹度', icon: '🎈', hint: '低=安静独处，高=人群沸腾' }
      ];
      const egBox = el('div', 'eg-box');
      egBox.innerHTML = `<div class="eg-title">🎚 体验目标（拖动微调，路线弧线会跟着变）</div>` +
        sliders.map(s => {
          const v = Math.round((eg[s.key] || 0.5) * 100);
          return `<div class="eg-row">
            <span class="eg-ic">${s.icon}</span>
            <span class="eg-lb">${s.label}</span>
            <input type="range" min="0" max="100" value="${v}" data-eg="${s.key}">
            <span class="eg-val">${v}</span>
            <span class="eg-hint">${s.hint}</span>
          </div>`;
        }).join('') +
        `<div class="eg-quest">
           <label class="quest-switch">
             <input type="checkbox" id="questModeToggle" ${state.answers.questMode ? 'checked' : ''}>
             <span>🗺 开启剧情任务模式（任务完成会解锁新景点、改变路线）</span>
           </label>
         </div>`;
      box.appendChild(egBox);
      egBox.querySelectorAll('input[type=range]').forEach(r => {
        r.oninput = () => {
          eg[r.dataset.eg] = parseInt(r.value) / 100;
          r.parentNode.querySelector('.eg-val').textContent = r.value;
        };
      });
      const qm = egBox.querySelector('#questModeToggle');
      if (qm) qm.onchange = () => { state.answers.questMode = qm.checked; };
    }
  }

  if (q.type === 'single') {
    const g = el('div', 'opt-grid');
    q.options.forEach(o => {
      const on = state.answers[q.key] === o.value;
      const btn = el('button', 'opt' + (on ? ' on' : ''));
      btn.innerHTML =
        `<span class="opt-icon">${o.icon}</span>
         <span class="opt-body"><span class="opt-label">${o.label}</span>
         <span class="opt-desc">${o.desc}</span></span>`;
      btn.onclick = () => { state.answers[q.key] = o.value; refresh(); };
      g.appendChild(btn);
    });
    box.appendChild(g);
  }

  $('btnBack').disabled = state.step === 0;
  $('btnNext').textContent = state.step === QUESTIONS.length - 1 ? '生成我的路线' : '下一步';
  $('btnNext').disabled = !stepValid();
  $('stepDots').innerHTML = QUESTIONS.map((_, i) => `<i class="${i === state.step ? 'on' : ''}"></i>`).join('');
}

function stepValid() {
  const q = QUESTIONS[state.step];
  const v = state.answers[q.key];
  if (q.type === 'city') return !!(state.answers.destinations && state.answers.destinations.length);
  if (q.type === 'multi') return v && v.length >= q.min;
  return !!v;
}
function refresh() { renderStep(); }

/* ============================================================
 *  多目的地选择器（问卷第 1 题）
 *  · 搜索栏支持 拼音/首字母/错别字/城市/景点（走 Places.searchPlaces）
 *  · 已选 chips = 游览顺序，每段可调天数（权重，最终按总天数归一）
 *  · 必去锚点：把具体景点钉进对应城市的行程
 *  · 未收录地名自动归并（Places.resolvePlace），并显式提示
 * ============================================================ */
let _destSuggestItems = [];   // 当前建议项（预留：供外部读取当前候选）

function destAdd(cityKey, opts) {
  opts = opts || {};
  const CI = (typeof CITY_INDEX !== 'undefined') ? CITY_INDEX : {};
  if (!CI[cityKey]) return;
  const list = state.answers.destinations;
  if (list.some(d => d.cityKey === cityKey)) {   // 已加过：仅补提示
    if (opts.note) { list.find(d => d.cityKey === cityKey).note = opts.note; refresh(); }
    return;
  }
  list.push({ cityKey, days: 1, note: opts.note || '' });
  // 第一段自动设为 answers.city（兼容单城逻辑与历史记录）
  if (!state.answers.city) state.answers.city = cityKey;
  refresh();
}

function destRemove(cityKey) {
  const list = state.answers.destinations;
  const i = list.findIndex(d => d.cityKey === cityKey);
  if (i >= 0) list.splice(i, 1);
  // 同步移除该城的锚点
  state.answers.anchors = state.answers.anchors.filter(a => a.cityKey !== cityKey);
  if (state.answers.city === cityKey) state.answers.city = list[0] ? list[0].cityKey : null;
  refresh();
}

function destAdjustDays(cityKey, delta) {
  const d = state.answers.destinations.find(x => x.cityKey === cityKey);
  if (!d) return;
  d.days = Math.max(1, Math.min(14, d.days + delta));
  refresh();
}

function destMove(cityKey, dir) {
  const list = state.answers.destinations;
  const i = list.findIndex(d => d.cityKey === cityKey);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  if (!state.answers.city || state.answers.city === list[j].cityKey) { }
  state.answers.city = list[0].cityKey;   // 首段即出发主城
  /* 用户一旦手动调顺序，就视为他表达了主观偏好：切到 manual，
     之后生成不再自动按地理重排，免得辛苦排的次序被悄悄改掉。
     想恢复自动排序，点标题行右侧的「🧭 智能排序」即可。 */
  if (list.length > 1 && state.destSortMode !== 'manual') {
    state.destSortMode = 'manual';
    toast('已切换为你的顺序，不再自动优化');
  }
  refresh();
}

/* 目的地选择器标题行的「智能排序 / 恢复我的顺序」切换 */
function toggleDestSort() {
  state.destSortMode = (state.destSortMode === 'manual') ? 'smart' : 'manual';
  toast(state.destSortMode === 'smart' ? '已开启智能排序' : '已保留你的顺序');
  refresh();
}

function anchorRemove(idx) {
  state.answers.anchors.splice(idx, 1);
  refresh();
}

function renderDestPicker(box) {
  const CI = (typeof CITY_INDEX !== 'undefined') ? CITY_INDEX : {};
  const dlist = state.answers.destinations;
  const alist = state.answers.anchors;

  /* —— 搜索栏 —— */
  const search = el('div', 'dest-search');
  search.innerHTML =
    `<span class="ds-icon">🔍</span>
     <input id="destInput" class="ds-input" placeholder="搜城市 / 景点，支持拼音和首字母" autocomplete="off" />
     <button id="destClear" class="ds-clear" hidden>✕</button>`;
  box.appendChild(search);
  const sugg = el('div', 'dest-suggest');
  sugg.id = 'destSuggest';
  sugg.hidden = true;
  box.appendChild(sugg);

  /* —— 已选目的地 chips —— */
  const chipWrap = el('div', 'dest-chips');
  chipWrap.id = 'destChips';
  box.appendChild(chipWrap);

  /* —— 必去打卡（锚点）—— */
  const anchorBox = el('div', 'anchor-box');
  anchorBox.id = 'anchorBox';
  box.appendChild(anchorBox);

  /* —— 归并/提示条 —— */
  const note = el('div', 'dest-note');
  note.id = 'destNote';
  note.hidden = true;
  box.appendChild(note);

  /* —— 热门推荐（未搜索时兜底）—— */
  const hot = el('div', 'dest-hot');
  hot.id = 'destHot';
  box.appendChild(hot);

  paintDestChips();

  /* —— 热门城市（原 city-grid 缩小为一行快选）—— */
  const hotKeys = ['shangrao', 'hangzhou', 'chengdu', 'xian', 'nanchang', 'ruijin', 'guilin', 'dunhuang'];
  hot.innerHTML = `<div class="dest-hot-title">试试这些：</div><div class="dest-hot-row">` +
    hotKeys.filter(k => CI[k]).map(k => {
      const v = cityVisual(k);
      return `<button class="dest-hot-chip" data-city="${k}"><span>${v.emoji}</span>${CI[k].name}</button>`;
    }).join('') + `</div>`;
  hot.querySelectorAll('.dest-hot-chip').forEach(b => {
    b.onclick = () => destAdd(b.dataset.city);
  });

  /* —— 输入事件 —— */
  const inp = $('destInput'), clr = $('destClear');
  const onInput = () => {
    const kw = inp.value.trim();
    clr.hidden = !kw;
    if (!kw) { sugg.hidden = true; sugg.innerHTML = ''; hot.hidden = false; return; }
    hot.hidden = true;
    renderDestSuggest(kw, sugg);
  };
  inp.oninput = onInput;
  inp.onfocus = onInput;
  inp.onblur = () => setTimeout(() => { sugg.hidden = true; }, 180);
  clr.onclick = () => { inp.value = ''; onInput(); inp.focus(); };
}

function renderDestSuggest(kw, sugg) {
  const items = (typeof Places !== 'undefined') ? Places.searchPlaces(kw, { limit: 10 }) : [];
  _destSuggestItems = items;
  if (!items.length) {
    // 无直接命中 → 尝试归并
    const r = (typeof Places !== 'undefined') ? Places.resolvePlace(kw) : null;
    if (r && r.city) {
      const CI = CITY_INDEX;
      const v = cityVisual(r.city);
      sugg.innerHTML = `<div class="sg-group">未直接收录 · 建议</div>
        <button class="sg-item ds-resolve" data-key="${r.city}" data-poi="${r.poiId || ''}" data-note="${escAttr(r.note)}">
          <span class="sg-emoji">${v.emoji}</span>
          <span class="sg-body"><span class="sg-name">${CI[r.city].name}</span>
          <span class="sg-sub">${r.note}</span></span></button>`;
    } else {
      sugg.innerHTML = `<div class="sg-empty">没找到「${escAttr(kw)}」，换个词或从热门里挑</div>`;
    }
  } else {
    const icon = { city: '🏙', province: '🏳', poi: '📍' };
    const label = { city: '城市', province: '省份', poi: '景点' };
    sugg.innerHTML = items.map((it, i) =>
      `<button class="sg-item" data-i="${i}">
        <span class="sg-emoji">${icon[it.type]}</span>
        <span class="sg-body"><span class="sg-name">${it.name}</span>
        <span class="sg-sub">${label[it.type]}${it.type === 'city' ? ' · ' + (it.sub || '') : it.type === 'province' ? ' · ' + (it.sub || '') : ' · ' + (it.sub || '')}</span></span></button>`
    ).join('');
    sugg.querySelectorAll('.sg-item').forEach(btn => {
      btn.onpointerdown = e => {
        e.preventDefault();
        const it = items[+btn.dataset.i];
        if (it.type === 'province') {
          route('province', { province: it.name });
        } else if (it.type === 'poi') {
          // 加城市 + 锚点
          destAdd(it.key);
          const a = { cityKey: it.key, poiId: it.poiId, label: it.name };
          if (!state.answers.anchors.some(x => x.poiId === it.poiId)) state.answers.anchors.push(a);
          refresh();
        } else {
          destAdd(it.key);
        }
      };
    });
  }
  sugg.hidden = false;
  // 归并项点击
  const rz = sugg.querySelector('.ds-resolve');
  if (rz) rz.onpointerdown = e => {
    e.preventDefault();
    const key = rz.dataset.key, poi = rz.dataset.poi, nt = rz.dataset.note;
    destAdd(key, { note: nt });
    if (poi) {
      // 锚点标签用归并前的原词（如「三清山」）更贴切
      if (!state.answers.anchors.some(x => x.poiId === poi)) {
        state.answers.anchors.push({ cityKey: key, poiId: poi, label: kw });
      }
    }
    refresh();
  };
}

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function paintDestChips() {
  const chipWrap = $('destChips'), anchorBox = $('anchorBox'), note = $('destNote');
  if (!chipWrap) return;
  const dlist = state.answers.destinations, alist = state.answers.anchors;
  const total = state.answers.days || 3;

  if (!dlist.length) {
    chipWrap.innerHTML = `<div class="dest-empty">还没选目的地 —— 用上面的搜索栏，或点下面的热门城市</div>`;
  } else {
    /* 显示「实际会分到几天」，而不是按权重估的值 —— 否则 2 段各 1 权重、总 3 天时
       两边都显示 2 天，加起来 4 天，用户会以为算错了。这里直接跑一次与生成时
       同一套 allocateDays，保证所见即所得。 */
    const alloc = (typeof Multi !== 'undefined' && Multi.allocateDays)
      ? Multi.allocateDays(dlist.map(d => ({ days: d.days })), total).map(a => a.days)
      : dlist.map(() => Math.max(1, Math.floor(total / dlist.length)));
    const sortBtn = dlist.length > 1
      ? `<button class="dc-sort" id="destSortToggle">${
          state.destSortMode === 'manual' ? '🧭 智能排序' : '↩︎ 恢复我的顺序'
        }</button>`
      : '';
    chipWrap.innerHTML = `<div class="dest-sec-title">行程顺序（共 ${dlist.length} 段 · 总 ${total} 天）${sortBtn}</div>` +
      dlist.map((d, i) => {
        const v = cityVisual(d.cityKey);
        const nm = (CITY_INDEX[d.cityKey] || {}).name || d.cityKey;
        const est = alloc[i] || 1;
        return `<div class="dest-chip" data-city="${d.cityKey}">
          <span class="dc-seq">${i + 1}</span>
          <span class="dc-emoji">${v.emoji}</span>
          <span class="dc-name">${nm}${d.note ? `<i class="dc-note" title="${escAttr(d.note)}">ⓘ</i>` : ''}</span>
          <span class="dc-days">
            <button class="dc-btn" data-act="minus">−</button>
            <b>${est}</b>天
            <button class="dc-btn" data-act="plus">＋</button>
          </span>
          <span class="dc-move">
            <button class="dc-btn" data-act="up">↑</button>
            <button class="dc-btn" data-act="down">↓</button>
          </span>
          <button class="dc-del" data-act="del">✕</button>
        </div>`;
      }).join('');
    chipWrap.querySelectorAll('.dest-chip').forEach(chip => {
      const key = chip.dataset.city;
      chip.querySelectorAll('[data-act]').forEach(b => {
        b.onclick = () => {
          const a = b.dataset.act;
          if (a === 'plus') destAdjustDays(key, 1);
          else if (a === 'minus') destAdjustDays(key, -1);
          else if (a === 'up') destMove(key, -1);
          else if (a === 'down') destMove(key, 1);
          else if (a === 'del') destRemove(key);
        };
      });
    });
    const sortToggle = chipWrap.querySelector('#destSortToggle');
    if (sortToggle) sortToggle.onclick = toggleDestSort;
  }

  // 锚点
  if (!alist.length) {
    anchorBox.innerHTML = `<div class="anchor-head">📍 必去打卡（选填）<span class="anchor-hint">在上面搜具体景点即可加入</span></div>`;
  } else {
    anchorBox.innerHTML = `<div class="anchor-head">📍 必去打卡</div><div class="anchor-list">` +
      alist.map((a, i) => `<span class="anchor-tag" data-i="${i}">${a.label}<button class="at-del">✕</button></span>`).join('') +
      `</div>`;
    anchorBox.querySelectorAll('.anchor-tag').forEach(t => {
      t.querySelector('.at-del').onclick = () => anchorRemove(+t.dataset.i);
    });
  }

  // 归并提示：任一目的地带 note
  const notes = dlist.filter(d => d.note).map(d => d.note);
  if (notes.length) {
    note.hidden = false;
    note.innerHTML = notes.map(n => `<div>⚠ ${n}</div>`).join('');
  } else {
    note.hidden = true;
  }
}

/* ============================================================
 *  页面 3 · quickplan —— 快速规划
 * ============================================================ */
/* 快速规划：cities 是已选城市列表（可多座），city 恒等于 cities[0]（兼容既有代码）。
   原先只有一个 city，多选不了城 —— 而「按地理顺路排序」只在多城时才有意义，
   等于最常用的入口根本用不到这个功能。这里改成累加式选城。 */
const quickState = { city: '', cities: [], days: 0, kw: '', showAll: false };

/* 快速规划选城：加入列表（已选则忽略），并同步 city = cities[0] */
function quickPickCity(key) {
  if (!key || !POI_DB[key]) return;
  if (quickState.cities.indexOf(key) >= 0) { toast('已经加过这座城了'); return; }
  if (quickState.cities.length >= 7) { toast('一次最多 7 座城'); return; }
  quickState.cities.push(key);
  quickState.city = quickState.cities[0];
  quickState.kw = '';
  if ($('quickKw')) $('quickKw').value = '';
  renderQuick(); bindQuick(); syncQuickBtn();
}

/* 快速规划移除某城 */
function quickRemoveCity(key) {
  const i = quickState.cities.indexOf(key);
  if (i < 0) return;
  quickState.cities.splice(i, 1);
  quickState.city = quickState.cities[0] || '';
  renderQuick(); bindQuick(); syncQuickBtn();
}

/* 快速规划里的城市顺序切换（与问卷页共用 state.destSortMode） */
function quickToggleSort() {
  state.destSortMode = (state.destSortMode === 'manual') ? 'smart' : 'manual';
  toast(state.destSortMode === 'smart' ? '已开启智能排序' : '已保留你的顺序');
  renderQuick(); bindQuick();
}

/* 首屏只展示这批热门（避免 114 张卡拉成长卷） */
const QUICK_HOT = ['hangzhou', 'chengdu', 'xian', 'chongqing', 'nanchang', 'shangrao', 'xiamen', 'guilin'];

function onEnterQuick(opts) {
  /* 从城市页跳进来时带 city：语义是「就玩这座城」，所以清空重建而不是累加
     —— 用户点「杭州」的 CTA 进来，不该带着上次选的南昌一起算。
     同时必须同步进 cities 数组，否则摘要卡（读 cities）会显示"还没选目的地"。 */
  if (opts && opts.city && POI_DB[opts.city]) {
    quickState.cities = [opts.city];
    quickState.city = opts.city;
  }
  if (opts && opts.days) quickState.days = opts.days;
  quickState.kw = '';
  if ($('quickKw')) $('quickKw').value = '';

  renderQuick();
  bindQuick();
}

/* 全量城市卡数据 */
function quickAll() {
  return Object.keys(POI_DB).map(k => {
    const c = POI_DB[k], v = cityVisual(k);
    return Object.assign({ key: k, name: c.name, slogan: c.slogan }, v);
  });
}

/* 首屏展示：已选置顶 + 热门补齐 */
function quickTop(cityKey) {
  const all = quickAll();
  const out = [], seen = Object.create(null);
  if (cityKey) {
    const hit = all.find(c => c.key === cityKey);
    if (hit) { out.push(hit); seen[cityKey] = 1; }
  }
  QUICK_HOT.forEach(k => {
    if (seen[k]) return;
    const hit = all.find(c => c.key === k);
    if (hit) { out.push(hit); seen[k] = 1; }
  });
  return out;
}

function quickCardHtml(c) {
  return `<button class="city-card ${quickState.city === c.key ? 'on' : ''}" data-city="${c.key}">
     <div class="city-ph" style="background:${c.bg}">${c.emoji}</div>
     <div class="city-nm"><b>${c.name}</b><span>${c.slogan}</span></div>
   </button>`;
}

/* 渲染整页（摘要 + 天数 + 城市区） */
function renderQuick() {
  /* 摘要卡：多于 1 座城时显示 chip 列表（可删除 + 可切排序），
     单城时保持原来的「一行摘要」样式不变。 */
  const sum = $('quickSummary');
  if (sum) {
    const keys = quickState.cities.filter(k => !!POI_DB[k]);
    const picked = keys.length > 0;
    sum.classList.toggle('on', picked);
    $('quickSumEmoji').textContent = picked ? (cityVisual(keys[0]).emoji || '🏙') : '🧭';
    $('quickSumLabel').textContent = keys.length > 1 ? ('已选 ' + keys.length + ' 座城') : (picked ? '已选目的地' : '还没选目的地');
    $('quickSumName').textContent = picked ? keys.map(k => POI_DB[k].name).join(' → ') : '在下面搜一座城';
    $('quickChange').hidden = !picked;

    /* 多城 chip 行：删城 + 顺序切换 */
    const chips = $('quickCityChips');
    if (chips) {
      if (keys.length > 1) {
        chips.hidden = false;
        chips.innerHTML = keys.map((k, i) =>
          `<span class="qc-chip">${i + 1}. ${cityVisual(k).emoji || '🏙'} ${POI_DB[k].name}<button class="qc-del" data-city="${k}">✕</button></span>`
        ).join('') +
          `<button class="dc-sort" id="quickSortToggle">${
            state.destSortMode === 'manual' ? '🧭 智能排序' : '↩︎ 恢复我的顺序'
          }</button>`;
        chips.querySelectorAll('.qc-del').forEach(b => {
          b.onclick = () => quickRemoveCity(b.dataset.city);
        });
        const st = $('quickSortToggle');
        if (st) st.onclick = quickToggleSort;
      } else {
        chips.hidden = true;
        chips.innerHTML = '';
      }
    }
  }

  /* 天数：1~7 */
  $('quickDays').innerHTML = [1, 2, 3, 4, 5, 6, 7].map(d =>
    `<button class="day-pill ${quickState.days === d ? 'on' : ''}" data-days="${d}">${d} 天</button>`).join('');
  const dh = $('quickDaysHint');
  if (dh) dh.textContent = quickState.days ? '已选 ' + quickState.days + ' 天' : '';

  /* 城市区：有搜索词走搜索结果，否则走卡片 */
  const kw = quickState.kw.trim();
  const box = $('quickSuggest');
  const grid = $('quickCities');
  const more = $('quickMore');
  if (kw) {
    box.hidden = false; grid.innerHTML = ''; more.hidden = true;
    let items = [];
    try { items = (typeof Places !== 'undefined' ? Places.searchPlaces(kw, { limit: 8 }) : []) || []; } catch (e) { items = []; }
    const seen = Object.create(null);
    const list = items.filter(it => { if (seen[it.key]) return false; seen[it.key] = 1; return true; });
    if (!list.length) {
      box.innerHTML = `<div class="qs-empty">没找到「${kw}」，换个词试试</div>`;
    } else {
      box.innerHTML = list.map((it, i) => {
        const v = it.type === 'poi' ? { emoji: '📍' } : cityVisual(it.key);
        const label = it.type === 'poi' ? '景点' : it.type === 'province' ? '省份' : '城市';
        return `<button class="qs-item" data-i="${i}">
          <span class="qs-emoji">${v.emoji || '🏙'}</span>
          <span class="qs-body"><span class="qs-name">${it.name}</span>
          <span class="qs-sub">${label}${it.sub ? ' · ' + it.sub : ''}</span></span>
          <span class="qs-go">选它 ›</span>
        </button>`;
      }).join('');
      box.querySelectorAll('.qs-item').forEach(btn => {
        btn.onclick = () => {
          const it = list[+btn.dataset.i];
          if (!it) return;
          let key = it.key;
          if (it.type === 'province') {
            const cities = (typeof ProvinceDB !== 'undefined' && ProvinceDB.citiesOf) ? ProvinceDB.citiesOf(it.name) : [];
            if (!cities.length) { toast('该省暂无收录城市'); return; }
            key = cities[0];
          }
          if (!POI_DB[key]) return;
          quickPickCity(key);
        };
      });
    }
    const ch = $('quickCityHint');
    if (ch) ch.textContent = list.length ? '点一项即选中' : '';
  } else {
    box.hidden = true;
    /* 默认只渲染精选，展开后全量 */
    const cards = quickState.showAll ? quickAll() : quickTop(quickState.city);
    grid.innerHTML = cards.map(quickCardHtml).join('');
    more.hidden = false;
    more.textContent = quickState.showAll ? '收起 ▲' : '展开全部 ' + Object.keys(POI_DB).length + ' 座城 ▾';
    const ch = $('quickCityHint');
    if (ch) ch.textContent = quickState.city ? '已选 ' + POI_DB[quickState.city].name : '搜一下更快';
  }
}

function bindQuick() {
  $('quickCities').querySelectorAll('.city-card').forEach(card => {
    card.onclick = () => {
      quickPickCity(card.dataset.city);
    };
  });
  $('quickDays').querySelectorAll('.day-pill').forEach(pill => {
    pill.onclick = () => {
      quickState.days = parseInt(pill.dataset.days, 10);
      renderQuick(); bindQuick(); syncQuickBtn();
    };
  });
  const more = $('quickMore');
  if (more) more.onclick = () => {
    quickState.showAll = !quickState.showAll;
    renderQuick(); bindQuick();
  };
  const chg = $('quickChange');
  if (chg) chg.onclick = () => {
    quickState.city = '';
    quickState.cities = [];
    quickState.showAll = true;      // 清空后自动展开，方便重选
    renderQuick(); bindQuick(); syncQuickBtn();
  };
  /* 搜索框：实时出结果 */
  const kwIn = $('quickKw');
  if (kwIn) {
    kwIn.oninput = () => {
      quickState.kw = kwIn.value || '';
      const c = $('quickKwClear');
      if (c) c.hidden = !quickState.kw;
      renderQuick();
    };
  }
  const clr = $('quickKwClear');
  if (clr) clr.onclick = () => {
    quickState.kw = '';
    if ($('quickKw')) $('quickKw').value = '';
    if (clr) clr.hidden = true;
    renderQuick(); bindQuick();
  };
}

function syncQuickBtn() {
  const ok = !!quickState.city && !!quickState.days;
  $('quickGo').classList.toggle('disabled', !ok);
}

function quickGo() {
  const keys = quickState.cities.filter(k => !!POI_DB[k]);
  if (!keys.length || !quickState.days) { toast(keys.length ? '再选个天数' : '先选个目的地'); return; }
  /* 多城时给出 destinations，走多城串联分支（含地理顺路排序）；
     单城时保持原样，行为与之前完全一致。 */
  const per = Math.max(1, Math.floor(quickState.days / keys.length));
  const answers = Object.assign(
    { city: keys[0], days: quickState.days },
    QUICK_DEFAULTS,
    keys.length > 1 ? { destinations: keys.map(k => ({ cityKey: k, days: per, note: '' })) } : null
  );
  generateAndGo(answers, 'quick');
}

/* ============================================================
 *  生成流程
 * ============================================================ */
const LOAD_TIPS = ['匹配兴趣标签…', '计算地理邻近度…', '平衡体力与节奏…', '安排时段与转场…', '生成你的专属行程…'];

function generateAndGo(answers, mode) {
  $('loading').hidden = false;

  let i = 0;
  const tick = setInterval(() => { i = (i + 1) % LOAD_TIPS.length; $('loadingTip').textContent = LOAD_TIPS[i]; }, 420);

  /* 目的地列表：优先用多目的地；否则退化为单城 */
  const dests = (answers.destinations && answers.destinations.length)
    ? answers.destinations.map(d => d.cityKey)
    : (answers.city ? [answers.city] : []);

  /* 城市数据是按需加载的分片，规划前必须把「所有目的地」都拿到手，
     否则 engine 读到的是空 pois，会规划出空路线（多城时尤其要全预载）。 */
  const ready = (typeof DataLoader !== 'undefined')
    ? Promise.all(dests.map(k => DataLoader.ensureCity(k)))
    : Promise.resolve();

  ready.catch(() => { }).then(() => {

    setTimeout(() => {
      clearInterval(tick);
      const profile = buildProfile(answers);

      /* 判定：多城 or 单城 */
      const isMulti = answers.destinations && answers.destinations.length > 1;
      let plan;

      if (isMulti) {
        // 收集每段锚点（POI id）
        const tripPlan = answers.destinations.map(d => ({
          cityKey: d.cityKey,
          days: d.days,
          note: d.note || '',
          anchors: (answers.anchors || []).filter(a => a.cityKey === d.cityKey).map(a => a.poiId).filter(Boolean)
        }));
        plan = (typeof Multi !== 'undefined')
          ? Multi.planMultiCity(profile, {
            tripPlan,
            /* 用户在目的地选择器里点了「恢复我的顺序」就不再自动优化；
               默认 smart 会按地理顺路重排（见 Multi.optimizeCityOrder）。 */
            optimize: state.destSortMode !== 'manual'
          })
          : planItinerary(profile);
      } else {
        // 单城（也允许带锚点）
        const onlyCity = dests[0] || profile.city;
        const anchors = (answers.anchors || []).filter(a => a.cityKey === onlyCity).map(a => a.poiId).filter(Boolean);
        const single = Object.assign({}, profile, { city: onlyCity, anchors });
        const p = planItinerary(single);
        // 包一层统一结构，让渲染层只需面向一种数据形状
        plan = {
          multi: false,
          trips: [{ seq: 0, cityKey: onlyCity, city: p.city, anchors, startDayIndex: 0, dayCount: p.days.length, note: '', plan: p }],
          legs: [],
          enterLeg: (typeof Multi !== 'undefined' && Multi.planMultiCity) ? _enterLegFor(onlyCity) : null,
          days: p.days.map((d, k) => { d.tripSeq = 0; d.cityKey = onlyCity; return d; }),
          stats: p.stats,
          anchorMiss: (p.anchorMiss && p.anchorMiss.length) ? [{ cityKey: onlyCity, ids: p.anchorMiss }] : [],
          orderInfo: null,     // 单城不涉及城市排序
          city: p.city,
          backups: p.backups, stay: p.stay
        };
        if (plan.days.length) plan.stats = p.stats;
      }

      state.session = { profile, plan, mode, answers, distanceOnly: !!answers.distanceOnly };
      state.profile = profile;
      state.plan = plan;

      // 写入历史（只记路线，不点亮足迹 —— 点亮 = 去过并手动打卡；回看不调用）
      Store.addHistory({
        sid: Store.sidOf(answers),
        city: dests[0] || answers.city,
        days: answers.days,
        mode: mode || 'deep',
        time: Date.now(),
        personaName: profile.persona.name,
        answers
      });

      $('loading').hidden = true;
      route('result');
      renderResult();
    }, 1500);
  });
}

/* 单城时也生成"出发地→目的地"大交通卡 */
function _enterLegFor(cityKey) {
  try {
    if (typeof Store === 'undefined' || !Store.getHome) return null;
    const home = Store.getHome();
    if (!home || !POI_DB[home] || home === cityKey) return null;
    return { fromKey: home, toKey: cityKey, kind: 'enter', transport: cityTransport(home, cityKey) };
  } catch (e) { return null; }
}

/* ============================================================
 *  页面 4 · result —— 路线详情
 * ============================================================ */
function renderResult() {
  const p = state.profile, plan = state.plan;
  const isMulti = !!(plan.multi && plan.trips && plan.trips.length > 1);

  /* 每次进结果页都重新读一次定位缓存，保证「我的位置」是最新的。
     之前只在声明处初始化，结果是一次定位后就永久缓存，用户挪了地方图上不动。 */
  myLocCache = null;

  $('personaName').textContent = p.persona.name;
  $('personaDesc').textContent = p.persona.desc;
  drawRadar(p.radar);

  /* 多城时标题显示「上饶 → 杭州」这样的串联，而不是单个城市名 */
  const cityLabel = isMulti
    ? plan.trips.map(t => t.city.name).join(' → ')
    : plan.city.name;

  const tags = [
    `<span class="tag hi">${cityLabel} · ${p.days} 天</span>`,
    `<span class="tag hi">想带走：${p.mood.label}</span>`,
    `<span class="tag meta">${p.pace.label}节奏 · ${p.persona.paceWord}</span>`,
    `<span class="tag meta">${p.company.label}同行</span>`,
    `<span class="tag meta">${p.stamina.label}体力</span>`,
    `<span class="tag meta">${p.budget.label}预算</span>`
  ];
  if (isMulti) tags.splice(1, 0, `<span class="tag hi">${plan.trips.length} 城串联</span>`);
  p.interests.forEach(k => tags.push(`<span class="tag hi">${TAG_META[k].icon} ${TAG_META[k].label}</span>`));
  p.persona.extras.forEach(e => tags.push(`<span class="tag">${e}</span>`));

  /* 锚点没排进任何一天时，明确告诉用户，别让人以为"选了没用" */
  const missIds = (plan.anchorMiss || []).reduce((acc, m) => acc.concat(m.ids || []), []);
  if (missIds.length) {
    tags.push(`<span class="tag">⚠️ ${missIds.length} 个指定点位这次没排进去</span>`);
  }

  /* 预约提醒：行程中含需预约/实名购票的点位时给出汇总 */
  const bookItems = plan.days.flatMap(d => d.items.map(i => i.poi)).filter(poi => poi && poi.book);
  if (bookItems.length) {
    const maxDays = Math.max(...bookItems.map(poi => poi.book.days || 0));
    tags.push(`<span class="tag hi">🎫 ${bookItems.length} 处需预约 · 最晚提前 ${maxDays} 天下手</span>`);
  }
  $('personaTags').innerHTML = tags.join('');

  /* 结果页顶部的城市顺序切换：看完排出来的路线，不满意可以当场切回自己的顺序重排。 */
  const sortBar = $('resultSortBar');
  if (sortBar) {
    if (isMulti) {
      sortBar.hidden = false;
      sortBar.innerHTML = `<button class="result-sort-toggle" id="resultSortToggle">${
        state.destSortMode === 'manual' ? '🧭 按地理智能排序' : '↩︎ 恢复我的顺序'
      }</button>`;
      const b = $('resultSortToggle');
      if (b) b.onclick = () => {
        state.destSortMode = (state.destSortMode === 'manual') ? 'smart' : 'manual';
        /* 就地重算这一份计划（不跳页、不丢滚动位置），比整页重生成轻得多。 */
        const ans = (state.session && state.session.answers) || state.answers;
        if (typeof Multi !== 'undefined' && Multi.planMultiCity && ans && ans.destinations) {
          const prof = state.profile || buildProfile(ans);
          const tripPlan = ans.destinations.map(d => ({
            cityKey: d.cityKey, days: d.days, note: d.note || '',
            anchors: (ans.anchors || []).filter(a => a.cityKey === d.cityKey).map(a => a.poiId).filter(Boolean)
          }));
          const np = Multi.planMultiCity(prof, { tripPlan, optimize: state.destSortMode !== 'manual' });
          np.stay = state.plan && state.plan.stay;
          state.plan = np;
          if (state.session) state.session.plan = np;
          renderResult();
        }
      };
    } else {
      sortBar.hidden = true;
      sortBar.innerHTML = '';
    }
  }

  renderWhys();
  renderTransport();
  syncFavBtn();
  syncVisitBtn();
  drawMap(plan, 0);
  $('statGrid').innerHTML = statHTML(plan.stats);
  renderDays();   /* 内部已调用 syncStaySummary()，无需重复 */
  $('mapHint').textContent = `${cityLabel} · ${plan.stats.poiCount} 个点 · 直线投影`;

  /* 对比模式：一键在「轻途智能版 / 纯距离版」间切换 */
  renderCompareBar();
  /* 任务清单：展示整条行程的剧情任务链 */
  renderQuestPanel();
  /* 反馈 + 添加宝藏地 */
  renderFeedbackBar();
}

/* 对比模式切换条 */
function renderCompareBar() {
  let bar = $('compareBar');
  if (!bar) {
    bar = el('div', 'compare-bar');
    bar.id = 'compareBar';
    const host = $('resultDays') || $('page-result');
    if (host) host.parentNode.insertBefore(bar, host);
  }
  const smart = !(state.session && state.session.distanceOnly);
  bar.innerHTML = `<span class="compare-label">🧪 路线模式：</span>
    <button class="compare-btn ${smart ? 'on' : ''}" data-mode="smart">轻途智能版</button>
    <button class="compare-btn ${!smart ? 'on' : ''}" data-mode="distance">纯距离版（对照）</button>
    <span class="compare-hint">${smart ? '兴趣+情绪+任务+地理综合打分' : '只按距离和热度排，用于 A/B 对照'}</span>`;
  bar.querySelectorAll('.compare-btn').forEach(b => {
    b.onclick = () => {
      const mode = b.dataset.mode;
      const ans = (state.session && state.session.answers) || {};
      if (mode === 'distance') {
        ans.distanceOnly = true;
      } else {
        delete ans.distanceOnly;
      }
      generateAndGo(Object.assign({}, ans), state.session ? state.session.mode : 'deep');
    };
  });
}

/* 任务清单面板 */
function renderQuestPanel() {
  let panel = $('questPanel');
  if (!panel) {
    panel = el('div', 'quest-panel');
    panel.id = 'questPanel';
    const host = $('resultDays') || $('page-result');
    if (host) host.parentNode.appendChild(panel);
  }
  if (typeof questChain !== 'function' || !state.plan || !state.profile) { panel.innerHTML = ''; return; }
  const chain = questChain(state.plan, state.profile) || [];
  if (!chain.length) { panel.innerHTML = ''; return; }
  const typeEmoji = { history: '🏛', nature: '🏞', food: '🍜', photo: '📷', shop: '🛍', family: '🧒', art: '🎨', night: '🌃', relax: '🍵' };
  const list = chain.map(q =>
    `<div class="quest-item ${q.done ? 'done' : ''}">
       <span class="q-check">${q.done ? '✅' : '⬜'}</span>
       <div class="q-body">
         <b>${q.name}</b>
         <span class="q-type">${typeEmoji[q.type] || '🎯'} ${q.type} · ${'★'.repeat(q.difficulty || 1)}</span>
         <span class="q-text">${q.text}</span>
         ${q.chainTag ? `<span class="q-chain">📜 ${q.chainTag}</span>` : ''}
       </div>
     </div>`
  ).join('');
  panel.innerHTML = `<div class="quest-head">🗺 剧情任务清单 <span class="quest-count">${chain.filter(q => q.done).length}/${chain.length}</span></div>${list}`;
}

/* 反馈 + 添加宝藏地 */
function renderFeedbackBar() {
  let bar = $('feedbackBar');
  if (!bar) {
    bar = el('div', 'feedback-bar');
    bar.id = 'feedbackBar';
    const host = $('resultDays') || $('page-result');
    if (host) host.parentNode.appendChild(bar);
  }
  bar.innerHTML = `<div class="fb-row">
      <span>路线密度：</span>
      <button class="fb-btn" data-fb="tight">😅 太满</button>
      <button class="fb-btn" data-fb="ok">😊 刚好</button>
      <button class="fb-btn" data-fb="loose">😴 太空</button>
    </div>
    <div class="fb-row">
      <span>满意度：</span>
      <span class="fb-stars" id="fbStars">${[1,2,3,4,5].map(i => `<i data-r="${i}">☆</i>`).join('')}</span>
    </div>
    <div class="fb-row">
      <textarea class="fb-text" id="fbText" placeholder="说说你的感受（选填）…" rows="2"></textarea>
    </div>
    <div class="fb-row">
      <label class="fb-photo-btn">📷 上传照片
        <input type="file" id="fbPhotos" accept="image/*" multiple hidden>
      </label>
      <span class="fb-photo-count" id="fbPhotoCount">0 张</span>
      <button class="fb-submit" id="fbSubmit">提交反馈</button>
    </div>
    <button class="fb-addgem" id="addGemBtn">➕ 添加宝藏地</button>`;
  state._fbPhotos = [];
  bar.querySelectorAll('.fb-btn').forEach(b => {
    b.onclick = () => {
      b.parentNode.querySelectorAll('.fb-btn').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      state._fbDensity = b.dataset.fb;
    };
  });
  bar.querySelectorAll('#fbStars i').forEach(s => {
    s.onclick = () => {
      state._fbRating = parseInt(s.dataset.r);
      bar.querySelectorAll('#fbStars i').forEach((x, i) => x.textContent = i < state._fbRating ? '★' : '☆');
    };
  });
  const photoInput = bar.querySelector('#fbPhotos');
  if (photoInput) photoInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    for (const f of files) {
      try {
        const b64 = await Store.fileToBase64(f, 600);
        state._fbPhotos.push(b64);
      } catch (err) {}
    }
    $('fbPhotoCount').textContent = state._fbPhotos.length + ' 张';
  };
  const submitBtn = bar.querySelector('#fbSubmit');
  if (submitBtn) submitBtn.onclick = submitFeedback;
  const addBtn = bar.querySelector('#addGemBtn');
  if (addBtn) addBtn.onclick = openAddGem;
}

function submitFeedback() {
  if (!state._fbDensity || !state._fbRating) {
    toast('请先选择密度和星级');
    return;
  }
  const text = $('fbText') ? $('fbText').value.trim() : '';
  Store.addFeedback({
    city: state.profile.city, cityKey: state.lastCity || state.profile.cityKey,
    days: state.profile.days,
    mode: state.session ? state.session.mode : 'deep',
    density: state._fbDensity, rating: state._fbRating,
    text: text, photos: state._fbPhotos || []
  });
  toast('感谢反馈！已记录到社区 📝');
  state._fbDensity = null; state._fbRating = null; state._fbPhotos = [];
  renderFeedbackBar();
}

function openAddGem() {
  const name = prompt('宝藏地名称？');
  if (!name) return;
  const area = prompt('在哪个城市/区域？', state.profile.city);
  const tags = prompt('标签（逗号分隔，如 food,history）', 'food');
  const desc = prompt('一句话推荐理由？', '');
  if (typeof addCustomPOI === 'function') {
    const poi = addCustomPOI(state.profile.city, {
      name, area: area || state.profile.city,
      tags: (tags || 'food').split(',').reduce((o, t) => { o[t.trim()] = 1; return o; }, {}),
      hours: 1.5, cost: 1, intensity: 1,
      lat: 0, lng: 0, custom: true
    });
    toast(`已添加「${name}」，可在换点时选择 ✨`);
  } else {
    toast('添加成功（会话级）');
  }
}

/* ============================================================
 *  我的位置（出发城市）—— 首页设置 + 结果页大交通卡
 * ============================================================ */

/* 渲染首页的位置卡文案 */
function syncHomeCard() {
  const sub = $('homeSub'), card = $('homeCard');
  if (!sub) return;
  const home = Store.getHome();
  const me = (typeof Geo !== 'undefined' && Geo.readGeoCache) ? Geo.readGeoCache() : null;
  const accTxt = (me && me.accuracy)
    ? (me.accuracy >= 1000 ? `±${(me.accuracy / 1000).toFixed(1)}km` : `±${Math.round(me.accuracy)}m`)
    : '';
  if (home && POI_DB[home]) {
    const base = `${POI_DB[home].name}`;
    if (me && me.source === 'gps') {
      sub.textContent = `${base} · 已定位${accTxt ? ' ' + accTxt : ''}`;
    } else if (me && me.source === 'manual') {
      sub.textContent = `${base} · 位置已手动指定`;
    } else {
      sub.textContent = `${base}`;
    }
    sub.classList.add('on');
    if (card) card.hidden = false;
  } else {
    sub.textContent = '—';
    sub.classList.remove('on');
    if (card) card.hidden = true;
  }
}

/* 弹出位置选择面板（手选城市） */
function openHomePicker() {
  if ($('homePickerMask')) return;
  const cur = Store.getHome();
  const mask = el('div', 'picker-mask');
  mask.id = 'homePickerMask';
  const cities = Object.keys(POI_DB);
  const items = cities.map(k => {
    const c = POI_DB[k], v = cityVisual(k);
    const isTreasure = k === 'quanzhou' || k === 'chaozhou' || k === 'luoyang' ||
      k === 'liuzhou' || k === 'shaoxing' || k === 'datong' ||
      k === 'zhenjiang' || k === 'linhai' || k === 'jianshui' || k === 'shantou';
    return `<button class="picker-item ${k === cur ? 'on' : ''}" data-home="${k}">
      <span class="pi-emoji">${v.emoji}</span>
      <span class="pi-name">${c.name}</span>
      ${isTreasure ? '<span class="pi-tag">宝藏</span>' : ''}
    </button>`;
  }).join('');

  mask.innerHTML = `<div class="picker-sheet">
    <div class="picker-head">
      <span class="picker-title">选择你所在的城市</span>
      <button class="picker-close" data-close="1">✕</button>
    </div>
    <div class="picker-hint">选好后，路线结果页会自动算出「出发地 → 目的地」的高铁 / 飞机 / 自驾方案</div>
    <div class="picker-list">${items}</div>
  </div>`;
  document.body.appendChild(mask);

  mask.addEventListener('click', e => {
    // 同上：点空白或点关闭按钮（含按钮内文字）都关掉
    if (e.target === mask || (e.target.closest && e.target.closest('[data-close]'))) { mask.remove(); return; }
    const btn = e.target.closest('[data-home]');
    if (!btn) return;
    const key = btn.dataset.home;
    Store.setHome(key);
    mask.remove();
    syncHomeCard();
    // 顺手刷新问候卡的定位/天气，用户选完立刻看到变化
    if (typeof loadGreetWeather === 'function') loadGreetWeather();
    toast(`出发地已设为 ${POI_DB[key].name}`);
    // 若当前在结果页，立即刷新大交通卡
    if (state.page === 'result' && state.plan) renderTransport();
  });
}

/* ============================================================
 *  高德导航：一个统一的「导航面板」承接四种入口
 *    { poi }                     —— 单点：导航到某个景点
 *    { day: { stops, index } }   —— 一日：首站起、末站终、中间途经，一次串完
 *    { cross: { fromKey, toKey } } —— 跨城：出发地 → 目的地
 *
 *  为什么统一成一个面板：三种入参最终都归约成「起点 + 途经点 + 终点」，
 *  用户还能在面板里改出行方式，改完立刻重新生成链接。
 * ============================================================ */
function openNavi(opt) {
  if (typeof Navi === 'undefined') { toast('导航模块未加载'); return; }
  const plan = state.plan;

  /* ---- 解析入参，统一出 title / stops / city ---- */
  let title = '导航', stops = [], city = '';
  /* 多城时 plan.city 是第一座城；用于高德的搜索范围提示，够用 */
  const planCity = plan && (plan.city || (plan.trips && plan.trips[0] && plan.trips[0].city));
  if (opt && opt.poi) {
    const poi = opt.poi;
    title = poi.name;
    stops = [{ name: poi.name, lng: poi.lng, lat: poi.lat }];
    city = planCity ? planCity.name : '';
  } else if (opt && opt.day) {
    title = `第 ${opt.day.index + 1} 天 · ${opt.day.stops.length} 站`;
    stops = opt.day.stops.map(p => ({ name: p.name, lng: p.lng, lat: p.lat }));
    /* 当天归属哪座城，取该天自己的 cityKey，跨城时更准 */
    if (plan && plan.days && plan.days[opt.day.index] && plan.days[opt.day.index].cityKey) {
      const dk = plan.days[opt.day.index].cityKey;
      city = (CITY_INDEX[dk] ? CITY_INDEX[dk].name : planCity ? planCity.name : '');
    } else {
      city = planCity ? planCity.name : '';
    }
  } else if (opt && opt.cross) {
    const a = POI_DB[opt.cross.fromKey], b = POI_DB[opt.cross.toKey];
    if (!a || !b) { toast('出发地或目的地信息缺失'); return; }
    title = `${a.name} → ${b.name}`;
    stops = [
      { name: a.name, lng: a.center[1], lat: a.center[0] },
      { name: b.name, lng: b.center[1], lat: b.center[0] }
    ];
  }
  if (!stops.length) { toast('这个点位没有坐标，暂时无法导航'); return; }

  const pts = stops.map(Navi.toAmapPoint).filter(Boolean);
  if (!pts.length) { toast('坐标转换失败，暂时无法导航'); return; }

  /* ---- 起点优先级：真实定位 > 出发城市 > 交给高德自定位 ----
   * 真实定位最准（用户就在那儿），出发城市只是个粗替身。 */
  const homeKey = Store.getHome();
  let from = null;
  if (opt && opt.cross) {
    // 跨城时 stops[0] 就是出发城市，直接拿它当起点，
    // 这样标题、面板文案、生成链接三者才一致（否则会退化成"按手机定位"）
    from = pts.length > 1 ? pts[0] : null;
  } else {
    const me = (typeof Geo !== 'undefined') ? Geo.readGeoCache() : null;
    if (me) {
      // 定位已是 GCJ-02，构造高德要的点结构
      from = { name: me.source === 'city' ? me.label : '我的位置', lng: me.lng, lat: me.lat };
    } else if (homeKey && POI_DB[homeKey]) {
      const h = POI_DB[homeKey];
      const nm = (h && h.name) ? h.name : homeKey;
      const ctr = (h && h.center) ? h.center
        : (CITY_INDEX[homeKey] ? CITY_INDEX[homeKey].center : null);
      if (ctr) from = Navi.toAmapPoint({ name: nm, lng: ctr[1], lat: ctr[0] });
    }
  }

  const MODES = [
    { k: 'car', label: '驾车', icon: '🚗' },
    { k: 'bus', label: '公交', icon: '🚌' },
    { k: 'walk', label: '步行', icon: '🚶' },
    { k: 'ride', label: '骑行', icon: '🚲' }
  ];
  let mode = 'car';

  const mask = el('div', 'picker-mask');
  mask.id = 'naviMask';
  mask.innerHTML = `<div class="picker-sheet navi-sheet">
    <div class="picker-head">
      <span class="picker-title">🧭 ${title}</span>
      <button class="picker-close" data-close="1">✕</button>
    </div>
    <div class="picker-hint" id="naviSeq"></div>
    <div class="navi-modes" id="naviModes">
      ${MODES.map(m => `<button class="navi-mode ${m.k === mode ? 'on' : ''}" data-mode="${m.k}">${m.icon} ${m.label}</button>`).join('')}
    </div>
    <div class="navi-acts">
      <button class="navi-go" id="naviGo">🚗 用高德导航</button>
      <button class="navi-star" id="naviStar">⭐ 在地图上标星</button>
    </div>
    <a class="navi-link" id="naviLink" href="#" target="_blank" rel="noopener">若按钮无反应，点这里直接打开 ›</a>
    <div class="navi-tip" id="naviTip">手机上会唤起高德 App；未安装则自动用网页版。路线较长时也可在高德里换成高铁 / 飞机方案。</div>
  </div>`;
  document.body.appendChild(mask);

  /* ---- 面板内的动态部分：起点说明 + 生成的链接 ---- */
  let curUrl = '';      // 导航链接
  let starUrls = [];    // 标星链接（可能多条）
  const draw = () => {
    const last = pts[pts.length - 1];
    const mid = pts.slice(1, -1).length;
    // 中间的站要说清有几站，没有中间站就直说「起点 → 终点」
    const seq = from
      ? `${from.name} → ${mid ? `途经 ${mid} 站 → ` : ''}${last.name}`
      : `${pts.length > 1 ? `${pts[0].name} → ${mid ? `途经 ${mid} 站 → ` : ''}` : ''}${last.name}`;
    $('naviSeq').innerHTML =
      `<span class="ns-line">${seq}</span>` +
      (from ? '' : `<span class="ns-warn">未设置出发地 · 将由高德按手机定位作为起点</span>`);
    curUrl = buildNaviUrl();
    // 标星：把「我」也带上（如果已定位），这样在高德上一眼看到自己和各个点的关系
    const me = (typeof Geo !== 'undefined') ? Geo.readGeoCache() : null;
    const st = Navi.starUrlWithMe(me, pts, { mode, city });
    starUrls = st.urls;
    const starBtn = $('naviStar');
    if (starBtn) {
      starBtn.textContent = st.single
        ? '⭐ 在地图上标星'
        : (st.chunks > 1 ? `⭐ 标出全部 ${st.total} 个点（分 ${st.chunks} 段）` : `⭐ 标出全部 ${st.total} 个点`);
    }
    // 同时渲染成可见链接，万一弹窗被拦截，用户还能长按/右键打开
    const a = $('naviGo');
    a.dataset.href = curUrl;
    const sl = $('naviLink');
    if (sl) sl.href = curUrl;
  };

  const buildNaviUrl = () => {
    // 只有「一个点、又没说从哪出发」时才降级成标点；
    // 只要知道起点，就该给真正的路线导航（用户点「导航到这里」是想走过去，不是想在地图上找它）
    if (pts.length === 1) {
      return from ? Navi.navUrl({ from, to: pts[0], mode }) : Navi.markerUrl(pts[0], city);
    }
    // from 已经是「起点」的话，途经点要避开它，只取中间站（最多 16 个）
    const via = from && from.name === pts[0].name
      ? pts.slice(1, -1)
      : (from ? pts.slice(0, -1) : pts.slice(1, -1));
    return Navi.navUrl({
      from,
      to: pts[pts.length - 1],
      via: via.slice(0, 16),
      mode
    });
  };

  mask.querySelectorAll('.navi-mode').forEach(b => {
    b.onclick = () => {
      mode = b.dataset.mode;
      mask.querySelectorAll('.navi-mode').forEach(x => x.classList.toggle('on', x === b));
      draw();
    };
  });

  $('naviGo').onclick = () => {
    if (!curUrl) { toast('链接生成失败'); return; }
    // 手机端优先直接跳（唤起 App）；桌面端新窗口打开网页版
    const w = window.open(curUrl, '_blank', 'noopener');
    if (!w) toast('弹窗被拦截了，点下面那行链接打开 ›');
    else toast('已为你打开高德');
  };

  $('naviStar').onclick = () => {
    if (!starUrls.length) { toast('链接生成失败'); return; }
    // 多条链接（点数超过高德上限时分段）：一次性打开会拦，所以逐条开
    let blocked = 0;
    starUrls.forEach((u, i) => {
      // 加一点延时，避免浏览器把连续 popup 全当弹窗拦掉
      setTimeout(() => {
        const w = window.open(u, '_blank', 'noopener');
        if (!w) blocked++;
        if (i === starUrls.length - 1) {
          if (blocked) toast('有窗口被拦截了，请允许本站弹窗后重试');
          else if (starUrls.length > 1) toast(`已分 ${starUrls.length} 段打开高德，逐段看即可`);
          else toast('已在高德中打开，每个点都会显示成图钉 ⭐');
        }
      }, i * 420);
    });
  };

  mask.addEventListener('click', e => {
    // 点遮罩空白处，或点关闭按钮（含按钮内的文字）都关掉
    if (e.target === mask || (e.target.closest && e.target.closest('[data-close]'))) mask.remove();
  });
  draw();
}

/* 结果页大交通卡 */
function renderTransport() {
  const slot = $('transportSlot');
  if (!slot) return;
  const plan = state.plan;
  const isMulti = !!(plan && plan.multi && plan.trips && plan.trips.length > 1);
  const home = Store.getHome();

  /* 多城：出发地→首城 + 城际各段 一起列出来（这段也是"为什么要这样串"的交代） */
  if (isMulti) { renderTransportMulti(slot, plan, home); return; }

  const dest = state.profile ? state.profile.city : null;

  if (!dest) { slot.innerHTML = ''; return; }

  /* 未设出发地 → 引导卡 */
  if (!home || !POI_DB[home]) {
    slot.innerHTML = `<div class="transport-card">
      <div class="tp-head">
        <span class="tp-ic">🚉</span>
        <span class="tp-t">出发地 → ${POI_DB[dest].name}</span>
        <span class="tp-chg" id="tpSetHome">去设置 ›</span>
      </div>
      <div class="tp-verdict">设置你的出发城市，就能看到高铁 / 飞机 / 自驾的时长与大致票价，连到达后怎么去第一个点都算好。</div>
    </div>`;
    const b = $('tpSetHome');
    if (b) b.onclick = openHomePicker;
    return;
  }

  if (home === dest) {
    slot.innerHTML = `<div class="transport-card">
      <div class="tp-head">
        <span class="tp-ic">📍</span>
        <span class="tp-t">你在 ${POI_DB[dest].name}</span>
        <span class="tp-chg" id="tpSetHome">修改 ›</span>
      </div>
      <div class="tp-verdict">出发地与目的地是同一座城市，不需要大交通；直接看下面的市内行程就好。</div>
    </div>`;
    const b = $('tpSetHome');
    if (b) b.onclick = openHomePicker;
    return;
  }

  const t = cityTransport(home, dest);
  if (!t) { slot.innerHTML = ''; return; }

  const modeHTML = t.options.map(o => {
    const rec = o.key === t.recommended;
    return `<div class="tp-mode ${rec ? 'rec' : ''}">
      ${rec ? '<span class="tm-rec">推荐</span>' : ''}
      <span class="tm-ic">${o.icon}</span>
      <span class="tm-name">${o.name}</span>
      <span class="tm-dur">${o.dur}</span>
      <span class="tm-price">¥${o.price[0]}~${o.price[1]}</span>
      ${o.headway ? `<div class="tm-sched">⏱ ${o.headway} · ${o.firstLast}</div>` : ''}
    </div>`;
  }).join('');

  /* 班次密度与首末班：让用户知道「大概几点有车」 */
  const schedHTML = t.rec.headway ? `<div class="tp-sched">
    <div class="tps-row"><b>班次密度</b><span>${t.rec.headway}</span></div>
    <div class="tps-row"><b>运营时段</b><span>${t.rec.firstLast}</span></div>
    ${t.rec.schedTip ? `<div class="tps-tip">${t.rec.schedTip}</div>` : ''}
    ${t.rec.queryUrl ? `<a class="tps-query" href="${t.rec.queryUrl}" target="_blank" rel="noopener">🔎 查具体车次 / 航班 · ${t.rec.queryName} ›</a>` : ''}
  </div>` : '';

  /* 出发 / 返程时刻建议 */
  const dp = t.departPlan;
  const departHTML = dp ? `<div class="tp-depart">
    <div class="tpd-row out">
      <span class="tpd-badge">去程</span>
      <span class="tpd-time">${dp.outbound.leaveTime} 出发</span>
      <span class="tpd-text">${dp.outbound.text}</span>
    </div>
    <div class="tpd-row back">
      <span class="tpd-badge back">返程</span>
      <span class="tpd-time">${dp.inbound.leaveTime} 前走</span>
      <span class="tpd-text">${dp.inbound.text}</span>
    </div>
  </div>` : '';

  const transferHTML = t.transfer ? `<div class="tp-arrive">
    <b>中转方案：</b>${t.transfer.note}<br>
    机票约 ¥${t.transfer.flyLeg.price[0]}~${t.transfer.flyLeg.price[1]}（${t.transfer.flyLeg.dur}）＋ 城际高铁约 ¥${t.transfer.railLeg.price[0]}~${t.transfer.railLeg.price[1]}（${t.transfer.railLeg.dur}）
  </div>` : '';

  const tipsHTML = t.tips.length ? `<div class="tp-tips">${t.tips.map(x => `<div>${x}</div>`).join('')}</div>` : '';

  slot.innerHTML = `<div class="transport-card">
    <div class="tp-head">
      <span class="tp-ic">${t.rec.icon}</span>
      <span class="tp-t">${t.from} → ${t.to} · ${t.distance}km</span>
      <span class="tp-chg" id="tpSetHome">换出发地 ›</span>
    </div>
    <div class="tp-verdict">${t.verdict}</div>
    <div class="tp-modes">${modeHTML}</div>
    ${schedHTML}
    ${departHTML}
    ${transferHTML}
    <div class="tp-arrive">
      <b>到达后怎么去第一站：</b>${t.arrive.how}（约 ${t.arrive.min} 分钟）
    </div>
    ${tipsHTML}
    <button class="tp-nav" id="tpNav">🧭 用高德导航这段跨城路</button>
  </div>`;

  const b = $('tpSetHome');
  if (b) b.onclick = openHomePicker;
  const tn = $('tpNav');
  if (tn) tn.onclick = () => openNavi({ cross: { fromKey: home, toKey: dest } });
}

/* 多城版大交通总览：一条时间线把「出发 → 城1 → 城2 → …」串起来 */
function renderTransportMulti(slot, plan, home) {
  const chain = plan.trips.map(t => t.city.name);
  const routeLabel = (home && POI_DB[home] ? POI_DB[home].name + ' → ' : '') + chain.join(' → ');

  const hasHome = !!(home && POI_DB[home]);

  /* 逐段渲染（进入段 + 城际段），继承 legCard 的结构但更紧凑 */
  const legs = [];
  if (plan.enterLeg) legs.push(plan.enterLeg);
  (plan.legs || []).forEach(l => legs.push(l));

  const legHTML = legs.map(l => {
    const t = l.transport;
    if (!t || t.sameCity) return '';
    const label = l.kind === 'enter' ? '出发' : '转场';
    const modes = t.options.map(o => {
      const rec = o.key === t.recommended;
      return `<div class="tp-mode ${rec ? 'rec' : ''}">
        ${rec ? '<span class="tm-rec">推荐</span>' : ''}
        <span class="tm-ic">${o.icon}</span>
        <span class="tm-name">${o.name}</span>
        <span class="tm-dur">${o.dur}</span>
        <span class="tm-price">¥${o.price[0]}~${o.price[1]}</span>
        ${o.headway ? `<div class="tm-sched">⏱ ${o.headway} · ${o.firstLast}</div>` : ''}
      </div>`;
    }).join('');
    const sched = t.rec.headway ? `<div class="tp-sched">
      <div class="tps-row"><b>班次密度</b><span>${t.rec.headway}</span></div>
      <div class="tps-row"><b>运营时段</b><span>${t.rec.firstLast}</span></div>
      ${t.rec.queryUrl ? `<a class="tps-query" href="${t.rec.queryUrl}" target="_blank" rel="noopener">🔎 查具体车次 / 航班 · ${t.rec.queryName} ›</a>` : ''}
    </div>` : '';
    const dp = t.departPlan;
    const depart = dp ? `<div class="tp-depart">
      <div class="tpd-row out"><span class="tpd-badge">去程</span><span class="tpd-time">${dp.outbound.leaveTime} 出发</span><span class="tpd-text">${dp.outbound.text}</span></div>
      <div class="tpd-row back"><span class="tpd-badge back">返程</span><span class="tpd-time">${dp.inbound.leaveTime} 前走</span><span class="tpd-text">${dp.inbound.text}</span></div>
    </div>` : '';
    return `<div class="leg-card">
      <div class="leg-head">${l.kind === 'enter' ? '🚉' : '🚌'} ${label}：${t.from} → ${t.to} · ${t.distance}km</div>
      <div class="leg-verdict">${t.verdict}</div>
      <div class="tp-modes">${modes}</div>
      ${sched}
      ${depart}
      <div class="tp-arrive"><b>到达后怎么去第一站：</b>${t.arrive.how}（约 ${t.arrive.min} 分钟）</div>
      <button class="tp-nav" data-from="${l.fromKey}" data-to="${l.toKey}">🧭 用高德导航这段路</button>
    </div>`;
  }).join('');

  slot.innerHTML = `<div class="transport-card">
    <div class="tp-head">
      <span class="tp-ic">🧭</span>
      <span class="tp-t">${routeLabel} · ${plan.trips.length} 城</span>
      <span class="tp-chg" id="tpSetHome">换出发地 ›</span>
    </div>
    <div class="tp-verdict">这是一条 ${plan.trips.length} 城串联的路线：每座城市连续住几天，段与段之间用高铁 / 飞机 / 自驾衔接。</div>
    ${hasHome ? '' : '<div class="tp-verdict" style="color:#b4523f">还没设出发地 —— 设好后这里会自动补上「你家 → 第一城」的大交通。</div>'}
    ${legHTML}
  </div>`;

  const b = $('tpSetHome');
  if (b) b.onclick = openHomePicker;
  slot.querySelectorAll('.tp-nav').forEach(btn => {
    btn.onclick = () => openNavi({ cross: { fromKey: btn.dataset.from, toKey: btn.dataset.to } });
  });
}

/* 为什么是这条路线 —— 让算法差异可见 */
function renderWhys() {
  const p = state.profile, plan = state.plan;
  const multi = !!(plan.multi && plan.trips && plan.trips.length > 1);
  const lines = [
    `按你想要的「${p.mood.label}」，把每天的体验弧线排成了先起后落：上午收着看，傍晚放开玩。`,
    `${p.pace.label}节奏 · 每天 ${p.pace.start}:00 出发、约 ${p.pace.endHour}:00 收工，站与站之间按地理邻近度串联，少走回头路。`,
    `同行是「${p.company.label}」、体力「${p.stamina.label}」，高体力项目与室内休息点已按此配比。`,
    `预算「${p.budget.label}」，全程预估 ¥${plan.stats.total}，免费与低消点位优先靠前。`
  ];
  /* 多城：把「为什么这样串」讲清楚 —— 你要去的地方各占连续几天，段间用大交通衔接 */
  if (multi) {
    const chain = plan.trips.map(t => `${t.city.name} ${t.dayCount}天`).join(' → ');
    lines.splice(0, 0, `你点名要去的地方按「一段一城」排：${chain}，段与段之间用高铁 / 飞机 / 自驾衔接。`);
  }
  if (p.interests.length) {
    lines.push(`你选的兴趣（${p.interests.map(k => TAG_META[k].label).join('、')}）在各站标签中已高亮显示。`);
  }

  // 住宿总览：需要换片区时给出搬行李提示
  let stayBlock = '';
  if (plan.stay && plan.stay.areas.length) {
    stayBlock = `<div class="why-stay">🛏 住宿安排：${plan.stay.switchNote}</div>`;
  } else if (multi) {
    const rows = plan.trips.map(t => {
      const st = t.plan && t.plan.stay;
      return (st && st.areas && st.areas.length)
        ? `<div class="why-stay">🛏 ${t.city.name} · ${st.switchNote}</div>` : '';
    }).join('');
    stayBlock = rows;
  }

  $('whyCard').innerHTML =
    `<div class="why-head">✦ 为什么是这条路线</div>
     <ul class="why-list">${lines.map(t => `<li>${t}</li>`).join('')}</ul>
     ${stayBlock}`;
}

/* 收藏按钮 */
function syncFavBtn() {
  const sid = Store.sidOf(state.session.answers);
  const on = Store.isFav(sid);
  $('favBtn').textContent = on ? '★' : '☆';
  $('favBtn').classList.toggle('on', on);
}
function toggleFav() {
  if (!state.session) return;
  const a = state.session.answers, p = state.profile;
  const on = Store.toggleFav({
    sid: Store.sidOf(a), city: a.city, days: a.days,
    mode: state.session.mode, time: Date.now(),
    personaName: p.persona.name, answers: a
  });
  syncFavBtn();
  toast(on ? '已收藏这条路线' : '已取消收藏');
}

/* 足迹打卡按钮（结果页 topbar ✦）：点亮 = 去过这座城市 */
function syncVisitBtn() {
  if (!state.session) return;
  const key = state.session.answers.city;
  const on = Store.isVisited(key);
  const name = POI_DB[key] ? POI_DB[key].name : key;
  const b = $('visitBtn');
  if (!b) return;
  b.classList.toggle('on', on);
  b.title = on ? `已点亮 ${name}` : '去过就点亮';
}
function toggleVisitHere() {
  if (!state.session) return;
  const key = state.session.answers.city;
  const name = POI_DB[key] ? POI_DB[key].name : key;
  const on = Store.toggleVisit(key);
  syncVisitBtn();
  toast(on ? `✦ 已点亮 ${name} · 记入你的足迹` : `已取消点亮 ${name}`);
}

function renderDays() {
  const plan = state.plan;
  const box = $('days');
  box.innerHTML = '';
  if (!plan || !plan.days) return;

  /* 是否多城：trips 长度 > 1 才需要段头与段间大交通；
     单城时走同一条代码路径，只是不渲染段头（保证跟以前像素级一致）。 */
  const multi = !!(plan.multi && plan.trips && plan.trips.length > 1);

  /* 降级节点：单天渲染抛错时兜底，避免一整天（甚至后续所有天）
     因为某个字段缺失而整体中断 —— 这正是「只出第一天」的根因。 */
  const errorNode = (di, err) => {
    const n = el('div', 'day day-err');
    n.innerHTML =
      `<div class="day-head"><div class="day-badge" style="background:#c8c8c8">D${di + 1}</div>
        <div class="day-meta"><b>第 ${di + 1} 幕 · 这一天暂时没排出来</b>
        <span>换个节奏或稍后重试即可 · 其余天的安排不受影响</span></div></div>`;
    if (err) n.title = String(err && err.message || err);
    return n;
  };

  /* 住宿卡不放在 day 卡内部，而是插在「当天」与「次日」之间 ——
     语义上它属于「今天收工之后、明天出发之前」的过夜节点，
     用户也更容易一眼看到「今晚住哪」再接着看明天的安排。
     每一小块单独 try：住宿卡炸了不该连累当天行程。 */
  const pushDay = (day, gdi) => {
    if (!day) return;
    let ok = false;
    try { box.appendChild(dayCard(day, gdi)); ok = true; }
    catch (err) {
      console.error('[renderDays] 第 ' + (gdi + 1) + ' 天渲染失败', err);
      box.appendChild(errorNode(gdi, err));
    }
    if (!ok) return;
    if (day.stay) {
      try { box.appendChild(stayNode(day.stay, gdi)); }
      catch (err) { console.error('[renderDays] 第 ' + (gdi + 1) + ' 天住宿卡渲染失败', err); }
    }
  };

  /* 段头/大交通卡也各自兜底：多城时任何一段出问题都不能吞掉后面的城 */
  const safeSeg = (fn, tag) => {
    try { fn(); } catch (err) { console.error('[renderDays] ' + tag + ' 渲染失败', err); }
  };

  /* 是否「用户明确选择保留自己的顺序」（而非优化后恰好没变）。
     两者都会让 orderInfo.orderChanged=false 或 orderInfo=null，
     但只有用户主动关掉智能排序时才该说「已按你的顺序走」。 */
  const isMultiPreserved = () => state.destSortMode === 'manual';

  /* 单城：老的平铺渲染，一个 day 一个卡片 */
  if (!multi) {
    plan.days.forEach((day, di) => pushDay(day, di));
    syncStaySummary();
    return;
  }

  /* 多城：按 trips 逐段渲染；「进入本段」的大交通卡放在段头之前
     （enterLeg → 第 1 城；legs[ti-1] → 第 ti 城） */

  /* 城市顺序说明条：把"引擎替你重新排过城市"这件事摆到明面上。
     不说的话，用户看到段头顺序和自己勾选的不一样，会以为出了 bug。 */
  safeSeg(() => {
    const names = plan.trips.map(t => t.city.name).join(' → ');
    const oi = plan.orderInfo;
    if (oi && oi.optimized && oi.orderChanged) {
      box.appendChild(el('div', 'day-note order',
        `<span class="dn-badge">🧭 智能排序</span><span class="dn-text">已按地理顺路重新安排城市顺序：${names}，城际总里程约 ${oi.totalKm} km${oi.savedKm > 0 ? `（比原顺序少走 ${oi.savedKm} km）` : ''}。想按自己的顺序走，点顶部「恢复我的顺序」。</span>`));
    } else if (oi && oi.optimized && !oi.orderChanged) {
      box.appendChild(el('div', 'day-note order',
        `<span class="dn-badge">🧭 智能排序</span><span class="dn-text">你选的城市顺序已经是最顺路的：${names}，城际总里程约 ${oi.totalKm} km。</span>`));
    } else if (isMultiPreserved()) {
      box.appendChild(el('div', 'day-note order',
        `<span class="dn-badge">↩︎ 我的顺序</span><span class="dn-text">已按你排好的顺序走：${names}（未做地理优化）。想让它自动顺路，点顶部「智能排序」。</span>`));
    }
  }, '排序说明条');

  plan.trips.forEach((trip, ti) => {
    const leg = (ti === 0) ? plan.enterLeg : (plan.legs && plan.legs[ti - 1]);
    if (leg && leg.transport && !leg.transport.sameCity) safeSeg(() => box.appendChild(legCard(leg)), '大交通卡');

    safeSeg(() => box.appendChild(tripHead(trip, ti, plan.trips.length)), '段头');

    /* 用索引切片，并夹住边界：即使 trip 的 startDayIndex/dayCount 有偏差，
       也不会 slice 出空数组而整段消失。 */
    const start = Math.max(0, Math.min(trip.startDayIndex || 0, plan.days.length));
    let count = (trip.dayCount || 0);
    if (!count) count = plan.days.length - start;
    const days = plan.days.slice(start, start + count);
    days.forEach((day, k) => pushDay(day, start + k));
  });
  syncStaySummary();
}

/** 单个「天」卡片的完整渲染（把原来的循环体原样抽出来，供单城/多城共用） */
function dayCard(day, di) {
  const wrap = el('div', 'day');
  const color = DAY_COLORS[di % DAY_COLORS.length];

  /* 字段兜底：引擎任何一处少给了字段，这里都不能让整天抛错。
     「只有第一天」那类事故，十有八九是一整天卡在某个 undefined 上。 */
  const timeline = (day && day.timeline) || [];
  const memory = (day && day.memory) || [];
  const areas = (day && day.areas) || [];
  const walkHours = (day && typeof day.walkHours === 'number') ? day.walkHours : 0;
  const firstArrive = timeline[0] && timeline[0].arrive ? timeline[0].arrive : '';

  wrap.appendChild(el('div', 'day-head',
    `<div class="day-badge" style="background:${color}">D${di + 1}</div>
     <div class="day-meta">
       <b>第 ${di + 1} 幕 · ${(day && day.title) || ''}</b>
       <span>${timeline.length} 站 · 游玩 ${Math.round(walkHours * 10) / 10}h · ${firstArrive} 出发 · ${areas.join(' / ')}</span>
     </div>
     <button class="day-nav" data-di="${di}">🧭 导航今日</button>`));

  /* 首末天与交通的联动提示：第 1 天几点才开始玩、末天几点要动身。
     这是「把出发返程时间排进天数里」最直观的落点。 */
  if (day && day.arrivalNote) {
    wrap.appendChild(el('div', 'day-note arrive',
      `<span class="dn-badge">🛬 抵达日</span><span class="dn-text">${day.arrivalNote.text}</span>`));
  }
  if (day && day.departNote) {
    wrap.appendChild(el('div', 'day-note depart',
      `<span class="dn-badge">🚄 返程日</span><span class="dn-text">${day.departNote.text}</span>`));
  }
  if (day && day.dropNote) {
    wrap.appendChild(el('div', 'day-note drop',
      `<span class="dn-badge">⏳ 时间不够</span><span class="dn-text">为了赶上 ${day.dropNote.capTime} 后的车，${day.dropNote.names.join('、')} 这次先割爱，留着下次来</span>`));
  }

  // 一键导航当天：把当日所有站点按顺序串给高德（首站起点、末站终点、中间途经）
  const dnBtn = wrap.querySelector('.day-nav');
  if (dnBtn) {
    const stops = timeline.map(t => t.poi).filter(Boolean);
    dnBtn.onclick = () => openNavi({ day: { stops, index: di } });
  }

  const mem = el('details', 'mem-card');
  mem.innerHTML =
    `<summary><span>🎒 行前看一眼（${memory.length} 件事）</span><span class="mem-sub">看一眼就够，路上不必再打开</span></summary>
     <ol class="mem-list">${memory.map(m =>
       `<li><b>${m.name}</b>${m.offline ? '<span class="mem-off">📵 手机入袋</span>' : ''}<br><span class="mem-quest">${m.quest}</span></li>`
     ).join('')}</ol>`;
  wrap.appendChild(mem);

  /* 曲线 / 氛围条 / 时间轴逐块兜底：任一块挂掉都只丢这一块 */
  try { wrap.appendChild(curveCard(day, color, di, false)); }
  catch (e) { console.error('[dayCard] 曲线A失败 D' + (di + 1), e); }
  try { wrap.appendChild(curveCard(day, color, di, true)); }
  catch (e) { console.error('[dayCard] 曲线B失败 D' + (di + 1), e); }
  try { wrap.appendChild(renderVibeStrip(day)); }
  catch (e) { console.error('[dayCard] 氛围条失败 D' + (di + 1), e); }

  /* 体验节奏贴合度：把目标弧线与实际点位激活度对齐，给出量化评分 */
  try {
    if (typeof experienceRhythm === 'function' && state.profile) {
      const r = experienceRhythm(day, state.profile);
      if (r && r.points && r.points.length) {
        const fitColor = r.fitScore >= 80 ? '#3ba272' : r.fitScore >= 60 ? '#e8a33d' : '#e8595c';
        const pointsHTML = r.points.map(p =>
          `<span class="rhythm-pt" title="${p.name}：目标 ${p.target.toFixed(2)} / 实际 ${p.actual.toFixed(2)}">
             <b>${p.name}</b><i style="color:${fitColor}">贴合 ${Math.round(p.fit)}%</i>
           </span>`
        ).join('');
        wrap.appendChild(el('div', 'rhythm-card',
          `<div class="rhythm-head">🎵 体验节奏贴合度 <b style="color:${fitColor}">${r.fitScore} 分</b></div>
           <div class="rhythm-pts">${pointsHTML}</div>
           <div class="rhythm-hint">目标弧线由「放松/探索/热闹」三维驱动，越贴合说明行程越符合你想要的感觉</div>`));
      }
    }
  } catch (e) { console.error('[dayCard] 节奏面板失败 D' + (di + 1), e); }

  const tl = el('div', 'tl');
  timeline.forEach((stop, si) => {
    if (!stop) return;
    try { tl.appendChild(transitNode(stop, si)); }
    catch (e) { console.error('[dayCard] 交通节点失败 D' + (di + 1) + '/S' + (si + 1), e); }
    try { tl.appendChild(stopNode(stop, di, si, color)); }
    catch (e) { console.error('[dayCard] 站点失败 D' + (di + 1) + '/S' + (si + 1), e); }
  });
  wrap.appendChild(tl);
  /* 注意：住宿卡不在这里 —— 由 renderDays() 插到「当天与次日之间」，
     因为它表达的是「今晚住哪」这个过夜节点，跨天而不是当天的收尾。 */
  return wrap;
}

/* 段头：第 N 城 · 城市名 · 占几天 · 锚点提示 */
function tripHead(trip, ti, total) {
  const v = cityVisual(trip.cityKey);
  const seq = total > 1 ? `第 ${ti + 1} 城` : '第 1 城';
  const anchorNote = (trip.anchors && trip.anchors.length)
    ? (trip.anchors.map(a => {
      const poi = (trip.plan && trip.plan.days)
        ? trip.plan.days.flatMap(d => d.timeline).map(t => t.poi).find(p => p.id === a)
        : null;
      return poi ? poi.name : '';
    }).filter(Boolean).join(' · '))
    : '';
  const head = el('div', 'trip-head');
  head.innerHTML =
    `<span class="th-seq">${seq}</span>
     <b>${v.emoji} ${trip.city.name}</b>
     <span class="th-days">住 ${trip.dayCount} 天（D${trip.startDayIndex + 1}~D${trip.startDayIndex + trip.dayCount}）</span>
     ${anchorNote ? `<span class="th-note">★ ${anchorNote}</span>` : ''}`;
  return head;
}

/* 段间 / 进入段的大交通卡（复用 cityTransport 的返回结构） */
function legCard(leg) {
  const t = leg.transport;
  const isEnter = leg.kind === 'enter';
  const title = isEnter
    ? `🚉 出发：${t.from} → ${t.to} · ${t.distance}km`
    : `🚌 转场：${t.from} → ${t.to} · ${t.distance}km`;

  const modeHTML = (t.options || []).map(o => {
    const rec = o.key === t.recommended;
    return `<div class="tp-mode ${rec ? 'rec' : ''}">
      ${rec ? '<span class="tm-rec">推荐</span>' : ''}
      <span class="tm-ic">${o.icon}</span>
      <span class="tm-name">${o.name}</span>
      <span class="tm-dur">${o.dur}</span>
      <span class="tm-price">¥${o.price[0]}~${o.price[1]}</span>
    </div>`;
  }).join('');

  const transferHTML = t.transfer
    ? `<div class="tp-arrive"><b>中转：</b>${t.transfer.note}</div>` : '';
  const tipsHTML = (t.tips && t.tips.length)
    ? `<div class="tp-tips">${t.tips.map(x => `<div>${x}</div>`).join('')}</div>` : '';

  const card = el('div', 'leg-card');
  card.innerHTML =
    `<div class="leg-head">${title}</div>
     <div class="leg-verdict">${t.verdict}</div>
     <div class="tp-modes">${modeHTML}</div>
     ${transferHTML}
     <div class="tp-arrive"><b>到达后怎么去第一站：</b>${t.arrive.how}（约 ${t.arrive.min} 分钟）</div>
     ${tipsHTML}
     <button class="tp-nav">🧭 用高德导航这段路</button>`;

  const nb = card.querySelector('.tp-nav');
  if (nb) nb.onclick = () => openNavi({ cross: { fromKey: leg.fromKey, toKey: leg.toKey } });
  return card;
}

/* ---- 每日住宿卡（住哪儿排进路线） ---- */
/**
 * 住宿卡（插在「当天」与「次日」之间）
 * @param {object} stay  引擎输出的当天住宿对象
 * @param {number} di    全局天序号 —— 用于读写「今晚选定哪家」的持久化记录
 */
function stayNode(stay, di) {
  const tierLabel = { economy: '经济', comfort: '舒适', premium: '品质' }[stay.tier] || '舒适';
  const all = stay.hotels || [];
  const SHOW = 3;                       // 默认露 3 家，其余折叠

  /* 选择记录按 sid + 天序号存；sid 由答案快照决定（不含住宿，改了也不会变） */
  const sid = (state.session && Store.sidOf) ? Store.sidOf(state.session.answers) : '';

  const card = el('div', 'stay-card');
  card.dataset.day = di;
  const head = el('div', 'stay-head');
  head.innerHTML =
    `<span class="stay-ic">🛏</span>
     <span class="stay-title">今晚住 · ${stay.area}</span>
     <span class="stay-tier ${stay.tier}">${tierLabel}</span>
     <span class="stay-price">${stay.price}</span>`;

  /* 已选回显：让「我订了哪家」一眼可见，不用翻列表找高亮 */
  const pickedNow = Store.getStay(sid, di);
  const pickedTag = el('span', 'stay-picked');
  if (pickedNow) pickedTag.textContent = '已选：' + pickedNow.name;
  pickedTag.hidden = !pickedNow;
  head.appendChild(pickedTag);
  card.appendChild(head);

  card.appendChild(el('div', 'stay-why', stay.why || ''));
  card.appendChild(el('div', 'stay-walk', stay.walkTip || ''));

  if (!all.length) return card;

  /* 类型筛选条：哪几类有就显示哪几个，含「全部」 */
  const bar = el('div', 'stay-filter');
  const kinds = stay.kinds || [];
  const chips = [{ kind: '', label: `全部 ${all.length}`, n: all.length }, ...kinds];
  chips.forEach((k, i) => {
    const b = el('button', 'stay-chip' + (i === 0 ? ' on' : ''), `${k.label}${k.kind ? ' ' + k.n : ''}`);
    b.dataset.kind = k.kind;
    bar.appendChild(b);
  });
  card.appendChild(bar);

  card.appendChild(el('div', 'stay-pick-tip', '👇 点一下选今晚住哪家 · 再点一下取消'));

  const list = el('div', 'stay-list');
  card.appendChild(list);

  const more = el('button', 'stay-more');
  card.appendChild(more);

  let filter = '';
  let expanded = false;
  let shownPool = [];                   // 当前显示出来的那批（data-idx 指向它）

  const hotelRow = (h, idx) => {
    const star = h.rating ? `<span class="stay-star">★${h.rating}</span>` : '';
    const tags = (h.tags || []).map(t => `<span class="stay-tag">${t}</span>`).join('');
    const picked = Store.getStay(sid, di);
    const on = picked && picked.name === h.name;
    return `<div class="stay-item${on ? ' on' : ''}" data-idx="${idx}">
      <div class="stay-line1">
        <span class="stay-kind ${h.kind}">${h.kindLabel}</span>
        <span class="stay-name">${h.name}</span>
        ${star}
        <span class="stay-hp">${h.price}</span>
        ${on ? '<span class="stay-picked-badge">✓ 已选</span>' : ''}
      </div>
      ${h.note ? `<div class="stay-note">${h.note}</div>` : ''}
      ${tags ? `<div class="stay-tags">${tags}</div>` : ''}
    </div>`;
  };

  const refresh = () => {
    const pool = filter ? all.filter(h => h.kind === filter) : all;
    shownPool = expanded ? pool : pool.slice(0, SHOW);
    list.innerHTML = shownPool.map(hotelRow).join('') ||
      `<div class="stay-empty">这一类暂时没有可选项，换个类型看看</div>`;
    const rest = pool.length - shownPool.length;
    if (rest > 0) {
      more.hidden = false;
      more.textContent = `看全部 ${pool.length} 家 ▾`;
    } else if (expanded && pool.length > SHOW) {
      more.hidden = false;
      more.textContent = '收起 ▴';
    } else {
      more.hidden = true;
    }
    /* 头部「已选：XX」跟着一起更新 */
    const cur = Store.getStay(sid, di);
    pickedTag.textContent = cur ? '已选：' + cur.name : '';
    pickedTag.hidden = !cur;
  };

  bar.querySelectorAll('.stay-chip').forEach(b => {
    b.onclick = () => {
      bar.querySelectorAll('.stay-chip').forEach(x => x.classList.toggle('on', x === b));
      filter = b.dataset.kind || '';
      expanded = false;                 // 换类型回到收起态，避免列表忽然很长
      refresh();
    };
  });
  more.onclick = () => { expanded = !expanded; refresh(); };

  /* 点某一行 = 选这家；再点同一行 = 取消。事件委托，重绘后不用重新绑定 */
  list.onclick = e => {
    const row = e.target.closest('.stay-item');
    if (!row || row.dataset.idx == null) return;
    const h = shownPool[+row.dataset.idx];
    if (!h) return;
    const cur = Store.getStay(sid, di);
    const next = (cur && cur.name === h.name) ? null : {
      name: h.name, kind: h.kind, kindLabel: h.kindLabel,
      price: h.price, rating: h.rating || 0,
      area: stay.area, cityKey: (state.session && state.session.answers && state.session.answers.city) || ''
    };
    Store.setStay(sid, di, next);
    refresh();
    syncStaySummary();
  };

  refresh();
  return card;
}

/**
 * 结果页顶部「住宿安排」汇总：把每天选定的酒店列成一张小卡。
 * 为什么要有它：住宿卡分散在各天之间、还会随筛选折叠，
 * 用户翻到后面容易忘记前面订了哪家 —— 汇总卡就是那份「备忘」。
 */
function syncStaySummary() {
  const box = $('staySummary');
  if (!box) return;
  const sid = (state.session && Store.sidOf) ? Store.sidOf(state.session.answers) : '';
  const map = Store.getStays(sid);
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  if (!keys.length) { box.hidden = true; box.innerHTML = ''; return; }

  box.hidden = false;
  box.innerHTML =
    `<div class="ss-head"><span>🏨 住宿安排</span>
       <button class="ss-clear" id="ssClear">清空</button></div>` +
    keys.map(k => {
      const h = map[String(k)];
      const price = h.price ? `<span class="ss-price">${h.price}</span>` : '';
      const kind = h.kindLabel ? `<span class="ss-kind ${h.kind}">${h.kindLabel}</span>` : '';
      return `<div class="ss-row"><b>D${k + 1}</b>
        <span class="ss-area">${h.area || ''}</span>
        ${kind}<span class="ss-name">${h.name}</span>${price}</div>`;
    }).join('');

  const btn = $('ssClear');
  if (btn) btn.onclick = () => { Store.clearStays(sid); renderDays(); syncStaySummary(); toast('已清空住宿安排'); };
}

/* ---- 体验曲线 ---- */
function curveCard(day, color, di, live) {
  const p = state.profile;
  if (live) {
    const W = 360, H = 34;
    const t0 = p.pace.start, t1 = Math.min(Math.max(day.endTime, t0 + 3), 23);
    let bars = '';
    const N = 34;
    for (let i = 0; i < N; i++) {
      const t = t0 + (t1 - t0) * i / (N - 1);
      const u = (t - t0) / (t1 - t0);
      const a = targetArousal(u, p);
      const col = a > 0.62 ? '#e8b98a' : a > 0.42 ? '#9ecfb0' : '#7fae8a';
      bars += `<rect x="${(i * W / N).toFixed(1)}" y="6" width="${(W / N + 0.6).toFixed(1)}" height="22" rx="3" fill="${col}" opacity="${(0.35 + a * 0.6).toFixed(2)}"/>`;
    }
    const card = el('div', 'curve-card live');
    card.innerHTML =
      `<div class="curve-head">
         <span class="curve-title">🟢 今日节律</span>
         <span class="curve-legend">左→右 = 一天的推进 ｜ 亮＝可放开 · 深＝该收着</span>
       </div>
       <svg viewBox="0 0 ${W} ${H}" class="day-curve-svg">${bars}</svg>`;
    return card;
  }

  const W = 360, H = 108, PL = 10, PR = 10, PT = 12, PB = 20;
  const x = h => PL + (h - 8) / (23 - 8) * (W - PL - PR);
  const y = a => PT + (1 - a) * (H - PT - PB);

  let s = `<svg viewBox="0 0 ${W} ${H}" class="day-curve-svg">`;
  [10, 14, 18, 22].forEach(hh => {
    s += `<line x1="${x(hh)}" y1="${PT - 4}" x2="${x(hh)}" y2="${H - PB + 2}" stroke="#eceee6" stroke-width="1"/>`;
    s += `<text x="${x(hh)}" y="${H - 6}" font-size="9" fill="#b0b5a8" text-anchor="middle">${hh}:00</text>`;
  });
  s += `<line x1="${PL}" y1="${y(0.5)}" x2="${W - PR}" y2="${y(0.5)}" stroke="#eceee6" stroke-width="1" stroke-dasharray="2 4"/>`;

  const t0 = p.pace.start, t1 = Math.min(Math.max(day.endTime, t0 + 3), 23);
  let dT = '';
  for (let i = 0; i <= 28; i++) {
    const t = t0 + (t1 - t0) * i / 28;
    const u = (t - t0) / (t1 - t0);
    dT += (i ? ' L' : 'M') + x(t).toFixed(1) + ' ' + y(targetArousal(u, p)).toFixed(1);
  }
  s += `<path d="${dT}" fill="none" stroke="#c2c8bb" stroke-width="1.6" stroke-dasharray="4 4"/>`;

  if (day.arc && day.arc.length) {
    let dA = '';
    day.arc.forEach((pt, i) => { dA += (i ? ' L' : 'M') + x(pt.h).toFixed(1) + ' ' + y(pt.a).toFixed(1); });
    s += `<path d="${dA}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
    day.arc.forEach(pt => {
      const meta = VIBE_META[pt.vibe] || {};
      s += `<circle cx="${x(pt.h)}" cy="${y(pt.a)}" r="4.4" fill="#fff" stroke="${color}" stroke-width="2"/>`;
      s += `<text x="${x(pt.h)}" y="${y(pt.a) - 8}" font-size="10" text-anchor="middle">${meta.emoji || ''}</text>`;
    });
  }
  s += '</svg>';

  const card = el('div', 'curve-card');
  card.innerHTML =
    `<div class="curve-head">
       <span class="curve-title">📈 体验曲线</span>
       <span class="curve-legend"><i style="border-color:#c2c8bb"></i>目标弧线 <i style="border-color:${color}"></i>实际行程</span>
     </div>${s}`;
  return card;
}

const RHYTHM_HINT = {
  zen: '收着点 · 慢慢待', learn: '沉进去 · 别急着走', warm: '放开吃 · 聊起来',
  thrill: '放开玩 · 尽兴', fun: '撒欢 · 拍两张就好'
};

function renderVibeStrip(day) {
  const box = el('div', 'vibe-strip');
  day.timeline.forEach((t, i) => {
    const vm = VIBE_META[t.poi.mood.vibe] || {};
    const seg = el('div', 'vibe-seg');
    seg.style.background = vm.color + '22';
    seg.innerHTML =
      `<span class="vibe-seg-time">${t.arrive}</span>
       <span class="vibe-seg-emoji">${vm.emoji}</span>
       <span class="vibe-seg-name">${t.poi.name}</span>
       <span class="vibe-seg-hint" style="color:${vm.color}">${RHYTHM_HINT[t.poi.mood.vibe] || ''}</span>`;
    box.appendChild(seg);
    if (i < day.timeline.length - 1) box.appendChild(el('div', 'vibe-arrow', '→'));
  });
  return box;
}

function statHTML(s) {
  return [
    ['地点', s.poiCount, '个', ''],
    ['游玩', s.totalHours, '小时', ''],
    ['📵 收手机', s.offlineHours || 0, '小时', 'off'],
    ['预估花费', '¥' + s.total, '', 'accent']
  ].map(([label, val, unit, cls]) =>
    `<div class="stat ${cls}"><b>${val}${unit}</b><span>${label}</span></div>`).join('');
}

function humanGap(mins) {
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

function transitNode(stop, si) {
  if (si === 0) return el('div', 'transit', `<span>🚩 ${stop.arrive} 出发</span>`);
  const mins = Math.round(stop.transitFrom * 60);
  const km = stop.distFrom.toFixed(1);
  if (stop.distFrom < 1.5 && mins > 40) {
    return el('div', 'transit', `<span>☕ 自由活动 / 休息 ${humanGap(mins)}</span><i></i>`);
  }
  const way = stop.distFrom > 12 ? '🚗' : stop.distFrom > 2 ? '🚕' : '🚶';
  return el('div', 'transit', `<span>${way} 转场约 ${mins} 分钟 · ${km} km</span><i></i>`);
}

function stopNode(stop, di, si, color) {
  const poi = stop.poi;
  const n = el('div', 'stop');
  n.style.animationDelay = (di * 60 + si * 45) + 'ms';

  const hitTags = Object.entries(poi.tags)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([t]) => {
      const hit = (state.profile.weights[t] || 0) > 0.6;
      return `<span class="mini-tag ${hit ? 'hit' : ''}">${TAG_META[t].icon} ${TAG_META[t].label}</span>`;
    }).join('');

  const costTxt = ['免费/低消', '中等', '偏高', '较高'][poi.cost];
  const intenTxt = ['轻松', '适中', '费力'][poi.intensity - 1];
  const vm = VIBE_META[poi.mood.vibe] || {};
  const quest = narrativeOf(poi);
  const qObj = (typeof questOf === 'function') ? questOf(poi) : { text: quest };
  const isQuest = !!NARRATIVE_DB[poi.id];
  const off = isOffline(poi);
  const img = (typeof imageOf === 'function') ? imageOf(poi) : '';
  const mapUrl = (typeof mapUrlOf === 'function') ? mapUrlOf(poi) : '';
  const questTypeEmoji = { history: '🏛', nature: '🏞', food: '🍜', photo: '📷', shop: '🛍', family: '🧒', art: '🎨', night: '🌃', relax: '🍵' };
  const questDiffStars = '★'.repeat(qObj.difficulty || 1) + '☆'.repeat(3 - (qObj.difficulty || 1));

  const body = el('div', 'stop-body');
  body.innerHTML =
    `${img ? `<div class="stop-img-wrap"><img class="stop-img" src="${img}" alt="${poi.name}" onerror="this.style.display='none'"><div class="stop-img-map">${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener">📍 地图</a>` : ''}</div></div>` : ''}
     <div class="stop-top">
       <div>
         <div class="stop-name">${si + 1}. ${poi.name}</div>
         <div class="stop-sub"><span class="vibe-chip" style="color:${vm.color};border-color:${vm.color}55">${vm.emoji} ${vm.label}</span> ${SLOT_LABEL[stop.slot]} · 约 ${poi.hours}h · ${costTxt} · 体力${intenTxt}${poi.indoor ? ' · 室内' : ''}</div>
       </div>
       <div class="stop-time">${stop.arrive}<br><span style="color:var(--ink-3);font-weight:400">${stop.leave}</span></div>
     </div>
     ${off ? `<div class="stop-offline">📵 ${humanGap(Math.round(poi.hours * 60))} 深度体验 · 建议手机入袋，${RHYTHM_HINT[poi.mood.vibe] || '好好待着'}</div>` : ''}
     ${poi.book ? `<div class="stop-book">🎫 需预约 · ${poi.book.days > 0 ? `提前 ${poi.book.days} 天` : '建议提前'} | ${poi.book.channel}<span class="bk-note">　${poi.book.note || ''}</span></div>` : ''}
     <div class="stop-quest">✦ 行前记住：${quest}${isQuest && qObj.type ? ` <span class="quest-type">${questTypeEmoji[qObj.type] || '🎯'} ${qObj.type} · ${questDiffStars}</span>` : ''}</div>
     ${isQuest && poi.tip && poi.tip !== quest ? `<div class="stop-tip">💡 ${poi.tip}</div>` : ''}
     <div class="stop-tags">${hitTags}</div>`;

  // 攻略详情（交通 / 美食 / 人文）
  const g = guideHTML(poi);
  if (g) body.appendChild(el('div', 'guide', g));

  const tools = el('div', 'stop-tools');
  const navBtn = el('button', 'tool-btn nav', '🧭 导航到这里');
  const swapBtn = el('button', 'tool-btn', '🔄 换个地方');
  const dropBtn = el('button', 'tool-btn', '🗑 去掉这站');
  const completeBtn = isQuest ? el('button', 'tool-btn complete', '✅ 完成任务') : null;
  const aiBtn = el('button', 'tool-btn ai', '🤖 AI 讲解');
  const gemBtn = el('button', 'tool-btn', '💎 投稿宝藏地');
  tools.appendChild(navBtn);
  tools.appendChild(swapBtn);
  tools.appendChild(dropBtn);
  if (completeBtn) tools.appendChild(completeBtn);
  tools.appendChild(aiBtn);
  tools.appendChild(gemBtn);
  body.appendChild(tools);
  n.appendChild(body);

  navBtn.onclick = () => openNavi({ poi, from: null });
  swapBtn.onclick = () => toggleSwap(n, di, si);
  dropBtn.onclick = () => {
    state.plan.days[di].items.splice(si, 1);
    rescheduleDay(di);
    afterEdit();
    toast('已移除该站');
  };
  if (completeBtn) completeBtn.onclick = () => {
    const prof = state.profile;
    if (typeof completeQuest === 'function') {
      prof.completedQuests = completeQuest(prof, poi.id);
    } else {
      prof.completedQuests = (prof.completedQuests || []).concat([poi.id]);
    }
    toast(`任务完成：${poi.name}`);
    afterEdit();
  };
  aiBtn.onclick = () => openAIExplain(poi);
  gemBtn.onclick = () => {
    const name = prompt('给这个宝藏地起个名字？', poi.name);
    if (!name) return;
    const reason = prompt('为什么推荐这里？（一句话）', '');
    if (typeof submitGem === 'function') {
      submitGem({ city: state.profile.city, name, reason, poiId: poi.id });
    }
    toast('感谢投稿！已加入审核队列 🎉');
  };

  return n;
}

/* 攻略四层：怎么去 / 打车 / 吃什么 / 人文 */
function guideHTML(poi) {
  const t = poi.traffic, e = poi.eat;
  const rows = [];
  if (t) {
    if (t.go) rows.push(['🚇 怎么去', t.go]);
    if (t.taxi) rows.push(['🚕 打车', t.taxi]);
    if (t.tips) rows.push(['💡 贴士', t.tips]);
  }
  if (e) {
    if (e.dishes && e.dishes.length) rows.push(['🍜 吃什么', e.dishes.join(' · ')]);
    if (e.shops && e.shops.length) {
      rows.push(['🏮 老店推荐', e.shops.map(s => `${s.name}（${s.dish} ¥${s.price}）`).join(' · ')]);
    }
    if (e.note) rows.push(['🧾 消费', e.note]);
  }
  if (poi.culture) rows.push(['📜 人文', poi.culture + (poi.cultureTag ? '　# ' + poi.cultureTag : '')]);
  if (poi.src) rows.push(['✅ 出处', poi.src]);
  if (!rows.length) return '';
  return `<div class="guide-toggle">📖 攻略详情</div><div class="guide-body">${
    rows.map(([k, v]) => `<div class="guide-row"><span class="guide-k">${k}</span><span class="guide-v">${v}</span></div>`).join('')
  }<div class="guide-note">具体营业与票价以实际为准</div></div>`;
}

function toggleSwap(node, di, si) {
  const existing = node.querySelector('.swap-panel');
  if (existing) { existing.remove(); return; }
  node.querySelectorAll('.swap-panel').forEach(e => e.remove());

  const cur = state.plan.days[di].timeline[si];
  const list = suggestSwaps(state.plan, di, cur.poi.id, state.profile).filter(x => x.poi.id !== cur.poi.id);

  const panel = el('div', 'swap-panel');
  panel.innerHTML = `<div class="swap-title">换成这些（按契合度与顺路程度排序）</div>`;
  if (!list.length) panel.appendChild(el('div', 'swap-title', '没有更合适的候选了'));
  list.forEach(x => {
    const b = el('button', 'swap-item');
    b.innerHTML =
      `<span class="swap-l"><b>${x.poi.name}</b><span>${x.poi.area} · 约 ${x.poi.hours}h · 距当日中心 ${x.distToDay.toFixed(1)}km</span></span>
       <span class="swap-r">换它 →</span>`;
    b.onclick = () => {
      state.plan.days[di].items[si] = x;
      rescheduleDay(di);
      afterEdit();
      toast(`已换成「${x.poi.name}」`);
    };
    panel.appendChild(b);
  });
  node.querySelector('.stop-body').appendChild(panel);
}

function rescheduleDay(di) {
  const day = state.plan.days[di];
  if (!day.items.length) { day.timeline = []; day.areas = []; day.walkHours = 0; day.arc = []; day.title = '自由一日'; return; }
  day.timeline = scheduleDay(day.items, state.profile);
  day.items = day.timeline;
  day.areas = [...new Set(day.timeline.map(t => t.poi.area))];
  day.walkHours = day.timeline.reduce((s, t) => s + t.poi.hours, 0);
  day.title = dayTitle(day.timeline);
  day.arc = day.timeline.map(t => ({ h: t.startHour, a: t.poi.mood.arousal, vibe: t.poi.mood.vibe }));
}

function afterEdit() {
  const plan = state.plan;
  plan.stats = buildStats(plan.days, state.profile);
  const s = plan.stats;
  $('statGrid').innerHTML = statHTML(s);
  const multi = !!(plan.multi && plan.trips && plan.trips.length > 1);
  const label = multi
    ? plan.trips.map(t => t.city.name).join(' → ')
    : (plan.city ? plan.city.name : '');
  $('mapHint').textContent = `${label} · ${s.poiCount} 个点 · 直线投影`;
  drawMap(plan, state._mapFocusSeq || 0);
  renderDays();
}

/* ---------- 雷达图 ---------- */
function drawRadar(data) {
  const svg = $('radar');
  const cx = 130, cy = 130, R = 88;
  const n = data.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  let s = '';
  [0.25, 0.5, 0.75, 1].forEach(f => {
    s += `<polygon points="${data.map((_, i) => pt(i, R * f).join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>`;
  });
  data.forEach((d, i) => {
    const [x, y] = pt(i, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.15)" stroke-width="1"/>`;
    const [lx, ly] = pt(i, R + 17);
    const anchor = lx > cx + 4 ? 'start' : lx < cx - 4 ? 'end' : 'middle';
    s += `<text x="${lx}" y="${ly + 4}" fill="rgba(255,255,255,${d.value > 45 ? .92 : .5})" font-size="10.5" text-anchor="${anchor}">${d.label}</text>`;
  });
  const pts = data.map((d, i) => pt(i, R * Math.max(0.08, d.value / 100)).join(',')).join(' ');
  s += `<polygon points="${pts}" fill="rgba(168,216,184,.5)" stroke="#c4e3ce" stroke-width="1.8" stroke-linejoin="round"/>`;
  data.forEach((d, i) => {
    const [x, y] = pt(i, R * Math.max(0.08, d.value / 100));
    s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#e6f2e8"/>`;
  });
  svg.innerHTML = s;
}

/* ---------- 横滑区通用绑定 ----------
 * 解决「划不动 + 点不进」：
 *  - 触摸：原生滚动即负责横滑；只要按下→抬起位移 < 8px 才算点击。
 *  - 桌面：鼠标没有原生横滑，这里手写 drag-to-scroll，并屏蔽拖拽后的 click。
 *  - 触控板横向滚轮：overflow-x:auto 天然支持。
 */
function bindHScroll(scroller, onPick) {
  if (!scroller || scroller.dataset.hbound === '1') return;
  scroller.dataset.hbound = '1';

  let downX = 0, downY = 0, lastX = 0, moved = false, active = false, pid = null;
  const TH = 8;

  const pick = (target, x, y) => {
    let card = target && target.closest ? target.closest('[data-city]') : null;
    /* 卡片内部元素设了 pointer-events:none，事件目标可能是滚动容器本身；
       用坐标兜底找到真正的卡片。 */
    if (!card && x != null) {
      const el = document.elementFromPoint(x, y);
      card = el && el.closest ? el.closest('[data-city]') : null;
    }
    if (card) onPick(card);
  };

  scroller.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = true; moved = false;
    downX = lastX = e.clientX; downY = e.clientY;
    pid = e.pointerId;
    /* 捕获指针：鼠标拖出卡片边界后仍能收到 move，横滑才不会中途断掉 */
    try { scroller.setPointerCapture(e.pointerId); } catch (err) { }
    /* scroll-snap 会和手写 drag-to-scroll 打架：拖拽中改 scrollLeft 会被
       立刻吸回最近的对齐点，表现就是「怎么拖都不动」。拖拽期间先关掉。 */
    scroller.style.scrollSnapType = 'none';
  });

  scroller.addEventListener('pointermove', e => {
    if (!active) return;
    if (Math.abs(e.clientX - downX) > TH || Math.abs(e.clientY - downY) > TH) moved = true;
    /* 不用 e.movementX（部分环境恒为 0），用两次 clientX 的差值自己算 */
    if (e.pointerType === 'mouse' && (e.buttons & 1)) {
      const dx = e.clientX - lastX;
      if (dx) scroller.scrollLeft -= dx;
    }
    lastX = e.clientX;
  });

  const finish = e => {
    if (!active) return;
    active = false;
    if (pid != null) { try { scroller.releasePointerCapture(pid); } catch (err) { } pid = null; }
    /* 松手恢复 snap，滑动仍有「停到卡片上」的手感 */
    scroller.style.scrollSnapType = '';
    /* 位移小于阈值才算点击。拖过就什么都不做，避免一划就误进详情。 */
    if (!moved) pick(e.target, e.clientX, e.clientY);
  };
  scroller.addEventListener('pointerup', finish);

  /* 兜底：某些浏览器（含部分 WebView）触摸后不派发 pointerup，
     但会正常派发 click。用 moved 标记区分「点击」与「拖拽后的收尾 click」。 */
  scroller.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    pick(e.target, e.clientX, e.clientY);
  });

  const reset = () => { active = false; pid = null; scroller.style.scrollSnapType = ''; };
  scroller.addEventListener('pointercancel', reset, { passive: true });
}

/* ---------- 点位疏散 ----------
 * 同一个片区里的景点经纬度常常只差几十米（比如什刹海 / 恭王府 / 南锣鼓巷），
 * 直接投影下来圆点会完全叠在一起 —— 这就是「糊成一坨」的根源。
 * 这里做几轮松弛：距离小于 MIN 的两个点互相推开，保持相对方位不变，
 * 只在不重叠的前提下做最小位移，地理关系仍然读得出来。 */
function relaxPoints(pts, minD, bounds) {
  const P = pts.map(p => [p[0], p[1]]);
  const N = P.length;
  if (!N) return P;
  const MIN = minD || 24;
  for (let k = 0; k < 120; k++) {
    let moved = false;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1];
        let d = Math.hypot(dx, dy);
        if (d >= MIN) continue;
        if (d < 0.001) {                       // 完全重合：按黄金角给个确定方向，避免抖动
          const a = i * 2.399963229728653;
          dx = Math.cos(a); dy = Math.sin(a); d = 1;
        }
        const push = (MIN - d) / (2 * d);
        P[i][0] -= dx * push; P[i][1] -= dy * push;
        P[j][0] += dx * push; P[j][1] += dy * push;
        moved = true;
      }
    }
    if (bounds) {                              // 别被推出画布
      P.forEach(p => {
        p[0] = Math.max(bounds[0], Math.min(bounds[2], p[0]));
        p[1] = Math.max(bounds[1], Math.min(bounds[3], p[1]));
      });
    }
    if (!moved) break;
  }
  return P;
}

/* ============================================================
 *  地图图层：景点 / 酒店 / 我的位置
 * ============================================================ */
const MAP_LAYERS_KEY = 'qt_map_layers_v2';   // v2：酒店图层默认改为开（v1 存过 hotel:false 的老用户也要跟着变）
const MAP_LAYERS_DEFAULT = { poi: true, hotel: true, me: true };

let mapLayers = (() => {
  try {
    const raw = localStorage.getItem(MAP_LAYERS_KEY);
    if (raw) return Object.assign({}, MAP_LAYERS_DEFAULT, JSON.parse(raw));
  } catch (e) { }
  return Object.assign({}, MAP_LAYERS_DEFAULT);
})();

function saveMapLayers() {
  try { localStorage.setItem(MAP_LAYERS_KEY, JSON.stringify(mapLayers)); } catch (e) { }
}

/* 「我的位置」的内存态（每次进结果页刷新一次，避免陈旧） */
let myLocCache = null;

/**
 * 取当前应该用的「我的位置」（**GCJ-02 口径，给高德/导航用**）
 * 顺序：真实定位（有缓存就用缓存）→ 出发城市中心 → 行程城市中心
 * @param {object} plan 用于最后兜底
 */
function currentMyLocation(plan) {
  if (myLocCache) return myLocCache;
  if (typeof Geo !== 'undefined') {
    const c = Geo.readGeoCache();
    if (c) { myLocCache = c; return c; }
  }
  // 退到出发城市（城市级，图上会画大精度圈说明「这是城市中心，不是精确定位」）
  const homeKey = Store.getHome();
  if (homeKey && typeof Geo !== 'undefined') {
    const f = Geo.cityFallback(homeKey);
    if (f) { myLocCache = f; return f; }
  }
  return null;
}

/**
 * 取「我的位置」的**地图展示坐标（WGS84）**
 *
 * 为什么要有这个转换：
 *   地图上的景点点用的是数据源的 WGS84，投影函数 proj() 也是按 WGS84 直线投射的。
 *   而 myLocCache 是 GCJ-02（GPS 与高德通用口径）。
 *   两者直接混画会差 300~600 米——「我的位置」看着像标偏了，其实只是坐标系不同。
 *   所以：给高德 → 用 GCJ-02；画在自己地图上 → 转回 WGS84。
 */
function myLocationForMap(me) {
  if (!me) return null;
  if (me.source === 'city') return me;   // 城市中心是数据源坐标，本就是 WGS84
  if (typeof Navi === 'undefined' || !Navi.gcj02ToWgs84) return me;
  const w = Navi.gcj02ToWgs84(me.lng, me.lat);
  return Object.assign({}, me, { lng: w.lng, lat: w.lat, __wgs: true });
}

/**
 * 取某城所有酒店门店（带 _lat/_lng），用于地图打点
 * 数据来自分片，若尚未加载则返回空数组（地图先画出来，加载完再刷新）
 */
function hotStoresOf(cityKey) {
  if (!cityKey || typeof DataLoader === 'undefined') return [];
  const areas = DataLoader.hotelsOfCity(cityKey);
  if (!areas || !areas.length) {
    // 触发加载，加载完重绘地图
    DataLoader.ensureCity(cityKey).then(() => {
      if (state.plan && state.page === 'result') drawMap(state.plan, state._mapFocusSeq || 0);
    }).catch(() => { });
    return [];
  }
  const out = [];
  areas.forEach(a => (a.hotels || []).forEach(h => {
    if (h._lat != null && h._lng != null) {
      out.push(Object.assign({}, h, {
        area: a.area,
        areaTier: a.tier,
        areaPrice: a.price,
        __id: (a.area || '') + '|' + h.name
      }));
    }
  }));
  return out;
}

/* ---------- 高德标准底图（JS API 2.0 · 联网加载 · 失败自动回退自绘示意地图） ----------
   合规说明：底图由高德官方服务提供（自带审图号），替换原来自绘的中国轮廓，
   解决「非标准地图」原则问题；离线 / Key 失效 / 加载失败时自动回退 SVG 示意图，地图不白屏。 */
const AMAP_CFG = {
  key: '4c0c91164e728517a8ffe9728523770a',
  sec: '744c6b5c545171cac879b59fda27f87e'
};
let _amapLoader = null;       // ensureAMap 单例 Promise（脚本只注入一次）
let amapBaseMode = 'auto';    // auto=优先高德底图（联网）；sketch=强制自绘示意图
let amapInst = null;          // 当前 AMap.Map 实例
let amapRefs = null;          // 当前底图覆盖物 { days:[{di,markers,line,off}], hotels:[], me:[] }
let amapCtx = null;           // 本次 drawMap 的地图数据（viewDays/pts/mapHotels/mapMe/mapLayers/dayIndexOf）

/** 按需加载高德 JS API（首次进结果页才注入，不影响首页秒开） */
function ensureAMap() {
  if (typeof AMap !== 'undefined') return Promise.resolve(true);
  if (!navigator.onLine) return Promise.resolve(false);
  if (_amapLoader) return _amapLoader;
  _amapLoader = new Promise(resolve => {
    let settled = false;
    const fin = ok => { if (!settled) { settled = true; resolve(ok); } };
    try { window._AMapSecurityConfig = { securityJsCode: AMAP_CFG.sec }; } catch (e) { }
    const sc = document.createElement('script');
    sc.src = 'https://webapi.amap.com/maps?v=2.0&key=' + AMAP_CFG.key;
    sc.onload = () => fin(typeof AMap !== 'undefined');
    sc.onerror = () => fin(false);
    setTimeout(() => fin(typeof AMap !== 'undefined'), 9000);
    document.head.appendChild(sc);
  });
  return _amapLoader;
}

let amapOverlays = [];        // 当前底图上的全部覆盖物（复用实例时统一清除）
/** 只清覆盖物、不销毁地图实例：销毁会触发高德内部统计回调访问已释放视图（getOptions 报错），复用则无此竞态 */
function clearAmapOverlays() {
  if (amapInst && amapOverlays.length) { try { amapInst.remove(amapOverlays); } catch (e) { } }
  amapOverlays = [];
  amapRefs = null;
}

/** 底图显隐：在 mapStage 上切 amap-on 类，同时更新提示文案 */
function showMapStage(amapOn) {
  const stage = $('mapStage');
  if (stage) stage.classList.toggle('amap-on', !!amapOn);
  const hint = $('mapHint');
  if (hint && state.page === 'result') {
    hint.textContent = amapOn ? '高德标准底图 · 底图联网加载' : '示意图底图 · 离线可用';
  }
}

/** WGS84（数据源口径）→ GCJ-02（高德口径） */
function amapConv(p) {
  if (typeof Navi !== 'undefined' && Navi.wgs84ToGcj02) {
    const g = Navi.wgs84ToGcj02(p.lng, p.lat);
    return [g.lng, g.lat];
  }
  return [p.lng, p.lat];
}

/** 在高德底图上画本次行程：每日编号点 + 虚线路线 + 酒店 + 我的位置 */
function renderAmapBase() {
  const box = $('amap');
  if (!box || typeof AMap === 'undefined' || !amapCtx) { showMapStage(false); return; }
  clearAmapOverlays();
  /* 关键顺序：先把容器显示出来再建图——隐藏容器建图会拿到 0 尺寸，
     setFitView 失效，表现为地图停在全国级视野、景点挤成一团 */
  showMapStage(true);
  const ctx = amapCtx;
  let map = amapInst;
  if (!map) {
    map = new AMap.Map('amap', { viewMode: '2D', zoom: 12, mapStyle: 'amap://styles/whitesmoke' });
    amapInst = map;
    AMap.plugin('AMap.Scale', () => {
      if (amapInst !== map) return;  // 理论上不再销毁，此处仅防御
      try { map.addControl(new AMap.Scale()); } catch (e) { }
    });
  }

  /* 每日路线 + 编号点 */
  const fitOverlays = [];
  const days = ctx.viewDays.map(day => {
    const di = ctx.dayIndexOf(day);
    const color = DAY_COLORS[di % DAY_COLORS.length];
    const tl = day.timeline;
    const markers = [];
    let line = null;
    if (tl.length) {
      const path = tl.map(t => amapConv(t.poi));
      path.forEach((pos, i) => {
        const m = new AMap.Marker({
          position: pos, anchor: 'bottom-center', zIndex: 120,
          content: `<div class="amap-pin" style="--pc:${color}"><span>${i + 1}</span></div>`
        });
        m.on('click', () => amapFocus(tl[i].poi.id));
        markers.push(m);
      });
      if (path.length > 1) {
        line = new AMap.Polyline({ path, strokeColor: color, strokeWeight: 3.2, strokeStyle: 'dashed', strokeOpacity: .72, bubble: true });
        fitOverlays.push(line);
      }
      fitOverlays.push(...markers);
    }
    return { di, markers, line, off: false };
  });

  /* 酒店层（点击 = 在高德搜这家店，与示意图行为一致） */
  const hotels = (ctx.mapHotels || []).map(h => {
    const m = new AMap.Marker({
      position: amapConv({ lng: h._lng, lat: h._lat }), anchor: 'bottom-center', zIndex: 100,
      content: `<div class="amap-hpin">🏨</div>`
    });
    m.on('click', () => {
      const city = (state.plan && state.plan.city && state.plan.city.name)
        || (state.plan && state.plan.trips && state.plan.trips[0] ? state.plan.trips[0].city.name : '') || '';
      window.open('https://uri.amap.com/search?keyword=' +
        encodeURIComponent(city + h.name) + '&city=' + encodeURIComponent(city) +
        '&src=qingtu&coordinate=gaode&callnative=1', '_blank', 'noopener');
    });
    return m;
  });

  /* 我的位置（城市级兜底时误差圈画大，别让人误以为很准） */
  const meOverlays = [];
  if (ctx.mapMe) {
    const pos = amapConv(ctx.mapMe);
    if (ctx.mapMe.accuracy) {
      meOverlays.push(new AMap.Circle({
        center: pos, radius: Math.max(200, Math.min(5000, ctx.mapMe.accuracy)),
        fillColor: '#3d7fd6', fillOpacity: .1, strokeWeight: 0, bubble: true
      }));
    }
    const dot = new AMap.CircleMarker({
      center: pos, radius: 7, fillColor: '#3d7fd6', fillOpacity: 1,
      strokeColor: '#fff', strokeWeight: 2.6, zIndex: 140
    });
    const label = new AMap.Marker({
      position: pos, anchor: 'bottom-center', zIndex: 141,
      offset: new AMap.Pixel(0, -12),
      content: `<div class="amap-melabel">我的位置</div>`
    });
    meOverlays.push(dot, label);
  }

  const allOverlays = days.flatMap(d => d.line ? [d.line] : []).concat(days.flatMap(d => d.markers)).concat(hotels).concat(meOverlays);
  map.add(allOverlays);
  amapOverlays = allOverlays;
  if (fitOverlays.length) map.setFitView(fitOverlays, false, [46, 46, 46, 46]);
  amapRefs = { days, hotels, me: meOverlays };
  showMapStage(true);
  applyLayersAmap();
}

/** 图层/图例显隐同步到高德底图（与 SVG 示意图共用同一组开关状态） */
function applyLayersAmap() {
  if (!amapInst || !amapRefs || !amapCtx) return;
  const L = amapCtx.mapLayers;
  amapRefs.days.forEach(d => {
    const on = L.poi && !d.off;
    try {
      if (d.line) { on ? d.line.show() : d.line.hide(); }
      d.markers.forEach(m => on ? m.show() : m.hide());
    } catch (e) { }
  });
  try {
    amapRefs.hotels.forEach(m => L.hotel ? m.show() : m.hide());
    amapRefs.me.forEach(o => L.me ? o.show() : o.hide());
  } catch (e) { }
}

/** 高德底图上聚焦某个景点：居中 + 自定义信息窗（含导航按钮），并同步站点清单高亮 */
function amapFocus(id) {
  if (!amapInst || !amapCtx) return;
  const hit = amapCtx.viewDays
    .flatMap(d => d.timeline.map(t => ({ poi: t.poi, di: amapCtx.dayIndexOf(d) })))
    .find(v => v.poi.id === id);
  if (!hit) return;
  const poi = hit.poi;
  const pos = amapConv(poi);
  amapInst.setCenter(pos);
  const iw = new AMap.InfoWindow({
    isCustom: true, anchor: 'bottom-center', offset: new AMap.Pixel(0, -20),
    content: `<div class="amap-iw"><b>${poi.name}</b><span>${poi.area}</span><button class="amap-nav">🧭 导航</button></div>`
  });
  iw.open(amapInst, pos);
  setTimeout(() => {
    const b = document.querySelector('#amap .amap-nav');
    if (b) b.onclick = e => { e.stopPropagation(); openNavi({ poi }); };
  }, 30);
}

/** drawMap 收尾钩子：按当前模式决定 高德底图 / 自绘示意图 */
function setupMapBase(plan) {
  bindMapBaseToggle();
  if (amapBaseMode === 'sketch' || !navigator.onLine) { clearAmapOverlays(); showMapStage(false); return; }
  ensureAMap().then(ok => {
    if (!ok || amapBaseMode === 'sketch') { clearAmapOverlays(); showMapStage(false); return; }
    /* 异步回来时若已切页 / 重画，放弃本次渲染（amapCtx 已被新一次 drawMap 覆盖） */
    if (!state.plan || state.plan !== plan || state.page !== 'result') return;
    renderAmapBase();
  });
}

/** 底图切换按钮：🗺️ 一键在 标准底图 / 示意图 之间切 */
function bindMapBaseToggle() {
  const btn = $('mapBaseToggle');
  if (!btn || btn._bound) return;
  btn._bound = true;
  btn.onclick = () => {
    amapBaseMode = amapBaseMode === 'sketch' ? 'auto' : 'sketch';
    toast(amapBaseMode === 'sketch' ? '已切回示意图底图（离线可用）' : '已切换为高德标准底图');
    if (state.plan && state.page === 'result') drawMap(state.plan, state._mapFocusSeq || 0);
  };
}

/* ---------- 地图 ---------- */
/**
 * @param {object} plan
 * @param {number} [focusTripSeq] 多城时只看第几座城的地图；不传 = 全部城市
 */
function drawMap(plan, focusTripSeq) {
  const svg = $('map');

  /* 多城：默认看第一座城（否则两城相距几百公里，点会挤成一粒芝麻）。
     用户可点 tab 切换；画布上只出现当前这座城的景点。 */
  const isMulti = !!(plan && plan.multi && plan.trips && plan.trips.length > 1);
  let focusCityKey = '';
  if (isMulti) {
    const seq = (focusTripSeq == null) ? 0 : focusTripSeq;
    const trip = plan.trips[seq] || plan.trips[0];
    focusCityKey = trip ? trip.cityKey : '';
    renderMapCityTabs(plan, focusCityKey);
    const tabs = $('mapCityTabs');
    if (tabs) tabs.style.display = '';
  } else {
    const tabs = $('mapCityTabs');
    if (tabs) { tabs.style.display = 'none'; tabs.innerHTML = ''; }
  }

  /* 当前视图要画的点：多城时只取 focusCityKey 这座城的 timeline */
  const viewDays = isMulti
    ? plan.days.filter(d => d.cityKey === focusCityKey)
    : plan.days;
  const dayIndexOf = d => plan.days.indexOf(d);

  /* 画布 800×540：H 从 460 加高 + PAD 从 74 收到 52，可用面积更大，
     配合下方封顶倍数 1.8→1.4，「远郊点 + 市区点」的行程里主聚集区能铺满画布，
     不再是中间一小簇 + 大片空白（用户反馈：地图整体偏小、放大镜也救不回布局）。 */
  const W = 800, H = 540, PAD = 52;
  const pts = viewDays.flatMap(d => d.timeline.map(t => t.poi));
  if (!pts.length) { svg.innerHTML = ''; clearAmapOverlays(); showMapStage(false); return; }

  /* ---- 额外图层的数据准备 ----
     酒店：只取本次行程涉及的城市住宿（片区下的每家门店）
     我的位置：优先真实定位，没有就退回出发城市中心 */
  const cityKey = isMulti
    ? focusCityKey
    : ((state.profile && state.profile.city) || state.lastCity || '');
  const mapHotels = hotStoresOf(cityKey);
  // 画在自己地图上用 WGS84（与景点数据同口径），避免 500m 系统性偏移
  const mapMe = myLocationForMap(currentMyLocation(plan));

  /* 投影范围要把「我的位置」也考虑进去，否则蓝点可能落在画布外 */
  const extra = [];
  if (mapMe) extra.push(mapMe);
  const lats = pts.map(p => p.lat).concat(extra.map(p => p.lat));
  const lngs = pts.map(p => p.lng).concat(extra.map(p => p.lng));
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const midLat = (minLat + maxLat) / 2;
  const kx = 111 * Math.cos(midLat * Math.PI / 180), ky = 111;

  /* ---------- 分位数跨度：别让一个远郊点毁掉整张图 ----------
   * 比如北京：市区 8 个点 + 60km 外的八达岭。按真实最大跨度投影，
   * 市区会挤成一粒芝麻。这里用 12%~88% 分位数圈出「主聚集区」，
   * 跨度封顶为主聚集区的 1.4 倍（最少 8km），远郊点投影后会越界，
   * 由 relaxPoints 的边界钳制收回画布边缘。
   * ⚠️ 分位必须 ≥0.12：点少时（n≤10）0.08 的 round 索引会取到
   * min/max（如北京 n=7 时八达岭直接成为下界），封顶失效，
   * 市区又挤回去——表现为比例尺 20km、点位缩成一坨。 */
  const qs = (arr, q) => {
    const a = [...arr].sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.max(0, Math.round(q * (a.length - 1))))];
  };
  const mainX = (qs(lngs, 0.88) - qs(lngs, 0.12)) * kx;
  const mainY = (qs(lats, 0.88) - qs(lats, 0.12)) * ky;
  /* 下限保护：只有 1 个点（如多城串联里只住 1 天的城 / 单城 1 日游）时，
     maxLng-minLng = 0 且 mainX = 0 → spanX = min(0, 8) = 0 → scale = Infinity → 全图 NaN。
     外层再 max(8) 兜底，单点时按 8km 视野画在正中央。 */
  const spanX = Math.max(8, Math.min((maxLng - minLng) * kx, Math.max(mainX * 1.4, 8)));
  const spanY = Math.max(6, Math.min((maxLat - minLat) * ky, Math.max(mainY * 1.4, 6)));
  const availW = W - PAD * 2, availH = H - PAD * 2 - 10;
  const scale = Math.min(availW / spanX, availH / spanY);
  /* 以中位数为中心投影：主聚集区落在画布中央，四周留白均匀 */
  const cLng = qs(lngs, 0.5), cLat = qs(lats, 0.5);
  const proj = p => [W / 2 + (p.lng - cLng) * kx * scale, H / 2 - (p.lat - cLat) * ky * scale];

  /* 存下投影参数，供「手动点选我的位置」做逆运算 */
  state._mapProj = { W, H, kx, ky, scale, cLng, cLat };

  /* 高德底图所需上下文（renderAmapBase / 图层开关共用） */
  amapCtx = { viewDays, pts, mapHotels, mapMe, mapLayers, dayIndexOf };

  /* 把所有点位投影后做一次疏散，圆点之间至少留出 MIN_GAP，
     同城的密集景点（什刹海 / 恭王府 / 南锣鼓巷这类）才不会叠成一坨。 */
  const MIN_GAP = 34;
  const placed = relaxPoints(pts.map(proj), MIN_GAP, [26, 26, W - 26, H - 26]);
  const at = new Map();
  pts.forEach((poi, i) => at.set(poi.id, placed[i]));
  const posOf = poi => at.get(poi.id) || proj(poi);

  let s = '';
  for (let gx = 0; gx <= 8; gx++) {
    const x = PAD / 2 + gx * (W - PAD) / 8;
    s += `<line x1="${x}" y1="20" x2="${x}" y2="${H - 20}" stroke="#eef0e8" stroke-width="1"/>`;
  }
  for (let gy = 0; gy <= 5; gy++) {
    const y = 20 + gy * (H - 40) / 5;
    s += `<line x1="${PAD / 2}" y1="${y}" x2="${W - PAD / 2}" y2="${y}" stroke="#eef0e8" stroke-width="1"/>`;
  }

  /* 每天一组（图例可点开关），标签独立成组（防碰撞） */
  const HALO = 'stroke="#fbfaf6" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round"';
  viewDays.forEach((day) => {
    const di = dayIndexOf(day);
    const color = DAY_COLORS[di % DAY_COLORS.length];
    const tl = day.timeline;
    if (!tl.length) return;
    const P = tl.map(t => posOf(t.poi));
    s += `<g class="map-day" data-d="${di}">`;
    if (P.length > 1) {
      let d = `M ${P[0][0]} ${P[0][1]}`;
      for (let i = 1; i < P.length; i++) {
        const [x0, y0] = P[i - 1], [x1, y1] = P[i];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        const dx = (x1 - x0) * 0.16, dy = (y1 - y0) * 0.16;
        d += ` Q ${mx - dy} ${my + dx} ${x1} ${y1}`;
      }
      s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="7 5" opacity=".62"/>`;
    }
    P.forEach(([x, y], i) => {
      const poi = tl[i].poi;
      /* 只画编号圆点，不画文字 —— 名字交给下面的「站点清单」列表，
         点位再密也不会有文字互相压住（编号小圆点本身就够小） */
      s += `<g class="m-pin" data-id="${poi.id}" data-d="${di}" data-n="${i + 1}" data-x="${x}" data-y="${y}">`;
      s += `<circle class="m-halo" cx="${x}" cy="${y}" r="17" fill="${color}" opacity=".14"/>`;
      s += `<circle class="m-dot" cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${color}" stroke-width="3" style="cursor:pointer"/>`;
      s += `<text class="m-num" x="${x}" y="${y + 4.2}" font-size="12.5" font-weight="700" fill="${color}" text-anchor="middle" pointer-events="none">${i + 1}</text>`;
      s += `</g>`;
    });
    s += `</g>`;
  });
  /* 聚焦标签层：同一时刻只显示一个站点的名字，天然不可能互相重叠 */
  s += `<g id="mapFocus"></g>`;

  /* ---- 酒店图层 ---- */
  const hotelPts = (mapHotels || []).map(h => {
    const [hx, hy] = proj({ lng: h._lng, lat: h._lat });
    return { h, x: hx, y: hy };
  });
  /* 酒店点位轻疏散：酒店多时互相叠、还压住景点编号；
     间距 18 比景点（34）小，尽量贴近真实相对位置，
     顺带把越界点钳回画布（scale 变大后远郊酒店会溢出）。 */
  {
    const hp = relaxPoints(hotelPts.map(p => [p.x, p.y]), 18, [22, 22, W - 22, H - 22]);
    hp.forEach((p, i) => { hotelPts[i].x = p[0]; hotelPts[i].y = p[1]; });
  }
  if (hotelPts.length) {
    s += `<g class="map-hotels"${mapLayers.hotel ? '' : ' style="display:none"'}>`;
    hotelPts.forEach(({ h, x, y }) => {
      s += `<g class="m-hotel" data-kind="hotel" data-id="h-${h.__id}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" style="cursor:pointer">`;
      s += `<circle class="m-halo" cx="${x}" cy="${y}" r="12" fill="#c98a3c" opacity=".16"/>`;
      s += `<rect class="m-dot" x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14" rx="4" fill="#fff" stroke="#c98a3c" stroke-width="2.4"/>`;
      s += `<text class="m-num" x="${x}" y="${(y + 3.4).toFixed(1)}" font-size="9" fill="#c98a3c" text-anchor="middle" pointer-events="none">🏨</text>`;
      s += `</g>`;
    });
    s += `</g>`;
  }

  /* ---- 我的位置图层 ---- */
  if (mapMe) {
    const [mx, my] = proj(mapMe);
    // 精度圈：城市级兜底会有 5km 误差，圈就画得明显大，别让人误以为很准
    const accR = mapMe.accuracy ? Math.max(10, Math.min(90, mapMe.accuracy * scale)) : 0;
    s += `<g class="map-me"${mapLayers.me ? '' : ' style="display:none"'} data-kind="me">`;
    if (accR > 12) s += `<circle cx="${mx}" cy="${my}" r="${accR.toFixed(1)}" fill="#3d7fd6" opacity=".1"/>`;
    s += `<circle class="me-pulse" cx="${mx}" cy="${my}" r="15" fill="#3d7fd6" opacity=".22"/>`;
    s += `<circle cx="${mx}" cy="${my}" r="7" fill="#3d7fd6" stroke="#fff" stroke-width="2.6"/>`;
    s += `<text x="${mx}" y="${my - 14}" font-size="10.5" font-weight="700" fill="#3d7fd6" text-anchor="middle" ${HALO} pointer-events="none">我的位置</text>`;
    s += `</g>`;
  }

  const barKm = niceScale(scale), barPx = barKm * scale;
  const bx = W - PAD / 2 - barPx, by = H - 22;
  s += `<line x1="${bx}" y1="${by}" x2="${bx + barPx}" y2="${by}" stroke="#9aa893" stroke-width="2"/>`;
  s += `<line x1="${bx}" y1="${by - 4}" x2="${bx}" y2="${by + 4}" stroke="#9aa893" stroke-width="2"/>`;
  s += `<line x1="${bx + barPx}" y1="${by - 4}" x2="${bx + barPx}" y2="${by + 4}" stroke="#9aa893" stroke-width="2"/>`;
  s += `<text x="${bx + barPx / 2}" y="${by - 7}" font-size="10" fill="#9aa893" text-anchor="middle">${barKm} km</text>`;

  svg.innerHTML = s;
  /* 图例可点：只看某一天 / 全部显示 */
  $('mapLegend').innerHTML = viewDays.map((d) => {
    const di = dayIndexOf(d);
    return `<span class="legend-item" data-d="${di}"><i class="legend-dot" style="background:${DAY_COLORS[di % DAY_COLORS.length]}"></i>第 ${di + 1} 天 · ${d.areas.join('/')}</span>`;
  }).join('');
  $('mapLegend').querySelectorAll('.legend-item').forEach(el => {
    el.onclick = () => {
      el.classList.toggle('off');
      const g = svg.querySelector(`.map-day[data-d="${el.dataset.d}"]`);
      if (g) g.classList.toggle('off', el.classList.contains('off'));
      /* 同步到高德底图上的当天显隐 */
      if (amapRefs) {
        const d = amapRefs.days.find(x => x.di === +el.dataset.d);
        if (d) { d.off = el.classList.contains('off'); applyLayersAmap(); }
      }
    };
  });

  /* ---- 图层开关：只切 display，不重绘地图 ---- */
  const lg = $('mapLayers');
  if (lg) {
    const CHIPS = [
      { k: 'poi', icon: '📍', label: '景点' },
      { k: 'hotel', icon: '🏨', label: '酒店' },
      { k: 'me', icon: '🧭', label: '我的位置' }
    ];
    lg.innerHTML = CHIPS.map(c =>
      `<button class="layer-chip${mapLayers[c.k] ? ' on' : ''}" data-layer="${c.k}">${c.icon} ${c.label}</button>`
    ).join('') + `<span class="layer-count" id="layerCount"></span>`;

    lg.querySelectorAll('.layer-chip').forEach(btn => {
      btn.onclick = () => {
        const k = btn.dataset.layer;
        mapLayers[k] = !mapLayers[k];
        btn.classList.toggle('on', mapLayers[k]);
        saveMapLayers();
        applyLayers();
      };
    });
    applyLayers();
  }

  /** 把图层显隐落到 DOM（不重绘） */
  function applyLayers() {
    const day = svg.querySelectorAll('.map-day');
    day.forEach(g => { g.style.display = mapLayers.poi ? '' : 'none'; });
    const hotels = svg.querySelector('.map-hotels');
    if (hotels) hotels.style.display = mapLayers.hotel ? '' : 'none';
    const meG = svg.querySelector('.map-me');
    if (meG) meG.style.display = mapLayers.me ? '' : 'none';

    const cnt = $('layerCount');
    if (cnt) {
      const parts = [];
      if (mapLayers.poi) parts.push(pts.length + ' 个景点');
      if (mapLayers.hotel && hotelPts.length) parts.push(hotelPts.length + ' 家酒店');
      cnt.textContent = parts.join(' · ');
    }
    applyLayersAmap();
  }
  /* ---- 站点清单：地图下方按天列出编号 + 名字，与图上圆点一一对应 ---- */
  $('mapStops').innerHTML = viewDays.map((day) => {
    const di = dayIndexOf(day);
    const color = DAY_COLORS[di % DAY_COLORS.length];
    return `<div class="ms-day" data-d="${di}">
      <div class="ms-head"><i class="ms-dot" style="background:${color}"></i>第 ${di + 1} 天</div>
      <div class="ms-row">${day.timeline.map((t, i) =>
      `<button class="ms-chip" data-id="${t.poi.id}" data-d="${di}" data-n="${i + 1}">
          <b>${i + 1}</b>${t.poi.name}
        </button>`).join('')}</div>
    </div>`;
  }).join('');

  /* 点圆点 / 点清单 / 点酒店 → 聚焦：图上高亮 + 只显示这一个名字 */
  const focus = id => {
    $('mapStops').querySelectorAll('.ms-chip.on').forEach(b => b.classList.remove('on'));
    /* 高德底图模式：信息窗口聚焦（SVG 上的高亮类不适用） */
    if (amapInst && amapRefs) {
      if (!id) return;
      const chip = $('mapStops').querySelector(`.ms-chip[data-id="${id}"]`);
      if (chip) chip.classList.add('on');
      amapFocus(id);
      return;
    }
    svg.querySelectorAll('.m-pin.on, .m-hotel.on').forEach(g => g.classList.remove('on'));
    const layer = svg.querySelector('#mapFocus');
    if (!layer) return;
    layer.innerHTML = '';
    if (!id) return;

    const HALO2 = 'stroke="#fbfaf6" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round"';

    /* ---- 酒店：文案换成店名 / 价格 / 评分，动作是「在高德搜这家」 ---- */
    if (String(id).startsWith('h-')) {
      const g = svg.querySelector(`.m-hotel[data-id="${id}"]`);
      if (!g) return;
      g.classList.add('on');
      const x = +g.dataset.x, y = +g.dataset.y;
      const h = mapHotels.find(v => 'h-' + v.__id === id);
      if (!h) return;
      const right = x > W * 0.62;
      const tx = right ? x - 15 : x + 15;
      const anchor = right ? 'end' : 'start';
      const nm = h.name.length > 9 ? h.name.slice(0, 9) + '…' : h.name;
      layer.innerHTML =
        `<text x="${tx}" y="${y - 4}" font-size="11.5" font-weight="700" fill="#a86b22" text-anchor="${anchor}" ${HALO2} pointer-events="none">${nm}</text>` +
        `<text x="${tx}" y="${y + 10}" font-size="9.5" fill="#9a9a93" text-anchor="${anchor}" ${HALO2} pointer-events="none">${h.price || ''}${h.rating ? ' · ' + h.rating + '分' : ''}</text>` +
        `<g class="map-hotelbtn" data-name="${encodeURIComponent(h.name)}" transform="translate(${x}, ${y + 25})" cursor="pointer">
           <rect x="-36" y="-11" width="72" height="22" rx="11" fill="#c98a3c" opacity=".95"/>
           <text x="0" y="4" font-size="10.5" fill="#fff" text-anchor="middle" pointer-events="none">🧭 搜这家</text>
         </g>`;
      const hb = layer.querySelector('.map-hotelbtn');
      if (hb) {
        hb.addEventListener('click', e => {
          e.stopPropagation();
          // 店名搜索比坐标更准（坐标是街区级估算）
          const nm = decodeURIComponent(hb.dataset.name);
          const city = (state.plan && state.plan.city && state.plan.city.name)
            || (state.plan && state.plan.trips && state.plan.trips[0] ? state.plan.trips[0].city.name : '')
            || '';
          window.open('https://uri.amap.com/search?keyword=' +
            encodeURIComponent(city + nm) + '&city=' + encodeURIComponent(city) +
            '&src=qingtu&coordinate=gaode&callnative=1', '_blank', 'noopener');
        });
      }
      return;
    }

    /* ---- 景点：原有逻辑 ---- */
    const pin = svg.querySelector(`.m-pin[data-id="${id}"]`);
    if (!pin) return;
    pin.classList.add('on');
    const chip = $('mapStops').querySelector(`.ms-chip[data-id="${id}"]`);
    if (chip) chip.classList.add('on');

    const x = +pin.dataset.x, y = +pin.dataset.y;
    const right = x > W * 0.62;
    const tx = right ? x - 15 : x + 15;
    const anchor = right ? 'end' : 'start';
    const poi = viewDays.flatMap(d => d.timeline).map(t => t.poi).find(p => p.id === id);
    if (!poi) return;
    const nm = poi.name.length > 10 ? poi.name.slice(0, 10) + '…' : poi.name;

    // 有定位就顺手标一句「离你多远」，方便判断先逛哪个
    let distTxt = '';
    if (mapLayers.me && mapMe) {
      const d = Geo.distanceM(mapMe.lat, mapMe.lng, poi.lat, poi.lng);
      distTxt = ` · 直线 ${Geo.fmtDistance(d)}`;
    }

    layer.innerHTML =
      `<text x="${tx}" y="${y - 4}" font-size="12" font-weight="700" fill="#3d5a40" text-anchor="${anchor}" ${HALO2} pointer-events="none">${nm}</text>` +
      `<text x="${tx}" y="${y + 11}" font-size="10" fill="#9a9a93" text-anchor="${anchor}" ${HALO2} pointer-events="none">${poi.area}${distTxt}</text>` +
      // 聚焦时给一个导航快捷键，省得再滚下去找那站的卡片
      `<g class="map-navbtn" data-nav="${poi.id}" transform="translate(${x}, ${y + 26})" cursor="pointer">
         <rect x="-33" y="-11" width="66" height="22" rx="11" fill="#3d5a40" opacity=".94"/>
         <text x="0" y="4" font-size="10.5" fill="#fff" text-anchor="middle" pointer-events="none">🧭 导航</text>
       </g>`;

    const nb = layer.querySelector('.map-navbtn');
    if (nb) {
      nb.addEventListener('click', e => {
        e.stopPropagation();
        openNavi({ poi });
      });
    }
  };

  svg.querySelectorAll('.m-pin').forEach(pin => {
    pin.addEventListener('click', e => {
      e.stopPropagation();
      focus(pin.classList.contains('on') ? null : pin.dataset.id);
    });
  });
  svg.querySelectorAll('.m-hotel').forEach(g => {
    g.addEventListener('click', e => {
      e.stopPropagation();
      focus(g.classList.contains('on') ? null : g.dataset.id);
    });
  });
  $('mapStops').querySelectorAll('.ms-chip').forEach(b => {
    b.onclick = () => focus(b.classList.contains('on') ? null : b.dataset.id);
  });
  mapFocusHandler = focus;

  // 复位视图并启用交互（缩放 / 平移 / 保存）
  mapBase = { x: 0, y: 0, w: W, h: H };
  mapView = { ...mapBase };
  applyMapView();
  bindMapGestures();

  /* 底图模式落位：联网优先高德标准底图，失败自动回退自绘示意图 */
  setupMapBase(plan);
}

/* 多城地图切城 tab：点一下就重画那座城 */
function renderMapCityTabs(plan, activeKey) {
  const box = $('mapCityTabs');
  if (!box) return;
  box.innerHTML = plan.trips.map((t, i) => {
    const v = cityVisual(t.cityKey);
    const on = t.cityKey === activeKey ? ' on' : '';
    return `<button class="map-city-tab${on}" data-key="${t.cityKey}" data-seq="${i}">${v.emoji} ${t.city.name}</button>`;
  }).join('');
  box.querySelectorAll('.map-city-tab').forEach(btn => {
    btn.onclick = () => {
      const seq = +btn.dataset.seq;
      state._mapFocusSeq = seq;
      if (state.plan) drawMap(state.plan, seq);
      const hint = $('mapHint');
      if (hint && state.plan) {
        const t = state.plan.trips[seq];
        if (t) hint.textContent = `${t.city.name} · 当前只看这座城`;
      }
    };
  });
}

/* 当前地图聚焦函数（供缩放后重绘聚焦标签用） */
let mapFocusHandler = null;

/* ============================================================
 *  「我的位置」定位
 *
 *  三级降级（与用户确认的方案一致）：
 *    1) GPS 高精度成功      → 蓝点 + 精度圈，并把「离你多远」标到景点上
 *    2) 拒绝 / 超时 / 失败  → 提示可手动在地图上点一下（手选兜底）
 *    3) 浏览器不支持        → 用出发城市中心兜底（城市级，图上圈会画大）
 * ============================================================ */
let mapManualMode = false;   // 是否处于「手动点选位置」模式

function bindLocateButton() {
  const btn = $('mapLocate');
  if (!btn) return;
  let pressTimer = null;
  let longPressed = false;

  /* 单击 = 重新定位一次；长按（或右键）= 打开定位面板
     （面板里有「持续跟随」开关和「按地址精确指定」） */
  btn.onclick = () => {
    if (longPressed) { longPressed = false; return; }
    if (geoWatchStop) { stopGeoWatch(true); return; }  // 跟随时再点 = 停止跟随
    doLocate(true);
  };
  const startPress = () => {
    longPressed = false;
    pressTimer = setTimeout(() => { longPressed = true; openLocatePanel(); }, 550);
  };
  const endPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
  btn.addEventListener('pointerdown', startPress);
  btn.addEventListener('pointerup', endPress);
  btn.addEventListener('pointerleave', endPress);
  btn.addEventListener('contextmenu', e => { e.preventDefault(); openLocatePanel(); });
}

/** 定位面板：持续跟随 + 按地址精确指定 */
function openLocatePanel() {
  if (typeof Geo === 'undefined') { toast('定位模块未加载'); return; }
  const me = Geo.readGeoCache();
  const following = !!geoWatchStop;

  const mask = el('div', 'picker-mask');
  mask.id = 'locMask';
  mask.innerHTML = `<div class="picker-sheet loc-sheet">
    <div class="picker-head">
      <span class="picker-title">📍 我的位置</span>
      <button class="picker-close" data-close="1">✕</button>
    </div>
    <div class="loc-cur" id="locCur"></div>

    <div class="loc-sec">
      <div class="loc-sec-title">① 持续跟随（走动时实时更新）</div>
      <button class="loc-follow ${following ? 'on' : ''}" id="locFollow">
        ${following ? '⏸ 停止跟随' : '▶ 开始跟随我的位置'}
      </button>
      <div class="loc-note" id="locFollowNote">开启后地图上的「我」会随你移动；费电，不用时记得关。</div>
    </div>

    <div class="loc-sec">
      <div class="loc-sec-title">② 按地址精确指定</div>
      <div class="loc-row">
        <input class="loc-input" id="locAddr" type="text" placeholder="输入地名，如「南昌滕王阁」" />
        <button class="loc-mini" id="locAddrGo">在高德中找</button>
      </div>
      <div class="loc-note">在高德里找到确切位置后，长按地图上的红点复制坐标，粘贴到下面。</div>
      <div class="loc-row">
        <input class="loc-input" id="locLL" type="text" placeholder="粘贴坐标，如 115.891,28.682" />
        <button class="loc-mini" id="locLLGo">填入</button>
      </div>
      <div class="loc-note" id="locLLNote">经度在前或纬度在前都认得，自动判断。</div>
    </div>

    <button class="loc-reset" id="locReset">清除我的位置</button>
  </div>`;
  document.body.appendChild(mask);

  const paintCur = () => {
    const c = Geo.readGeoCache();
    const box = $('locCur');
    if (!box) return;
    if (!c) { box.innerHTML = '<span class="loc-none">还没有设置位置</span>'; return; }
    const srcMap = { gps: 'GPS 精确定位', manual: '手动指定', city: '城市中心（粗略）' };
    box.innerHTML =
      `<span class="loc-badge ${c.source}">${srcMap[c.source] || c.source}</span>` +
      `<span class="loc-coord">${c.lng.toFixed(5)}, ${c.lat.toFixed(5)}</span>` +
      (c.accuracy ? `<span class="loc-acc">±${c.accuracy}m</span>` : '') +
      (geoWatchStop ? `<span class="loc-live">● 跟随中 · 已更新 ${geoWatchCount} 次</span>` : '');
  };
  paintCur();

  /* ---- ① 跟随开关 ---- */
  $('locFollow').onclick = () => {
    if (geoWatchStop) { stopGeoWatch(true); closePanel(); return; }
    startGeoWatch();
    // 不关面板，让用户看到坐标/精度在跳
    $('locFollow').classList.add('on');
    $('locFollow').textContent = '⏸ 停止跟随';
    $('locFollowNote').textContent = '跟随中……位置有变化时会自动更新。';
    paintCur();
  };

  /* ---- ② 按地址：跳高德搜索 ---- */
  $('locAddrGo').onclick = () => {
    const kw = ($('locAddr').value || '').trim();
    if (!kw) { toast('先输入一个地名'); return; }
    const city = (state.plan && state.plan.city && state.plan.city.name)
      || (state.plan && state.plan.trips && state.plan.trips[0] ? state.plan.trips[0].city.name : '')
      || '';
    const u = Geo.amapSearchUrl(kw, city);
    const w = window.open(u, '_blank', 'noopener');
    if (!w) toast('弹窗被拦截了，请允许本站弹窗');
    else toast('在高德里找到位置后，复制坐标粘贴到下面');
  };

  /* ---- ② 填坐标 ---- */
  $('locLLGo').onclick = () => {
    const txt = ($('locLL').value || '').trim();
    const ll = Geo.parseLatLng(txt);
    if (!ll) {
      $('locLLNote').innerHTML = '<span class="loc-err">没认出坐标，格式像「115.891,28.682」</span>';
      return;
    }
    // 高德里复制出来的坐标是 GCJ-02，直接落库，不再二次转换
    myLocCache = Geo.setGcjLocation(ll.lat, ll.lng, '地址指定', 120);
    mapLayers.me = true; saveMapLayers();
    if (state.plan) drawMap(state.plan, state._mapFocusSeq || 0);
    $('locLLNote').innerHTML = `<span class="loc-ok">已设为 ${ll.lng.toFixed(5)}, ${ll.lat.toFixed(5)}（经度, 纬度）</span>`;
    paintCur();
    toast('位置已更新');
  };

  $('locReset').onclick = () => {
    Geo.clearGeoCache();
    myLocCache = null;
    stopGeoWatch(false);
    if (state.plan) drawMap(state.plan, state._mapFocusSeq || 0);
    paintCur();
    toast('已清除我的位置');
  };

  const closePanel = () => { if (mask.parentNode) mask.remove(); };
  mask.addEventListener('click', e => {
    if (e.target === mask || (e.target.closest && e.target.closest('[data-close]'))) closePanel();
  });
}

/** 开始持续跟随 */
function startGeoWatch() {
  if (typeof Geo === 'undefined' || !Geo.watch) { toast('定位模块不支持跟随'); return; }
  if (geoWatchStop) return;
  geoWatchCount = 0;
  geoWatchStop = Geo.watch(
    loc => {
      myLocCache = loc;
      geoWatchCount++;
      mapLayers.me = true; saveMapLayers();
      if (state.plan) drawMap(state.plan, state._mapFocusSeq || 0);
      const hint = $('mapHint');
      if (hint) hint.textContent = `跟随中 · 精度 ±${loc.accuracy || '?'}m · 已更新 ${geoWatchCount} 次`;
    },
    err => {
      stopGeoWatch(false);
      handleLocateFail(err);
    }
  );
  const btn = $('mapLocate');
  if (btn) { btn.textContent = '🛰'; btn.classList.add('watching'); }
  toast('已开始跟随你的位置');
}

/** 停止跟随 */
function stopGeoWatch(showToast) {
  if (geoWatchStop) { geoWatchStop(); geoWatchStop = null; }
  const btn = $('mapLocate');
  if (btn) { btn.textContent = '📍'; btn.classList.remove('watching'); }
  if (showToast) toast('已停止跟随');
}

/**
 * 执行定位
 * @param {boolean} userAction 是否用户主动点击（决定失败时是否弹提示）
 */
function doLocate(userAction) {
  if (typeof Geo === 'undefined') { toast('定位模块未加载'); return; }

  const btn = $('mapLocate');
  if (btn) { btn.classList.add('busy'); btn.textContent = '⏳'; }

  const restore = () => {
    if (btn) { btn.classList.remove('busy'); btn.textContent = '📍'; }
  };

  if (userAction) Geo.clearGeoCache();   // 主动点 = 想重新定一次

  /* locateBest：连采 3 次取最准的一次。
     GPS 冷启动第一枪精度常有 500~2000m，等一两秒锁星后能跳到 20~50m，
     只取一次容易把人"定"到两条街外 —— 这是「我的位置要精准」的关键。 */
  const job = (Geo.locateBest ? Geo.locateBest({ tries: 3, good: 60 }) : Geo.locate({ force: userAction }));
  job.then(loc => {
    myLocCache = loc;
    mapLayers.me = true; saveMapLayers();
    if (state.plan) drawMap(state.plan, state._mapFocusSeq || 0);
    restore();
    const acc = loc.accuracy || 0;
    /* 精度回显：好（≤60m）轻描淡写；差（>500m）明确预警并给出口 */
    if (loc.source === 'gps' || loc.source === 'manual') {
      if (acc && acc > 500) {
        toast(`定位偏差较大（约 ±${Math.round(acc / 10) * 10}m）— 可到窗边/空旷处重试，或长按 📍 手动指定`);
      } else if (acc && acc > 60) {
        toast(`已定位（±${Math.round(acc)}m）`);
      } else {
        toast(acc ? `已定位（±${Math.round(acc)}m）` : '已定位');
      }
    } else {
      toast('已更新位置');
    }
    const hint = $('mapHint');
    if (hint && acc) hint.textContent = `已定位 · 精度 ±${acc >= 1000 ? (acc / 1000).toFixed(1) + 'km' : Math.round(acc) + 'm'}`;
  }).catch(err => {
    restore();
    handleLocateFail(err);
  });
}

/**
 * 把整个行程的所有点位一次性在高德地图上标星
 *
 * 与导航面板里的「标星」区别：
 *   面板里标的是「当前这一个动作涉及的点」（某个景点 / 某一天 / 跨城两点）；
 *   这里标的是「整趟行程的全部点」——用户想在高德上看自己这一趟都去哪。
 * 顺带把「我的位置」也带上，做成一张"我 + 全部目的地"的总览图。
 */
function starWholeTrip() {
  if (typeof Navi === 'undefined') { toast('导航模块未加载'); return; }
  const plan = state.plan;
  if (!plan || !plan.days) { toast('还没有行程可以标星'); return; }

  /* 收集全部点位，按 id 去重（跨天可能重复出现同一个点） */
  const seen = Object.create(null);
  const pts = [];
  plan.days.forEach(d => (d.timeline || []).forEach(t => {
    const poi = t.poi;
    if (!poi || !poi.id || seen[poi.id]) return;
    seen[poi.id] = 1;
    pts.push({ name: poi.name, lng: poi.lng, lat: poi.lat });
  }));

  if (!pts.length) { toast('这个行程没有可标星的点位'); return; }

  const me = (typeof Geo !== 'undefined') ? Geo.readGeoCache() : null;
  /* 多城时高德的 city 参数用第一座城（它只是搜索范围提示，不影响标星本身） */
  const city = plan.city ? plan.city.name
    : (plan.trips && plan.trips[0] ? plan.trips[0].city.name : '');
  const st = Navi.starUrlWithMe(me, pts, { city });

  if (!st.urls.length) { toast('标星链接生成失败'); return; }

  let blocked = 0;
  st.urls.forEach((u, i) => {
    setTimeout(() => {
      const w = window.open(u, '_blank', 'noopener');
      if (!w) blocked++;
      if (i === st.urls.length - 1) {
        if (blocked) toast('有窗口被拦截了，请允许本站弹窗后重试');
        else if (st.chunks > 1) toast(`全程 ${st.total} 个点，已分 ${st.chunks} 段打开高德`);
        else toast(`已在 高德中打开，${st.total} 个点都会显示成图钉 ⭐`);
      }
    }, i * 420);
  });
}

/** 定位失败的处理：给出可操作的下一步，而不是干瞪眼 */
function handleLocateFail(err) {
  const code = err && err.code;

  // 浏览器根本不支持（多半是 http 页面）
  if (code === 'unsupported') {
    const home = Store.getHome();
    const fb = home ? Geo.cityFallback(home) : null;
    if (fb) {
      myLocCache = fb;
      mapLayers.me = true; saveMapLayers();
      if (state.plan) drawMap(state.plan, state._mapFocusSeq || 0);
      toast(`当前环境不支持精确定位，已按「${fb.label}」标注`);
    } else {
      toast('当前环境不支持定位，可先设一个出发城市');
    }
    return;
  }

  // 被拒绝 / 超时 / 拿不到 → 引导手动点选
  const msg = code === 'denied'
    ? '定位权限被拒绝，点一下地图就能手动标位置'
    : code === 'timeout'
      ? '定位超时了，也可以直接点地图手选位置'
      : '没能拿到你的位置，点地图手动标一个吧';
  toast(msg);
  enterManualLocate();
}

/** 进入「手动点选位置」模式：点地图任意处 = 我的位置 */
function enterManualLocate() {
  const svg = $('map');
  if (!svg) return;
  mapManualMode = true;
  svg.style.cursor = 'crosshair';
  const hint = $('mapHint');
  const old = hint ? hint.textContent : '';
  if (hint) hint.textContent = '点地图任意位置设为「我的位置」';

  const once = e => {
    if (!mapManualMode) return;
    e.stopPropagation();
    const pt = svgPointFromEvent(svg, e);
    const wgs = unproject(pt[0], pt[1]);
    if (!wgs) return;
    myLocCache = Geo.setManualLocation(wgs.lat, wgs.lng, '手动选择的位置');
    mapLayers.me = true; saveMapLayers();
    exitManualLocate();
    if (state.plan) drawMap(state.plan, state._mapFocusSeq || 0);
    toast('已把这里设为「我的位置」');
  };

  svg.addEventListener('click', once, { once: true });
  mapManualCleanup = () => {
    svg.removeEventListener('click', once);
    if (hint) hint.textContent = old;
  };
}
let mapManualCleanup = null;

function exitManualLocate() {
  mapManualMode = false;
  const svg = $('map');
  if (svg) svg.style.cursor = '';
  if (mapManualCleanup) { mapManualCleanup(); mapManualCleanup = null; }
}

/* ---------- 屏幕坐标 ←→ 地理坐标（手动点选 / 定位联动都要用） ---------- */

/** 把鼠标事件换算成 SVG 的 viewBox 坐标 */
function svgPointFromEvent(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
  // 再叠加当前的缩放/平移视图
  const v = mapView || { x: 0, y: 0, w: 800, h: 540 };
  return [v.x + loc.x * (v.w / 800), v.y + loc.y * (v.h / 460)];
}

/** viewBox 坐标 → WGS84 经纬度（drawMap 里 proj 的逆运算） */
function unproject(x, y) {
  const m = state._mapProj;
  if (!m) return null;
  const { W, H, kx, ky, scale, cLng, cLat } = m;
  return {
    lng: (x - W / 2) / (kx * scale) + cLng,
    lat: cLat - (y - H / 2) / (ky * scale)
  };
}

/* ---------- 地图交互：矢量缩放 / 平移 / 导出图片 ---------- */
let mapBase = { x: 0, y: 0, w: 800, h: 540 };
let mapView = { ...mapBase };
let mapGesturesBound = false;

function applyMapView() {
  const svg = $('map');
  if (!svg) return;
  svg.setAttribute('viewBox', `${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`);
  scheduleLayout();
}

/* ---------- 标签实测尺寸 ----------
 * 中文字宽差异大，估算框必然有偏差；这里用 getBBox() 实测每个标签的
 * 真实包围盒，回填 data-w / data-h，之后排版即与渲染像素级一致。 */
function measureLabels() {
  const svg = $('map'), legend = $('mapLegend');
  if (!svg) return;
  const hide = legend && legend.offsetParent !== null;
  if (hide) legend.style.display = 'none';
  svg.querySelectorAll('.map-lbl').forEach(g => {
    g.style.opacity = ''; g.style.transform = '';
  });
  svg.querySelectorAll('.map-lbl').forEach(g => {
    let b;
    try { b = g.getBBox(); } catch (e) { return; }
    if (!b.width) return;
    g.dataset.w = b.width; g.dataset.h = b.height;
  });
  if (hide) legend.style.display = '';
}

/* 缩放 / 平移 / 窗口尺寸变化 → 重新排版（rAF 合并，避免连发） */
let layoutRaf = 0;
function scheduleLayout() {
  if (layoutRaf) return;
  layoutRaf = requestAnimationFrame(() => { layoutRaf = 0; layoutLabels(); });
}

/* ---------- 标签防碰撞 ----------
 * 屏幕空间贪心：坐标全用「屏幕 px」推导，保证判定与实际渲染一致。
 * 每个标签有 7 档上下避让位（0/±20/±40/±60），放不下就隐藏。
 * ⚠️ 不能给标签加 CSS transition —— 会建立 containing block，
 *    translate 的参照系会变成标签自身包围盒，避让全部错位。
 * 点圆点可钉住标签（pinned 永远显示，且优先占位）。
 * 缩放后自动重排：放大 → 点距拉开 → 更多标签放得下。 */
function layoutLabels() {
  const svg = $('map');
  if (!svg) return;
  const lbls = [...svg.querySelectorAll('.map-lbl')];
  if (!lbls.length) return;
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const kx = r.width / mapView.w, ky = r.height / mapView.h;
  /* 1 个 SVG 用户单位 = 多少屏幕 px。viewBox 宽高比固定 ⇒ kx === ky，
     统一取 kx，避免再引入一个会算错的常量。 */
  const ow = kx;
  const GAP = 1.5;                    // 判定留 1.5px 余量

  /* 钉住的标签优先占位，且以自身真实包围盒为准（此时无 translate） */
  const rects = [];
  const pinned = [];
  lbls.forEach(g => {
    if (!g.classList.contains('pinned')) return;
    g.style.transform = ''; g.style.opacity = 1;
    const b = g.getBBox();
    rects.push({ x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height });
    pinned.push(g);
  });

  lbls.forEach(g => {
    if (pinned.includes(g)) return;
    const tx = (+g.dataset.tx - mapView.x) * kx;         // 锚点（屏幕 px）
    const ty = (+g.dataset.ty - mapView.y) * ky;
    const right = g.dataset.right === '1';
    const w = +g.dataset.w * ow, h = +g.dataset.h * ow;
    const gx = right ? -ow * 4 : ow * 4;                 // 锚点与文字间的横向留白
    const bx = right ? tx + gx - w : tx + gx;
    let placed = false;
    for (const dy of [0, 20, -20, 40, -40, 60, -60]) {
      const rc = { x1: bx - GAP, y1: ty + dy - GAP, x2: bx + w + GAP, y2: ty + dy + h + GAP };
      if (!rects.some(o => !(rc.x2 < o.x1 || rc.x1 > o.x2 || rc.y2 < o.y1 || rc.y1 > o.y2))) {
        rects.push(rc);
        g.style.transform = dy ? `translate(0 ${dy * mapView.h / r.height})` : '';
        g.style.opacity = 1;
        placed = true;
        break;
      }
    }
    if (!placed) g.style.opacity = 0;
  });
}

/* 以画布坐标 (px,py) 为锚点按 factor 缩放（<1 放大，>1 缩小） */
function zoomMap(factor, px, py) {
  const w0 = mapView.w, h0 = mapView.h;
  let w = Math.max(mapBase.w / 8, Math.min(mapBase.w * 1.6, w0 * factor));
  const k = w / w0;
  const h = h0 * k;
  if (px == null) { px = mapView.x + w0 / 2; py = mapView.y + h0 / 2; }
  mapView.x = px - (px - mapView.x) * k;
  mapView.y = py - (py - mapView.y) * k;
  mapView.w = w; mapView.h = h;
  // 限制平移范围，别把地图拖出视野
  mapView.x = Math.max(mapBase.x - mapBase.w * 0.3, Math.min(mapBase.x + mapBase.w * 1.3 - w, mapView.x));
  mapView.y = Math.max(mapBase.y - mapBase.h * 0.3, Math.min(mapBase.y + mapBase.h * 1.3 - h, mapView.y));
  applyMapView();
}
/* 屏幕坐标 → SVG viewBox 坐标 */
function screenToView(clientX, clientY) {
  const svg = $('map');
  const r = svg.getBoundingClientRect();
  const sx = mapView.x + (clientX - r.left) / r.width * mapView.w;
  const sy = mapView.y + (clientY - r.top) / r.height * mapView.h;
  return { x: sx, y: sy };
}

function bindMapGestures() {
  const stage = $('mapStage');
  if (!stage) return;
  const svg = $('map');

  // 按钮
  $('mapZoomIn').onclick = () => zoomMap(0.75);
  $('mapZoomOut').onclick = () => zoomMap(1 / 0.75);
  $('mapReset').onclick = () => { mapView = { ...mapBase }; applyMapView(); };
  $('mapSave').onclick = saveMapImage;
  $('mapStar').onclick = starWholeTrip;   // ⭐ 在高德上标出全程点位
  bindLocateButton();          // 📍 定位到我

  // 切换城市/重绘时退出手动点选态，避免光标与提示残留
  exitManualLocate();

  if (mapGesturesBound) return;
  mapGesturesBound = true;

  // 手势起点是否落在地图区域内。不这样做的话，监听绑在 #stage 上会接管整页触摸，
  // 单指上下滑被 preventDefault 掉，导致「整个页面滑不动、只能点」。
  let startedInMap = false;

  // 滚轮缩放（仅鼠标悬停在地图上时生效，避免抢走页面滚动）
  stage.addEventListener('wheel', e => {
    if (!e.target.closest || !e.target.closest('.map-stage')) return;
    e.preventDefault();
    const a = screenToView(e.clientX, e.clientY);
    zoomMap(e.deltaY > 0 ? 1.12 : 1 / 1.12, a.x, a.y);
  }, { passive: false });

  // 双指捏合 + 单指横向拖拽（移动端）；竖向滑动一律交还页面滚动
  let lastDist = 0, lastMid = null, dragging = false, startV = null, startPt = null, lockAxis = '';
  const dist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  const mid = (t1, t2) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

  stage.addEventListener('touchstart', e => {
    startedInMap = !!(e.target.closest && e.target.closest('.map-stage'));
    lockAxis = '';
    if (e.touches.length === 2) {
      dragging = false;
      if (!startedInMap) { lastDist = 0; return; }
      lastDist = dist(e.touches[0], e.touches[1]); lastMid = mid(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      lastDist = 0;
      dragging = startedInMap;      // 只有从地图上按下才进入拖拽，其余一律不拦截
      if (dragging) { startV = { ...mapView }; startPt = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    }
  }, { passive: true });

  stage.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && lastDist && startedInMap) {
      e.preventDefault();
      const d = dist(e.touches[0], e.touches[1]);
      const m = mid(e.touches[0], e.touches[1]);
      const a = screenToView(m.x, m.y);
      zoomMap(lastDist / d, a.x, a.y);   // 两指张开 d 变大 → factor<1 → 放大
      lastDist = d; lastMid = m;
      return;
    }
    if (!dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startPt.x, dy = e.touches[0].clientY - startPt.y;
    // 先判定主方向：竖向拖动直接放弃，把滚动交还浏览器
    if (!lockAxis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      lockAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (lockAxis === 'y') { dragging = false; return; }
    }
    if (lockAxis !== 'x') return;
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;   // 地图不可见时忽略，避免除零把 viewBox 写成 Infinity
    const kx = mapView.w / r.width, ky = mapView.h / r.height;
    mapView.x = startV.x - dx * kx;
    mapView.y = startV.y - dy * ky;
    applyMapView();
  }, { passive: false });

  stage.addEventListener('touchend', () => { dragging = false; lastDist = 0; lastMid = null; lockAxis = ''; }, { passive: true });

  /* 手机壳宽度变化 / 旋转屏幕 → 屏幕像素换算变了，重排一次 */
  if (window.ResizeObserver) {
    new ResizeObserver(() => scheduleLayout()).observe(svg);
  } else {
    window.addEventListener('resize', scheduleLayout);
  }
}

/* 把当前 SVG 地图导出为 PNG（无需服务器，纯 canvas 光栅化） */
function saveMapImage() {
  const svg = $('map');
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', 1600);
  clone.setAttribute('height', 920);
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', mapView.x); bg.setAttribute('y', mapView.y);
  bg.setAttribute('width', mapView.w); bg.setAttribute('height', mapView.h);
  bg.setAttribute('fill', '#fbfaf6');
  clone.insertBefore(bg, clone.firstChild);
  const data = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 1600; cv.height = 920;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, 1600, 920);
    ctx.drawImage(img, 0, 0, 1600, 920);
    cv.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const nm = (state.plan
        ? (state.plan.city ? state.plan.city.name
          : (state.plan.trips && state.plan.trips.length > 1
            ? state.plan.trips.map(t => t.city.name).join('-')
            : (state.plan.trips && state.plan.trips[0] ? state.plan.trips[0].city.name : '')))
        : '路线') + '-路线地图.png';
      a.download = nm;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast('地图已保存为图片');
    }, 'image/png');
  };
  img.onerror = () => toast('保存失败，可长按地图截屏');
  img.src = url;
}

function niceScale(scale) {
  const targetKm = 110 / scale;
  return [0.5, 1, 2, 3, 5, 10, 20, 50, 100].find(c => c >= targetKm) || 200;
}

/* ============================================================
 *  页面 5 · mine —— 个人中心
 * ============================================================ */
function renderMine() {
  const foot = Store.getVisits();
  const footCities = Object.keys(foot);
  const favs = Store.listFavs(), hist = Store.listHistory();

  $('mineStats').innerHTML = [
    ['收藏', favs.length, '条'],
    ['记录', hist.length, '条'],
    ['足迹', footCities.length, '/' + Object.keys(POI_DB).length, '城']
  ].map(([label, v, u]) =>
    `<div class="mine-stat"><b>${v}</b><span>${label}${u}</span></div>`).join('');

  $('footHint').textContent = footCities.length
    ? `去过 ${footCities.length} 座城 · 共 ${Object.keys(POI_DB).length} 座`
    : `还没点亮足迹 · 去过一座城时，在城市页点「我去过」打卡`;

  $('favList').innerHTML = favs.length
    ? favs.map(x => mineItemHTML(x, true)).join('')
    : `<div class="empty">还没有收藏 · 在路线详情页点右上角 ☆ 收藏</div>`;

  $('histList').innerHTML = hist.length
    ? hist.map(x => mineItemHTML(x, false)).join('')
    : `<div class="empty">还没有生成记录 · 去首页试试两种入口</div>`;

  /* 社区动态：所有人的反馈 + 宝藏地投稿 */
  const community = Store.listCommunity ? Store.listCommunity() : [];
  $('communityList').innerHTML = community.length
    ? community.slice(0, 30).map(c => communityItemHTML(c)).join('')
    : `<div class="empty">还没有社区动态 · 去结果页反馈或投稿宝藏地吧</div>`;

  bindMine();
  // 延迟初始化地图，确保容器尺寸已计算
  setTimeout(() => drawFootMap(footCities), 100);
  setTimeout(() => { if (_footMap) _footMap.invalidateSize(); }, 300);
}

/* 社区动态卡片 */
function communityItemHTML(c) {
  const d = new Date(c.time);
  const pad = n => (n < 10 ? '0' + n : '' + n);
  const timeStr = `${d.getMonth()+1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (c.type === 'feedback') {
    const f = c.data || {};
    const densityMap = { tight: '😅 太满', ok: '😊 刚好', loose: '😴 太空' };
    const stars = '★'.repeat(f.rating || 0) + '☆'.repeat(5 - (f.rating || 0));
    const photos = (f.photos || []).slice(0, 3).map(p => `<img src="${p}" class="cm-photo">`).join('');
    return `<div class="cm-card">
      <div class="cm-head"><span class="cm-tag">📝 路线反馈</span><span class="cm-time">${timeStr}</span></div>
      <div class="cm-body">
        <div class="cm-city">${f.city || ''} · ${f.days || ''}天 · ${densityMap[f.density] || ''} · ${stars}</div>
        ${f.text ? `<div class="cm-text">${f.text}</div>` : ''}
        ${photos ? `<div class="cm-photos">${photos}</div>` : ''}
      </div>
    </div>`;
  } else if (c.type === 'gem') {
    const g = c.data || {};
    const photos = (g.photos || []).slice(0, 3).map(p => `<img src="${p}" class="cm-photo">`).join('');
    return `<div class="cm-card">
      <div class="cm-head"><span class="cm-tag gem">💎 宝藏地投稿</span><span class="cm-time">${timeStr}</span></div>
      <div class="cm-body">
        <div class="cm-city">${g.city || ''} · ${g.name || ''}</div>
        ${g.reason ? `<div class="cm-text">${g.reason}</div>` : ''}
        ${photos ? `<div class="cm-photos">${photos}</div>` : ''}
      </div>
    </div>`;
  }
  return '';
}

function mineItemHTML(item, isFav) {
  const c = POI_DB[item.city] || { name: '未知' };
  const v = cityVisual(item.city);
  const d = new Date(item.time);
  const pad = n => (n < 10 ? '0' + n : '' + n);
  const dateStr = (d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  const modeLabel = item.mode === 'quick' ? '快速' : '深度';
  return `<div class="mine-item card" data-sid="${encodeURIComponent(item.sid)}">
    <div class="mi-ph" style="background:${v.bg}">${v.emoji}</div>
    <div class="mi-body">
      <div class="mi-title">${c.name} · ${item.days} 天</div>
      <div class="mi-sub">${item.personaName || ''} · <span class="mi-mode ${item.mode}">${modeLabel}</span></div>
      <div class="mi-time">${dateStr}</div>
    </div>
    <div class="mi-acts">
      <button class="mi-btn" data-act="review" data-sid="${encodeURIComponent(item.sid)}">回看</button>
      ${isFav ? `<button class="mi-btn danger" data-act="removeFav" data-sid="${encodeURIComponent(item.sid)}">取消</button>` : ''}
    </div>
  </div>`;
}

function bindMine() {
  $('favList').querySelectorAll('.mi-btn').forEach(b => {
    b.onclick = e => {
      const sid = decodeURIComponent(b.dataset.sid);
      if (b.dataset.act === 'review') reviewPlan(sid);
      else { Store.toggleFav({ sid }); renderMine(); toast('已取消收藏'); }
    };
  });
  $('histList').querySelectorAll('.mi-btn').forEach(b => {
    b.onclick = () => reviewPlan(decodeURIComponent(b.dataset.sid));
  });
}

/* 回看：按答案快照由引擎重算（同输入同输出）。
   ⚠️ 城市数据是按需异步分片：必须先等所有目的地的分片就绪再调引擎，
   否则住宿分片未到位 → 重算出的行程没有住宿卡（景点因懒加载 Proxy 不受影响，
   表现为「有景点、没酒店」）。 */
function reviewPlan(sid) {
  const item = Store.listFavs().concat(Store.listHistory()).find(x => x.sid === sid);
  if (!item || !item.answers) { toast('这条记录缺少答案，无法回看'); return; }
  const a = item.answers;
  const dests = (a.destinations && a.destinations.length)
    ? a.destinations.map(d => d.cityKey)
    : (a.city ? [a.city] : []);
  const ready = (typeof DataLoader !== 'undefined')
    ? Promise.all(dests.map(k => DataLoader.ensureCity(k)))
    : Promise.resolve();

  $('loading').hidden = false;
  ready.catch(() => { }).then(() => {
    const profile = buildProfile(a);
    const plan = planItinerary(profile);
    state.session = { profile, plan, mode: item.mode || 'deep', answers: a };
    state.profile = profile;
    state.plan = plan;
    $('loading').hidden = true;
    route('result');
    renderResult();
  });
}

/* 足迹点亮地图（简化示意轮廓，非标准地图） */
let _footMap = null;
function drawFootMap(lightCities) {
  const el = $('footmap');
  if (!el || typeof L === 'undefined') return;

  // 确保容器有尺寸
  el.style.height = '220px';
  el.style.width = '100%';

  // 已存在则销毁重建（避免重复初始化）
  if (_footMap) { _footMap.remove(); _footMap = null; }

  const lit = new Set(lightCities);
  const cities = Object.keys(POI_DB).map(k => ({ key: k, ...POI_DB[k] }));
  const litCities = cities.filter(c => lit.has(c.key));
  const otherCities = cities.filter(c => !lit.has(c.key));

  try {
    _footMap = L.map(el, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      zoomSnap: 0.5
    });
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: '1234',
      maxZoom: 18,
      attribution: '© 高德地图'
    }).addTo(_footMap);

    // 已点亮城市：绿色标记
    litCities.forEach(c => {
      const marker = L.circleMarker([c.center[0], c.center[1]], {
        radius: 8, color: '#fff', weight: 2, fillColor: '#3d6b47', fillOpacity: 0.9
      }).addTo(_footMap);
      marker.bindPopup(`<b>${c.name}</b><br>已点亮 ✓`);
    });

    // 未点亮城市：灰色小点
    otherCities.forEach(c => {
      L.circleMarker([c.center[0], c.center[1]], {
        radius: 3, color: '#ccc', weight: 1, fillColor: '#bbb', fillOpacity: 0.5
      }).addTo(_footMap);
    });

    // 视野适配：有点亮城市就聚焦它们，否则看全国
    if (litCities.length > 0) {
      const bounds = L.latLngBounds(litCities.map(c => [c.center[0], c.center[1]]));
      _footMap.fitBounds(bounds.pad(0.5));
    } else {
      _footMap.setView([35, 105], 4);
    }

    // 强制重绘（解决容器尺寸问题）
    setTimeout(() => { if (_footMap) _footMap.invalidateSize(); }, 200);
  } catch (e) {
    console.warn('足迹地图初始化失败', e);
  }
}

/* ============================================================
 *  工具
 * ============================================================ */
let toastTimer;
function toast(msg, dur) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), dur || 1900);
}

/* ============================================================
 *  事件绑定
 * ============================================================ */
function bindGlobal() {
  // 首页
  $('searchBtn').onclick = doSearch;
  const hb = $('homeBtn'); if (hb) hb.onclick = openHomePicker;
  const editBtn = $('homeEditBtn');
  if (editBtn) editBtn.onclick = openHomePicker;
  // 首页问候卡的位置文字：点一下也能改城市（定位不准时手动纠正）
  const greetLocEl = $('greetLoc');
  if (greetLocEl) greetLocEl.onclick = openHomePicker;
  $('searchInput').onkeydown = e => { if (e.key === 'Enter') doSearch(); };
  $('searchInput').oninput = searchSuggest;
  $('searchInput').onfocus = searchSuggest;
  $('searchInput').onblur = () => setTimeout(() => { const sg = $('searchSuggest'); if (sg) sg.hidden = true; }, 180);
  /* 人气城市：卡片点击进城市介绍页。
     横滑区里「划一下」和「点一下」会连在一起触发，所以记录按下的位移，
     拖超过 8px 视为滑动、不跳转，避免一划就误进详情页。 */
  bindHScroll($('hotScroll'), card => {
    if (card && card.dataset.city) route('city', { city: card.dataset.city });
  });
  // 城市介绍页里的点位卡：点一下展开/收起小贴士
  $('ciPois').addEventListener('click', e => {
    const p = e.target.closest('.ci-poi');
    if (p) p.classList.toggle('open');
  });
  document.querySelectorAll('[data-go]').forEach(n => {
    n.onclick = () => route(n.dataset.go);
  });

  // 问卷
  $('btnNext').onclick = () => {
    if (!stepValid()) return;
    if (state.step < QUESTIONS.length - 1) {
      state.step++; renderStep(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      generateAndGo(Object.assign({}, state.answers), 'deep');
    }
  };
  $('btnBack').onclick = () => { if (state.step > 0) { state.step--; renderStep(); } };

  // 快速规划
  $('quickGo').onclick = quickGo;
  $('quickUpgrade').onclick = () => route('question', { city: quickState.city, days: quickState.days });

  // 结果页
  $('favBtn').onclick = toggleFav;
  $('visitBtn').onclick = toggleVisitHere;
  $('resultBack').onclick = () => route('index');
  $('btnExport').onclick = async () => {
    /* 把 sid 挂到 plan 上，exportText 才能读到「已选定哪家酒店」 */
    if (state.plan && state.session && Store.sidOf) state.plan.__sid = Store.sidOf(state.session.answers);
    const txt = exportText(state.plan, state.profile);
    try { await navigator.clipboard.writeText(txt); toast('行程已复制到剪贴板'); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('行程已复制'); }
      catch (_) { toast('复制失败，请手动选择文本'); }
      ta.remove();
    }
  };
  $('btnRestart').onclick = () => route('question');
  $('btnPolish').onclick = () => openAIPolish();
  if ($('btnChat')) $('btnChat').onclick = () => route('chat');

  // 个人中心
  $('clearHistory').onclick = () => {
    if (!Store.listHistory().length) return;
    if (confirm('记录清空后不可恢复（收藏与足迹不受影响），确定吗？')) {
      Store.clearHistory(); renderMine();
    }
  };

  // 结果页「重新规划」返回入口
  window.addEventListener('hashchange', () => {
    const p = location.hash.replace('#', '');
    if (p && p !== state.page && PAGES.indexOf(p) >= 0) route(p);
  });
}

/* ============================================================
 *  AI 功能：讲解 / 润色 / 对话
 * ============================================================ */

/* AI 弹窗（共用：讲解 & 润色结果展示） */
function openAIModal(title, contentPromise) {
  let modal = document.getElementById('aiModal');
  if (!modal) {
    modal = el('div', 'ai-modal');
    modal.id = 'aiModal';
    modal.innerHTML = `
      <div class="ai-mask"></div>
      <div class="ai-dialog">
        <div class="ai-head">
          <span class="ai-title"></span>
          <button class="ai-close">✕</button>
        </div>
        <div class="ai-body"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.ai-mask').onclick = () => modal.classList.remove('show');
    modal.querySelector('.ai-close').onclick = () => modal.classList.remove('show');
  }
  modal.querySelector('.ai-title').textContent = title;
  const body = modal.querySelector('.ai-body');
  body.innerHTML = '<div class="ai-loading">🤖 AI 正在思考中…</div>';
  modal.classList.add('show');

  contentPromise.then(text => {
    body.innerHTML = renderMarkdown(text);
  }).catch(e => {
    body.innerHTML = `<div class="ai-error">⚠️ ${e.message || '出错了'}</div>`;
  });
}

/* 极简 Markdown 渲染（粗体 / 换行 / 列表） */
function renderMarkdown(text) {
  let html = String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');
  return html;
}

/* AI 景点讲解 */
function openAIExplain(poi) {
  if (typeof AI === 'undefined' || !AI.explainPOI) { toast('AI 模块未加载'); return; }
  openAIModal(`🤖 ${poi.name} · AI 讲解`, AI.explainPOI(poi, state.profile));
}

/* AI 行程润色 */
function openAIPolish() {
  if (typeof AI === 'undefined' || !AI.polishPlan) { toast('AI 模块未加载'); return; }
  openAIModal('✨ AI 行程润色', AI.polishPlan(state.plan, state.profile));
}

/* ---------- AI 对话页 ---------- */
let chatHistory = [];

function renderChat() {
  const box = $('chatMessages');
  if (!chatHistory.length) {
    chatHistory = [{ role: 'ai', content: '👋 你好！我是轻途 AI 助手。\n\n我可以帮你：\n• 🍜 推荐当地美食\n• 🛏 住宿建议\n• 🧭 交通指引\n• 🔄 行程调整\n• 🌤 天气提醒\n\n直接问我吧～' }];
  }
  box.innerHTML = chatHistory.map(m =>
    `<div class="chat-msg ${m.role}">${renderMarkdown(m.content)}</div>`
  ).join('');
  box.scrollTop = box.scrollHeight;

  const input = $('chatInput');
  const send = $('chatSend');
  send.onclick = () => sendChat();
  input.onkeydown = (e) => { if (e.key === 'Enter') sendChat(); };
}

function sendChat() {
  const input = $('chatInput');
  const text = input.value.trim();
  if (!text) return;
  const box = $('chatMessages');
  chatHistory.push({ role: 'user', content: text });
  input.value = '';
  box.innerHTML = chatHistory.map(m =>
    `<div class="chat-msg ${m.role}">${renderMarkdown(m.content)}</div>`
  ).join('') + '<div class="chat-msg ai chat-loading">🤖 思考中…</div>';
  box.scrollTop = box.scrollHeight;

  const sendBtn = $('chatSend');
  sendBtn.disabled = true;

  const msgs = chatHistory.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
  AI.chatWithAI(msgs, state.profile).then(reply => {
    chatHistory.push({ role: 'ai', content: reply });
    box.innerHTML = chatHistory.map(m =>
      `<div class="chat-msg ${m.role}">${renderMarkdown(m.content)}</div>`
    ).join('');
    box.scrollTop = box.scrollHeight;
    sendBtn.disabled = false;
  });
}

/* ============================================================
 *  启动
 * ============================================================ */
bindGlobal();
initZoomer();
/* 刷新 / 带 hash 直接打开：一律回首页。
 * state 不持久化，若按 URL 里的 #result 之类回到子页，plan 已清空，
 * renderResult 不会被调用（route 对 result 是空操作），首页又被 hidden，
 * 整屏就空白了。统一回首页最稳。 */
route('index');
