import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BuySell } from './buy-sell.schema';
import { SocketService } from 'src/common/websocket/socket.service';

@Injectable()
export class SymbolService {
  constructor(
    @InjectModel(BuySell.name) private symbolModel: Model<BuySell>,
    @Inject('SOCKET_SERVICE') private readonly socketService: SocketService,
  ) {}

  async addSymbol(symbol: string, entryPrice: number, side: string): Promise<{ symbol: BuySell }> {
    console.log('Adding symbol:', symbol, entryPrice, side);
    try {
      const normalizedSide = side.toLowerCase() as 'long' | 'short';
      const newSymbol = new this.symbolModel({ symbol, entryPrice, side: normalizedSide });
      const savedSymbol = await newSymbol.save();
      const allSymbols = await this.getAllSymbols(); // Fetch updated list
      this.socketService.emitLiveDataAll({ symbols: allSymbols });
      console.log('Emitted live-data-all after add:', allSymbols);
      return { symbol: savedSymbol };
    } catch (error) {
      console.error('Error saving symbol:', error);
      throw new Error(`Failed to save symbol: ${error.message}`);
    }
  }

  async updateSymbol(id: string, symbol: string, entryPrice: number, side: string): Promise<{ symbol: BuySell }> {
    try {
      const normalizedSide = side.toLowerCase() as 'long' | 'short';
      const updatedSymbol = await this.symbolModel.findByIdAndUpdate(
        id,
        { symbol, entryPrice, side: normalizedSide },
        { new: true, runValidators: true },
      );
      if (!updatedSymbol) {
        throw new NotFoundException('Symbol not found');
      }
      const allSymbols = await this.getAllSymbols(); // Fetch updated list
      this.socketService.emitLiveDataAll({ symbols: allSymbols });
      console.log('Emitted live-data-all after update:', allSymbols);
      return { symbol: updatedSymbol };
    } catch (error) {
      console.error('Error updating symbol:', error);
      throw error instanceof NotFoundException ? error : new Error(`Failed to update symbol: ${error.message}`);
    }
  }

  async deleteSymbol(id: string): Promise<void> {
    try {
      const result = await this.symbolModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('Symbol not found');
      }
      const allSymbols = await this.getAllSymbols(); // Fetch updated list
      this.socketService.emitLiveDataAll({ symbols: allSymbols });
      console.log('Emitted live-data-all after delete:', allSymbols);
    } catch (error) {
      console.error('Error deleting symbol:', error);
      throw error instanceof NotFoundException ? error : new Error(`Failed to delete symbol: ${error.message}`);
    }
  }

  async getAllSymbols(): Promise<BuySell[]> {
    console.log('Fetching all symbols');
    const symbols = await this.symbolModel.find().exec();
    return symbols;
  }
}