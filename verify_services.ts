
import 'dotenv/config';
import prisma from './src/lib/prisma';

async function main() {
  const email = "contato@demo.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      services: {
        where: { status: 'ACTIVE' },
        include: {
          modules: true
        }
      }
    }
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log(`User: ${user.name} (${user.email})`);
  console.log("Active Services:");
  user.services.forEach(service => {
    console.log(`- ${service.title} (ID: ${service.id})`);
    console.log(`  Features: ${JSON.stringify(service.features)}`);
    console.log(`  Modules: ${service.modules.map(m => m.key).join(', ')}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
