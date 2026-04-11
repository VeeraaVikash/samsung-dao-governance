import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function splitReputation(
  reputation: number,
  voteCount: number,
  proposalCount: number,
  delegationCount: number
) {
  const act = voteCount + proposalCount + delegationCount;
  if (act === 0 || reputation === 0) {
    return {
      participation: 0,
      proposals: 0,
      delegation: 0,
      tenure: 0,
      total: reputation,
    };
  }
  let participation = Math.round((reputation * voteCount) / act);
  let proposals = Math.round((reputation * proposalCount) / act);
  let delegation = Math.round((reputation * delegationCount) / act);
  const sum = participation + proposals + delegation;
  const remainder = reputation - sum;
  participation += remainder;
  return {
    participation,
    proposals,
    delegation,
    tenure: 0,
    total: reputation,
  };
}

export const MemberController = {
  async getMetrics(req: Request, res: Response) {
    try {
      const userId = (req as Request & { user?: { uid: string } }).user?.uid;
      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ where: { firebase_uid: userId } });
      }

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const activeElectionsCount = await prisma.election.count({
        where: { status: 'LIVE' },
      });

      const proposalsCreated = await prisma.proposal.count({
        where: { created_by: user.id },
      });

      const totalProposals = await prisma.proposal.count();

      const rewards = await prisma.rewardTransaction.aggregate({
        where: { user_id: user.id, type: 'TOKEN' },
        _sum: { amount: true },
      });
      const spuEarned = Number(rewards._sum.amount || 0);

      const approvedProposals = await prisma.proposal.count({
        where: {
          created_by: user.id,
          status: { in: ['APPROVED', 'PASSED', 'EXECUTED'] },
        },
      });

      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const repThisMonth = await prisma.rewardTransaction.aggregate({
        where: {
          user_id: user.id,
          type: 'TOKEN',
          created_at: { gte: monthStart },
        },
        _sum: { amount: true },
      });
      const reputationDeltaThisMonth = Math.round(Number(repThisMonth._sum.amount || 0));

      res.json({
        reputationScore: user.reputation || 0,
        activeVotes: activeElectionsCount,
        proposalsCreated,
        spuEarned,
        totalProposals,
        approvedProposals,
        reputationDeltaThisMonth,
      });
    } catch (error) {
      console.error('getMetrics:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getDashboardData(req: Request, res: Response) {
    try {
      const uid = (req as Request & { user?: { uid: string } }).user?.uid;
      const user = uid
        ? await prisma.user.findUnique({ where: { firebase_uid: uid } })
        : null;

      const activeElections = await prisma.election.findMany({
        where: { status: 'LIVE' },
        include: { candidates: true },
        orderBy: { end_date: 'asc' },
        take: 1,
      });

      let activeElection: Record<string, unknown> | null = null;
      const raw = activeElections[0];
      if (raw) {
        const counts = await prisma.electionVote.groupBy({
          by: ['candidate_id'],
          where: { election_id: raw.id },
          _count: { id: true },
        });
        const countMap = new Map(counts.map((c) => [c.candidate_id, c._count.id]));
        const totalVotes = counts.reduce((s, c) => s + c._count.id, 0);

        let userVotedCandidateId: string | null = null;
        if (user) {
          const mine = await prisma.electionVote.findFirst({
            where: { election_id: raw.id, user_id: user.id },
          });
          userVotedCandidateId = mine?.candidate_id ?? null;
        }

        activeElection = {
          ...raw,
          candidates: raw.candidates.map((c) => {
            const n = countMap.get(c.id) ?? 0;
            const percentage = totalVotes > 0 ? Math.round((n / totalVotes) * 1000) / 10 : 0;
            return {
              ...c,
              voteCount: n,
              percentage,
            };
          }),
          totalVotes,
          userVotedCandidateId,
        };
      }

      const recentProposals = await prisma.proposal.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
          creator: { select: { name: true } },
        },
      });

      let reputationBreakdown = {
        participation: 0,
        proposals: 0,
        delegation: 0,
        tenure: 0,
        total: 0,
      };
      if (user) {
        const [voteCount, proposalCount, delegationCount] = await Promise.all([
          prisma.signalingVote.count({ where: { user_id: user.id } }),
          prisma.proposal.count({ where: { created_by: user.id } }),
          prisma.delegation.count({ where: { from_user_id: user.id } }),
        ]);
        reputationBreakdown = splitReputation(
          user.reputation || 0,
          voteCount,
          proposalCount,
          delegationCount
        );
      }

      const lotteries = await prisma.lottery.findMany({
        where: { draw_date: { gt: new Date() } },
        orderBy: { draw_date: 'asc' },
        take: 1,
      });

      const giveaways = await prisma.giveaway.findMany({
        where: { closes_at: { gt: new Date() } },
        orderBy: { closes_at: 'asc' },
        take: 1,
      });

      let lotteryPreview: {
        lottery: (typeof lotteries)[0];
        entered: boolean;
      } | null = null;
      if (lotteries[0] && user) {
        const ent = await prisma.lotteryEntry.findUnique({
          where: {
            lottery_id_user_id: { lottery_id: lotteries[0].id, user_id: user.id },
          },
        });
        lotteryPreview = { lottery: lotteries[0], entered: !!ent };
      } else if (lotteries[0]) {
        lotteryPreview = { lottery: lotteries[0], entered: false };
      }

      let giveawayPreview: {
        giveaway: (typeof giveaways)[0];
        registered: boolean;
      } | null = null;
      if (giveaways[0] && user) {
        const reg = await prisma.giveawayEntry.findUnique({
          where: {
            giveaway_id_user_id: { giveaway_id: giveaways[0].id, user_id: user.id },
          },
        });
        giveawayPreview = { giveaway: giveaways[0], registered: !!reg };
      } else if (giveaways[0]) {
        giveawayPreview = { giveaway: giveaways[0], registered: false };
      }

      res.json({
        activeElection,
        recentProposals,
        reputationBreakdown,
        lotteryPreview,
        giveawayPreview,
      });
    } catch (error) {
      console.error('getDashboardData:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getDelegations(req: Request, res: Response) {
    try {
      const uid = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const rows = await prisma.delegation.findMany({
        where: { from_user_id: user.id },
        include: {
          to_user: { select: { id: true, name: true, email: true, department: true } },
        },
        orderBy: { created_at: 'desc' },
      });

      res.json({
        delegations: rows.map((d) => ({
          id: d.id,
          name: d.to_user.name,
          email: d.to_user.email,
          department: d.to_user.department,
        })),
      });
    } catch (error) {
      console.error('getDelegations:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const uid = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const votes = await prisma.signalingVote.findMany({
        where: { user_id: user.id },
        include: { proposal: { select: { title: true, status: true } } },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const proposals = await prisma.proposal.findMany({
        where: { created_by: user.id },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const lotteryParticipants = await prisma.lotteryParticipant.findMany({
        where: { user_id: user.id },
        include: {
          event: { select: { created_at: true, proposal: { select: { title: true } } } },
        },
        orderBy: { id: 'desc' },
        take: 5,
      });

      const lotteryEntries = await prisma.lotteryEntry.findMany({
        where: { user_id: user.id },
        include: { lottery: true },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const giveawayEntries = await prisma.giveawayEntry.findMany({
        where: { user_id: user.id },
        include: { giveaway: true },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const electionVotes = await prisma.electionVote.findMany({
        where: { user_id: user.id },
        include: {
          election: { select: { title: true } },
          candidate: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const delegOut = await prisma.delegation.findMany({
        where: { from_user_id: user.id },
        include: { to_user: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const delegIn = await prisma.delegation.findMany({
        where: { to_user_id: user.id },
        include: { from_user: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 8,
      });

      const timeline: {
        type: string;
        date: Date;
        title: string;
        detail: string;
      }[] = [];

      votes.forEach((v) =>
        timeline.push({
          type: 'VOTE',
          date: v.created_at,
          title: `Voted on ${v.proposal.title}`,
          detail: `Vote: ${v.vote_type}`,
        })
      );
      proposals.forEach((p) =>
        timeline.push({
          type: 'PROPOSAL',
          date: p.created_at,
          title: `Proposal: ${p.title}`,
          detail: `Status: ${p.status.toLowerCase()}`,
        })
      );
      lotteryParticipants.forEach((lp) =>
        timeline.push({
          type: 'LOTTERY',
          date: lp.event.created_at,
          title: lp.event.proposal?.title ?? 'Lottery event',
          detail: 'Lottery participation',
        })
      );
      lotteryEntries.forEach((le) =>
        timeline.push({
          type: 'LOTTERY',
          date: le.created_at,
          title: le.lottery.title,
          detail: `Entered · Prize: ${le.lottery.prize}`,
        })
      );
      giveawayEntries.forEach((ge) =>
        timeline.push({
          type: 'GIVEAWAY',
          date: ge.created_at,
          title: ge.giveaway.title,
          detail: `Registered · Prize: ${ge.giveaway.prize}`,
        })
      );
      electionVotes.forEach((ev) =>
        timeline.push({
          type: 'VOTE',
          date: ev.created_at,
          title: ev.election.title,
          detail: `Candidate: ${ev.candidate.name}`,
        })
      );
      delegOut.forEach((d) =>
        timeline.push({
          type: 'DELEGATION',
          date: d.created_at,
          title: `Delegated to ${d.to_user.name}`,
          detail: 'Outgoing delegation',
        })
      );
      delegIn.forEach((d) =>
        timeline.push({
          type: 'DELEGATION',
          date: d.created_at,
          title: `Received delegation from ${d.from_user.name}`,
          detail: 'Incoming delegation',
        })
      );

      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

      res.json({ history: timeline.slice(0, 25) });
    } catch (error) {
      console.error('getHistory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
