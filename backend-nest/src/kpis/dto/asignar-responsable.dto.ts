import { IsString, IsOptional } from 'class-validator';

export class AsignarResponsableDto {
  @IsString()
  @IsOptional()
  responsable_id?: string;
}
