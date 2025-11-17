import { Player } from './player';

interface Game {
  id: number;
  players: Player[];
  turn: string | null;
  lastAttackStatus: string | null;
  shipsReceived: number;
  userHashes: string[];
}

export { Game };
