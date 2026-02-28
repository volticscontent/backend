
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }
  
  const user = users[0];
  console.log(`Checking products for user: ${user.slug} (${user.id})`);

  const products = await prisma.product.findMany({
    where: { userId: user.id }
  });

  console.log(`Found ${products.length} products.`);
  
  const manualProducts = products.filter(p => p.source !== 'CMS');
  const cmsProducts = products.filter(p => p.source === 'CMS');

  console.log(`CMS Products: ${cmsProducts.length}`);
  console.log(`Manual/Other Products: ${manualProducts.length}`);

  if (manualProducts.length > 0) {
    console.log('Sample Manual Product:', manualProducts[0]);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
