import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenRouterService } from './openrouter.service';
import { DataPermissionsModule } from './data-permissions/data-permissions.module';

/**
 * Shared infrastructure module.
 *
 * Exports `OpenRouterService` so any module that imports `CommonModule` can
 * inject the LLM wrapper. Marked `@Global()` to avoid re-importing in every
 * consumer module — just importing `CommonModule` in `app.module.ts` is
 * sufficient to make `OpenRouterService` injectable everywhere.
 */
@Global()
@Module({
  imports: [HttpModule, DataPermissionsModule],
  providers: [OpenRouterService],
  exports: [OpenRouterService, DataPermissionsModule],
})
export class CommonModule {}
