import { httpServer } from './src/http_server/index';
import { createWebSocketServer } from './src/websocket_server/index';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

console.log(`Start websocket server on the ${WS_PORT} port!`);
createWebSocketServer(WS_PORT);
