// src/lib/notion.ts
import { Client } from '@notionhq/client';

const fallbackData = [
  { id: '1', name: '金枪鱼大腹', japaneseName: 'おおとろ', bestMonths: ['12月', '1月', '2月'], tasteScore: 4.8, eatingMethod: '刺身', sakePairing: '纯米酒', imageUrl: '', slug: 'tuna-otoro' },
  { id: '2', name: '鰤鱼', japaneseName: 'ぶり', bestMonths: ['11月', '12月', '1月'], tasteScore: 4.2, eatingMethod: '炙烤', sakePairing: '吟酿', imageUrl: '', slug: 'buri' },
  { id: '3', name: '樱鲷', japaneseName: 'さくらだい', bestMonths: ['3月', '4月'], tasteScore: 3.8, eatingMethod: '刺身', sakePairing: '起泡清酒', imageUrl: '', slug: 'sakura-dai' },
];

export async function getFishList() {
  const apiKey = import.meta.env.NOTION_API_KEY;
  const dbId = import.meta.env.NOTION_DATABASE_ID;
  
  if (!apiKey || !dbId || apiKey === 'ntn_您的完整token') {
    console.log('📦 使用示例数据');
    return fallbackData;
  }
  
  try {
    const notion = new Client({ auth: apiKey });
    const response = await notion.databases.query({ 
      database_id: dbId,
      page_size: 100
    });
    
    console.log(`✅ 获取到 ${response.results.length} 条数据`);
    
    const fishList = [];
    
    for (const page of response.results) {
      const props = page.properties;
      
      // 直接打印每条数据的原始信息用于调试
      console.log(`\n🔍 处理第 ${fishList.length + 1} 条:`);
      
      // 获取鱼种名称 - 尝试多种方式
      let name = '';
      const nameField = props['鱼种名称'];
      console.log(`   nameField 类型: ${nameField?.type}`);
      
      if (nameField) {
        if (nameField.type === 'title' && nameField.title && nameField.title.length > 0) {
          name = nameField.title[0].plain_text;
          console.log(`   ✅ 从 title 获取: ${name}`);
        } else if (nameField.type === 'rich_text' && nameField.rich_text && nameField.rich_text.length > 0) {
          name = nameField.rich_text[0].plain_text;
          console.log(`   ✅ 从 rich_text 获取: ${name}`);
        } else {
          console.log(`   ❌ nameField 内容:`, JSON.stringify(nameField));
        }
      } else {
        console.log(`   ❌ 找不到 '鱼种名称' 字段`);
        // 尝试打印所有字段名
        console.log(`   可用字段: ${Object.keys(props).join(', ')}`);
      }
      
      // 跳过名称为空的数据
      if (!name || name.trim() === '') {
        console.log(`   ⏭️ 跳过: 名称为空`);
        continue;
      }
      
      // 检查状态
      let isOnline = true; // 默认认为在线
      const statusField = props['状态'];
      if (statusField?.multi_select && statusField.multi_select.length > 0) {
        const statuses = statusField.multi_select.map((s: any) => s.name);
        isOnline = statuses.some(s => s.includes('已上线'));
        console.log(`   状态: ${statuses.join(',')} -> isOnline: ${isOnline}`);
      }
      
      if (!isOnline) {
        console.log(`   ⏭️ 跳过: 未上线`);
        continue;
      }
      
      // 最佳月份
      let bestMonths: string[] = [];
      const monthField = props['最佳月份'];
      if (monthField?.multi_select) {
        bestMonths = monthField.multi_select.map((t: any) => t.name + '月');
      }
      
      // 口感评分
      let tasteScore = 3.0;
      const scoreField = props['口感评价'];
      if (scoreField && scoreField.number !== null && scoreField.number !== undefined) {
        tasteScore = scoreField.number;
      }
      
      // 推荐吃法
      let eatingMethod = '刺身';
      const methodField = props['推荐吃法'];
      if (methodField?.select?.name) {
        eatingMethod = methodField.select.name;
      }
      
      // 关联清酒
      let sakePairing = '纯米酒';
      const sakeField = props['关联清酒'];
      if (sakeField?.select?.name) {
        sakePairing = sakeField.select.name;
      }
      
      // 日文名
      let japaneseName = '';
      const jpField = props['日文名'];
      if (jpField?.rich_text && jpField.rich_text.length > 0) {
        japaneseName = jpField.rich_text[0].plain_text;
      }
      
      // 封面图
      let imageUrl = '';
      const imageField = props['封面图'];
      if (imageField?.files && imageField.files.length > 0) {
        imageUrl = imageField.files[0].file?.url || '';
      }
      
      console.log(`   ✅ 成功解析: ${name}`);
      
      fishList.push({
        id: page.id,
        name: name,
        japaneseName: japaneseName,
        bestMonths: bestMonths,
        tasteScore: tasteScore,
        eatingMethod: eatingMethod,
        sakePairing: sakePairing,
        imageUrl: imageUrl,
        slug: page.id
      });
    }
    
    console.log(`\n📊 成功解析 ${fishList.length} 条鱼种数据`);
    return fishList;
    
  } catch (error) {
    console.error('❌ 错误，使用示例数据', error);
    return fallbackData;
  }
}

export async function getFishBySlug(slug: string) {
  const fishList = await getFishList();
  return fishList.find(fish => fish.slug === slug) || null;
}

export async function getSeasonalFish(month?: number) {
  const currentMonth = month || new Date().getMonth() + 1;
  const monthLabel = `${currentMonth}月`;
  const fishList = await getFishList();
  return fishList.filter(fish => fish.bestMonths.includes(monthLabel));
}