import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getProfile } from '../services/profile.service';

const prisma = new PrismaClient();

export const UserController = {
  async me(req: Request, res: Response) {
    try {
      const firebaseUser = (req as Request & { user?: { uid: string } }).user;
      if (!firebaseUser?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { firebase_uid: firebaseUser.uid },
        include: { wallets: true },
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /** Aggregated member profile for portal (identity + wallet summary + stats). */
  async profile(req: Request, res: Response) {
    try {
      const firebaseUser = (req as Request & { user?: { uid: string } }).user;
      if (!firebaseUser?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const [user, profile] = await Promise.all([
        prisma.user.findUnique({ where: { firebase_uid: firebaseUser.uid } }),
        getProfile(firebaseUser.uid),
      ]);

      if (!user || !profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      const spuBalance = await prisma.rewardTransaction.aggregate({
        where: { user_id: user.id, type: 'TOKEN' },
        _sum: { amount: true },
      });

      res.status(200).json({
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        department: user.department,
        role: user.role,
        assigned_hq: profile.hq,
        memberSince: user.created_at.toISOString(),
        kycVerified: user.is_onboarded,
        wallet: {
          ...profile.wallet,
          spuBalance: String(Number(spuBalance._sum.amount ?? 0)),
        },
        stats: profile.stats,
      });
    } catch (error) {
      console.error('UserController.profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
