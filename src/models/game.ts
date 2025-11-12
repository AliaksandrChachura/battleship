import { Player } from "./player";

interface Game {
    id: string;
    players: Player[];
    turn: string;
    lastAttackStatus: string | null;
}

export { Game}
     