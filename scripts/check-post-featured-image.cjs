#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async ()=> {
  try {
    const info = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='Post' AND column_name='featuredImage'");
    console.warn('information_schema_result', info);
    let selectErr = null;
    try {
      const sample = await prisma.post.findFirst({ select: { id: true, featuredImage: true }});
      console.warn('select_sample_ok', sample);
    } catch(e) { selectErr = e; console.error('select_failed', e); }
    if (!info.length) {
      console.error('COLUMN_MISSING');
      process.exit(2);
    }
    if (selectErr) process.exit(3);
  } catch(e) {
    console.error('GENERAL_ERROR', e);
    process.exit(1);
  } finally { await prisma.$disconnect(); }
})();
