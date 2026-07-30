import { IsInt, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsInt()
  kpi_rol_id?: number | null;

  @IsOptional()
  @IsInt()
  kpi_area_id?: number | null;
}
