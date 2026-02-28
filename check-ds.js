const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
    const ds = await p.dataSource.findMany({
        where: { user: { slug: 'demo-client' } },
        select: { id: true, name: true, type: true, status: true }
    })
    console.log(JSON.stringify(ds, null, 2))
    await p.$disconnect()
}
main()
