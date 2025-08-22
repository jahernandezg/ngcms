#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async()=>{ const prisma = new PrismaClient();
 try {
  const items = await prisma.menuItem.findMany({ orderBy: { sortOrder: 'asc' } });
  const shaped = items.map(m=>({ id: m.id, title: m.title, type: m.type, targetId: m.targetId, url: m.url, sortOrder: m.sortOrder }));
  console.log(JSON.stringify(shaped,null,2));
 } catch (e){
  console.error(e);
  process.exit(1);
 } finally { await prisma.$disconnect(); }
})();
