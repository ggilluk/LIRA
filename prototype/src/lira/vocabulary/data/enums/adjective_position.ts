// WordNet's own three syntactic-position restrictions for an adjective
// sense -- undefined (syntacticPositionForSense's own return) means
// unrestricted (attributive AND predicative both fine), the common
// case; only ~4% of dict/data.adj's own lemmas carry one of these three
// markers at all.
export enum AdjectivePosition {
  // WordNet "(a)" -- only directly before the noun it modifies
  // ("former" in "the former president", never "the president is former").
  ATTRIBUTIVE_ONLY = 0,
  // WordNet "(p)" -- only after a linking verb, never directly before
  // the noun ("afraid" in "he is afraid", never "the afraid man").
  PREDICATE_ONLY = 1,
  // WordNet "(ip)" -- only directly after the noun it modifies
  // ("galore" in "whiskey galore", never "galore whiskey" or
  // "the whiskey is galore").
  IMMEDIATELY_POSTNOMINAL = 2,
}
