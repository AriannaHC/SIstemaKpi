import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Area } from './entities/area.entity';
import { KpiRol } from './entities/kpi-rol.entity';
import { User } from './entities/user.entity';
import { Kpi } from './entities/kpi.entity';
import { KpiCampo } from './entities/kpi-campo.entity';
import { RegistroKpi } from './entities/registro-kpi.entity';
import { RegistroValores } from './entities/registro-valores.entity';
import { KpiProgramado } from './entities/kpi-programado.entity';
import { Notification } from './entities/notification.entity';
import { NotificationRead } from './entities/notification-read.entity';
import { RegistroDiario } from './entities/registro-diario.entity';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupController } from './backup/backup.controller';
import { BackupService } from './backup/backup.service';
import { FtpService } from './common/ftp/ftp.service';
import { InternalController } from './internal/internal.controller';
import { RegistroDiarioModule } from './registro-diario/registro-diario.module';
import { KpisModule } from './kpis/kpis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DATABASE_HOST'),
        port: config.get('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [
          Area,
          KpiRol,
          User,
          Kpi,
          KpiCampo,
          RegistroKpi,
          RegistroValores,
          KpiProgramado,
          Notification,
          NotificationRead,
          RegistroDiario,
        ],
        synchronize: false,
      }),
    }),
    CacheModule,
    AuthModule,
    UsersModule,
    AnalyticsModule,
    RegistroDiarioModule,
    KpisModule,
  ],
  controllers: [BackupController, InternalController],
  providers: [BackupService, FtpService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger('DatabaseCheck');

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      const result = await this.dataSource.query(
        'SELECT COUNT(*) as totalUsuarios FROM users',
      );

      this.logger.log(`✅ ¡Conexión a la BD confirmada!`);
      this.logger.log(
        `📊 Consulta de prueba exitosa. Total de usuarios en la tabla: ${result[0].totalUsuarios}`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error al intentar consultar la base de datos.',
        error,
      );
    }
  }
}
