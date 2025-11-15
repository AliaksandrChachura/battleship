import { IWebSocket } from "../types/websocket";
import { IDb } from "../data/types";
import { getUserByHash, getRoomByUser, sendMessage, broadcastUpdateRoomToAll } from "../helpers/utils";
import { WebSocketServer } from 'ws';
import { MessageType } from "../helpers/constants";
import { User } from "../models/user";
import { Game } from "../models/game";

function handleAddUserToRoom(ws: IWebSocket, data: string | object, db: IDb, wsServer: WebSocketServer) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { indexRoom } = parsedData;
        const player = getUserByHash(ws.id, db);
        
        if (!player) return;
        
        const room = db.rooms.find(room => room.roomId === indexRoom);
        if (!room || room.users.length !== 1) return;
        
        room.users.push(player);
        
        const existingRoom = getRoomByUser(player.index, db);
        if (existingRoom && existingRoom.roomId !== room.roomId) {
            existingRoom.users = existingRoom.users.filter(
                (user: User) => user.index !== player.index
            );
            if (existingRoom.users.length === 0) {
                db.rooms = db.rooms.filter(room => room.roomId !== existingRoom.roomId);
            }
        }
        
        const player1 = db.users.find(
            (user: User) => user.index === room.users[0].index
        );
        const player2 = db.users.find(
            (user: User) => user.index === room.users[1].index
        );
        
        if (!player1 || !player2) return;
        
        const player1Ws = Array.from(wsServer.clients).find(
            (client) => (client as IWebSocket).id === player1.hash
        ) as IWebSocket | undefined;
        const player2Ws = Array.from(wsServer.clients).find(
            (client) => (client as IWebSocket).id === player2.hash
        ) as IWebSocket | undefined;
        
        if (!player1Ws || !player2Ws) return;
        
        const idPlayer1 = "1";
        const idPlayer2 = "2";
        
        const game: Game = {
            id: db.games.length,
            players: [
                { playerId: idPlayer1, ships: [], targetingCoords: new Set() },
                { playerId: idPlayer2, ships: [], targetingCoords: new Set() }
            ],
            turn: null,
            lastAttackStatus: null,
            shipsReceived: 0,
            userHashes: [player1.hash, player2.hash]
        };
        db.games.push(game);
        
        db.rooms = db.rooms.filter(r => r.roomId !== room.roomId);
        
        broadcastUpdateRoomToAll(wsServer, db);
        
        sendMessage(player1Ws, MessageType.CREATE_GAME, {
            idGame: game.id,
            idPlayer: idPlayer1
        });
        sendMessage(player2Ws, MessageType.CREATE_GAME, {
            idGame: game.id,
            idPlayer: idPlayer2
        });
        
    } catch (error) {
        console.error('Error handling add_user_to_room:', error);
    }
}

export { handleAddUserToRoom };