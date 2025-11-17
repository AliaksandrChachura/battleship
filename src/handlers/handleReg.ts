import { sendMessage, createUser } from '../helpers/utils';
import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import { MessageType } from '../helpers/constants';

function handleReg(ws: IWebSocket, data: string | object, db: IDb) {
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { password, name, hash } = parsedData;
    const userHash = hash || password;

    const existingPlayer = db.users.find((p) => p.hash === userHash);
    if (existingPlayer) {
      ws.id = existingPlayer.hash;
      sendMessage(ws, MessageType.REG, {
        name: existingPlayer.name,
        index: existingPlayer.index,
        error: false,
        errorText: '',
      });
    } else {
      const newUser = createUser(name, db);
      ws.id = newUser.hash;
      sendMessage(ws, MessageType.REG, {
        name: newUser.name,
        index: newUser.index,
        error: false,
        errorText: '',
      });
    }

    const roomsList = db.rooms
      .filter((room) => room.users.length === 1)
      .map((room) => ({
        roomId: room.roomId,
        roomUsers: room.users.map((user) => ({
          name: user.name,
          index: user.index,
        })),
      }));
    sendMessage(
      ws,
      MessageType.UPDATE_ROOM,
      Array.isArray(roomsList) ? roomsList : []
    );

    const winnersList = db.winners
      .map((winner) => ({ name: winner.name, wins: winner.score }))
      .sort((a, b) => b.wins - a.wins);
    sendMessage(ws, MessageType.UPDATE_WINNERS, winnersList);
  } catch (error) {
    console.error('Error handling auth:', error);
    sendMessage(ws, 'error', {
      message: 'Internal server error',
      error: true,
      errorText: 'Internal server error',
    });
  }
}

export { handleReg };
