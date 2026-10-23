/**
 * Stored on `groups.votingSystem` (PG enum `groups_votingsystem_enum` has all
 * three values since the baseline migration). Only ONE_MEMBER_ONE_VOTE is
 * consulted by vote counting today — the other two are accepted on create and
 * persisted, but no token/NFT weighting logic exists yet. Not deleted, because
 * groups created with them already exist in the DB.
 */
export enum VotingSystem {
  ONE_MEMBER_ONE_VOTE = 'one_member_one_vote',
  TOKEN_WEIGHTED = 'token_weighted',
  NFT_GATED = 'nft_gated',
}
