import { IWebSocket } from "../types/websocket";
import { handleReg } from "./handleReg";
import { IDb } from "../data/types";
import { handleCreateRoom } from "./handleCreateRoom";
import { handleAddUserToRoom } from "./handleAddUserToRoom";
import { handleAddShips } from "./handleAddShips";
import { handleStartGame } from "./handleStartGame";
import { handleUpdateRoom } from "./handleUpdateRoom";
import { handleAttack } from "./handleAttack";
import { handleDisconnect } from "./handleDisconnect";
import { WebSocketServer } from 'ws';
import { MessageType } from "../helpers/constants";

interface IncomingMessage {
    type: string;
    data: string | object;
    id?: number;
}

function handleMessage(ws: IWebSocket, message: string, db: IDb, wsServer: WebSocketServer) {
    try {
        const parsed: IncomingMessage = JSON.parse(message);
        
        if (!parsed || typeof parsed.type !== 'string') {
            console.error('Invalid message structure:', message);
            return;
        }
        
        const { type, data } = parsed;
        
        switch (type) {
            case MessageType.REG:
                handleReg(ws, data, db, wsServer);
                break;
            case MessageType.CREATE_ROOM:
                handleCreateRoom(ws, db, wsServer);
                break;
            case MessageType.ADD_USER_TO_ROOM:
                handleAddUserToRoom(ws, data, db, wsServer);
                break;
            case MessageType.ADD_SHIPS:
                handleAddShips(ws, data, db, wsServer);
                break;
            case MessageType.START_GAME:
                handleStartGame(ws, data, db, wsServer);
                break;
            case MessageType.UPDATE_ROOM:
                handleUpdateRoom(ws, data, db, wsServer);
                break;     
            case MessageType.ATTACK:
                handleAttack(ws, data, db, wsServer);
                break;
            // case MessageType.RANDOM_ATTACK:
            //     handleRandomAttack(ws, data, db, wsServer);
            //     break;
            case MessageType.FINISH:
                handleDisconnect(ws, db, wsServer);
                break;
            default:
                console.log('Unknown message type:', type);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

export { handleMessage };