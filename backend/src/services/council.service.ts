import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const CouncilService = {
  async getMetrics() {
    const [activeRules, pendingProposals, eligibleMembers, timelockRule] = await Promise.all([
      prisma.governanceRule.count(),
      prisma.proposal.count({ where: { status: { in: ['DRAFT', 'REVIEW', 'SIGNALING'] } } }),
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.governanceRule.findUnique({ where: { key: 'execution_delay' } }),
    ]);
    return {
      activeRules,
      pendingProposals,
      eligibleMembers,
      timelock: timelockRule ? `${timelockRule.value}h` : '48h',
    };
  },
};
