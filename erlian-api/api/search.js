// 引入 7 个 JSON 数据文件
const rosterErlian = require('../data/roster_erlian.json');
const subsidyGaoling = require('../data/subsidy_gaoling.json');
const subsidyCanjiLife = require('../data/subsidy_canji_life.json');
const subsidyCanjiCare = require('../data/subsidy_canji_care.json');
const subsidyOrphan = require('../data/subsidy_orphan.json');
const subsidyFoster = require('../data/subsidy_foster.json');
const subsidyYanglao = require('../data/subsidy_yanglao.json');

// 🌟 设置访问令牌密码（可以修改为你想要的秘钥，如 erlian2026）
const API_SECRET = 'erlian2026';

module.exports = (req, res) => {
  // 设置跨域允许
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { kw, token } = req.query;

  // 1. 安全密码验证
  if (token !== API_SECRET) {
    return res.status(403).json({ code: 403, msg: '无访问权限或密码错误' });
  }

  if (!kw) {
    return res.status(400).json({ code: 400, msg: '请输入姓名或身份证号' });
  }

  const match = (item) => item.name === kw || item.id_card === kw;

  // 2. 7 个表格同时检索
  const erlianFound = rosterErlian.find(match);
  const gaolingFound = subsidyGaoling.find(match);
  const canjiLifeFound = subsidyCanjiLife.find(match);
  const canjiCareFound = subsidyCanjiCare.find(match);
  const orphanFound = subsidyOrphan.find(match);
  const fosterFound = subsidyFoster.find(match);
  const yanglaoFound = subsidyYanglao.find(match);

  const subsidies = [];
  if (gaolingFound) subsidies.push({ category: '👵 高龄补贴', amount: gaolingFound.amount || '符合条件' });
  if (canjiLifeFound) subsidies.push({ category: '♿ 残疾人生活补贴', amount: canjiLifeFound.amount || '符合条件' });
  if (canjiCareFound) subsidies.push({ category: '🛋️ 残疾人护理补贴', amount: canjiCareFound.amount || '符合条件' });
  if (orphanFound) subsidies.push({ category: '👶 孤儿救助补贴', amount: orphanFound.amount || '符合条件' });
  if (fosterFound) subsidies.push({ category: '🌱 事实无人抚养儿童补贴', amount: fosterFound.amount || '符合条件' });
  if (yanglaoFound) subsidies.push({ category: '🏡 居家养老服务', amount: yanglaoFound.amount || '在册人员' });

  const hasErlian = !!erlianFound;
  const hasAnySubsidy = subsidies.length > 0;

  if (!hasErlian && !hasAnySubsidy) {
    return res.status(200).json({ code: 404, data: null });
  }

  const firstSubsidy = gaolingFound || canjiLifeFound || yanglaoFound || orphanFound || fosterFound || canjiCareFound || {};
  const finalIdCard = (erlianFound && erlianFound.id_card) || firstSubsidy.id_card || '';

  // 根据身份证自动算年龄
  let finalAge = firstSubsidy.age ? `${firstSubsidy.age} 岁` : '';
  if (!finalAge && finalIdCard.length === 18) {
    const birthYear = parseInt(finalIdCard.substring(6, 10));
    const currentYear = new Date().getFullYear();
    finalAge = `${currentYear - birthYear} 岁`;
  }

  return res.status(200).json({
    code: 200,
    data: {
      name: (erlianFound && erlianFound.name) || firstSubsidy.name || kw,
      id_card: finalIdCard || '详见档案',
      age: finalAge,
      phone: (erlianFound && erlianFound.phone) || firstSubsidy.phone || '暂无电话',
      grid: hasErlian ? (erlianFound.grid ? `${erlianFound.village || '二连'}(${erlianFound.grid})` : '二连名册') : '非二连在册人员',
      address: (erlianFound && erlianFound.address) || firstSubsidy.village || firstSubsidy.address || '暂无详细地址',
      family_count: erlianFound && erlianFound.family_count ? `${erlianFound.family_count} 人` : '未记录',
      members: (erlianFound && erlianFound.members) || '二连主表未记录家庭成员',
      subsidies: subsidies
    }
  });
};