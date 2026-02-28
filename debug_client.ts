import dotenv from 'dotenv';
dotenv.config();
import prisma from './src/lib/prisma';

async function main() {
  const slug = 'demo-client';

  try {
    const user: any = await prisma.user.findUnique({
      where: { slug },
      include: {
        credentials: true,
        dataSources: true,
        products: true,
        cmsTypes: true,
        services: {
          include: {
            checkoutSettings: true
          }
        }
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n--- USER INFO ---');
    console.log('ID:', user.id);
    console.log('Slug:', user.slug);
    
    console.log('\n--- CMS CONTENT TYPES ---');
    if (user.cmsTypes && user.cmsTypes.length > 0) {
      user.cmsTypes.forEach((ct: any) => {
        console.log(`- ${ct.name} (ID: ${ct.id}, Slug: ${ct.slug}, Resolver: ${ct.resolver})`);
      });
    } else {
      console.log('No content types found');
    }

    console.log('\n--- STRIPE CREDENTIALS ---');
    if (user.credentials) {
      const stripeCred = user.credentials.find((c: any) => c.serviceName === 'STRIPE');
      if (stripeCred) {
        console.log('Connected:', true);
        console.log('API Key (Publishable):', stripeCred.apiKey);
        console.log('API Secret (Secret):', stripeCred.apiSecret ? 'Present' : 'Missing');
        console.log('Meta:', JSON.stringify(stripeCred.meta, null, 2));
      } else {
        console.log('Stripe not connected');
      }
    }

    console.log('\n--- PRODUCTS ---');
    if (user.products && user.products.length > 0) {
      user.products.forEach((p: any) => {
        console.log(`- ${p.name} (ID: ${p.id})`);
        console.log(`  Price: ${p.price}`);
        console.log(`  Variants (Stripe IDs):`, JSON.stringify(p.variants, null, 2));
      });
    } else {
      console.log('No products found');
    }

    console.log('\n--- DATA SOURCES ---');
    if (user.dataSources && user.dataSources.length > 0) {
      user.dataSources.forEach((ds: any) => {
        console.log(`- ${ds.name} (${ds.type}) - Status: ${ds.status}`);
      });
    } else {
      console.log('No data sources found');
    }

    console.log('\n--- SERVICES & CHECKOUT ---');
    if (user.services && user.services.length > 0) {
      user.services.forEach((s: any) => {
        console.log(`- Service: ${s.title} (ID: ${s.id})`);
        if (s.checkoutSettings) {
          console.log(`  Checkout Settings: Present`);
          console.log(`  Config:`, JSON.stringify(s.checkoutSettings, null, 2));
        } else {
          console.log(`  No checkout settings for this service`);
        }
      });
    } else {
      console.log('No services found');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
