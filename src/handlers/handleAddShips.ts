import { IWebSocket } from "../types/websocket";
import { IDb } from "../data/types";
import { sendMessage } from "../helpers/utils";
import { Game } from "../models/game";
import { WebSocketServer } from 'ws';
import { MessageType } from "../helpers/constants";

function handleAddShips(ws: IWebSocket, data: string | object, db: IDb, wsServer: WebSocketServer) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { gameId, ships, indexPlayer } = parsedData;
        
        const game = db.games.find(game => game.id === Number(gameId));
        if (!game) {
            console.log('Game not found for gameId:', gameId);
            return;
        }
        
        const player = game.players.find(p => p.playerId === indexPlayer);
        if (!player) {
            console.log('Player not found. indexPlayer:', indexPlayer, 'Available players:', game.players.map(p => p.playerId));
            return;
        }
        if (player.ships.length > 0) {
            console.log('Player already has ships, ignoring duplicate');
            return;
        }
        player.ships = ships;
        game.shipsReceived++;

        const bothPlayersHaveShips = game.players.length === 2 && 
            game.players.every(p => p.ships && p.ships.length > 0) &&
            game.shipsReceived === 2;
        
        if (bothPlayersHaveShips) {
            const firstPlayerId = game.players[0].playerId;
            game.turn = firstPlayerId;
            
            const playerWebSockets: Map<string, IWebSocket> = new Map();
            
            game.userHashes.forEach((userHash, index) => {
                const playerWs = Array.from(wsServer.clients).find(
                    (client) => (client as IWebSocket).id === userHash
                ) as IWebSocket | undefined;
                
                if (playerWs && index < game.players.length) {
                    playerWebSockets.set(game.players[index].playerId, playerWs);
                }
            });
            
            if (playerWebSockets.size === 2) {
                game.players.forEach(p => {
                    const playerWs = playerWebSockets.get(p.playerId);
                    if (playerWs) {
                        sendMessage(playerWs, MessageType.START_GAME, {
                            ships: p.ships,
                            currentPlayerIndex: firstPlayerId
                        });
                        
                        sendMessage(playerWs, MessageType.TURN, {
                            currentPlayer: firstPlayerId
                        });
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error handling add_ships:', error);
    }
}

export { handleAddShips };