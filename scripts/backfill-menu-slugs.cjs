/* Backfill MenuItem.slug (solo ejecutar una vez tras migración) */
const { PrismaClient } = require('@prisma/client');
const { kebabCase } = require('./util-kebab.cjs');
const prisma = new PrismaClient();

async function main(){
  const items = await prisma.menuItem.findMany();
  let updated = 0;
  for (const item of items){
    const existing = item.slug; // si ya existe, saltar
    if (existing && existing.trim().length>0) continue;
    const base = kebabCase(item.title);
    let slug = base; let n=1;
    while (await prisma.menuItem.findFirst({ where: { parentId: item.parentId, slug } })){
      slug = `${base}-${n++}`;
    }
    await prisma.menuItem.update({ where: { id: item.id }, data: { slug } });
    updated++;
  }
  console.error(`Backfill slugs: ${updated} registros actualizados`);
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
