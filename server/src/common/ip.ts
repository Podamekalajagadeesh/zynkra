/**
 * IP address and CIDR matching for trusted-address allowlists.
 *
 * Deliberately dependency-free and DNS-free. Resolving a hostname here would be
 * both wrong (a trusted entry should be a literal address) and a security
 * problem (an attacker-controlled DNS record could widen the allowlist).
 *
 * IPv4 and IPv6 are both supported, including IPv4-mapped IPv6 (`::ffff:a.b.c.d`),
 * which is what Node reports for IPv4 clients on a dual-stack socket.
 */

/** Parse a dotted-quad IPv4 address into its 32-bit numeric form. */
function parseIpv4(value: string): bigint | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;

  let result = 0n;
  for (const part of parts) {
    // Reject empty, non-numeric, and out-of-range octets. Leading zeros are
    // rejected too: "010" is ambiguous (octal in some parsers) and a mismatch
    // between parsers is a security bug in an allowlist.
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part.startsWith('0')) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    result = (result << 8n) | BigInt(octet);
  }
  return result;
}

/** Parse an IPv6 address (including `::` compression) into a 128-bit value. */
function parseIpv6(value: string): bigint | null {
  if (!value.includes(':')) return null;

  // An IPv6 address may carry an embedded IPv4 in the last 32 bits.
  let normalized = value;
  const lastColon = value.lastIndexOf(':');
  const tail = value.slice(lastColon + 1);
  if (tail.includes('.')) {
    const v4 = parseIpv4(tail);
    if (v4 === null) return null;
    const high = (v4 >> 16n) & 0xffffn;
    const low = v4 & 0xffffn;
    normalized = `${value.slice(0, lastColon + 1)}${high.toString(16)}:${low.toString(16)}`;
  }

  const doubleColon = normalized.indexOf('::');
  let head: string[];
  let rear: string[];

  if (doubleColon === -1) {
    head = normalized.split(':');
    rear = [];
  } else {
    if (normalized.indexOf('::', doubleColon + 1) !== -1) {
      // More than one `::` is invalid.
      return null;
    }
    head = normalized.slice(0, doubleColon).split(':').filter(Boolean);
    rear = normalized.slice(doubleColon + 2).split(':').filter(Boolean);
    if (head.length + rear.length > 7) {
      // `::` must stand for at least one zero group.
      return null;
    }
  }

  const groupsToBits = (groups: string[]): bigint | null => {
    let acc = 0n;
    for (const group of groups) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
      acc = (acc << 16n) | BigInt(`0x${group}`);
    }
    return acc;
  };

  const headBits = groupsToBits(head);
  const rearBits = groupsToBits(rear);
  if (headBits === null || rearBits === null) return null;

  const headLen = head.length;
  const rearLen = rear.length;
  if (doubleColon === -1 && headLen !== 8) return null;

  const missing = 8 - headLen - rearLen;
  const filler = missing > 0 ? missing : 0;
  return (headBits << BigInt((filler + rearLen) * 16)) | rearBits;
}

/**
 * Normalise an address to a comparable BigInt plus its bit width.
 * IPv4 addresses are widened to 128 bits and marked as v4 so that a stored IPv4
 * address can still match an `::ffff:`-prefixed client address.
 */
export function parseIp(value: string): { bits: bigint; width: 32 | 128; isV4: boolean } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Strip a zone index (fe80::1%eth0) — it is local to an interface and cannot
  // meaningfully be trusted across requests.
  const withoutZone = trimmed.split('%')[0];

  const mapped = withoutZone.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (mapped) {
    const v4 = parseIpv4(mapped[1]);
    if (v4 === null) return null;
    return { bits: v4, width: 32, isV4: true };
  }

  const v4 = parseIpv4(withoutZone);
  if (v4 !== null) {
    return { bits: v4, width: 32, isV4: true };
  }

  const v6 = parseIpv6(withoutZone);
  if (v6 !== null) {
    return { bits: v6, width: 128, isV4: false };
  }

  return null;
}

export interface ParsedCidr {
  network: bigint;
  prefixLength: number;
  width: 32 | 128;
  isV4: boolean;
}

/** Parse `a.b.c.d/n` or `addr::/n`. A bare address is treated as a full-length prefix. */
export function parseCidr(value: string): ParsedCidr | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const slash = trimmed.lastIndexOf('/');
  if (slash === -1) {
    const parsed = parseIp(trimmed);
    if (!parsed) return null;
    return {
      network: parsed.bits,
      prefixLength: parsed.width,
      width: parsed.width,
      isV4: parsed.isV4,
    };
  }

  const address = trimmed.slice(0, slash);
  const prefixText = trimmed.slice(slash + 1);
  if (!/^\d{1,3}$/.test(prefixText)) return null;

  const parsed = parseIp(address);
  if (!parsed) return null;

  const prefixLength = Number(prefixText);
  if (prefixLength < 0 || prefixLength > parsed.width) return null;

  return {
    network: parsed.bits,
    prefixLength,
    width: parsed.width,
    isV4: parsed.isV4,
  };
}

/** True when `cidr` covers `address`. */
export function ipMatchesCidr(address: string, cidr: string): boolean {
  const addr = parseIp(address);
  const range = parseCidr(cidr);
  if (!addr || !range) return false;

  // An IPv4 address never matches an IPv6 range and vice versa, except that an
  // IPv4-mapped IPv6 range (`::ffff:0:0/96`) is treated as the IPv4 space. This
  // is handled by parseIp already unwrapping `::ffff:` to isV4, so the simple
  // width comparison below is sufficient.
  if (addr.width !== range.width) return false;

  if (range.prefixLength === 0) {
    return true;
  }

  const hostBits = BigInt(range.width - range.prefixLength);
  const mask = ((1n << BigInt(range.prefixLength)) - 1n) << hostBits;
  return (addr.bits & mask) === (range.network & mask);
}

/** True when `address` matches any entry in `cidrs` (bare addresses allowed). */
export function ipInAllowlist(address: string | null | undefined, cidrs: readonly string[]): boolean {
  if (!address) return false;
  for (const entry of cidrs) {
    if (ipMatchesCidr(address, entry)) {
      return true;
    }
  }
  return false;
}

/** Shape check used when accepting a new trusted entry from a user. */
export function isValidIpOrCidr(value: string): boolean {
  return parseCidr(value) !== null;
}
