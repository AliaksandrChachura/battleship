import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import { WebSocketServer } from 'ws';
import {
  getUserByHash,
  checkShipKilled,
  sendMessage,
  broadcastUpdateWinners,
  checkGameFinished,
} from '../helpers/utils';
import { BOT_PLAYER_ID } from './handleSinglePlay';
import { checkBotTurn } from '../helpers/singlePlayUtils';

function handleAttack(
  ws: IWebSocket,
  data: string | object,
  db: IDb,
  wsServer: WebSocketServer
) {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { gameId, x, y, indexPlayer } = parsedData;
    const game = db.games.find((game) => game.id === Number(gameId));
    if (!game) return;

    const attacker = game.players.find(
      (p) => p.playerId === String(indexPlayer)
    );
    const enemy = game.players.find((p) => p.playerId !== String(indexPlayer));

    if (!attacker || !enemy) return;

    if (game.turn !== attacker.playerId) return;

    const coordKey = `${x},${y}`;
    if (attacker.targetingCoords.has(coordKey)) return;

    attacker.targetingCoords.add(coordKey);

    let hit = false;
    for (const ship of enemy.ships) {
      const { position, direction, length } = ship;
      const { x: sx, y: sy } = position;
      for (let i = 0; i < length; i++) {
        const posX = direction ? sx : sx + i;
        const posY = direction ? sy + i : sy;

        if (posX === x && posY === y) {
          hit = true;
          break;
        }
      }
      if (hit) break;
    }

    const killedCells = hit
      ? checkShipKilled(enemy.ships, attacker.targetingCoords, x, y)
      : null;

    let status = hit ? 'shot' : 'miss';
    if (killedCells) {
      status = 'killed';
      killedCells.forEach(({ x: kx, y: ky }: { x: number; y: number }) => {
        let isShipCell = false;
        for (const ship of enemy.ships) {
          const { position, direction, length } = ship;
          const { x: sx, y: sy } = position;
          for (let i = 0; i < length; i++) {
            const posX = direction ? sx + i : sx;
            const posY = direction ? sy : sy + i;
            if (posX === kx && posY === ky) {
              isShipCell = true;
              break;
            }
          }
          if (isShipCell) break;
        }

        if (!isShipCell) {
          const coordKey = `${kx},${ky}`;
          if (!attacker.targetingCoords.has(coordKey)) {
            attacker.targetingCoords.add(coordKey);
          }
        }
      });
    }

    const playerWebSockets: Map<string, IWebSocket> = new Map();
    game.userHashes.forEach((userHash, index) => {
      const playerWs = Array.from(wsServer.clients).find(
        (client) => (client as IWebSocket).id === userHash
      ) as IWebSocket | undefined;

      if (playerWs && index < game.players.length) {
        playerWebSockets.set(game.players[index].playerId, playerWs);
      }
    });

    const attackData = {
      position: { x, y },
      currentPlayer: attacker.playerId,
      status,
    };

    game.players.forEach((p) => {
      if (p.playerId === BOT_PLAYER_ID) return;

      const playerWs = playerWebSockets.get(p.playerId);
      if (playerWs) {
        sendMessage(playerWs, 'attack', attackData);
      }
    });

    if (killedCells) {
      killedCells.forEach(({ x: kx, y: ky }) => {
        let isShipCell = false;
        for (const ship of enemy.ships) {
          const { position, direction, length } = ship;
          const { x: sx, y: sy } = position;
          for (let i = 0; i < length; i++) {
            const posX = direction ? sx + i : sx;
            const posY = direction ? sy : sy + i;
            if (posX === kx && posY === ky) {
              isShipCell = true;
              break;
            }
          }
          if (isShipCell) break;
        }

        if (!isShipCell && (kx !== x || ky !== y)) {
          const missData = {
            position: { x: kx, y: ky },
            currentPlayer: attacker.playerId,
            status: 'miss',
          };
          game.players.forEach((p) => {
            if (p.playerId === BOT_PLAYER_ID) return;

            const playerWs = playerWebSockets.get(p.playerId);
            if (playerWs) {
              sendMessage(playerWs, 'attack', missData);
            }
          });
        }
      });
    }

    if (checkGameFinished(game, attacker.playerId)) {
      const winnerPlayerIndex = game.players.findIndex(
        (p) => p.playerId === attacker.playerId
      );
      const winnerUserHash =
        winnerPlayerIndex >= 0 ? game.userHashes[winnerPlayerIndex] : null;
      const winnerUser = winnerUserHash
        ? getUserByHash(winnerUserHash, db)
        : null;
      const winnerName = winnerUser?.name || null;

      if (winnerName) {
        const existingWinner = db.winners.find((w) => w.name === winnerName);
        if (existingWinner) {
          existingWinner.score += 1;
        } else {
          db.winners.push({ name: winnerName, score: 1 });
        }
      }

      game.players.forEach((p) => {
        if (p.playerId === BOT_PLAYER_ID) return;

        const playerWs = playerWebSockets.get(p.playerId);
        if (playerWs) {
          sendMessage(playerWs, 'finish', {
            winPlayer: attacker.playerId,
          });
        }
      });

      broadcastUpdateWinners(wsServer, db);
      const gameIndex = db.games.findIndex((g) => g.id === game.id);
      if (gameIndex >= 0) {
        db.games.splice(gameIndex, 1);
      }
      return;
    }

    if (status === 'miss') {
      game.turn = enemy.playerId;
    }

    game.players.forEach((p) => {
      if (p.playerId === BOT_PLAYER_ID) return;

      const playerWs = playerWebSockets.get(p.playerId);
      if (playerWs) {
        sendMessage(playerWs, 'turn', {
          currentPlayer: game.turn,
        });
      }
    });

    checkBotTurn(game, db, wsServer);
  } catch (error) {
    console.error('Error handling attack:', error);
  }
}

export { handleAttack };
