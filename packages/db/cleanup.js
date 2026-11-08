const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'postgresql://atlas:atlas_dev_password@localhost:5432/atlas_db' } } });
const MID = 'cmug3yat400007vs45kjrhz6v';
p.apiKey.deleteMany({ where: { merchantId: MID } })
  .then(() => p.merchant.delete({ where: { id: MID } }))
  .then(() => { console.log('Old account cleared. You can now re-register with the same email.'); })
  .catch(e => { console.log('Note:', e.message); })
  .finally(() => p.$disconnect());
