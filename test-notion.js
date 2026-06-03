import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function test() {
  console.log('🔍 正在测试 Notion 连接...');
  
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;
  
  console.log(`Token: ${apiKey ? apiKey.substring(0, 15) + '...' : '未设置'}`);
  console.log(`Database ID: ${dbId || '未设置'}`);
  
  if (!apiKey || !dbId) {
    console.error('❌ 请先在 .env 文件中设置 NOTION_API_KEY 和 NOTION_DATABASE_ID');
    return;
  }
  
  const notion = new Client({ auth: apiKey });
  
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      page_size: 3
    });
    
    console.log(`\n✅ Notion 连接成功！`);
    console.log(`📊 数据库中共有 ${response.results.length} 条数据`);
    
    response.results.forEach((page, i) => {
      console.log(`\n第 ${i+1} 条：`);
      const title = page.properties['鱼种名称']?.title?.[0]?.plain_text;
      console.log(`  名称: ${title || '未找到'}`);
    });
    
  } catch (error) {
    console.error('\n❌ 连接失败：', error.message);
    if (error.code === 'unauthorized') {
      console.log('  → Token 无效，请检查 .env 中的 NOTION_API_KEY');
    } else if (error.code === 'object_not_found') {
      console.log('  → Database ID 无效或 Integration 未连接到数据库');
    }
  }
}

test();