import { WebSocket } from 'ws';

interface IWebSocket extends WebSocket {
  id: string;
}

export { IWebSocket };
