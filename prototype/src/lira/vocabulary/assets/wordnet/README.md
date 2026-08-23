# WordNet 3.1 dict/ files

The raw Princeton WordNet 3.1 database files: `dict/data.{noun,verb,adj,adv}`
are parsed by `role/wordnet_loader.ts` and seeded by
`WordSeeder.seedWordNet` (`role/word_seeder.ts`) -- see those two
files' own docstrings, `Word.synsetId`'s (`data/entities/word.ts`), and
`LexicalRelationshipType`'s (`data/enums/lexical_relationship_type.ts`), for
how a WordNet synset maps onto a LIRA Domain+Word, its SYNONYM
`LexicalRelationship`s, and (via each synset's own pointer records --
hypernym, meronym, antonym, and the rest of WordNet's pointer symbol
set) every other `LexicalRelationship` kind WordNet expresses between
two synsets or two specific words within them.

`dict/index.{noun,verb,adj,adv}` are bundled for provenance/completeness
but still not read by any code path -- `wordnet_loader.ts` derives
everything it needs (a synset's own member lemmas, gloss, and pointer
records) directly from the `data.*` files; the index files' own reverse
lemma -> synset lookup has no LIRA counterpart to seed yet.

`dict/index.sense` **is** read, separately from the four above --
`wordnet_loader.ts`'s own `loadSenseFrequencies()` sums its `tag_cnt`
column (how often a sense_key was tagged in WordNet's own SemCor
semantic concordance corpus) per synset, seeding `Sense.senseFrequency`
(`data/entities/sense.ts`) and, via `WordSeeder.seedWordNet`'s own
`orderSensesByFrequency`, the order of a polysemous Word/Phrase's own
`senseIds` -- see those two docstrings for the full mechanism.

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
