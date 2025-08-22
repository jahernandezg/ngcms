/*
 Backfill script para poblar MenuItem.slug basado en title si vacío.
 Ejecutar tras migración que añade columna slug.
 Usage:
  npx ts-node -T scripts/backfill-menu-slugs.ts
*/
import { PrismaClient } from '@prisma/client';
import { kebabCase } from './util-kebab';

const prisma = new PrismaClient();

async function main(){
  const items = await prisma.menuItem.findMany();
  const updates: { id:string; slug:string }[] = [];
  for (const item of items){
    const existing = (item as unknown as { slug?: string }).slug;
    if (existing && existing.trim().length>0) continue;
    const base = kebabCase(item.title);
    let slug = base;
    let n=1;
    // garantizar unicidad por parentId
    while (await prisma.menuItem.findFirst({ where: { parentId: item.parentId, slug } })){
      slug = `${base}-${n++}`;
    }
    await prisma.menuItem.update({ where: { id: item.id }, data: { slug } });
    updates.push({ id: item.id, slug });
  }
  // Emitir resumen con console.error (permitido por lint configurado)
  if (updates.length){
    console.error(`Backfill slugs completado: ${updates.length} items`);
  } else {
    console.error('Backfill slugs: no se requirieron cambios');
  }
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
