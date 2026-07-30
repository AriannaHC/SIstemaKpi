import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditarOperacionesDto {
  @IsString() @IsOptional() prioridad?: string;
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tiempo_real_operaciones?: number;
  @IsString() @IsOptional() estado_tarea_operaciones?: string;
  @IsString() @IsOptional() motivo_retraso?: string;
  @IsString() @IsOptional() actitud_colaborador?: string;
  @IsString() @IsOptional() enlace_evidencia?: string;
  @IsString() @IsOptional() validacion_lider?: string;
  @IsString() @IsOptional() observaciones_operaciones?: string;
  @Type(() => Number) @IsInt() @IsOptional() dias_vencimiento?: number;
  @IsString() @IsOptional() unidad_medida?: string;
  @Type(() => Number) @IsNumber() @IsOptional() tiempo_estimado?: number;
}
