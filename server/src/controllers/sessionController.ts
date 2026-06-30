import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { LoginSession } from '../auth/entities/login-session.entity';
import { User } from '../users/entities/user.entity';

export const getSessions = async (req: Request, res: Response) => {
  try {
    const userRepository = getRepository(User);
    const sessionRepository = getRepository(LoginSession);
    
    const user = await userRepository.findOneBy({ id: (req.user as any).id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sessions = await sessionRepository.find({ 
      where: { user: { id: user.id }, revokedAt: null },
      order: { createdAt: 'DESC' }
    });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const revokeSession = async (req: Request, res: Response) => {
  try {
    const userRepository = getRepository(User);
    const sessionRepository = getRepository(LoginSession);
    
    const user = await userRepository.findOneBy({ id: (req.user as any).id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await sessionRepository.findOne({
      where: { id: req.params.id, user: { id: user.id } }
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.revokedAt = new Date();
    await sessionRepository.save(session);
    res.json({ message: 'Session revoked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};