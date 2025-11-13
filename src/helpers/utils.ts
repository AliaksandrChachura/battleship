import { User } from "../models/user";
import { IDb, Winner } from "../data/types";
import crypto from 'crypto';
import { IWebSocket } from "../types/websocket";
import { MessageType } from "./constants";
import { WebSocketServer } from 'ws';


const getUserByHash = (hash: string, db: IDb): User | undefined => {
    return db.users.find((user: User) => user.hash === hash);
}

const createUser = (name: string, db: IDb): User => {
    const user = {
        index: db.users.length + 1,
        name: name,
        hash: crypto.randomBytes(32).toString('hex'),
        isLoggedIn: false,
    };
    db.users.push(user);
    return user;
}

function sendMessage(ws: IWebSocket, type: string, data: any) {
    if (ws && ws.readyState === 1) {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const message = {
            type,
            data: dataString,
            id: 0
        };
        ws.send(JSON.stringify(message));
    }
}

function broadcastToAll( wsServer: WebSocketServer, type: string, data: string | object ) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const message = {
        type,
        data: dataString,
        id: 0
    };
    wsServer.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

function broadcastUpdateRoom( wsServer: WebSocketServer, db: IDb ) {
    const roomsList = Array.from(db.rooms.values())
        .filter(room => room.users.length === 1)
        .map(room => ({
            roomId: room.roomId,
            users: room.users
        }));
    
    broadcastToAll(wsServer, MessageType.UPDATE_ROOM, JSON.stringify(roomsList));
}

function broadcastUpdateWinners( wsServer: WebSocketServer, db: IDb ) {
    const winnersList = Array.from(db.winners.entries())
        .map(([name, wins]) => ({ name, wins }))
        .sort((a: { name: number, wins: Winner }, b: { name: number, wins: Winner } ) => b.wins.score - a.wins.score);
    
    broadcastToAll(wsServer, MessageType.UPDATE_WINNERS, JSON.stringify(winnersList));
}

export { getUserByHash, createUser, sendMessage }