import { IWebSocket } from "../types/websocket";
import { Game } from "../models/game";
import { WebSocketServer } from 'ws';
import { MessageType } from "../helpers/constants";
import { sendMessage } from "../helpers/utils";

function sendTurnToPlayers(game: Game, currentPlayerId: string | number, wsServer: WebSocketServer) {
    const playerWebSockets: Map<string, IWebSocket> = new Map();
    
    game.userHashes.forEach((userHash, index) => {
        const playerWs = Array.from(wsServer.clients).find(
            (client) => (client as IWebSocket).id === userHash
        ) as IWebSocket | undefined;
        
        if (playerWs && index < game.players.length) {
            playerWebSockets.set(game.players[index].playerId, playerWs);
        }
    });
    
    game.players.forEach(p => {
        const playerWs = playerWebSockets.get(p.playerId);
        if (playerWs) {
            sendMessage(playerWs, MessageType.TURN, {
                currentPlayer: currentPlayerId
            });
        }
    });
}

export { sendTurnToPlayers };

