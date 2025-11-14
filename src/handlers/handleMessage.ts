import { IWebSocket } from "../types/websocket";
import { handleReg } from "./handleAuth";
import { IDb } from "../data/types";
import { handleCreateRoom } from "./handleCreateRoom";
import { handleAddUserToRoom } from "./handleAddUserToRoom";
import { WebSocketServer } from 'ws';

function handleMessage(ws: IWebSocket, message: string, db: IDb, wsServer: WebSocketServer) {
    try {
        const parsed = JSON.parse(message);
        const { type, data } = parsed;
        
        switch (type) {
            case 'reg':
                handleReg(ws, data, db);
                break;
            case 'create_room':
                handleCreateRoom(ws, db, wsServer);
                break;
            case 'add_user_to_room':
                handleAddUserToRoom(ws, data, db, wsServer);
                break;
            // case 'add_ships':
            //     handleAddShips(ws, data);
            //     break;
            // case 'attack':
            //     handleAttack(ws, data);
            //     break;
            // case 'randomAttack':
            //     handleRandomAttack(ws, data);
            //     break;
            default:
                console.log('Unknown message type:', type);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

export { handleMessage };