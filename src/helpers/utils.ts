import { User } from '../models/user';
import { Ship } from '../models/ship';
import { Game } from '../models/game';
import { IDb } from '../data/types';
import crypto from 'crypto';
import { IWebSocket } from '../types/websocket';
import { MessageType } from './constants';
import { WebSocketServer } from 'ws';

const getUserByHash = (hash: string, db: IDb): User | undefined => {
  return db.users.find((user: User) => user.hash === hash);
};

const createUser = (name: string, db: IDb): User => {
  const user = {
    index: db.users.length + 1,
    name: name,
    hash: crypto.randomBytes(32).toString('hex'),
    isLoggedIn: false,
  };
  db.users.push(user);
  return user;
};

function sendMessage(ws: IWebSocket, type: string, data: unknown) {
  if (ws && ws.readyState === 1) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const message = {
      type,
      data: dataString,
      id: 0,
    };
    ws.send(JSON.stringify(message));
  }
}

function broadcastToAll(
  wsServer: WebSocketServer,
  type: string,
  data: string | object
) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const message = {
    type,
    data: dataString,
    id: 0,
  };
  const messageString = JSON.stringify(message);
  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(messageString);
    }
  });
}

function broadcastUpdateWinners(wsServer: WebSocketServer, db: IDb) {
  const winnersList = db.winners
    .map((winner) => ({ name: winner.name, wins: winner.score }))
    .sort((a, b) => b.wins - a.wins);

  broadcastToAll(wsServer, MessageType.UPDATE_WINNERS, winnersList);
}

function broadcastUpdateRoomToAll(wsServer: WebSocketServer, db: IDb) {
  const roomsList = db.rooms
    .filter((room) => room.users.length === 1)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: room.users.map((user) => ({
        name: user.name,
        index: user.index,
      })),
    }));

  const data = Array.isArray(roomsList) ? roomsList : [];

  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) {
      sendMessage(client as IWebSocket, MessageType.UPDATE_ROOM, data);
    }
  });
}

function getRoomByUser(index: number, db: IDb) {
  for (const room of db.rooms) {
    if (
      room.users.some((user) => {
        const player = db.users.find((p: User) => p.index === user.index);
        return player && user.index === player.index;
      })
    ) {
      return room;
    }
  }
  return null;
}

function createBoard() {
  return Array(10)
    .fill(null)
    .map(() => Array(10).fill(null));
}

function checkShipKilled(
  ships: Ship[],
  targetingCoords: Set<string>,
  x: number,
  y: number
) {
  for (const ship of ships) {
    const { position, direction, length } = ship;
    const { x: sx, y: sy } = position;
    let isPartOfShip = false;

    for (let i = 0; i < length; i++) {
      const posX = direction ? sx : sx + i;
      const posY = direction ? sy + i : sy;

      if (posX === x && posY === y) {
        isPartOfShip = true;
        break;
      }
    }

    if (isPartOfShip) {
      let allHit = true;
      for (let i = 0; i < length; i++) {
        const posX = direction ? sx : sx + i;
        const posY = direction ? sy + i : sy;
        const coordKey = `${posX},${posY}`;

        if (!targetingCoords.has(coordKey)) {
          allHit = false;
          break;
        }
      }

      if (allHit) {
        const cells: { x: number; y: number }[] = [];
        const addedCells = new Set<string>();

        for (let i = 0; i < length; i++) {
          const posX = direction ? sx : sx + i;
          const posY = direction ? sy + i : sy;

          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = posX + dx;
              const ny = posY + dy;
              if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
                const cellKey = `${nx},${ny}`;
                if (!addedCells.has(cellKey)) {
                  cells.push({ x: nx, y: ny });
                  addedCells.add(cellKey);
                }
              }
            }
          }
        }
        return cells;
      }
    }
  }

  return null;
}

function checkGameFinished(game: Game, playerIndex: string) {
  const attacker = game.players.find((p) => p.playerId === playerIndex);
  const enemy = game.players.find((p) => p.playerId !== playerIndex);
  if (!attacker || !enemy) return false;

  let allShipsKilled = true;
  for (const ship of enemy.ships) {
    const { position, direction, length } = ship;
    const { x: sx, y: sy } = position;
    for (let i = 0; i < length; i++) {
      const posX = direction ? sx : sx + i;
      const posY = direction ? sy + i : sy;
      const coordKey = `${posX},${posY}`;

      if (!attacker.targetingCoords.has(coordKey)) {
        allShipsKilled = false;
        break;
      }
    }
    if (!allShipsKilled) break;
  }

  return allShipsKilled;
}

export {
  getUserByHash,
  createUser,
  sendMessage,
  broadcastToAll,
  broadcastUpdateWinners,
  broadcastUpdateRoomToAll,
  getRoomByUser,
  createBoard,
  checkShipKilled,
  checkGameFinished,
};
