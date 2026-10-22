/**
 * Zip-archive import (POST /data-export/import-zip).
 *
 * The JSON import alone leaves media URLs pointing at the exporting instance.
 * These tests pin the zip flow: data.json is parsed, media/ files are
 * re-hosted into this instance's upload directory, and unsafe entries never
 * escape it.
 */
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { ExportService, ExportData } from './export.service';

const emptyRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
});

function buildZip(files: Record<string, Buffer | string>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, typeof content === 'string' ? Buffer.from(content, 'utf8') : content);
  }
  return zip.toBuffer();
}

function minimalExportData(): ExportData {
  return {
    user: { username: 'mover', email: 'mover@example.com' },
    posts: [
      {
        content: 'imported post with media',
        media: [{ url: '/uploads/photo.jpg', type: 'image', sortOrder: 0 }],
      },
    ],
    comments: [],
    reactions: [],
    follows: { following: [], followers: [] },
    bookmarks: [],
    stories: [],
    reels: [],
    messages: [],
    conversations: [],
    articles: [],
    podcasts: [],
    courses: [],
    enrollments: [],
    groupMemberships: [],
    notifications: [],
    orders: [],
    wallet: [],
    verification: [],
    linkedAccounts: [],
    settings: null,
    personalization: null,
    analytics: null,
    exportManifest: { enabledCategories: [], omittedCategories: [] },
    exportedAt: new Date().toISOString(),
    version: '2.1.0',
  } as ExportData;
}

describe('ExportService.importFromZip', () => {
  let uploadDir: string;

  const makeService = () => {
    const configStub = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'UPLOAD_DIR' ? uploadDir : fallback
      ),
    };
    const repos = Array(20)
      .fill(null)
      .map(() => emptyRepository());
    return Reflect.construct(ExportService, [...repos, configStub]) as ExportService;
  };

  beforeEach(() => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zynkra-zip-import-'));
  });

  afterEach(() => {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('re-hosts media files and runs the JSON import', async () => {
    const service = makeService();
    const importSpy = jest
      .spyOn(service, 'importFromJson')
      .mockResolvedValue({ imported: true, posts: 1, comments: 0 } as any);

    const zip = buildZip({
      'data.json': JSON.stringify(minimalExportData()),
      'media/photo.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xdb]),
    });

    const result = await service.importFromZip('user-1', zip);

    expect(result.imported).toBe(true);
    expect(result.mediaRehosted).toBe(1);
    expect(importSpy).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ posts: expect.any(Array) })
    );
    expect(fs.existsSync(path.join(uploadDir, 'photo.jpg'))).toBe(true);
  });

  it('rejects a buffer that is not a zip archive', async () => {
    const service = makeService();
    await expect(service.importFromZip('user-1', Buffer.from('not a zip'))).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('rejects an archive without data.json', async () => {
    const service = makeService();
    const zip = buildZip({ 'media/photo.jpg': Buffer.from('x') });
    await expect(service.importFromZip('user-1', zip)).rejects.toThrow(/data\.json/);
  });

  it('rejects data.json that is not valid JSON', async () => {
    const service = makeService();
    const zip = buildZip({ 'data.json': '{nope' });
    await expect(service.importFromZip('user-1', zip)).rejects.toThrow(/not valid JSON/);
  });

  it('does not write files outside a flat media/ directory', async () => {
    const service = makeService();
    const importSpy = jest
      .spyOn(service, 'importFromJson')
      .mockResolvedValue({ imported: true, posts: 0, comments: 0 } as any);

    const zip = buildZip({
      'data.json': JSON.stringify(minimalExportData()),
      'media/nested/deep.jpg': Buffer.from('nested'),
      'media/ok.jpg': Buffer.from('ok'),
      'not-media/evil.jpg': Buffer.from('evil'),
    });

    const result = await service.importFromZip('user-1', zip);

    expect(result.mediaRehosted).toBe(1);
    expect(fs.existsSync(path.join(uploadDir, 'ok.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(uploadDir, 'deep.jpg'))).toBe(false);
    expect(fs.existsSync(path.join(uploadDir, 'evil.jpg'))).toBe(false);
    expect(importSpy).toHaveBeenCalled();
  });
});
