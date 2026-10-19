/* ============================================================
 *  places.js —— 精确搜索 + 未收录地名归并（纯数据 + 纯函数，无 DOM）
 *
 *  能力（「像高德一样精确」）：
 *    · 城市/省份/景点（POI）混搜
 *    · 拼音全拼（hangzhou / yiwu）
 *    · 拼音首字母（hz / yw / sql＝三清山）
 *    · 错别字容错（编辑距离 ≤1：上尧→上饶）
 *    · 未收录地名向上归并（义乌→杭州，带明确提示）
 *
 *  依赖（调用期，非加载期）：
 *    · CITY_INDEX  (data.js)        城市轻量索引
 *    · POI_DB      (data-loader.js) 城市数据 Proxy（惰性）
 *    · ProvinceDB  (provinces.js)   省份匹配
 *    · CITY_ALIAS  (app.js)         城市别名表（运行期已加载）
 *    · DataLoader  (data-loader.js) 判断分片是否已加载
 *    · 汉字→拼音表 HANZI_PY（本文件内联）
 * ============================================================ */

/* ---------- 汉字 → 拼音（无声调，覆盖 114 城 + 全部 POI 名用字） ---------- */
const HANZI_PY = {
  "成":"cheng","都":"du","西":"xi","安":"an","厦":"xia","门":"men","南":"nan","昌":"chang","北":"bei","京":"jing","上":"shang","海":"hai",
  "重":"chong","庆":"qing","长":"chang","沙":"sha","杭":"hang","州":"zhou","广":"guang","泉":"quan","潮":"chao","洛":"luo","阳":"yang","柳":"liu",
  "绍":"shao","兴":"xing","大":"da","同":"tong","镇":"zhen","江":"jiang","临":"lin","建":"jian","水":"shui","汕":"shan","头":"tou","天":"tian",
  "津":"jin","石":"shi","家":"jia","庄":"zhuang","承":"cheng","德":"de","秦":"qin","皇":"huang","岛":"dao","正":"zheng","定":"ding","哈":"ha",
  "尔":"er","滨":"bin","沈":"shen","连":"lian","春":"chun","延":"yan","边":"bian","苏":"su","扬":"yang","宁":"ning","波":"bo","武":"wu",
  "汉":"han","郑":"zheng","开":"kai","封":"feng","张":"zhang","界":"jie","桂":"gui","林":"lin","口":"kou","三":"san","亚":"ya","青":"qing",
  "济":"ji","太":"tai","原":"yuan","平":"ping","遥":"yao","昆":"kun","明":"ming","理":"li","丽":"li","贵":"gui","兰":"lan","敦":"dun",
  "煌":"huang","银":"yin","川":"chuan","乌":"wu","鲁":"lu","木":"mu","齐":"qi","喀":"ka","什":"shi","拉":"la","萨":"sa","福":"fu",
  "黄":"huang","山":"shan","景":"jing","呼":"hu","和":"he","浩":"hao","特":"te","包":"bao","中":"zhong","卫":"wei","掖":"ye","嘉":"jia",
  "峪":"yu","关":"guan","吐":"tu","番":"fan","克":"ke","玛":"ma","依":"yi","伊":"yi","犁":"li","邯":"han","郸":"dan","曲":"qu",
  "阜":"fu","淄":"zi","博":"bo","威":"wei","恩":"en","施":"shi","无":"wu","锡":"xi","宜":"yi","凤":"feng","凰":"huang","庐":"lu",
  "岳":"yue","深":"shen","圳":"zhen","婺":"wu","源":"yuan","珠":"zhu","普":"pu","陀":"tuo","顺":"shun","台":"tai","堰":"yan","乐":"le",
  "双":"shuang","版":"ban","纳":"na","荔":"li","腾":"teng","冲":"chong","远":"yuan","宏":"hong","村":"cun","井":"jing","冈":"gang","九":"jiu",
  "华":"hua","漠":"mo","河":"he","芝":"zhi","日":"ri","则":"ze","五":"wu","赣":"gan","饶":"rao","吉":"ji","抚":"fu","萍":"ping",
  "乡":"xiang","新":"xin","余":"yu","鹰":"ying","潭":"tan","瑞":"rui","金":"jin","龙":"long","鄱":"po","樟":"zhang","树":"shu","丰":"feng",
  "城":"cheng","溪":"xi","宽":"kuan","窄":"zhai","巷":"xiang","子":"zi","侯":"hou","祠":"ci","锦":"jin","里":"li","杜":"du","甫":"fu",
  "草":"cao","堂":"tang","熊":"xiong","猫":"mao","繁":"fan","育":"yu","研":"yan","究":"jiu","基":"ji","地":"di","人":"ren","民":"min",
  "公":"gong","园":"yuan","鹤":"he","鸣":"ming","茶":"cha","社":"she","熙":"xi","路":"lu","古":"gu","东":"dong","郊":"jiao","记":"ji",
  "忆":"yi","设":"she","小":"xiao","吃":"chi","街":"jie","魁":"kui","星":"xing","楼":"lou","玉":"yu","酒":"jiu","馆":"guan","眼":"yan",
  "桥":"qiao","廊":"lang","四":"si","物":"wu","院":"yuan","遗":"yi","址":"zhi","文":"wen","殊":"shu","望":"wang","圣":"sheng","花":"hua",
  "农":"nong","居":"ju","环":"huan","球":"qiu","心":"xin","带":"dai","始":"shi","兵":"bing","马":"ma","俑":"yong","清":"qing","宫":"gong",
  "墙":"qiang","钟":"zhong","鼓":"gu","回":"hui","洒":"sa","陕":"shan","历":"li","史":"shi","雁":"yan","塔":"ta","慈":"ci","寺":"si",
  "唐":"tang","不":"bu","夜":"ye","芙":"fu","蓉":"rong","池":"chi","永":"yong","坊":"fang","碑":"bei","书":"shu","湘":"xiang","庙":"miao",
  "国":"guo","寨":"zhai","赛":"sai","格":"ge","际":"ji","陵":"ling","浪":"lang","屿":"yu","坡":"po","尾":"wei","避":"bi","风":"feng",
  "坞":"wu","学":"xue","步":"bu","行":"xing","第":"di","八":"ba","市":"shi","场":"chang","曾":"ceng","厝":"cuo","垵":"an","骑":"qi",
  "万":"wan","植":"zhi","胡":"hu","炮":"pao","白":"bai","滩":"tan","演":"yan","观":"guan","铁":"tie","化":"hua","集":"ji","美":"mei",
  "缘":"yuan","湾":"wan","湿":"shi","音":"yin","梦":"meng","幻":"huan","世":"shi","港":"gang","老":"lao","滕":"teng","王":"wang","阁":"ge",
  "一":"yi","起":"qi","义":"yi","纪":"ji","念":"nian","寿":"shou","区":"qu","蛤":"ha","蟆":"ma","胜":"sheng","利":"li","绳":"sheng",
  "杏":"xing","百":"bai","洲":"zhou","省":"sheng","秋":"qiu","之":"zhi","摩":"mo","轮":"lun","游":"you","创":"chuang","意":"yi","艾":"ai",
  "湖":"hu","瑶":"yao","野":"ye","森":"sen","香":"xiang","梅":"mei","岭":"ling","狮":"shi","峰":"feng","昏":"hun","融":"rong","故":"gu",
  "刹":"sha","后":"hou","坛":"tan","前":"qian","栅":"zha","栏":"lan","达":"da","十":"shi","锣":"luo","屯":"tun","颐":"yi","圆":"yuan",
  "府":"fu","奥":"ao","匹":"pi","鸟":"niao","巢":"chao","立":"li","方":"fang","簋":"gui","艺":"yi","术":"shu","恭":"gong","道":"dao",
  "外":"wai","豫":"yu","隍":"huang","田":"tian","康":"kang","迪":"di","士":"shi","尼":"ni","朱":"zhu","角":"jiao","徐":"xu","汇":"hui",
  "多":"duo","伦":"lun","名":"ming","思":"si","复":"fu","陆":"lu","嘴":"zui","科":"ke","技":"ji","码":"ma","甜":"tian","爱":"ai",
  "迅":"xun","洪":"hong","崖":"ya","洞":"dong","解":"jie","放":"fang","磁":"ci","器":"qi","李":"li","坝":"ba","轻":"qing","轨":"gui",
  "穿":"chuan","索":"suo","鹅":"e","二":"er","厂":"chang","棵":"ke","朝":"chao","峡":"xia","礼":"li","梯":"ti","传":"chuan","统":"tong",
  "貌":"mao","歌":"ge","渣":"zha","滓":"zi","缙":"jin","云":"yun","弹":"dan","动":"dong","杨":"yang","坪":"ping","桷":"jue","涂":"tu",
  "鸦":"ya","橘":"ju","麓":"lu","火":"huo","殿":"dian","烈":"lie","堕":"duo","落":"luo","窗":"chuang","月":"yue","师":"shi","范":"fan",
  "铜":"tong","官":"guan","窑":"yao","燕":"yan","底":"di","光":"guang","吧":"ba","断":"duan","残":"can","雪":"xue","灵":"ling","隐":"yin",
  "飞":"fei","来":"lai","高":"gao","雷":"lei","堤":"di","鱼":"yu","宋":"song","御":"yu","吴":"wu","象":"xiang","校":"xiao","涧":"jian",
  "良":"liang","渚":"zhu","塘":"tang","栖":"qi","运":"yun","拱":"gong","宸":"chen","钱":"qian","岩":"yan","菊":"ju","展":"zhan","蛮":"man",
  "腰":"yao","面":"mian","置":"zhi","陈":"chen","枝":"zhi","涌":"yong","下":"xia","惠":"hui","食":"shi","越":"yue","秀":"xiu","羊":"yang",
  "像":"xiang","隆":"long","旅":"lv","度":"du","假":"jia","夫":"fu","埔":"pu","佳":"jia","元":"yuan","肃":"su","君":"jun","净":"jing",
  "蟳":"xun","真":"zhen","交":"jiao","通":"tong","产":"chan","业":"ye","闽":"min","服":"fu","装":"zhuang","沪":"hu","牌":"pai","韩":"han",
  "己":"ji","略":"lve","许":"xu","驸":"fu","淡":"dan","浮":"fu","雕":"diao","刺":"ci","绣":"xiu","所":"suo","佛":"fo","灯":"deng",
  "工":"gong","体":"ti","验":"yan","窟":"ku","应":"ying","邑":"yi","隋":"sui","字":"zi","驾":"jia","六":"lu","代":"dai","魏":"wei",
  "彩":"cai","周":"zhou","牡":"mu","丹":"dan","鞍":"an","埠":"bu","莲":"lian","穴":"xue","喷":"pen","车":"che","卡":"ka","雀":"que",
  "儿":"er","生":"sheng","螺":"luo","蛳":"si","粉":"fen","苗":"miao","空":"kong","仓":"cang","直":"zhi","亭":"ting","会":"hui","稽":"ji",
  "禹":"yu","瑾":"jin","柯":"ke","法":"fa","节":"jie","剧":"ju","篷":"peng","船":"chuan","鉴":"jian","悬":"xuan","严":"yan","善":"shan",
  "壁":"bi","瀛":"ying","态":"tai","县":"xian","群":"qun","仿":"fang","土":"tu","纯":"chun","欢":"huan","采":"cai","凉":"liang","渡":"du",
  "固":"gu","焦":"jiao","锅":"guo","盖":"gai","伯":"bo","先":"xian","醋":"cu","珍":"zhen","宝":"bao","茅":"mao","紫":"zi","巾":"jin",
  "桃":"tao","剪":"jian","纸":"zhi","麦":"mai","虾":"xia","矶":"ji","列":"lie","糟":"zao","羹":"geng","蜜":"mi","巡":"xun","宵":"xiao",
  "洋":"yang","豆":"dou","腐":"fu","政":"zheng","考":"kao","棚":"peng","团":"tuan","陶":"tao","指":"zhi","烤":"kao","摊":"tan","制":"zhi",
  "作":"zuo","孔":"kong","祭":"ji","汽":"qi","鸡":"ji","芽":"ya","牛":"niu","肉":"rou","礐":"que","澳":"ao","菜":"cai","存":"cun",
  "妈":"ma","侨":"qiao","试":"shi","濠":"hao","归":"gui","线":"xian","标":"biao","志":"zhi","黉":"hong","式":"shi","情":"qing","瓷":"ci",
  "房":"fang","教":"jiao","至":"zhi","觉":"jue","悟":"wu","盘":"pan","蓟":"ji","独":"du","播":"bo","电":"dian","视":"shi","与":"yu",
  "厢":"xiang","荣":"rong","须":"xu","弥":"mi","澄":"cheng","赵":"zhao","柏":"bai","禅":"chan","苍":"cang","于":"yu","抱":"bao","犊":"du",
  "站":"zhan","商":"shang","圈":"quan","活":"huo","暑":"shu","佑":"you","宗":"zong","乘":"cheng","布":"bu","磬":"qing","锤":"chui","棒":"bang",
  "槌":"chui","段":"duan","围":"wei","塞":"sai","罕":"han","向":"xiang","热":"re","帝":"di","佟":"tong","僧":"seng","冠":"guan","片":"pian",
  "相":"xiang","声":"sheng","冰":"bing","季":"ji","冬":"dong","限":"xian","孟":"meng","姜":"jiang","女":"nv","戴":"dai","鸽":"ge","窝":"wo",
  "浴":"yu","虎":"hu","碧":"bi","求":"qiu","仙":"xian","入":"ru","处":"chu","栈":"zhan","玻":"bo","璃":"li","祖":"zu","翡":"fei",
  "翠":"cui","黎":"li","岸":"an","葡":"pu","萄":"tao","沟":"gou","娱":"yu","板":"ban","凌":"ling","霄":"xiao","碗":"wan","非":"fei",
  "常":"chang","战":"zhan","品":"pin","摄":"she","影":"ying","框":"kuang","机":"ji","位":"wei","早":"zao","本":"ben","腊":"la","俗":"su",
  "央":"yang","防":"fang","菲":"fei","巴":"ba","斯":"si","松":"song","畔":"pan","黑":"hei","果":"guo","戈":"ge","司":"si","力":"li",
  "滑":"hua","伏":"fu","加":"jia","夏":"xia","出":"chu","极":"ji","旧":"jiu","帅":"shuai","昭":"zhao","辽":"liao","怪":"guai","营":"ying",
  "鲜":"xian","族":"zu","棋":"qi","登":"deng","俄":"e","罗":"luo","劳":"lao","务":"wu","军":"jun","付":"fu","自":"zi","然":"ran",
  "堡":"bu","垒":"lei","伪":"wei","满":"man","质":"zhi","筑":"zhu","红":"hong","旗":"qi","塑":"su","沦":"lun","陷":"xian","漫":"man",
  "绿":"lv","网":"wang","帽":"mao","冷":"leng","条":"tiao","图":"tu","们":"men","酱":"jiang","汤":"tang","米":"mi","店":"dian","烧":"shao",
  "年":"nian","户":"hu","舞":"wu","表":"biao","孝":"xiao","淮":"huai","玄":"xuan","锋":"feng","侵":"qin","屠":"tu","杀":"sha","遇":"yu",
  "难":"nan","胞":"bao","瓮":"weng","拙":"zhuo","丘":"qiu","留":"liu","诚":"cheng","寒":"han","七":"qi","全":"quan","渎":"du","瘦":"shou",
  "个":"ge","何":"he","冶":"ye","皮":"pi","夹":"jia","沿":"yan","缸":"gang","鸭":"ya","狗":"gou","童":"tong","阿":"a","部":"bu",
  "昙":"tan","粮":"liang","听":"ting","涛":"tao","樱":"ying","晴":"qing","琴":"qin","如":"ru","千":"qian","玺":"xi","嵩":"song","少":"shao",
  "只":"zhi","有":"you","戏":"xi","甘":"gan","及":"ji","汴":"bian","袁":"yuan","凡":"fan","鞭":"bian","贺":"he","谷":"gu","魅":"mei",
  "庸":"yong","鼻":"bi","靖":"jing","两":"liang","逍":"xiao","芦":"lu","笛":"di","漓":"li","精":"jing","磨":"mo","朔":"shuo","竹":"zhu",
  "筏":"fa","画":"hua","脊":"ji","骆":"luo","驼":"tuo","邕":"yong","益":"yi","炬":"ju","冯":"feng","刚":"gang","澜":"lan","墓":"mu",
  "蜈":"wu","支":"zhi","涯":"ya","椰":"ye","鹿":"lu","棠":"tang","免":"mian","税":"shui","崂":"lao","巨":"ju","帆":"fan","啤":"pi",
  "主":"zhu","浙":"zhe","信":"xin","号":"hao","劈":"pi","柴":"chai","督":"du","趵":"bao","突":"tu","厚":"hou","超":"chao","晋":"jin",
  "蒙":"meng","祚":"zuo","煤":"mei","炭":"tan","汾":"fen","崇":"chong","迎":"ying","泽":"ze","昇":"sheng","票":"piao","衙":"ya","协":"xie",
  "库":"ku","又":"you","见":"jian","境":"jing","滇":"dian","埂":"geng","讲":"jiang","屏":"ping","斗":"dou","强":"qiang","洱":"er","感":"gan",
  "洗":"xi","喜":"xi","舌":"she","才":"cai","寂":"ji","照":"zhao","庵":"an","龛":"kan","蓝":"lan","束":"shu","印":"yin","实":"shi",
  "忠":"zhong","黔":"qian","甲":"jia","母":"mu","亲":"qin","览":"lan","读":"du","者":"zhe","莫":"mo","牙":"ya","雅":"ya","魔":"mo",
  "鬼":"gui","党":"dang","反":"fan","琵":"pi","琶":"pa","郎":"lang","剑":"jian","爷":"ye","藏":"zang","怀":"huai","事":"shi","疆":"jiang",
  "维":"wei","吾":"wu","治":"zhi","扎":"zha","牧":"mu","提":"ti","尕":"ga","妃":"fei","帕":"pa","霍":"huo","麻":"ma","橐":"tuo",
  "班":"ban","勒":"lei","干":"gan","廓":"kuo","色":"se","哲":"zhe","蚌":"beng","禄":"lu","药":"yao","烟":"yan","脉":"mai","温":"wen",
  "客":"ke","顶":"ding","徒":"tu","递":"di","徽":"hui","呈":"cheng","坎":"kan","潜":"qian","宅":"zhai","丙":"bing","丁":"ding","梁":"liang",
  "召":"zhao","内":"nei","席":"xi","敕":"chi","将":"jiang","署":"shu","恼":"nao","素":"su","当":"dang","汗":"han","岱":"dai","乔":"qiao",
  "稀":"xi","谣":"yao","横":"heng","竖":"shu","坤":"kun","希":"xi","穆":"mu","仁":"ren","更":"geng","宿":"su","枣":"zao","革":"ge",
  "命":"ming","壶":"hu","瀑":"pu","泥":"ni","乾":"qian","雨":"yu","岔":"cha","霞":"xia","蹄":"ti","焉":"yan","墩":"dun","雄":"xiong",
  "轩":"xuan","焰":"yan","孜":"zi","郡":"jun","油":"you","禾":"he","那":"na","峻":"jun","赞":"zan","其":"qi","琼":"qiong","恰":"qia",
  "根":"gen","忧":"you","薰":"xun","衣":"yi","托":"tuo","乎":"hu","娲":"wa","丛":"cong","响":"xiang","娘":"niang","邺":"ye","令":"ling",
  "粱":"liang","吕":"lv","颜":"yan","昊":"hao","仞":"ren","蓼":"liao","局":"ju","便":"bian","聊":"liao","斋":"zhai","琉":"liu","叶":"ye",
  "柿":"shi","溶":"rong","沂":"yi","踏":"ta","刘":"liu","幸":"xing","乳":"ru","神":"shen","经":"jing","驴":"lv","悦":"yue","梭":"suo",
  "垭":"ya","彭":"peng","鼋":"yuan","拈":"nian","蠡":"li","浒":"hu","荡":"dang","阴":"yin","屈":"qu","荒":"huang","沱":"tuo","虹":"hong",
  "从":"cong","龄":"ling","奇":"qi","丝":"si","含":"han","叠":"die","径":"jing","议":"yi","牯":"gu","庭":"ting","英":"ying","汨":"mi",
  "坑":"keng","保":"bao","护":"hu","篁":"huang","晓":"xiao","汪":"wang","漳":"zhang","鄣":"zhang","卧":"wo","侣":"lv","渔":"yu","伶":"ling",
  "仃":"ding","狸":"li","涠":"wei","合":"he","浦":"pu","旁":"pang","进":"jin","慧":"hui","肯":"ken","去":"qu","梵":"fan","财":"cai",
  "迦":"jia","龟":"gui","晖":"hui","逢":"feng","简":"jian","翁":"weng","祐":"you","休":"xiu","卉":"hui","灶":"zao","榜":"bang","硐":"dong",
  "箬":"ruo","蛇":"she","蟠":"pan","灌":"guan","芒":"mang","峨":"e","眉":"mei","尤":"you","郭":"guo","沫":"mo","若":"ruo","沐":"mu",
  "傣":"dai","曼":"man","告":"gao","诺":"nuo","勐":"meng","沧":"cang","泐":"le","易":"yi","茂":"mao","鸳":"yuan","鸯":"yang","级":"ji",
  "跌":"die","殇":"shang","抗":"kang","绮":"qi","贡":"gong","报":"bao","侗":"dong","过":"guo","垣":"yuan","沼":"zhao","氏":"shi","叙":"xu",
  "卢":"lu","墅":"shu","茨":"ci","毛":"mao","笔":"bi","架":"jia","鹃":"juan","荆":"jing","身":"shen","岁":"sui","祇":"qi","旃":"zhan",
  "檀":"tan","闵":"min","柱":"zhu","悲":"bei","露":"lu","浅":"qian","厅":"ting","诞":"dan","弯":"wan","胭":"yan","脂":"zhi","苑":"yuan",
  "瓦":"wa","措":"cuo","朗":"lang","堆":"dui","苯":"ben","密":"mi","嘎":"ga","绒":"rong","桑":"sang","颇":"po","章":"zhang","显":"xian",
  "菩":"pu","黛":"dai","睺":"hou","浔":"xun","锁":"suo","湓":"pen","坚":"jian","郁":"yu","孤":"gu","蒋":"jiang","共":"gong","摇":"yao",
  "篮":"lan","丫":"ya","脐":"qi","橙":"cheng","葛":"ge","铅":"qian","夷":"yi","岗":"gang","钹":"bo","脚":"jiao","亮":"liang","帘":"lian",
  "鹭":"lu","渼":"mei","陂":"bei","钓":"diao","槎":"cha","改":"gai","编":"bian","泰":"tai","宴":"yan","薄":"bao","酥":"su","饼":"bing",
  "铺":"pu","儒":"ru","能":"neng","谯":"qiao","爪":"zhao","仑":"lun","载":"zai","皂":"zao","贾":"jia","茗":"ming","流":"liu","姑":"gu",
  "拟":"ni","岘":"xian","巩":"gong","泡":"pao","点":"dian","矿":"kuang","总":"zong","功":"gong","岐":"qi","孽":"nie","傩":"nuo","示":"shi",
  "宕":"dang","甸":"dian","收":"shou","蝴":"hu","蝶":"die","辣":"la","鳌":"ao","排":"pai","档":"dang","最":"zui","夕":"xi","羽":"yu",
  "傅":"fu","目":"mu","仰":"yang","介":"jie","狐":"hu","调":"diao","查":"cha","分":"fen","钢":"gang","泸":"lu","漂":"piao","棺":"guan",
  "升":"sheng","蚊":"wen","嗣":"si","寻":"xun","哩":"li","荸":"bi","弄":"nong","镜":"jing","柠":"ning","语":"yu","垅":"long","委":"wei",
  "据":"ju","埃":"ai","绵":"mian","征":"zheng","屋":"wu","栗":"li","仔":"zai","翼":"yi","虔":"qian","荳":"dou","濂":"lian","止":"zhi",
  "夔":"kui","汊":"cha","瓢":"piao","屑":"xie","移":"yi","医":"yi","帮":"bang","养":"yang","匣":"xia","谌":"chen","滴":"di","耳":"er",
  "暴":"bao","畲":"she",
};

/* 转写：中文串 → 全拼；非中文字符原样保留（小写化） */
function pyOf(str) {
  if (!str) return '';
  let out = '';
  for (const ch of String(str)) {
    if (HANZI_PY[ch]) out += HANZI_PY[ch];
    else out += ch.toLowerCase();
  }
  return out;
}

/* 转写：中文串 → 拼音首字母串（三清山 → sql；上饶 → sr；杭州 → hz） */
function abbrOf(str) {
  if (!str) return '';
  let out = '';
  for (const ch of String(str)) {
    if (HANZI_PY[ch]) out += HANZI_PY[ch][0];
    else if (/[a-z0-9]/i.test(ch)) out += ch.toLowerCase();
  }
  return out;
}

/* ---------- 编辑距离（带长度剪枝；中文/拼音容错都用它） ---------- */
function editDistance(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return 2;   // 差超过 1 直接判否，省算力
  const dp = [];
  for (let i = 0; i <= m; i++) dp.push([i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/* ---------- 未收录地名 → 已收录城市 的映射表 ----------
 *  策略：先精确/别名/拼音匹配已收录城市；再查本表；再省份归属；再经纬度就近。
 *  浙江省仅收录 杭州/绍兴/宁波/临海/普陀/台州，义乌/金华等未收录 → 归并到杭州
 *  （省会枢纽、高铁约 40 分钟、可玩性高），并在 UI 明确提示替代关系。 */
const GEO_MAP = {
  /* —— 浙江（未收录地级市/县 → 杭州优先）—— */
  '义乌': { city: 'hangzhou', note: '义乌暂无独立数据，已用杭州替代（高铁义乌→杭州约 40 分钟）' },
  '金华': { city: 'hangzhou', note: '金华暂无独立数据，已用杭州替代（高铁约 1 小时）' },
  '横店': { city: 'hangzhou', note: '横店暂无独立数据，已用杭州替代（高铁/自驾约 1.5 小时）' },
  '东阳': { city: 'hangzhou', note: '东阳暂无独立数据，已用杭州替代' },
  '永康': { city: 'hangzhou', note: '永康暂无独立数据，已用杭州替代' },
  '嘉兴': { city: 'hangzhou', note: '嘉兴暂无独立数据，已用杭州替代（高铁约 30 分钟）' },
  '湖州': { city: 'hangzhou', note: '湖州暂无独立数据，已用杭州替代' },
  '丽水': { city: 'hangzhou', note: '丽水暂无独立数据，已用杭州替代' },
  '衢州': { city: 'hangzhou', note: '衢州暂无独立数据，已用杭州替代' },
  '温州': { city: 'linhai', note: '温州暂无独立数据，已用临近的临海/台州替代' },
  '舟山': { city: 'putuo', note: '舟山市区暂无独立数据，已用普陀山替代' },
  /* —— 江西（补漏，多数已收录；带 poiId 的可作必去锚点）—— */
  '婺源篁岭': { city: 'wuyuan', poiId: 'wy01', note: '已归并到婺源' },
  '篁岭': { city: 'wuyuan', poiId: 'wy01', note: '已归并到婺源' },
  '三清山': { city: 'shangrao', poiId: 'sr01', note: '三清山归属上饶，已用上饶行程承载' },
  '鄱阳湖': { city: 'poyang', note: '已归并到鄱阳' },
  '滕王阁': { city: 'nanchang', note: '滕王阁在南昌，已用南昌行程承载' },
  '龙虎山': { city: 'yingtan', note: '龙虎山在鹰潭，已用鹰潭行程承载' },
  '庐山': { city: 'lushan', note: '已归并到庐山' },
  '井冈山': { city: 'jinggangshan', note: '已归并到井冈山' },
  '武功山': { city: 'pingxiang', note: '武功山（萍乡侧）已归并到萍乡' },
  '明月山': { city: 'yichun', note: '明月山在宜春，已用宜春行程承载' },
  /* —— 其他常见未收录地名（渐进补全）—— */
  '雪乡': { city: 'harbin', note: '雪乡暂无独立数据，已用哈尔滨替代' },
  '长白山': { city: 'yanbian', note: '长白山暂无独立数据，已用延边替代' },
  '婺源江湾': { city: 'wuyuan', note: '已归并到婺源' },
};

/* 省级兜底：省份 → 省会（该省已收录城市中的首选） */
const PROVINCE_CAPITAL = {
  '北京': 'beijing', '上海': 'shanghai', '天津': 'tianjin', '重庆': 'chongqing',
  '四川': 'chengdu', '陕西': 'xian', '福建': 'fuzhou', '江西': 'nanchang',
  '湖南': 'changsha', '浙江': 'hangzhou', '广东': 'guangzhou', '湖北': 'wuhan',
  '河南': 'zhengzhou', '江苏': 'nanjing', '山东': 'jinan', '山西': 'taiyuan',
  '云南': 'kunming', '贵州': 'guiyang', '甘肃': 'lanzhou', '青海': 'xining',
  '宁夏': 'yinchuan', '新疆': 'urumqi', '西藏': 'lhasa', '广西': 'guilin',
  '海南': 'haikou', '内蒙古': 'hohhot', '河北': 'shijiazhuang', '辽宁': 'shenyang',
  '吉林': 'changchun', '黑龙江': 'harbin', '安徽': 'huangshan',
};

/* 少数知名未收录地名的参考坐标（用于经纬度就近兜底） */
const GEO_ANCHORS = {
  '义乌': { lat: 29.306, lng: 120.076 },
  '金华': { lat: 29.078, lng: 119.647 },
  '横店': { lat: 29.157, lng: 120.308 },
  '嘉兴': { lat: 30.746, lng: 120.755 },
  '湖州': { lat: 30.894, lng: 120.086 },
  '丽水': { lat: 28.467, lng: 119.922 },
  '衢州': { lat: 28.970, lng: 118.859 },
  '温州': { lat: 27.994, lng: 120.699 },
};

/* ---------- 便捷取值（惰性、跨全局） ---------- */
const _CI = () => (typeof CITY_INDEX !== 'undefined' ? CITY_INDEX : {});
const _ALIAS = () => {
  if (typeof CITY_ALIAS !== 'undefined' && CITY_ALIAS) return CITY_ALIAS;
  return {};
};

function haversineKm2(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* 取已收录城市里距离 (lat,lng) 最近的一个 */
function nearestCity(lat, lng) {
  const CI = _CI();
  let best = null;
  Object.keys(CI).forEach(k => {
    const c = CI[k].center;
    if (!c) return;
    const d = haversineKm2({ lat, lng }, { lat: c[0], lng: c[1] });
    if (!best || d < best.d) best = { city: k, d };
  });
  return best;
}

/* ---------- 城市层打分 ---------- */
function scoreCityPlace(key, kw) {
  const CI = _CI();
  const meta = CI[key];
  if (!meta) return 0;
  const low = kw.toLowerCase();
  const name = meta.name || '';
  const full = pyOf(name);
  const abbr = abbrOf(name);
  const keyLow = key.toLowerCase();
  const aliases = _ALIAS()[key] || [];

  if (name === kw) return 1000;
  if (keyLow === low) return 980;
  if (full === low) return 960;
  if (abbr === low) return 940;
  for (const a of aliases) {
    if (a === kw) return 920;
  }
  if (name.startsWith(kw)) return 800;
  if (full.startsWith(low)) return 780;
  if (abbr.startsWith(low)) return 760;
  if (name.includes(kw) && kw.length >= 2) return 600;
  for (const a of aliases) {
    if (a.includes(kw) && kw.length >= 2) return 500;
  }
  // 容错：中文/拼音编辑距离 ≤1（上尧→上饶；hangzou→hangzhou）
  if (kw.length >= 2 && editDistance(kw, name) <= 1) return 400;
  if (kw.length >= 4 && editDistance(low, full) <= 1) return 360;
  return 0;
}

/* ---------- POI 层打分（仅当该城分片已加载） ---------- */
let __poiIdx = null;   // { cityKey: [{id,name,abbr,full}] } 惰性构建

function poiIndexOf(cityKey) {
  if (typeof DataLoader === 'undefined' || !DataLoader.isCityLoaded) return null;
  if (!DataLoader.isCityLoaded(cityKey)) return null;   // 未加载不建索引（遵守 Proxy 约束）
  if (!__poiIdx) __poiIdx = {};
  if (__poiIdx[cityKey]) return __poiIdx[cityKey];
  const city = DataLoader.peekCity(cityKey);
  if (!city || !city.pois) return null;
  __poiIdx[cityKey] = city.pois.map(p => ({ id: p.id, name: p.name, abbr: abbrOf(p.name), full: pyOf(p.name) }));
  return __poiIdx[cityKey];
}

/* ---------- 轻量全量名字索引 ----------
 * 为什么需要它：搜索栏在第 1 题，此时绝大多数城市分片还没加载，
 * 若只认「已加载城」的 POI，用户搜「三清山」就搜不到（只能搜到上饶市）。
 * 这里用 poi-names.js 提供的 id+name 清单做全量召回，
 * 拼音/首字母现场算 —— 1730 条只算一次，代价可忽略。 */
let __nameIdx = null;

function nameIndexOf(cityKey) {
  if (__nameIdx && __nameIdx[cityKey]) return __nameIdx[cityKey];
  if (typeof POI_NAMES_BY_CITY === 'undefined' || !POI_NAMES_BY_CITY[cityKey]) return null;
  if (!__nameIdx) __nameIdx = {};
  __nameIdx[cityKey] = POI_NAMES_BY_CITY[cityKey].map(([id, name]) => ({
    id, name, abbr: abbrOf(name), full: pyOf(name)
  }));
  return __nameIdx[cityKey];
}

function scorePoiPlace(poi, kw) {
  const low = kw.toLowerCase();
  if (poi.name === kw) return 900;
  if (poi.name.includes(kw) && kw.length >= 2) return 550;
  /* 全拼 / 首字母：三清山 → sanqingshan / sqs */
  if (poi.full === low) return 620;
  if (poi.abbr === low) return 600;
  if (kw.length >= 2 && poi.full.startsWith(low)) return 500;
  if (kw.length >= 2 && poi.abbr.startsWith(low)) return 480;
  /* 拼音容错：sanqinshan → sanqingshan */
  if (kw.length >= 4 && editDistance(low, poi.full) <= 1) return 420;
  if (kw.length >= 3 && editDistance(low, poi.abbr) <= 1) return 400;
  // 容错：长度 ≥3 且首字相同，才认编辑距离 ≤1（否则「江西↔江岭」「舟山↔灵山」会误召回）
  if (kw.length >= 3 && poi.name[0] === kw[0] && editDistance(kw, poi.name) <= 1) return 380;
  return 0;
}

/* ============================================================
 *  searchPlaces(kw, opts) —— 统一搜索
 *  @returns {Array<{type,key,name,sub,score,note?,poiId?}>}
 *    type: 'province' | 'city' | 'poi'
 * ============================================================ */
function searchPlaces(kw, opts) {
  opts = opts || {};
  if (!kw || !kw.trim()) return [];
  kw = kw.trim();
  const CI = _CI();
  const out = [];

  // 1) 省份（复用 ProvinceDB，映射到 700 区间——高于城市容错、低于城市精确）
  if (typeof ProvinceDB !== 'undefined' && ProvinceDB.matchProvinces) {
    const matchedProvs = new Set(ProvinceDB.matchProvinces(kw, 3));
    // 省份首字母（jx→江西、zj→浙江）补充匹配
    const low = kw.toLowerCase();
    ProvinceDB.allProvinces().forEach(pname => {
      if (abbrOf(pname) === low || pyOf(pname) === low) matchedProvs.add(pname);
    });
    matchedProvs.forEach(pname => {
      const s = (ProvinceDB.statsOf ? ProvinceDB.statsOf(pname) : null);
      out.push({
        type: 'province', key: pname, name: pname,
        sub: s ? `${s.cityCount} 座城` : '省份',
        score: 700 + 60
      });
    });
  }

  // 2) 城市（遍历轻量 CITY_INDEX）
  Object.keys(CI).forEach(k => {
    const s = scoreCityPlace(k, kw);
    if (s > 0) {
      const meta = CI[k];
      out.push({
        type: 'city', key: k, name: meta.name,
        sub: `${meta.name} · ${meta.poiCount} 个地点`,
        score: s
      });
    }
  });

  // 3) POI —— 用全量名字索引（不依赖分片加载），已加载城再额外用完整池
  const loaded = Object.keys(CI).filter(k =>
    typeof DataLoader !== 'undefined' && DataLoader.isCityLoaded && DataLoader.isCityLoaded(k));
  const scope = opts.scopeCity ? [opts.scopeCity] : Object.keys(CI);
  scope.forEach(k => {
    // 3a. 轻量名字索引（全量）
    const nidx = nameIndexOf(k);
    if (nidx) {
      const meta = CI[k];
      nidx.forEach(p => {
        const s = scorePoiPlace(p, kw);
        if (s > 0) {
          out.push({
            type: 'poi', key: k, poiId: p.id, name: p.name,
            sub: `${meta.name} · 景点`,
            score: s
          });
        }
      });
    }
  });

  // 排序 + 去重（同 key/poiId 只留最高分）
  out.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const dedup = [];
  for (const r of out) {
    const sig = r.type + ':' + r.key + ':' + (r.poiId || '');
    if (seen.has(sig)) continue;
    seen.add(sig);
    dedup.push(r);
  }
  return dedup.slice(0, opts.limit || 12).filter(r => r.score >= 300);
}

/* ============================================================
 *  resolvePlace(input) —— 未收录地名归并
 *  @returns {{city, matched, alias, note, poiId, confidence}}
 * ============================================================ */
function resolvePlace(input) {
  const raw = String(input || '').trim();
  if (!raw) return { city: null, matched: 'none', alias: null, note: '', poiId: null, confidence: 0 };

  // 1) 精确/别名/拼音匹配已收录城市
  const hits = searchPlaces(raw, { limit: 6 });
  const cityHit = hits.find(h => h.type === 'city' && h.score >= 900);
  if (cityHit) {
    return { city: cityHit.key, matched: 'exact', alias: null, note: '', poiId: null, confidence: 1 };
  }

  // 2) 内置地名映射表（优先于 POI 模糊，避免「舟山」被误判成某景点）
  if (GEO_MAP[raw]) {
    const m = GEO_MAP[raw];
    return { city: m.city, matched: 'map', alias: raw, note: m.note, poiId: m.poiId || null, confidence: 0.75 };
  }

  // 3) POI 级精确/包含命中（已加载城）
  const poiHit = hits.find(h => h.type === 'poi' && h.score >= 550);
  if (poiHit) {
    return { city: poiHit.key, matched: 'poi', alias: poiHit.name, note: `已定位到「${poiHit.name}」（${_CI()[poiHit.key].name}）`, poiId: poiHit.poiId, confidence: 0.9 };
  }

  // 4) 省份归属兜底（输入能识别到某省 → 用省会）
  if (typeof ProvinceDB !== 'undefined' && ProvinceDB.matchProvinces) {
    const prov = ProvinceDB.matchProvinces(raw, 1)[0];
    if (prov && PROVINCE_CAPITAL[prov]) {
      const cap = PROVINCE_CAPITAL[prov];
      return {
        city: cap, matched: 'province', alias: raw,
        note: `${raw}未收录，已用${prov}省会${_CI()[cap] ? _CI()[cap].name : cap}替代`,
        poiId: null, confidence: 0.5
      };
    }
  }

  // 5) 经纬度就近兜底（若在内置锚点里）
  if (GEO_ANCHORS[raw]) {
    const g = GEO_ANCHORS[raw];
    const near = nearestCity(g.lat, g.lng);
    if (near) {
      return {
        city: near.city, matched: 'geo', alias: raw,
        note: `${raw}未收录，已用最近的${_CI()[near.city] ? _CI()[near.city].name : near.city}替代`,
        poiId: null, confidence: 0.4
      };
    }
  }

  // 6) 未命中
  return { city: null, matched: 'none', alias: raw, note: `暂未找到「${raw}」，请从下面选一个相近的城市`, poiId: null, confidence: 0 };
}

/* ---------- 导出 ---------- */
const Places = {
  pyOf, abbrOf, editDistance,
  searchPlaces, resolvePlace, nearestCity,
  GEO_MAP, PROVINCE_CAPITAL, GEO_ANCHORS, HANZI_PY
};
if (typeof window !== 'undefined') window.Places = Places;
if (typeof module !== 'undefined' && module.exports) module.exports = Places;
