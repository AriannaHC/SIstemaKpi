import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { KpiRol } from '../entities/kpi-rol.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Kpi } from 'src/entities/kpi.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, KpiRol, Kpi])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
