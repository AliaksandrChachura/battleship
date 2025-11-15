import { IWebSocket } from "../types/websocket";
import { IDb } from "../data/types";
import { WebSocketServer } from 'ws';
import { getUserByHash, broadcastUpdateRoomToAll } from "../helpers/utils";

function handleUpdateRoom(ws: IWebSocket, data: string | object, db: IDb, wsServer: WebSocketServer) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { roomId } = parsedData;
        const user = getUserByHash(ws.id, db);
        if (!user) return;
        
        const room = db.rooms.find(r => r.roomId === roomId);
        if (!room) return;
        room.users = room.users.filter(u => u.index !== user.index);
        if (room.users.length === 0) {
            db.rooms = db.rooms.filter(r => r.roomId !== roomId);
        }
        broadcastUpdateRoomToAll(wsServer, db);
    } catch (error) {
        console.error('Error handling update_room:', error);
    }
}

export { handleUpdateRoom };