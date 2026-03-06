const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'nn70nn70@gmail.com' }
    });
    console.log(JSON.stringify(user, null, 2));

    // 如果不存在，我們就先幫他手動改成 ADMIN 試試看
    if (user && user.role !== 'ADMIN') {
        const updated = await prisma.user.update({
            where: { email: 'nn70nn70@gmail.com' },
            data: { role: 'ADMIN' }
        });
        console.log('Updated to ADMIN:', JSON.stringify(updated, null, 2));
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
