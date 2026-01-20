import prisma from "../lib/prisma";

export class SeoService {
  async getSettings(userId: string) {
    let settings = await prisma.seoSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.seoSettings.create({
        data: {
          userId,
          targetKeywords: [], // Inicializa com array vazio
        },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, data: any) {
    return prisma.seoSettings.upsert({
      where: { userId },
      update: {
        globalTitle: data.globalTitle,
        globalDescription: data.globalDescription,
        googleSearchConsoleId: data.googleSearchConsoleId,
        googleAnalyticsId: data.googleAnalyticsId,
        targetKeywords: data.targetKeywords ?? [],
      },
      create: {
        userId,
        globalTitle: data.globalTitle,
        globalDescription: data.globalDescription,
        googleSearchConsoleId: data.googleSearchConsoleId,
        googleAnalyticsId: data.googleAnalyticsId,
        targetKeywords: data.targetKeywords ?? [],
      },
    });
  }
}
