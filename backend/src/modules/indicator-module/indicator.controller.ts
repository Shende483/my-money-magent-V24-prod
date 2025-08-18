

import { Controller, Get, Post, Body, HttpException, HttpStatus, Query } from '@nestjs/common';
import { IndicatorService } from './indicator.service';
import { CreateIndicatorSettingsDto } from './dto/indicator-setting.dto';
import { CreateEmissionSettingsDto } from './dto/data-emission-dto';


@Controller('indicators')



export class IndicatorController {
  constructor(
    private readonly indicatorService: IndicatorService,
  ) {}

  @Post('settings')
  async saveIndicatorSettings(@Body() settings: CreateIndicatorSettingsDto) {
    try {
     const indicators = await this.indicatorService.saveIndicatorSettings(settings);
     return { success: true, message: 'Settings updated successfully', indicators };
    } catch (error) {
      throw new HttpException(`Failed to save indicator settings: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('settings')
  async getIndicatorSettings(@Query('symbol') symbol: string, @Query('timeframe') timeframe: string) {
    try {
      console.log("dfgggggggggg", symbol, timeframe);
      const settings = await this.indicatorService.getIndicatorSettings(symbol, timeframe);
      return settings || null;
    } catch (error) {
      throw new HttpException(`Failed to fetch indicator settings: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


 @Post('emission-settings')
  async saveEmissionSettings(@Body() settings: CreateEmissionSettingsDto) {
    try {
     const result = await this.indicatorService.saveEmissionSettings(settings);
       return { success: true, message: 'Settings updated successfully', result};
    } catch (error) {
      throw new HttpException(`Failed to save emission settings: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('emission-settings')
  async getEmissionSettings(@Query('symbol') symbol: string, @Query('timeframe') timeframe: string) {
    try {
       console.log("nnnnnnnnnnnnnnggg", symbol, timeframe);
      const settings = await this.indicatorService.getEmissionSettings(symbol);
      return settings || null;
    } catch (error) {
      throw new HttpException(`Failed to fetch emission settings: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }




}


