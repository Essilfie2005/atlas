const { PrismaClient } = require('@prisma/client');
const { createHash, randomBytes } = require('crypto');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://atlas:atlas_dev_password@localhost:5432/atlas_db' } }
});

async function main() {
  const merchants = await prisma.merchant.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, legalName: true }
  });

  console.log('Found merchants:', JSON.stringify(merchants, null, 2));

  if (merchants.length === 0) {
    console.log('No merchants found — please register first at http://localhost:3001/register');
    return;
  }

  const m = merchants[0];
  const secret = randomBytes(32).toString('hex');
  const rawKey = `sk_test_${secret}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 16);

  await prisma.apiKey.create({
    data: {
      merchantId: m.id,
      name: 'Recovery Key',
      type: 'TEST',
      keyHash,
      keyPrefix,
      scopes: [],
      status: 'ACTIVE',
    }
  });

  console.log('\n========================================');
  console.log('MERCHANT:', m.legalName, '/', m.email);
  console.log('YOUR TEST API KEY:');
  console.log(rawKey);
  console.log('========================================');
  console.log('Copy the key above and paste it at http://localhost:3001/login');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
