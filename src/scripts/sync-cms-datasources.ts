
import { config } from 'dotenv';
config();

import prisma from '../lib/prisma';
import { DataSourceService } from '../services/DataSourceService';

const dataSourceService = new DataSourceService();

async function main() {
  console.log('Iniciando sincronização de DataSources do CMS...');

  const contentTypes = await prisma.cmsContentType.findMany();
  console.log(`Encontrados ${contentTypes.length} tipos de conteúdo CMS.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const contentType of contentTypes) {
    const existing = await prisma.dataSource.findFirst({
      where: {
        userId: contentType.userId,
        type: 'CMS',
        integrationId: contentType.id
      }
    });

    if (!existing) {
      console.log(`Criando DataSource para: ${contentType.name}`);
      await dataSourceService.createDataSource(contentType.userId, {
        name: `CMS: ${contentType.name}`,
        type: 'CMS',
        integrationId: contentType.id,
        status: 'ACTIVE'
      });
      createdCount++;
    } else {
      // Opcional: Atualizar nome se necessário
      if (existing.name !== `CMS: ${contentType.name}`) {
         console.log(`Atualizando nome do DataSource para: ${contentType.name}`);
         await prisma.dataSource.update({
             where: { id: existing.id },
             data: { name: `CMS: ${contentType.name}` }
         });
         updatedCount++;
      }
    }
  }

  console.log(`Sincronização concluída!`);
  console.log(`Criados: ${createdCount}`);
  console.log(`Atualizados: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
