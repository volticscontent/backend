import prisma from "../lib/prisma";
import { randomBytes } from "crypto";

export class CredentialService {
  /**
   * Cria uma nova credencial (API Key) para o usuário.
   * @param userId ID do usuário
   * @param name Nome da credencial (ex: "Integração Vercel", "CMS Mobile App")
   */
  async createCredential(userId: string, name: string) {
    // Gera uma chave aleatória de 32 bytes (64 caracteres hex)
    // Prefixo 'sk_' para indicar Secret Key
    const apiKey = `sk_${randomBytes(24).toString('hex')}`;

    return prisma.credential.create({
      data: {
        userId,
        serviceName: name,
        apiKey: apiKey,
        // apiSecret não é estritamente necessário se a apiKey já for longa e aleatória o suficiente,
        // mas podemos usar para assinatura HMAC no futuro. Por enquanto, null.
      }
    });
  }

  /**
   * Lista todas as credenciais do usuário.
   * Oculta a apiKey completa por segurança, retornando apenas os últimos caracteres.
   */
  async listCredentials(userId: string) {
    const credentials = await prisma.credential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Retorna mascarado para listagem, mas o create retorna full
    return credentials.map(c => ({
      ...c,
      apiKey: `${c.apiKey.substring(0, 7)}...${c.apiKey.substring(c.apiKey.length - 4)}`
    }));
  }

  /**
   * Revoga (deleta) uma credencial.
   */
  async deleteCredential(userId: string, id: string) {
    // Verifica propriedade antes de deletar
    const cred = await prisma.credential.findUnique({ where: { id } });
    
    if (!cred || cred.userId !== userId) {
        throw new Error("Credential not found or access denied");
    }

    return prisma.credential.delete({
      where: { id }
    });
  }

  /**
   * Valida uma API Key e retorna o usuário associado.
   * Usado pelo Middleware.
   */
  async validateApiKey(apiKey: string) {
    const credential = await prisma.credential.findFirst({
        where: { apiKey },
        include: { user: true }
    });

    if (!credential) return null;

    return credential.user;
  }
}
