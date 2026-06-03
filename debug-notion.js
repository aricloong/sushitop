import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function debug() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 10
    });
    
    console.log(`获取到 ${response.results.length} 条数据\n`);
    
    response.results.forEach((page, idx) => {
      console.log(`=== 第 ${idx + 1} 条 ===`);
      const props = page.properties;
      
      // 打印所有字段的名称和值
      for (const [key, value] of Object.entries(props)) {
        if (value.type === 'title') {
          console.log(`📝 ${key}: ${value.title?.[0]?.plain_text || '(空)'}`);
        } else if (value.type === 'rich_text') {
          console.log(`📄 ${key}: ${value.rich_text?.[0]?.plain_text || '(空)'}`);
        } else if (value.type === 'multi_select') {
          const selections = value.multi_select.map(s => s.name).join(', ');
          console.log(`🏷️ ${key}: [${selections}]`);
        } else if (value.type === 'select') {
          console.log(`🔘 ${key}: ${value.select?.name || '(空)'}`);
        } else if (value.type === 'number') {
          console.log(`🔢 ${key}: ${value.number}`);
        } else {
          console.log(`📎 ${key}: ${value.type}`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

debug();