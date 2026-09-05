import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectedAccount } from './entities/connected-account.entity';
import { ConnectedAccountsService } from './connected-accounts.service';
import { ConnectedAccountsController } from './connected-accounts.controller';
import { DataPermissionsModule } from '../common/data-permissions/data-permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectedAccount]), DataPermissionsModule],
  controllers: [ConnectedAccountsController],
  providers: [ConnectedAccountsService],
})
export class ConnectedAccountsModule {}
