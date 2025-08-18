import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './config/database.config';
import { IndicatorModule } from './modules/indicator-module/indicator.module';
import { AuthModule } from './modules/authModule/auth.module';
import { WebsocketModule } from './common/websocket/websocket.module';
import { BuySellModule } from './modules/buy-sell-module/buy-sell-module';




@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    WebsocketModule,
  //  TradeModule,
     AuthModule,
    DatabaseConfig,
  IndicatorModule,
  BuySellModule
   
  
  ],
})
export class AppModule {}
