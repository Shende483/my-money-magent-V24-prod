import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { LiveGateway } from './live.gateway';

@Injectable()
export class SocketService implements OnModuleInit {
  private server: Server;

  constructor(private readonly liveGateway: LiveGateway) {}

  onModuleInit() {
    this.server = this.liveGateway.server;
    if (!this.server) {
      console.error('SocketService: Server not initialized in LiveGateway');
    }
  }

  emitLiveData(symbol: string, timeframe: string, data: { indicators: any; price: { bid: number; ask: number; time: string } }) {
    if (this.server) {
      this.server.emit('live-data', { symbol, timeframe, ...data });
    } else {
      console.error('SocketService: Cannot emit live-data, server is undefined');
    }
  }

  emitLiveDataAll(data: any) {
    if (this.server) {
      this.server.emit('live-data-all', data);
    } else {
      console.error('SocketService: Cannot emit live-data-all, server is undefined');
    }
  }




}


/*
import { Injectable } from '@nestjs/common';
import { LiveGateway } from './live.gateway';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  sendToSocket(socketId: string, arg1: string, indicators: any) {
    throw new Error('Method not implemented.');
  }
  getConnectionsForSymbol(symbol: string) {
    throw new Error('Method not implemented.');
  }
 
  constructor(private readonly gateway: LiveGateway) {}

  on(event: string, callback: (data: any) => void) {
    this.gateway.server.on('connection', (socket) => {
      socket.on(event, callback);
    });
  }

  toUser(userId: string, event: string, data: any) {
    this.gateway.server.to(userId).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.gateway.server.emit(event, data);
  }
}
*/