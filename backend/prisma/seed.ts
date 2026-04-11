import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HQS = [
  { id: 'INDIA', name: 'India HQ (Noida / Gurgaon)', region: 'APAC', timezone: 'Asia/Kolkata' },
  { id: 'USA', name: 'North America HQ (New Jersey / Texas)', region: 'AMERICAS', timezone: 'America/New_York' },
  { id: 'KOREA', name: 'Korea HQ (Suwon – Global HQ)', region: 'KOREA', timezone: 'Asia/Seoul' },
  { id: 'EUROPE', name: 'Europe HQ (UK / Germany – Munich)', region: 'EMEA', timezone: 'Europe/Berlin' },
  { id: 'UAE', name: 'Middle East HQ (UAE – Dubai)', region: 'EMEA', timezone: 'Asia/Dubai' },
  { id: 'AFRICA', name: 'Africa HQ (South Africa – Johannesburg)', region: 'EMEA', timezone: 'Africa/Johannesburg' },
  { id: 'CHINA', name: 'China HQ (Beijing)', region: 'GREATER_CHINA', timezone: 'Asia/Shanghai' },
  { id: 'HONG_KONG', name: 'Hong Kong HQ', region: 'GREATER_CHINA', timezone: 'Asia/Hong_Kong' },
  { id: 'TAIWAN', name: 'Taiwan HQ (Taipei)', region: 'GREATER_CHINA', timezone: 'Asia/Taipei' },
  { id: 'SINGAPORE', name: 'Southeast Asia HQ (Singapore)', region: 'APAC', timezone: 'Asia/Singapore' },
  { id: 'AUSTRALIA', name: 'Oceania HQ (Australia – Sydney)', region: 'APAC', timezone: 'Australia/Sydney' },
  { id: 'CANADA', name: 'Canada HQ (Toronto)', region: 'AMERICAS', timezone: 'America/Toronto' },
  { id: 'BRAZIL', name: 'Latin America HQ (Brazil – São Paulo)', region: 'AMERICAS', timezone: 'America/Sao_Paulo' },
  { id: 'SEMICONDUCTOR', name: 'Global Device Solutions HQ (Semiconductor)', region: 'KOREA', timezone: 'Asia/Seoul' },
  { id: 'DIGITAL_CITY', name: 'Samsung Digital City (Strategic HQ / R&D)', region: 'KOREA', timezone: 'Asia/Seoul' },
  { id: 'GLOBAL', name: 'Global Fallback HQ', region: 'GLOBAL', timezone: 'Etc/UTC' },
];

async function main() {
  console.log('Seeding HQ master table...');

  for (const hq of HQS) {
    await prisma.hQ.upsert({
      where: { id: hq.id },
      update: { name: hq.name, region: hq.region, timezone: hq.timezone },
      create: hq,
    });
  }

  console.log(`Seeded ${HQS.length} HQ records successfully.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
