import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma';

async function main() {
  const email = 'demo@client.com';
  const password = 'password123';
  const slug = 'demo-client';
  const name = 'Demo Client';

  try {
    // 1. Check if user exists by slug first
    let user = await prisma.user.findUnique({ where: { slug } });

    if (!user) {
        // Then try email
        user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      console.log('Creating demo user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          slug,
          name,
        }
      });
      console.log('Demo user created:', user.id);
    } else {
      console.log('Demo user already exists:', user.id);
    }

    // 2. Generate token
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign({ 
      id: user.id, 
      role: 'OWNER', 
      slug: user.slug,
      memberId: null
    }, secret, { expiresIn: '1d' });

    console.log('\n--- AUTH TOKEN ---');
    console.log(token);
    console.log('------------------\n');

    // 3. Find a product for this user
    const product = await prisma.product.findFirst({ where: { userId: user.id } });
    if (product) {
        console.log('Sample Product ID:', product.id);
    } else {
        console.log('No products found for this user. Creating one...');
        const newProduct = await prisma.product.create({
            data: {
                name: 'Test Product',
                description: 'Description',
                price: 100,
                userId: user.id
            }
        });
        console.log('Created Product ID:', newProduct.id);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
