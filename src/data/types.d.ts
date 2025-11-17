import { User } from '../models/user';
import { Game } from '../models/game';
import { Room } from '../models/room';
import { Winner } from '../models/winner';

interface IDb {
  users: User[];
  games: Game[];
  rooms: Room[];
  winners: Winner[];
}

export { IDb, Winner };
