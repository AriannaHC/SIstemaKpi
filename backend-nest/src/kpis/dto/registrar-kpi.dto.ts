import {
  IsInt,
  IsOptional,
  IsString,
  IsObject,
  IsNotEmpty,
} from 'class-validator';

export class RegistrarKpiDto {
  @IsInt()
  @IsNotEmpty()
  kpi_id: number;

  @IsInt()
  @IsOptional()
  semana?: number;

  @IsString()
  @IsOptional()
  periodo_inicio?: string;

  @IsString()
  @IsOptional()
  periodo_fin?: string;

  @IsObject()
  @IsNotEmpty()
  valores: Record<string, any>;
}
