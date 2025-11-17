import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import { getUserByHash, sendMessage } from '../helpers/utils';
import { MessageType } from '../helpers/constants';
import { Game } from '../models/game';
import { generateBotShips } from '../helpers/singlePlayUtils';

const BOT_PLAYER_ID = 'bot';

function handleSinglePlay(ws: IWebSocket, data: string | object, db: IDb) {
  try {
    const player = getUserByHash(ws.id, db);

    if (!player) {
      sendMessage(ws, MessageType.REG, {
        name: '',
        index: 0,
        error: true,
        errorText: 'Please register first',
      });
      return;
    }

    const idPlayer = '1';
    const botShips = generateBotShips();

    const game: Game = {
      id: db.games.length,
      players: [
        { playerId: idPlayer, ships: [], targetingCoords: new Set() },
        {
          playerId: BOT_PLAYER_ID,
          ships: botShips,
          targetingCoords: new Set(),
        },
      ],
      turn: null,
      lastAttackStatus: null,
      shipsReceived: 1,
      userHashes: [player.hash, 'bot'],
    };

    db.games.push(game);

    sendMessage(ws, MessageType.CREATE_GAME, {
      idGame: game.id,
      idPlayer: idPlayer,
    });
  } catch (error) {
    console.error('Error handling single_play:', error);
  }
}

export { handleSinglePlay, BOT_PLAYER_ID };
