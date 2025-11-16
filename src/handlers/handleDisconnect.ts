import { IWebSocket } from "../types/websocket";
import { IDb } from "../data/types";
import { WebSocketServer } from 'ws';
import { getUserByHash, getRoomByUser, broadcastUpdateRoomToAll } from "../helpers/utils";
import { User } from "../models/user";

function handleDisconnect(ws: IWebSocket, db: IDb, wsServer: WebSocketServer) {
    const player = getUserByHash(ws.id, db);
    if (!player) return;
    
    // Remove from rooms
    const room = getRoomByUser(player.index, db);
    if (room) {
        room.users = room.users.filter(
            (user: User) => {
                return user.index !== player?.index;
            }
        );
        if (room.users.length === 0) {
            db.rooms.splice(db.rooms.indexOf(room), 1);
        } else {
            broadcastUpdateRoomToAll(wsServer, db);
        }
    }
    
    // Remove from games
    const game = db.games.find(g => g.userHashes.includes(player.hash));
    if (game) {
        db.games.splice(db.games.indexOf(game), 1);
    }
    
    // Remove player
    db.users.splice(db.users.indexOf(player), 1);
    
    broadcastUpdateRoomToAll(wsServer, db);
}

export { handleDisconnect };