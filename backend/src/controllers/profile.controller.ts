import { Request, Response } from 'express';
import { getProfile } from '../services/profile.service';

export const ProfileController = {
  async me(req: Request, res: Response) {
    try {
      const firebaseUser = req.user;
      if (!firebaseUser?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const profile = await getProfile(firebaseUser.uid);
      if (!profile) {
        return res.status(404).json({ error: 'User not initialized' });
      }

      res.status(200).json(profile);
    } catch (error: unknown) {
      console.error('ProfileController.me:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
