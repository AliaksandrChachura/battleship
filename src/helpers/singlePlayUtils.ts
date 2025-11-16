import { Ship } from '../models/ship';
import { handleAttack } from '../handlers/handleAttack';
import { SHIP_CONFIGS } from '../helpers/constants';
import { Game } from '../models/game';
import { IDb } from '../data/types';
import { WebSocketServer } from 'ws';
import { IWebSocket } from '../types/websocket';
import { BOT_PLAYER_ID } from '../handlers/handleSinglePlay';

function generateBotShips(): Ship[] {
  const ships: Ship[] = [];
  const occupied = new Set<string>();

  for (const config of SHIP_CONFIGS) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const direction = Math.random() < 0.5; // true = vertical, false = horizontal
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);

      const endX = direction ? x : x + config.length - 1;
      const endY = direction ? y + config.length - 1 : y;

      if (endX >= 10 || endY >= 10) continue;

      let canPlace = true;
      const cells: string[] = [];

      for (let i = 0; i < config.length; i++) {
        const posX = direction ? x : x + i;
        const posY = direction ? y + i : y;
        const cellKey = `${posX},${posY}`;

        if (occupied.has(cellKey)) {
          canPlace = false;
          break;
        }
        cells.push(cellKey);
      }

      if (canPlace) {
        cells.forEach((cell) => occupied.add(cell));
        ships.push({
          position: { x, y },
          direction,
          length: config.length,
          type: config.type,
        });
        placed = true;
      }
    }
  }

  return ships;
}

function makeBotAttack(game: Game, db: IDb, wsServer: WebSocketServer) {
  const bot = game.players.find((p) => p.playerId === BOT_PLAYER_ID);
  const enemy = game.players.find((p) => p.playerId !== BOT_PLAYER_ID);

  if (!bot || !enemy || game.turn !== BOT_PLAYER_ID) return;

  const availableCells: { x: number; y: number }[] = [];
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const coordKey = `${x},${y}`;
      if (!bot.targetingCoords.has(coordKey)) {
        availableCells.push({ x, y });
      }
    }
  }

  if (availableCells.length === 0) return;

  const randomCell =
    availableCells[Math.floor(Math.random() * availableCells.length)];

  const playerHash = game.userHashes.find((hash) => hash !== 'bot');
  const playerWs = playerHash
    ? (Array.from(wsServer.clients).find(
        (client) => (client as IWebSocket).id === playerHash
      ) as IWebSocket | undefined)
    : undefined;

  const wsToUse = playerWs || ({ id: 'bot', readyState: 1 } as IWebSocket);

  handleAttack(
    wsToUse,
    JSON.stringify({
      gameId: game.id,
      x: randomCell.x,
      y: randomCell.y,
      indexPlayer: BOT_PLAYER_ID,
    }),
    db,
    wsServer
  );
}

function checkBotTurn(game: Game, db: IDb, wsServer: WebSocketServer) {
  if (game.turn === BOT_PLAYER_ID) {
    setTimeout(() => {
      const currentGame = db.games.find((g) => g.id === game.id);
      if (currentGame && currentGame.turn === BOT_PLAYER_ID) {
        makeBotAttack(currentGame, db, wsServer);
      }
    }, 500);
  }
}

export { generateBotShips, makeBotAttack, checkBotTurn };
