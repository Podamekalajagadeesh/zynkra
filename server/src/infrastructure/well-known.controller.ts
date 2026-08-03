import { Controller, Get, Header } from '@nestjs/common';

// Universal-link association files for the mobile apps. The team ID and
// certificate fingerprint are placeholders — replace with real values once the
// production domain and signing certs exist, then verify at Apple/Google.
@Controller('.well-known')
export class WellKnownController {
  @Get('apple-app-site-association')
  @Header('Content-Type', 'application/json')
  appleAppSiteAssociation() {
    return {
      applinks: {
        apps: [],
        details: [
          {
            appID: 'TEAMID.com.zynkra.app',
            paths: ['/post/*', '/threads/*'],
          },
        ],
      },
    };
  }

  @Get('assetlinks.json')
  @Header('Content-Type', 'application/json')
  assetLinks() {
    return [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.zynkra.app',
          sha256_cert_fingerprints: ['REPLACE_WITH_SIGNING_CERT_SHA256'],
        },
      },
    ];
  }
}
