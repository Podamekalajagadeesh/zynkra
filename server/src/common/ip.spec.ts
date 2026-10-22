import { parseIp, parseCidr, ipMatchesCidr, ipInAllowlist, isValidIpOrCidr } from './ip';

describe('parseIpv4 / parseIp', () => {
  it('parses dotted quads', () => {
    expect(parseIp('0.0.0.0')).toEqual({ bits: 0n, width: 32, isV4: true });
    expect(parseIp('255.255.255.255')).toEqual({ bits: 4294967295n, width: 32, isV4: true });
    expect(parseIp('203.0.113.10')).toEqual({ bits: 3405803786n, width: 32, isV4: true });
  });

  it('unwraps IPv4-mapped IPv6, which is what Node reports for IPv4 clients', () => {
    expect(parseIp('::ffff:203.0.113.10')).toEqual({ bits: 3405803786n, width: 32, isV4: true });
  });

  it('rejects out-of-range and malformed octets', () => {
    for (const bad of ['256.0.0.1', '1.2.3', '1.2.3.4.5', 'a.b.c.d', '', '  ']) {
      expect(parseIp(bad)).toBeNull();
    }
  });

  it('rejects leading-zero octets, which are ambiguous between parsers', () => {
    // "010" is octal to some resolvers and decimal to others. A mismatch inside
    // an allowlist is a security bug, so refuse rather than guess.
    expect(parseIp('010.0.0.1')).toBeNull();
    expect(parseIp('192.168.001.1')).toBeNull();
  });

  it('rejects a bogus IPv4-mapped address', () => {
    expect(parseIp('::ffff:999.0.0.1')).toBeNull();
  });

  it('parses IPv6 including :: compression', () => {
    expect(parseIp('::')?.bits).toBe(0n);
    expect(parseIp('::1')?.bits).toBe(1n);
    expect(parseIp('2001:db8::1')?.width).toBe(128);
    expect(parseIp('2001:0db8:0000:0000:0000:0000:0000:0001')?.bits).toBe(
      parseIp('2001:db8::1')!.bits
    );
  });

  it('rejects malformed IPv6', () => {
    for (const bad of ['2001:db8:::1', '1:2:3:4:5:6:7', 'gggg::1', '1::2::3']) {
      expect(parseIp(bad)).toBeNull();
    }
  });

  it('strips a zone index', () => {
    expect(parseIp('fe80::1%eth0')?.bits).toBe(parseIp('fe80::1')!.bits);
  });

  it('parses IPv6 with an embedded IPv4 tail', () => {
    expect(parseIp('::ffff:1.2.3.4')).toEqual({ bits: 16909060n, width: 32, isV4: true });
  });
});

describe('parseCidr', () => {
  it('treats a bare address as a full-length prefix', () => {
    expect(parseCidr('203.0.113.10')).toEqual({
      network: 3405803786n,
      prefixLength: 32,
      width: 32,
      isV4: true,
    });
  });

  it('parses an IPv4 CIDR', () => {
    const cidr = parseCidr('203.0.113.0/24');
    expect(cidr).not.toBeNull();
    expect(cidr!.prefixLength).toBe(24);
    expect(cidr!.width).toBe(32);
  });

  it('parses an IPv6 CIDR', () => {
    const cidr = parseCidr('2001:db8::/32');
    expect(cidr!.prefixLength).toBe(32);
    expect(cidr!.width).toBe(128);
  });

  it('rejects a prefix longer than the address width', () => {
    expect(parseCidr('203.0.113.0/33')).toBeNull();
    expect(parseCidr('2001:db8::/129')).toBeNull();
  });

  it('rejects a non-numeric prefix', () => {
    expect(parseCidr('203.0.113.0/abc')).toBeNull();
    expect(parseCidr('203.0.113.0/')).toBeNull();
  });
});

describe('ipMatchesCidr', () => {
  it('matches an exact address', () => {
    expect(ipMatchesCidr('203.0.113.10', '203.0.113.10')).toBe(true);
    expect(ipMatchesCidr('203.0.113.11', '203.0.113.10')).toBe(false);
  });

  it('matches within an IPv4 CIDR', () => {
    expect(ipMatchesCidr('203.0.113.1', '203.0.113.0/24')).toBe(true);
    expect(ipMatchesCidr('203.0.113.255', '203.0.113.0/24')).toBe(true);
    expect(ipMatchesCidr('203.0.114.1', '203.0.113.0/24')).toBe(false);
  });

  it('matches a /32 and a /0', () => {
    expect(ipMatchesCidr('203.0.113.10', '203.0.113.10/32')).toBe(true);
    expect(ipMatchesCidr('8.8.8.8', '0.0.0.0/0')).toBe(true);
  });

  it('matches within an IPv6 CIDR', () => {
    expect(ipMatchesCidr('2001:db8:0:1::1', '2001:db8::/32')).toBe(true);
    expect(ipMatchesCidr('2001:db9::1', '2001:db8::/32')).toBe(false);
  });

  it('matches an IPv4-mapped client address against a stored IPv4 entry', () => {
    expect(ipMatchesCidr('::ffff:203.0.113.10', '203.0.113.10')).toBe(true);
  });

  it('does NOT let an IPv4 address match an IPv6 range, or vice versa', () => {
    expect(ipMatchesCidr('203.0.113.10', '2001:db8::/32')).toBe(false);
    expect(ipMatchesCidr('2001:db8::1', '203.0.113.0/24')).toBe(false);
  });

  it('does not let a widened prefix leak across families', () => {
    // ::ffff:0:0/96 is the IPv4-mapped range; parseIp unwraps the client side
    // to isV4, so this must not match an arbitrary IPv6 address.
    expect(ipMatchesCidr('2001:db8::1', '::ffff:0:0/96')).toBe(false);
  });

  it('returns false for unparseable input on either side', () => {
    expect(ipMatchesCidr('nonsense', '203.0.113.0/24')).toBe(false);
    expect(ipMatchesCidr('203.0.113.1', 'nonsense/24')).toBe(false);
    expect(ipMatchesCidr('', '')).toBe(false);
  });
});

describe('ipInAllowlist', () => {
  const list = ['203.0.113.0/24', '198.51.100.7', '2001:db8::/32'];

  it('matches any entry', () => {
    expect(ipInAllowlist('203.0.113.99', list)).toBe(true);
    expect(ipInAllowlist('198.51.100.7', list)).toBe(true);
    expect(ipInAllowlist('2001:db8::5', list)).toBe(true);
  });

  it('does not match an unlisted address', () => {
    expect(ipInAllowlist('192.0.2.1', list)).toBe(false);
  });

  it('is false for a missing address or empty list', () => {
    expect(ipInAllowlist(null, list)).toBe(false);
    expect(ipInAllowlist(undefined, list)).toBe(false);
    expect(ipInAllowlist('203.0.113.1', [])).toBe(false);
  });

  it('ignores unparseable entries rather than throwing', () => {
    expect(ipInAllowlist('203.0.113.1', ['garbage', '203.0.113.0/24'])).toBe(true);
  });
});

describe('isValidIpOrCidr', () => {
  it('accepts addresses and CIDRs', () => {
    expect(isValidIpOrCidr('203.0.113.10')).toBe(true);
    expect(isValidIpOrCidr('203.0.113.0/24')).toBe(true);
    expect(isValidIpOrCidr('2001:db8::/32')).toBe(true);
    expect(isValidIpOrCidr('  203.0.113.10  ')).toBe(true);
  });

  it('rejects hostnames — resolving them here would be a security problem', () => {
    expect(isValidIpOrCidr('example.com')).toBe(false);
    expect(isValidIpOrCidr('localhost')).toBe(false);
    expect(isValidIpOrCidr('evil.example.com')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidIpOrCidr('')).toBe(false);
    expect(isValidIpOrCidr('203.0.113.0/99')).toBe(false);
    expect(isValidIpOrCidr('999.1.1.1')).toBe(false);
  });
});
