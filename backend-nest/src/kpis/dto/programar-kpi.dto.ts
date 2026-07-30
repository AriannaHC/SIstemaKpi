import { IsDateString, IsNotEmpty } from 'class-validator';

export class ProgramarKpiDto {
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_fin: string;
}
