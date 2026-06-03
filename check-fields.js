import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function checkFields() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 1
    });
    
    if (response.results.length > 0) {
      const properties = response.results[0].properties;
      console.log('📋 您的数据库字段列表：\n');
      for (const [key, value] of Object.entries(properties)) {
        console.log(`  - ${key} (${value.type})`);
      }
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkFields();