import { User } from "../models/user";
import { db } from "../data/db";
import { sendMessage, createUser } from "../helpers/utils"
import { IWebSocket } from "../types/websocket";
import { IDb } from "../data/types";
import { MessageType } from "../helpers/constants";

function handleReg(ws: IWebSocket, data: string | object, db: IDb) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { password, name, hash } = parsedData;
        const userHash = hash || password;

        const existingPlayer = db.users.find(p => p.hash === userHash);
        if (existingPlayer) {
            sendMessage(ws, 'auth', {
                name,
                index: existingPlayer.index,
                error: false,
                errorText: ''
            });
            return;
        }

        const newUser = createUser(name, db);
        sendMessage(ws, MessageType.REG, {
            name,
            index: newUser.index,
            error: false,
            errorText: ''
        });
    } catch (error) {
        console.error('Error handling auth:', error);
        sendMessage(ws, 'error', {
            message: 'Internal server error',
            error: true,
            errorText: 'Internal server error'
        });
    }
}

export { handleReg };