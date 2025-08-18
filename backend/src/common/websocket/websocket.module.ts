
/*
import { Module } from '@nestjs/common';
import { LiveGateway } from './live.gateway';
import { SocketService } from './socket.service';
import { WsAuthGuard } from './ws-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: 'SECRET' })],
  providers: [LiveGateway, SocketService, WsAuthGuard],
  exports: [SocketService],
})
export class WebsocketModule {}

*/

import { Module } from '@nestjs/common';
import { LiveGateway } from './live.gateway';
import { SocketService } from './socket.service';
import { WsAuthGuard } from './ws-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: 'SECRET' })],
  providers: [
    { provide: 'SOCKET_SERVICE', useClass: SocketService },
    LiveGateway,
    WsAuthGuard,
  ],
  exports: ['SOCKET_SERVICE'],
})
export class WebsocketModule {}
