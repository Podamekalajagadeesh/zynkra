#!/usr/bin/env bash
# Reports which server modules are still wired into the product surface.
#
# This is a REPORT ONLY. It moves nothing, by design.
#
# The previous version of this script listed 10 modules as archive candidates
# using a naive `grep -qi <name> app.module.ts` check. That list was wrong, and
# two of its entries were load-bearing:
#
#   crypto    Not blockchain. This is the Signal Protocol X3DH key store
#             (IdentityKey / PreKey / SignedPreKey / registrationId) — the
#             infrastructure Phase 3 E2EE depends on. Unregistering it breaks
#             1:1 encrypted DMs.
#   tipping   Registers the 'tip' fulfillment handler into PaymentsService and
#             depends on WalletService. This is the 90/10 split on the creator
#             payout path (Phase 2), the product's main differentiator.
#
# snooze, watchlist, forms, and sponsored-posts are also real, persisted, and
# reachable from the client (/watchlist, /settings/snooze).
#
# CORRECTION: `dao` and `token` are genuinely unwired. `token-gated-content` and
# `snapmap` are NOT — they are registered transitively (posts.module.ts,
# groups.module.ts, feed.module.ts), so they report WIRED below. app.module.ts
# previously claimed otherwise, which understated the live attack surface.
#
# Do not add a module to CUT_MODULES without reading its service first and
# checking who imports it.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$ROOT_DIR/server/src"
APP_MODULE="$SRC_DIR/app.module.ts"

# Intended to be cut from the product surface per ROADMAP.md §2 (scope) and §6
# (not doing). Some of these are already reachable via transitive imports — the
# report below tells you which.
CUT_MODULES=(
  token               # fake `$ZYNK` token stored as a Postgres row
  dao                 # DAO governance layered on a Group
  token-gated-content # token-gated access to posts — WIRED via posts/groups modules
  snapmap             # in-process location Maps, never persisted — WIRED via feed module
)

# Real, load-bearing modules. Listed so a future edit can't quietly reclassify
# them. `verify` fails if any of these is missing from AppModule.
PROTECTED_MODULES=(
  crypto  # Signal Protocol X3DH key storage (Phase 3 E2EE)
  tipping # wallet/Stripe tips + revenue split (Phase 2 money path)
  keys    # E2EE session key management
  wallet  # ledger with row-locking
  payments # Stripe Connect payouts + webhooks
  snooze
  watchlist
  forms
  sponsored-posts
  translation
)

if [[ ! -f "$APP_MODULE" ]]; then
  printf 'AppModule not found: %s\n' "$APP_MODULE" >&2
  exit 1
fi

printf '== Archive candidates (cut per ROADMAP.md §2/§6) ==\n'
for module in "${CUT_MODULES[@]}"; do
  if [[ ! -d "$SRC_DIR/$module" ]]; then
    printf 'GONE     %s (directory removed)\n' "$module"
    continue
  fi
  if grep -q "$module" "$APP_MODULE"; then
    printf 'WIRED    %s — registered directly in AppModule, needs unwiring\n' "$module"
    continue
  fi
  # A module can be absent from app.module.ts and still be live if some other
  # module imports it. app.module.ts used to claim that was not the case for
  # token-gated-content and snapmap, and it was wrong.
  importers="$(grep -rl "from '.*$module/$module.module'" "$SRC_DIR" 2>/dev/null | grep -v "/$module/" || true)"
  if [[ -n "$importers" ]]; then
    printf 'WIRED    %s — NOT in AppModule, but imported by:\n' "$module"
    printf '           %s\n' ${importers//$SRC_DIR\//}
  else
    printf 'CUT      %s — off the product surface, code left on disk\n' "$module"
  fi
done

printf '\n== Protected modules (must stay wired) ==\n'
for module in "${PROTECTED_MODULES[@]}"; do
  if ! grep -q "$module" "$APP_MODULE"; then
    printf 'MISSING  %s — expected in AppModule but not found. Investigate.\n' "$module"
  else
    printf 'OK       %s\n' "$module"
  fi
done

cat <<'EOF'

Nothing was moved. Archiving means removing the module from AppModule and the
client route, then leaving the code on disk for later — see git history for the
token / token-gated-content / dao / snapmap removals.
EOF
