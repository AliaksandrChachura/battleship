import { User } from "../models/user";
import { Ship } from "../models/ship";
import { IDb } from "../data/types";
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
            data: dataString, // data field is a JSON string
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


function broadcastUpdateWinners( wsServer: WebSocketServer, db: IDb ) {
    const winnersList = db.winners
        .map(winner => ({ name: winner.name, wins: winner.score }))
        .sort((a, b) => b.wins - a.wins);
    
    broadcastToAll(wsServer, MessageType.UPDATE_WINNERS, winnersList);
}

function broadcastUpdateRoomToAll(wsServer: WebSocketServer, db: IDb) {
    const roomsList = db.rooms
        .filter(room => room.users.length === 1)
        .map(room => ({
            roomId: room.roomId,
            roomUsers: room.users.map(user => ({
                name: user.name,
                index: user.index
            }))
        }));
    
    const data = Array.isArray(roomsList) ? roomsList : [];
    console.log('Broadcasting update_room with', data.length, 'available rooms (rooms with 1 player)');
    
    wsServer.clients.forEach((client) => {
        if (client.readyState === 1) {
            sendMessage(client as IWebSocket, MessageType.UPDATE_ROOM, data);
        }
    });   
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

export { getUserByHash, createUser, sendMessage, broadcastToAll, broadcastUpdateWinners, broadcastUpdateRoomToAll, getRoomByUser, createBoard }