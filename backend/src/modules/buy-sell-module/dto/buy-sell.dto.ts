import { IsString, IsNumber, Min, MaxLength, IsEnum } from 'class-validator';

export class CreateSymbolDto {
  @IsString()
  @MaxLength(10)
  symbol: string;

  @IsNumber()
  @Min(0)
  entryPrice: number;

  @IsEnum(['long', 'short'])
  side: string;
}

export class UpdateSymbolDto {
  @IsString()
  @MaxLength(10)
  symbol: string;

  @IsNumber()
  @Min(0)
  entryPrice: number;

  @IsEnum(['long', 'short'])
  side: string;
}