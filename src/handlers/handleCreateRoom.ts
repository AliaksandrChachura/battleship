import { IWebSocket } from '../types/websocket';
import { IDb } from '../data/types';
import {
  getUserByHash,
  getRoomByUser,
  sendMessage,
  broadcastUpdateRoomToAll,
} from '../helpers/utils';
import { WebSocketServer } from 'ws';
import { MessageType } from '../helpers/constants';

function handleCreateRoom(ws: IWebSocket, db: IDb, wsServer: WebSocketServer) {
  const player = getUserByHash(ws.id, db);

  if (!player) {
    console.error('Player not found for hash:', ws.id);
    sendMessage(ws, MessageType.REG, {
      name: '',
      index: 0,
      error: true,
      errorText: 'Please register first',
    });
    return;
  }

  const existingRoom = getRoomByUser(player.index, db);
  if (existingRoom) {
    existingRoom.users = existingRoom.users.filter(
      (user) => user.index !== player.index
    );
    if (existingRoom.users.length === 0) {
      db.rooms = db.rooms.filter((room) => room.roomId !== existingRoom.roomId);
    }
  }

  const roomId = (db.rooms.length + 1).toString();
  const room = {
    roomId,
    users: [player],
  };
  db.rooms.push(room);

  broadcastUpdateRoomToAll(wsServer, db);
}

export { handleCreateRoom };
