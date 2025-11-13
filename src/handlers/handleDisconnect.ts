import { IWebSocket } from "../types/websocket";
import { IDb } from "../data/types";
import { getUserByHash } from "../helpers/utils";

function handleDisconnect(ws: IWebSocket, db: IDb) {
    // const player = getUserByHash(ws.id, db);
    
    // // Remove from rooms
    // const room = getRoomByPlayer(ws);
    // if (room) {
    //     room.roomUsers = room.roomUsers.filter(
    //         user => {
    //             const p = Array.from(players.entries()).find(([, pl]) => pl.index === user.index);
    //             return p && p[0] !== ws;
    //         }
    //     );
    //     if (room.roomUsers.length === 0) {
    //         rooms.delete(room.roomId);
    //     } else {
    //         broadcastUpdateRoom();
    //     }
    // }
    
    // // Remove from games
    // const game = getGameByPlayer(ws);
    // if (game) {
    //     games.delete(game.gameId);
    // }
    
    // // Remove player
    // players.delete(ws);
    
    // broadcastUpdateRoom();
}

export { handleDisconnect };