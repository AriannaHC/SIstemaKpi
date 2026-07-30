import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(1)
  findAll() {
    return this.usersService.findAllActive();
  }

  @Get('mi-equipo')
  @Roles(2, 3)
  miEquipo(@Req() req) {
    if (!req.user.kpiAreaId) {
      throw new BadRequestException('No tienes un área asignada');
    }
    return this.usersService.findMiEquipo(req.user.kpiAreaId);
  }

  @Put(':id')
  @Roles(1)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Get('roles')
  @Roles(1)
  roles() {
    return this.usersService.findRoles();
  }
}
