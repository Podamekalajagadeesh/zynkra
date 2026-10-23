import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { InboxRateLimitException } from './http-signatures.service';

/**
 * Controller-scoped exception filter for the federation routes.
 *
 * Nest's stock exception handling cannot attach response headers — its
 * `HttpException` carries no header support — so the one thing this filter
 * exists for is `Retry-After` on inbox 429s: a peer that gets a bare 429 has
 * no idea how long to back off, and Mastodon's delivery queue uses that header
 * to schedule its retry. Every other case is written exactly as Nest's default
 * handler would write it, so behavior outside the 429 path is unchanged.
 */
@Catch()
export class FederationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FederationExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<any>();

    if (exception instanceof InboxRateLimitException) {
      response.set('Retry-After', String(exception.retryAfterSeconds));
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    this.logger.error(
      'Unhandled exception in federation route',
      exception instanceof Error ? exception.stack : String(exception)
    );
    response.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}
