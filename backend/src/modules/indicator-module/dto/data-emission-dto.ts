

import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateEmissionSettingsDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsArray()
  @IsString({ each: true })
  enabledIndicators: string[];

  @IsArray()
  @IsString({ each: true })
  enabledTimeframes: string[];
}


