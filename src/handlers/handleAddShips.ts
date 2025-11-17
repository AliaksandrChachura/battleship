import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import { sendMessage } from '../helpers/utils';
import { WebSocketServer } from 'ws';
import { MessageType } from '../helpers/constants';
import { BOT_PLAYER_ID } from './handleSinglePlay';
import { checkBotTurn } from '../helpers/singlePlayUtils';

function handleAddShips(
  ws: IWebSocket,
  data: string | object,
  db: IDb,
  wsServer: WebSocketServer
) {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { gameId, ships, indexPlayer } = parsedData;

    const game = db.games.find((game) => game.id === Number(gameId));
    if (!game) {
      return;
    }

    const player = game.players.find((p) => p.playerId === indexPlayer);
    if (!player) {
      return;
    }
    if (player.ships.length > 0) {
      return;
    }
    player.ships = ships;
    game.shipsReceived++;

    const bothPlayersHaveShips =
      game.players.length === 2 &&
      game.players.every((p) => p.ships && p.ships.length > 0) &&
      game.shipsReceived === 2;

    if (bothPlayersHaveShips) {
      const firstPlayerId = game.players[0].playerId;
      game.turn = firstPlayerId;

      const playerWebSockets: Map<string, IWebSocket> = new Map();

      game.userHashes.forEach((userHash, index) => {
        // Skip bot hash
        if (userHash === 'bot') return;

        const playerWs = Array.from(wsServer.clients).find(
          (client) => (client as IWebSocket).id === userHash
        ) as IWebSocket | undefined;

        if (playerWs && index < game.players.length) {
          playerWebSockets.set(game.players[index].playerId, playerWs);
        }
      });

      // Send start_game to all players (skip bot, it doesn't have WebSocket)
      game.players.forEach((p) => {
        if (p.playerId === BOT_PLAYER_ID) return;

        const playerWs = playerWebSockets.get(p.playerId);
        if (playerWs) {
          sendMessage(playerWs, MessageType.START_GAME, {
            ships: p.ships,
            currentPlayerIndex: firstPlayerId,
          });

          sendMessage(playerWs, MessageType.TURN, {
            currentPlayer: firstPlayerId,
          });
        }
      });

      // If bot goes first, make it attack
      if (firstPlayerId === BOT_PLAYER_ID) {
        checkBotTurn(game, db, wsServer);
      }
    }
  } catch (error) {
    console.error('Error handling add_ships:', error);
  }
}

export { handleAddShips };
