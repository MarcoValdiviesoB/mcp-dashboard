import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function socketEmit(event: string, data: any) {
  getSocket().emit(event, data);
}

export function socketRequest<T>(event: string, data: any): Promise<T> {
  return new Promise(resolve => {
    const s = getSocket();
    if (s.connected) {
      s.emit(event, data, (r: T) => resolve(r));
    } else {
      s.once('connect', () => {
        s.emit(event, data, (r: T) => resolve(r));
      });
    }
  });
}
