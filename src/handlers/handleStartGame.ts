import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import { getUserByHash } from '../helpers/utils';
import { Ship } from '../models/ship';
import { WebSocketServer } from 'ws';

function handleStartGame(ws: IWebSocket, data: string | object, db: IDb) {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { ships, currentPlayerIndex } = parsedData;

    const user = getUserByHash(ws.id, db);
    if (!user) return;

    const playerId = String(currentPlayerIndex);

    const game = db.games.find((game) => game.userHashes.includes(user.hash));
    if (!game) return;

    const player = game.players.find((p) => p.playerId === playerId);
    if (!player || player.ships.length > 0) return;

    player.ships = ships as Ship[];
    game.shipsReceived++;
  } catch (error) {
    console.error('Error handling start_game:', error);
  }
}

export { handleStartGame };
