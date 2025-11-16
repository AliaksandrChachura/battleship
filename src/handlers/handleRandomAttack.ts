import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import { WebSocketServer } from 'ws';
import { handleAttack } from './handleAttack';

function handleRandomAttack(
  ws: IWebSocket,
  data: string | object,
  db: IDb,
  wsServer: WebSocketServer
) {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { gameId, indexPlayer } = parsedData;

    const game = db.games.find((game) => game.id === Number(gameId));
    if (!game) return;

    const attacker = game.players.find(
      (p) => p.playerId === String(indexPlayer)
    );
    const enemy = game.players.find((p) => p.playerId !== String(indexPlayer));

    if (!attacker || !enemy) return;

    if (game.turn !== attacker.playerId) return;

    const availableCells = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const coordKey = `${x},${y}`;
        if (!attacker.targetingCoords.has(coordKey)) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length === 0) return;

    const randomCell =
      availableCells[Math.floor(Math.random() * availableCells.length)];

    handleAttack(
      ws,
      JSON.stringify({
        gameId,
        x: randomCell.x,
        y: randomCell.y,
        indexPlayer,
      }),
      db,
      wsServer
    );
  } catch (error) {
    console.error('Error handling randomAttack:', error);
  }
}

export { handleRandomAttack };
