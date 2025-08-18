import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SymbolService } from './buy-sell.service';


@Controller('symbols')
export class SymbolController {
  constructor(private readonly symbolService: SymbolService) {}

  @Post()
  async addSymbol(@Body() body: { symbol: string; entryPrice: number; side: string }) {
       console.log("hdfgfgfhbvjfgjjg nnnnnnnnn",body)
    try {
      const symbol = await this.symbolService.addSymbol(body.symbol, body.entryPrice, body.side);
      return { success: true, message: 'Symbol added successfully', symbol };
    } catch (error) {
      throw new HttpException(`Failed to add symbol: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async updateSymbol(@Param('id') id: string, @Body() body: { symbol: string; entryPrice: number; side: string }) {
    try {
      const symbol = await this.symbolService.updateSymbol(id, body.symbol, body.entryPrice, body.side);
      return { success: true, message: 'Symbol updated successfully', symbol };
    } catch (error) {
      throw new HttpException(`Failed to update symbol: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteSymbol(@Param('id') id: string) {
    try {
      await this.symbolService.deleteSymbol(id);
      return { success: true, message: 'Symbol deleted successfully' };
    } catch (error) {
      throw new HttpException(`Failed to delete symbol: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async getAllSymbols() {
       console.log("nnnnnnnnnnnnn")
    try {
      const symbols = await this.symbolService.getAllSymbols();
      console.log("jjjjjjjjjjj",symbols)
      return { success: true, symbols };
    } catch (error) {
      throw new HttpException(`Failed to fetch symbols: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}