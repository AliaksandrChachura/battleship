import { Ship } from "./ship";

interface Player {
    playerId: string;
    ships: Ship[];
    targetingCoords : Set<string>;
}

export { Player }