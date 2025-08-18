import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SymbolController } from './buy-sell-controller';
import { BuySell,BuySellSchema} from './buy-sell.schema';
import { SymbolService } from './buy-sell.service';
import { HttpModule } from '@nestjs/axios';
import { WebsocketModule } from 'src/common/websocket/websocket.module';


@Module({
  imports: [
       WebsocketModule,
                    HttpModule, 
       MongooseModule.forFeature([{ name: BuySell.name, schema: BuySellSchema }])],
  controllers: [SymbolController],
  providers: [SymbolService],
})
export class BuySellModule {}