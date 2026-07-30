import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { KpiRol } from '../entities/kpi-rol.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KpiRol])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
