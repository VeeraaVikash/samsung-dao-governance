import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const EventService = {
  // Giveaway
  async listGiveaways() {
    return prisma.giveaway.findMany({ orderBy: { created_at: 'desc' } });
  },
  async createGiveaway(data: {
    title: string;
    prize: string;
    description?: string;
    closesAt: string;
    requireKyc?: boolean;
    allowMultiple?: boolean;
    createdBy?: string;
  }) {
    return prisma.giveaway.create({
      data: {
        title: data.title,
        prize: data.prize,
        description: data.description,
        closes_at: new Date(data.closesAt),
        require_kyc: data.requireKyc ?? false,
        allow_multiple: data.allowMultiple ?? false,
        created_by: data.createdBy,
      },
    });
  },

  // Lottery
  async listLotteries() {
    return prisma.lottery.findMany({ orderBy: { created_at: 'desc' } });
  },
  async createLottery(data: {
    title: string;
    prize: string;
    drawDate: string;
    minReputation?: number;
    isOnchainRandom?: boolean;
    createdBy?: string;
  }) {
    return prisma.lottery.create({
      data: {
        title: data.title,
        prize: data.prize,
        draw_date: new Date(data.drawDate),
        min_reputation: data.minReputation ?? 0,
        is_onchain_random: data.isOnchainRandom ?? false,
        created_by: data.createdBy,
      },
    });
  },
};
