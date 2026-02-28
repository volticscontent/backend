
import { config } from 'dotenv';
config();
import prisma from './src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map((u: any) => ({ id: u.id, name: u.name, slug: u.slug })));
  
  const contentTypes = await prisma.cmsContentType.findMany();
  console.log('Content Types:', contentTypes.map((t: any) => ({ id: t.id, name: t.name, resolver: t.resolver })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
