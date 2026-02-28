
import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/lib/prisma';

// const prisma = new PrismaClient();

async function main() {
  const userId = "cmlyoo8qm000198tf81k9avqi"; // Do JSON do usuário

  console.log("--- CMS Content Types ---");
  const types = await prisma.cmsContentType.findMany({
    where: { userId }
  });
  console.log(JSON.stringify(types, null, 2));

  console.log("\n--- CMS Content Entries ---");
  for (const type of types) {
      console.log(`\nEntries for Type: ${type.name} (${type.id})`);
      const entries = await prisma.cmsContentEntry.findMany({
          where: { contentTypeId: type.id }
      });
      console.log(JSON.stringify(entries, null, 2));
  }

  console.log("\n--- DataSources (CMS) ---");
  const dataSources = await prisma.dataSource.findMany({
      where: { userId, type: 'CMS' }
  });
  console.log(JSON.stringify(dataSources, null, 2));

  console.log("\n--- Native Products ---");
  const products = await prisma.product.findMany({
      where: { userId }
  });
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
