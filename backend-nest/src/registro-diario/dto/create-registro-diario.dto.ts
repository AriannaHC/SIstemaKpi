import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateRegistroDiarioDto {
  @IsString() @IsNotEmpty() proceso: string;
  @IsString() @IsNotEmpty() tipo_actividad: string;
  @IsString() @IsNotEmpty() tipo_tarea: string;
  @IsString() @IsNotEmpty() entregable: string;
  @IsString() @IsNotEmpty() responsable_asigna: string;
  @IsDateString() @IsNotEmpty() fecha_inicio: string;
  @IsDateString() @IsNotEmpty() fecha_entrega: string;

  // Campos que eran obligatorios en la BD original
  @IsString() @IsOptional() unidad_medida?: string;
  @IsNumber() @IsOptional() tiempo_estimado?: number;
  @IsString() @IsOptional() estado_base?: string;
}
