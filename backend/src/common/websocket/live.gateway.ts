import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from './ws-auth.guard';

@WebSocketGateway({ cors: true })
@UseGuards(WsAuthGuard)
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (user) {
      client.join(user.id);
      console.log(`User ${user.id} connected`);
    } else {
      console.log('Public client connected');
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
