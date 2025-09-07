#!/usr/bin/env node

/**
 * 构建后验证脚本
 * 检查翻译文件是否正确构建和加载
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证构建结果...');

// 检查翻译文件是否存在
const localesDir = path.join(__dirname, '../public/locales');
const languages = ['en', 'zh'];

let hasErrors = false;

languages.forEach(lang => {
  const langDir = path.join(localesDir, lang);
  const commonFile = path.join(langDir, 'common.json');
  
  if (!fs.existsSync(commonFile)) {
    console.error(`❌ 缺少翻译文件: ${commonFile}`);
    hasErrors = true;
    return;
  }
  
  try {
    const content = JSON.parse(fs.readFileSync(commonFile, 'utf8'));
    
    // 检查关键的翻译键是否存在
    const requiredKeys = [
      'nav.home',
      'auth.login',
      'auth.register',
      'time.justNow',
      'fileSize.mb'
    ];
    
    requiredKeys.forEach(key => {
      const keys = key.split('.');
      let current = content;
      
      for (const k of keys) {
        if (!current || !current[k]) {
          console.error(`❌ ${lang} 缺少翻译键: ${key}`);
          hasErrors = true;
          return;
        }
        current = current[k];
      }
    });
    
    console.log(`✅ ${lang} 翻译文件验证通过`);
    
  } catch (error) {
    console.error(`❌ ${lang} 翻译文件格式错误:`, error.message);
    hasErrors = true;
  }
});

// 检查 .next 构建目录
const nextDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextDir)) {
  console.log('✅ Next.js 构建目录存在');
} else {
  console.error('❌ Next.js 构建目录不存在');
  hasErrors = true;
}

if (hasErrors) {
  console.error('❌ 构建验证失败');
  process.exit(1);
} else {
  console.log('✅ 构建验证通过');
  process.exit(0);
}