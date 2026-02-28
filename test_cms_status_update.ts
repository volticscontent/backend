
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { CmsService } from './src/services/CmsService'
import { CmsProductService } from './src/services/CmsProductService'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Mock the services to use the same prisma instance if possible, 
// but since they import prisma from lib, we might need to be careful.
// However, since we are running a standalone script, the global prisma in lib/prisma.ts 
// will be initialized separately. 
// To avoid connection limits or conflicts, we should try to reuse the prisma instance 
// or just rely on the fact that the services will create their own connection.
// 
// BETTER APPROACH: Use the services directly. They will use the default prisma instance.
// But we need to ensure the default prisma instance works in this environment (ts-node).
// The default prisma instance in src/lib/prisma.ts uses `process.env.DATABASE_URL`.
// So as long as we load dotenv, it should be fine.

// We will use the services directly.
const cmsService = new CmsService();

async function main() {
  console.log('Starting CMS Status Update Test...');

  // 1. Find a user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found');
    return;
  }
  console.log(`User found: ${user.slug} (${user.id})`);

  // 2. Create or Find "products" Content Type
  let contentType = await prisma.cmsContentType.findUnique({
    where: { userId_slug: { userId: user.id, slug: 'products' } }
  });

  if (!contentType) {
    console.log('Creating "products" content type...');
    contentType = await cmsService.createContentType(user.id, {
        name: 'Products',
        slug: 'products',
        resolver: 'products',
        fields: [
            { key: 'name', label: 'Nome', type: 'text', required: true },
            { key: 'price', label: 'Preço', type: 'number', required: true },
            { key: 'description', label: 'Descrição', type: 'richtext', required: false }
        ]
    });
  } else {
      console.log('Found existing "products" content type.');
      // Update resolver if not set
      if (contentType.resolver !== 'products') {
          console.log('Updating resolver to "products"...');
          contentType = await prisma.cmsContentType.update({
              where: { id: contentType.id },
              data: { resolver: 'products' }
          });
      }
  }

  // 3. Create a CMS Entry in DRAFT
  console.log('Creating CMS Entry in DRAFT...');
  const entryData = {
      name: 'Test Product Draft',
      price: 100,
      description: 'This is a test product in draft'
  };
  
  const entry = await cmsService.createContentEntry(
      user.id, 
      contentType!.id, 
      entryData, 
      'DRAFT'
  );
  console.log(`Entry created: ${entry.id} (Status: ${entry.status})`);

  // Verify it is DRAFT
  if (entry.status !== 'DRAFT') {
      console.error('FAILED: Entry should be DRAFT');
      return;
  }

  // 4. Update to PUBLISHED
  console.log('Updating Entry to PUBLISHED...');
  const updatedEntry = await cmsService.updateContentEntry(
      user.id, 
      entry.id, 
      entryData, 
      'PUBLISHED'
  );
  console.log(`Entry updated: ${updatedEntry.id} (Status: ${updatedEntry.status})`);

  // 5. Verify Status
  if (updatedEntry.status !== 'PUBLISHED') {
      console.error('FAILED: Entry status did not update to PUBLISHED');
  } else {
      console.log('SUCCESS: Entry status updated to PUBLISHED');
  }

  // 6. Verify Product Sync
  console.log('Verifying Product Sync...');
  const products = await prisma.product.findMany({
      where: {
          userId: user.id,
          tags: { has: `cms:${entry.id}` }
      }
  });

  if (products.length > 0) {
      console.log(`SUCCESS: Found ${products.length} synced product(s).`);
      console.log(`Product Source: ${products[0].source}`);
      console.log(`Product Active: ${products[0].active}`);
  } else {
      console.error('FAILED: No synced product found.');
  }

  // Cleanup
  console.log('Cleaning up...');
  await cmsService.deleteContentEntry(user.id, entry.id);
  // Deleting the entry should also delete the product if logic is correct, or we might need to delete manually
  // CmsService.deleteContentEntry handles product deletion if it's a CMS product? 
  // Let's check CmsService.deleteContentEntry logic later.
  // For now, let's manually delete the product if it exists to keep DB clean
  if (products.length > 0) {
      await prisma.product.delete({ where: { id: products[0].id } });
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
