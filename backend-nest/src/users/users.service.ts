import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { KpiRol } from '../entities/kpi-rol.entity';
import { Kpi } from '../entities/kpi.entity';
import { CacheService } from '../common/cache/cache.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(KpiRol) private rolesRepo: Repository<KpiRol>,
    @InjectRepository(Kpi) private kpiRepo: Repository<Kpi>,
    private cache: CacheService,
  ) {}

  private serialize(u: User) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      kpi_rol_id: u.kpiRolId,
      kpi_area_id: u.kpiAreaId,
      rol_nombre: u.rolKpi ? u.rolKpi.nombre : null,
      area_nombre: u.areaKpi ? u.areaKpi.nombre : null,
    };
  }

  async findAllActive() {
    const cacheKey = 'users-lista';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const users = await this.usersRepo.find({
      where: { status: true },
      relations: { areaKpi: true, rolKpi: true },
      order: { name: 'ASC' },
    });
    const resultado = users.map((u) => this.serialize(u));
    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  async findMiEquipo(areaId: number) {
    const cacheKey = `users-mi-equipo-${areaId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const users = await this.usersRepo.find({
      where: { status: true, kpiAreaId: areaId },
      relations: { areaKpi: true, rolKpi: true },
      order: { name: 'ASC' },
    });
    const resultado = users.map((u) => this.serialize(u));
    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.kpi_rol_id === null || dto.kpi_rol_id === undefined) {
      user.kpiRolId = null;
      user.kpiAreaId = null;

      await this.kpiRepo.update(
        { responsableId: userId },
        { responsableId: null },
      );
    } else {
      user.kpiRolId = dto.kpi_rol_id;
      user.kpiAreaId = dto.kpi_rol_id === 1 ? null : (dto.kpi_area_id ?? null);
    }

    await this.usersRepo.save(user);
    this.cache.invalidatePrefix('users-');
    this.cache.invalidatePrefix('kpis-');

    const reloaded = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { areaKpi: true, rolKpi: true },
    });
    if (!reloaded) throw new NotFoundException('Usuario no encontrado');
    return this.serialize(reloaded);
  }

  async findRoles() {
    const roles = await this.rolesRepo.find({ order: { id: 'ASC' } });
    return roles.map((r) => ({ id: r.id, nombre: r.nombre }));
  }
}
