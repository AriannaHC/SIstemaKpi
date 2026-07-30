import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class AuditarCalidadDto {
  @IsString() @IsNotEmpty() estado_entregable_calidad: string;
  @IsString() @IsNotEmpty() estado_animo: string;
  @IsNumber() tiempo_estandar: number;
  @IsNumber() tiempo_real_calidad: number;
  @IsString() errores_observaciones: string;
  @IsString() observaciones_calidad: string;
  @IsString() rubrica_final: string;
  @IsNumber() eficiencia: number;
  @IsNumber() tasa_calidad: number;
}
