const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = ['面紙', '扇子'];
    for (const name of categories) {
        await prisma.itemCategory.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }
    console.log('Seeded categories:', categories);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
