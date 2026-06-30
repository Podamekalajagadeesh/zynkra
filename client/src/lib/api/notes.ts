import { del, get, post } from '../api';

export interface Note {
  id: string;
  content: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export const createNote = (content: string) => {
  return post<Note>('/notes', { content });
};

export const getFollowingNotes = () => {
  return get<Note[]>('/notes/following');
};

export const getUserNote = (userId: string) => {
  return get<Note | null>(`/notes/user/${userId}`);
};

export const deleteNote = (id: string) => {
  return del(`/notes/${id}`);
};