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
    const messageString = JSON.stringify(message);
    console.log(`Broadcasting ${type}:`, messageString.substring(0, 200));
    wsServer.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(messageString);
        }
    });
}

function broadcastUpdateRoom( wsServer: WebSocketServer, db: IDb ) {
    const roomsList = db.rooms
        .filter(room => room.users.length === 1)
        .map(room => ({
            roomId: room.roomId,
            roomUsers: room.users.map(user => ({
                name: user.name,
                index: user.index
            }))
        }));
    
    // Ensure we always send an array, even if empty
    const data = Array.isArray(roomsList) ? roomsList : [];
    console.log('Broadcasting update_room with', data.length, 'rooms');
    broadcastToAll(wsServer, MessageType.UPDATE_ROOM, data);
}

function broadcastUpdateWinners( wsServer: WebSocketServer, db: IDb ) {
    const winnersList = db.winners
        .map(winner => ({ name: winner.name, wins: winner.score }))
        .sort((a, b) => b.wins - a.wins);
    
    broadcastToAll(wsServer, MessageType.UPDATE_WINNERS, winnersList);
}

function getRoomByUser(index: number, db: IDb) {
    for (const room of db.rooms) {
        if (room.users.some(user => {
            const player = db.users.find((p: User) => p.index === user.index);
            return player && user.index === player.index;
        })) {
            return room;
        }
    }
    return null;
}

function createBoard() {
    return Array(10).fill(null).map(() => Array(10).fill(null));
}

export { getUserByHash, createUser, sendMessage, broadcastToAll, broadcastUpdateRoom, broadcastUpdateWinners, getRoomByUser, createBoard }