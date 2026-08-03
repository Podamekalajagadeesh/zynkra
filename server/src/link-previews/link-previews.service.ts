import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { LinkPreview } from './entities/link-preview.entity';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HTML_BYTES = 2_000_000;
const USER_AGENT = 'ZynkraBot/1.0 (+https://github.com/Podamekalajagadeesh/zynkra)';

@Injectable()
export class LinkPreviewsService {
  private readonly logger = new Logger(LinkPreviewsService.name);

  constructor(
    @InjectRepository(LinkPreview)
    private readonly previewsRepository: Repository<LinkPreview>,
  ) {}

  async unfurl(rawUrl: string): Promise<LinkPreview> {
    const url = await this.assertPublicUrl(rawUrl);

    const cached = await this.previewsRepository.findOne({ where: { url: url.href } });
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      return cached;
    }

    let preview: LinkPreview;
    try {
      const { data } = await axios.get<string>(url.href, {
        timeout: 8000,
        maxRedirects: 3,
        responseType: 'text',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      });
      preview = this.parseHtml(url.href, typeof data === 'string' ? data.slice(0, MAX_HTML_BYTES) : '');
    } catch (error) {
      this.logger.debug(`unfurl failed for ${url.href}: ${(error as Error).message}`);
      preview = this.previewsRepository.create({ url: url.href });
    }

    return this.previewsRepository.save(preview);
  }

  private parseHtml(url: string, html: string): LinkPreview {
    const root = parse(html);
    const meta = (property: string): string | null => {
      const el = root.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el?.getAttribute('content')?.trim() || null;
    };

    const title = meta('og:title') ?? root.querySelector('title')?.text?.trim() ?? null;
    const description = meta('og:description') ?? meta('description') ?? null;
    const image = meta('og:image') ?? meta('twitter:image') ?? null;
    const siteName = meta('og:site_name') || null;
    const favicon =
      root.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.getAttribute('href') || null;

    return this.previewsRepository.create({
      url,
      title: title ? title.slice(0, 512) : null,
      description: description ? description.slice(0, 512) : null,
      image,
      siteName: siteName ? siteName.slice(0, 255) : null,
      favicon,
    });
  }

  private async assertPublicUrl(rawUrl: string): Promise<URL> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('Only http/https URLs are supported');
    }
    if (isPrivateHostname(url.hostname)) {
      throw new BadRequestException('URL host is not reachable');
    }

    // SSRF guard: reject URLs whose resolved address is private or reserved.
    try {
      const { address } = await lookup(url.hostname, { verbatim: true });
      if (isPrivateIp(address)) {
        throw new BadRequestException('URL host is not reachable');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('URL host could not be resolved');
    }

    return url;
  }

  @Cron('0 3 * * *', { name: 'link-preview-cache-cleanup' })
  async cleanupStalePreviews(): Promise<void> {
    const cutoff = new Date(Date.now() - CACHE_TTL_MS);
    await this.previewsRepository.delete({ fetchedAt: LessThan(cutoff) });
  }
}

function isPrivateHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  );
}

function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower.startsWith('::ffff:')) {
    return isPrivateIpv4(lower.slice(7));
  }
  if (ip.includes(':')) {
    return (
      lower === '::1' ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('::')
    );
  }
  return isPrivateIpv4(ip);
}

function isPrivateIpv4(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
    return true;
  }
  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0 ||
    a >= 224
  );
}

// Keep isIP referenced so the import stays used when types change the caller.
void isIP;
