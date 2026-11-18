import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface Client {
  ws: WebSocket;
  roomId: string;
  userId: string;
  role: string;
}

export function setupWebRTCSignaling(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/telehealth' });
  const rooms = new Map<string, Set<Client>>();

  wss.on('connection', (ws: WebSocket) => {
    let clientInfo: Client | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'join-room': {
            const { roomId, userId, role } = data;
            clientInfo = { ws, roomId, userId, role };

            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Set());
            }

            const room = rooms.get(roomId)!;
            room.add(clientInfo);

            // Notify peer that someone joined
            room.forEach((client) => {
              if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'peer-joined',
                  userId,
                  role,
                  peerCount: room.size,
                }));
              }
            });

            ws.send(JSON.stringify({
              type: 'room-joined',
              roomId,
              peerCount: room.size,
            }));
            break;
          }

          case 'offer':
          case 'answer':
          case 'ice-candidate':
          case 'mute-audio':
          case 'mute-video': {
            if (clientInfo && rooms.has(clientInfo.roomId)) {
              const room = rooms.get(clientInfo.roomId)!;
              room.forEach((client) => {
                if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
                  client.ws.send(JSON.stringify({
                    ...data,
                    from: clientInfo?.userId,
                  }));
                }
              });
            }
            break;
          }

          case 'leave-room': {
            if (clientInfo && rooms.has(clientInfo.roomId)) {
              const room = rooms.get(clientInfo.roomId)!;
              room.delete(clientInfo);

              room.forEach((client) => {
                if (client.ws.readyState === WebSocket.OPEN) {
                  client.ws.send(JSON.stringify({
                    type: 'peer-left',
                    userId: clientInfo?.userId,
                  }));
                }
              });

              if (room.size === 0) {
                rooms.delete(clientInfo.roomId);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Telehealth signaling error:', err);
      }
    });

    ws.on('close', () => {
      if (clientInfo && rooms.has(clientInfo.roomId)) {
        const room = rooms.get(clientInfo.roomId)!;
        room.delete(clientInfo);
        room.forEach((client) => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: 'peer-left',
              userId: clientInfo?.userId,
            }));
          }
        });
        if (room.size === 0) {
          rooms.delete(clientInfo.roomId);
        }
      }
    });
  });

  console.log('📡 WebRTC Telehealth Signaling Server mounted at /ws/telehealth');
}
