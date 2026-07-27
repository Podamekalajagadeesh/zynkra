import { del, get, post } from '../api';

export interface Note {
  id: string;
  content: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export const createNote = async (content: string): Promise<Note> => {
  const res = await post<Note>('/notes', { content });
  return res.data;
};

export const getFollowingNotes = async (): Promise<Note[]> => {
  const res = await get<Note[]>('/notes/following');
  return res.data;
};

export const getUserNote = async (userId: string): Promise<Note | null> => {
  const res = await get<Note | null>(`/notes/user/${userId}`);
  return res.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await del(`/notes/${id}`);
};
