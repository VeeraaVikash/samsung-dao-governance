import { PrismaClient, Role } from '@prisma/client';
import { deriveHQ } from '../utils/deriveHQ';

const prisma = new PrismaClient();

export class AuthService {
  static async councilLogin(firebaseUser: { uid: string; email: string }, timezone: string = 'UTC') {
    const { uid: firebaseUid, email } = firebaseUser;

    // Derive HQ
    const hq = deriveHQ(email, timezone);
    const alias = `${hq}_COUNCIL`;
    if (!hq) {
      throw new Error('HQ missing');
    }

    // 1. Validate HQ exists in master table
    const hqExists = await prisma.hQ.findUnique({ where: { id: hq } });
    if (!hqExists) {
      throw new Error(`Invalid HQ: ${hq}. Not found in master HQ table.`);
    }

    // 2. Lookup user by email OR firebase_uid to avoid unique constraint collisions
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { firebase_uid: firebaseUid }
        ]
      }
    });

    if (user) {
      // Update existing user to COUNCIL role and enforce HQ & alias
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebase_uid: firebaseUid, // Ensure UID is current
          email, // Ensure email is current
          role: Role.COUNCIL,
          hq,
          alias,
          last_seen_at: new Date()
        }
      });
    } else {
      console.log('Creating new user WITH role: COUNCIL');
      user = await prisma.user.create({
        data: {
          firebase_uid: firebaseUid,
          email,
          name: alias,
          role: Role.COUNCIL,
          hq,
          alias,
          last_seen_at: new Date()
        }
      });
    }

    // Check if the HQ wallet is already provisioned
    const hqWallet = await prisma.hQWallet.findFirst({
      where: { hq }
    });

    const isWalletCreated = !!hqWallet;
    if (hqWallet && user.hq_wallet_id !== hqWallet.id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          hq_wallet_id: hqWallet.id,
          is_wallet_created: true
        }
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hq: user.hq,
        alias: user.alias,
      },
      walletDetails: hqWallet,
      isWalletCreated
    };
  }

  static async memberLogin(firebaseUser: { uid: string; email: string; name?: string }) {
    const { uid: firebaseUid, email, name } = firebaseUser;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ firebase_uid: firebaseUid }, { email }],
      },
    });

    if (user?.role === Role.COUNCIL) {
      throw new Error('COUNCIL_ACCOUNT');
    }

    const displayName = name?.trim() || email.split('@')[0] || 'Member';

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebase_uid: firebaseUid,
          email,
          name: displayName,
          last_seen_at: new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebase_uid: firebaseUid,
          email,
          name: displayName,
          role: Role.MEMBER,
          last_seen_at: new Date(),
        },
      });
    }

    return user;
  }

  static async memberOnboard(firebaseUid: string, nickname: string) {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
    });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.role !== Role.MEMBER) {
      throw new Error('Onboarding is only for members');
    }
    return prisma.user.update({
      where: { id: user.id },
      data: {
        nickname: nickname.trim(),
        is_onboarded: true,
      },
    });
  }
}
