import { User } from '../models/user';
import { Game } from '../models/game';
import { Room } from '../models/room';
import { Winner } from '../models/winner';

const users: User[] = [];
const games: Game[] = [];
const rooms: Room[] = [];
const winners: Winner[] = [];

const db: { users: User[]; games: Game[]; rooms: Room[]; winners: Winner[] } = {
  users,
  games,
  rooms,
  winners,
};

export { db };
