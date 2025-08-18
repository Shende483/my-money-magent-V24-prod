import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { IndicatorService } from './indicator.service';
import { WebsocketModule } from 'src/common/websocket/websocket.module';
import { MongooseModule } from '@nestjs/mongoose';
import { IndicatorSettings, IndicatorSettingsSchema } from './indicator-setting.schema';
import { IndicatorController } from './indicator.controller';
import { EmissionSettings, EmissionSettingsSchema } from './data-emission-schema';

@Module({
  imports: [WebsocketModule,
             HttpModule, 
              MongooseModule.forFeature([
                { name: IndicatorSettings.name, schema: IndicatorSettingsSchema },
                { name: EmissionSettings.name, schema: EmissionSettingsSchema },
              
              
              ])
             ], // Add HttpModule to imports
  controllers: [IndicatorController],
  providers: [IndicatorService],
  exports: [IndicatorService],
})
export class IndicatorModule {}


