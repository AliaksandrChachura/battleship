import { WebSocketServer } from 'ws';
import { IWebSocket } from '../types/websocket';

export const createWebSocketServer = (port: number): WebSocketServer => {
  const wsServer = new WebSocketServer({ port });
  
  wsServer.on('connection', (ws: IWebSocket) => {
    console.log('Client connected');
    ws.on('message', (message: string) => {
      console.log(`Received message: ${message}`);
    });
  });

  return wsServer;
};
