import { IWebSocket } from "../types/websocket";
import { handleReg } from "./handleAuth";
import { IDb } from "../data/types";

function handleMessage(ws: IWebSocket, message: string, db: IDb) {
    try {
        const parsed = JSON.parse(message);
        const { type, data } = parsed;
        
        switch (type) {
            case 'reg':
                handleReg(ws, data);
                break;
            // case 'create_room':
            //     handleCreateRoom(ws);
            //     break;
            // case 'add_user_to_room':
            //     handleAddUserToRoom(ws, data);
            //     break;
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