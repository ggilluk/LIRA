# WordNet 3.1 dict/ files

The raw Princeton WordNet 3.1 database files: `dict/data.{noun,verb,adj,adv}`
are parsed by `role/wordnet_loader.ts` and seeded by
`WordSeeder.seedWordNet` (`role/word_seeder.ts`) -- see those two
files' own docstrings, `Word.synsetId`'s (`data/word.ts`), and
`LexicalRelationshipType`'s (`data/lexical_relationship_type.ts`), for
how a WordNet synset maps onto a LIRA Domain+Word, its SYNONYM
`LexicalRelationship`s, and (via each synset's own pointer records --
hypernym, meronym, antonym, and the rest of WordNet's pointer symbol
set) every other `LexicalRelationship` kind WordNet expresses between
two synsets or two specific words within them.

`dict/index.{noun,verb,adj,adv,sense}` are bundled for
provenance/completeness but still not read by any code path --
`wordnet_loader.ts` derives everything it needs (a synset's own member
lemmas, gloss, and pointer records) directly from the `data.*` files;
the index files' own reverse lemma -> synset lookup and sense-frequency
data (which sense of a polysemous word is used most often) have no LIRA
counterpart to seed yet.

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
