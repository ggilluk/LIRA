# WordNet 3.1 dict/ files

The raw Princeton WordNet 3.1 database files (`dict/data.{noun,verb,adj,adv}`,
`dict/index.{noun,verb,adj,adv,sense}`) -- not yet wired into any
`WordSeeder`/`Dictionary` code path, just the raw upstream data.

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
