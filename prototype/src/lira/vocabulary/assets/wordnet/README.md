# WordNet 3.1 dict/ files

The raw Princeton WordNet 3.1 database files: `dict/data.{noun,verb,adj,adv}`
are parsed by `role/wordnet_loader.ts` and seeded by
`WordSeeder.seedWordNet` (`role/word_seeder.ts`) -- see those two
files' own docstrings, and `Word.synsetId`'s (`data/word.ts`), for how a
WordNet synset maps onto a LIRA Domain+Word and its SYNONYM
`LexicalRelationship`s. `dict/index.{noun,verb,adj,adv,sense}` are
bundled for provenance/completeness but not yet read by any code path
-- `wordnet_loader.ts` derives everything it needs (a synset's own
member lemmas and gloss) directly from the `data.*` files.

**Source:** requested as `https://wordnetcode.princeton.edu/wn3.1.dict.tar.gz`,
but that host is blocked by this sandbox's outbound network policy.
Fetched instead via the `wordnet-db` npm package (`registry.npmjs.org`
is allowlisted), which bundles the identical WordNet 3.1 `dict/` files:
https://registry.npmjs.org/wordnet-db/-/wordnet-db-3.1.14.tgz
(sha256 `9b93831ae01771d02f360c1ebf3fe415ed2426a31f2201cb0943025c7403e79a`
for that tarball; see https://www.npmjs.com/package/wordnet-db).

**License:** Princeton WordNet License, `LICENSE` in this directory --
permissive, no fee/royalty, but requires the copyright notice and
disclaimer to accompany any copy or redistribution (including this one).
