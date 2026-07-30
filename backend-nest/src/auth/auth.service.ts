import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { verifyPassword, needsRehash, getPasswordHash } from './security.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      relations: {
        areaKpi: true,
        rolKpi: true,
      },
    });

    if (!user || !verifyPassword(dto.password, user.password)) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (needsRehash(user.password)) {
      user.password = getPasswordHash(dto.password);
      await this.usersRepo.save(user);
    }

    if (!user.status) throw new ForbiddenException('Usuario inactivo');
    if (!user.kpiRolId)
      throw new ForbiddenException('No tienes acceso al sistema de KPIs');

    const payload = {
      sub: String(user.id),
      rol: user.kpiRolId,
      area: user.kpiAreaId,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        kpi_area_id: user.kpiAreaId,
        kpi_rol_id: user.kpiRolId,
        area_nombre: user.areaKpi ? user.areaKpi.nombre : null,
        rol_nombre: user.rolKpi ? user.rolKpi.nombre : null,
      },
      token: {
        access_token: accessToken,
        token_type: 'bearer',
      },
    };
  }
}
