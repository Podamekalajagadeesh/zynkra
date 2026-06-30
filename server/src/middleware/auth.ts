import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { getRepository } from 'typeorm';
import { User } from '../users/entities/user.entity';

const configService = new ConfigService();

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRepository = getRepository(User);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded: any = jwt.verify(token, configService.get('JWT_SECRET'));
    const user = await userRepository.findOneBy({ id: decoded.sub });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};