import { Player } from "./player";

interface Game {
    id: number;
    players: Player[];
    turn: string | null;
    lastAttackStatus: string | null;
}

export { Game}
     