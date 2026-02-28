import dotenv from 'dotenv';
dotenv.config();
import prisma from './src/lib/prisma';

async function main() {
    try {
        const user = await prisma.user.findFirst({ select: { slug: true, id: true } });
        if (!user) {
            console.log('No user found');
            return;
        }
        const product = await prisma.product.findFirst({ 
            where: { userId: user.id }, 
            select: { id: true } 
        });
        console.log(JSON.stringify({ user, product }));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
