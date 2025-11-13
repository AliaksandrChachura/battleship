import { WebSocketServer } from 'ws';
import { IWebSocket } from '../types/websocket';
import { handleMessage } from '../handlers/handleMessage';
import { db } from '../data/db';

export const createWebSocketServer = (port: number): WebSocketServer => {
  const wsServer = new WebSocketServer({ port });
  
  wsServer.on('connection', (ws: IWebSocket) => {
    console.log('Client connected');
    ws.on('message', (message: string) => {
      handleMessage(ws, message, db);
      console.log(`Received message: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
                // handleDisconnect(ws);
    });
            
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
  });

  return wsServer;
};
