"""The set of Domains currently hosted on this LIRA Host.

Also implements the Knowledge Vector Space Specification's Dimensions
5 and 6 (knowledge/documentation/knowledge_vector_space_specification.md,
sections 14, 15, 41.6) -- Domain generalisation and composition. This
is the Domain-scale mirror of TensorLiraGraph's D1/D2 (Concept scale,
tensor_graph.py): same fractional/gap indexing (fractional_midpoint,
spec 41.9), same Root/Bottom convention, same "explicit registration,
never auto-derived" discipline as D1/D2's isA_uuid/partOf_uuid. It
lives here rather than in tensor_graph.py because D5/D6 are inherently
cross-Domain -- a single Domain's own TensorLiraGraph has no visibility
into other Domains at all (spec 4's own Domain-boundary rule), while
HostedDomains is the one place on a LIRAHost that already sees every
Domain it hosts.

The "Common" Domain (host.py's COMMON_DOMAIN_NAME) is the outer
boundary for both trees (spec 4.1, 14, 15) -- it stays at D1_D2_ROOT
(1.0) for both D5 and D6 permanently; register_domain_generalisation/
register_domain_composition refuse to give Common a parent, since
nothing is broader than the Common Domain by definition. Every other
Domain starts at D1_D2_ROOT too (spec's own "nothing broader known
yet" convention, tensor_graph.py's own docstring) until it's
explicitly registered under a parent."""

from .tensor_graph import D1_D2_BOTTOM, D1_D2_ROOT, DEFAULT_EPSILON_MERGE, DEFAULT_EPSILON_REVIEW, fractional_midpoint

COMMON_DOMAIN_NAME = "Common"


class HostedDomains:
    def __init__(self, epsilon_merge=DEFAULT_EPSILON_MERGE, epsilon_review=DEFAULT_EPSILON_REVIEW):
        self._domains = {}  # name -> Domain

        # Knowledge Vector Space D5/D6 (module docstring) -- Domain
        # scale mirror of TensorLiraGraph's D1/D2, keyed by Domain name
        # rather than a row index since Domains are held by name here,
        # not in a dense/indexed table.
        self.epsilon_merge = epsilon_merge
        self.epsilon_review = epsilon_review
        self._domain_d5_z = {}  # name -> z (generalisation, Domain Hypernym -> Domain Hyponym)
        self._domain_d5_parent = {}  # name -> parent domain name (-1/None = none)
        self._d5_next_gap_bound = {}  # parent name -> closest-to-parent z claimed so far
        self._domain_d6_z = {}  # name -> z (composition, Domain Holonym -> Domain Meronym)
        self._domain_d6_whole = {}  # name -> whole domain name (None = none)
        self._d6_next_gap_bound = {}  # whole name -> closest-to-parent z claimed so far

    def add(self, domain):
        self._domains[domain.name] = domain
        self._domain_d5_z.setdefault(domain.name, D1_D2_ROOT)
        self._domain_d6_z.setdefault(domain.name, D1_D2_ROOT)
        self._domain_d5_parent.setdefault(domain.name, None)
        self._domain_d6_whole.setdefault(domain.name, None)

    def get(self, name: str):
        return self._domains.get(name)

    def __iter__(self):
        return iter(self._domains.values())

    # -- Knowledge Vector Space D5: Domain generalisation (spec 14) --

    def register_domain_generalisation(self, child, parent) -> float:
        """child is a Domain Hyponym of parent (spec 14: Domain
        Hypernym -> Domain Hyponym) -- e.g. a "python.programming"
        Domain registered under a "programming" Domain, itself under
        Common (spec 41.6's own Domain Naming Convention mapping: each
        reverse-hierarchy name segment is one such step). Returns
        child's new D5 z. Raises if `child` is the Common Domain --
        Common is the outer boundary (spec 4.1), nothing is broader
        than it."""
        if child.name == COMMON_DOMAIN_NAME:
            raise ValueError("the Common Domain is the D5/D6 outer boundary and cannot have a parent")
        self._domain_d5_parent[child.name] = parent.name
        parent_z = self._domain_d5_z[parent.name]
        bound = self._d5_next_gap_bound.get(parent.name, D1_D2_BOTTOM)
        new_z = fractional_midpoint(parent_z, bound)
        self._d5_next_gap_bound[parent.name] = new_z
        self._domain_d5_z[child.name] = new_z
        return new_z

    def d5_z(self, domain) -> float:
        return self._domain_d5_z[domain.name]

    def register_domain_hierarchy_from_name(self, host, dotted_name: str):
        """spec 41.6: "python.programming.language.common <=> common ->
        language -> programming -> python". Splits a DNC-001
        reverse-hierarchy dotted Domain name and D5-registers every
        missing intermediate Domain along the path, using the FULL
        cumulative dotted path as each intermediate's own Domain name
        (DNC-003: each component specialises the one to its right --
        "language.common" is what actually identifies that
        specialisation step; the bare "language" segment alone could
        collide across unrelated hierarchies). Returns the final
        (leftmost/most specific) segment's Domain. `host` is required,
        not just this registry, because a missing intermediate Domain
        must be created via LIRAHost.get_or_create_domain, not
        fabricated here. "common" itself (DNC-002) resolves to the
        Host's own real Common Domain, never a separately created
        Domain literally named "common"."""
        segments = dotted_name.split(".")
        if not segments or segments[-1].lower() != "common":
            raise ValueError(f"domain name {dotted_name!r} does not end with the common root (DNC-002)")

        parent_domain = self.get(COMMON_DOMAIN_NAME)
        cumulative = []
        for segment in reversed(segments[:-1]):
            cumulative.insert(0, segment)
            name = ".".join(cumulative + ["common"])
            child_domain = host.get_or_create_domain(name)
            if self._domain_d5_parent.get(child_domain.name) is None:
                self.register_domain_generalisation(child_domain, parent_domain)
            parent_domain = child_domain
        return parent_domain

    # -- Knowledge Vector Space D6: Domain composition (spec 15) --

    def register_domain_composition(self, part, whole) -> float:
        """part is a Domain Meronym of whole (spec 15: Domain Holonym ->
        Domain Meronym). Returns part's new D6 z. Raises if `part` is
        the Common Domain, for the same reason as D5 above."""
        if part.name == COMMON_DOMAIN_NAME:
            raise ValueError("the Common Domain is the D5/D6 outer boundary and cannot have a parent")
        self._domain_d6_whole[part.name] = whole.name
        whole_z = self._domain_d6_z[whole.name]
        bound = self._d6_next_gap_bound.get(whole.name, D1_D2_BOTTOM)
        new_z = fractional_midpoint(whole_z, bound)
        self._d6_next_gap_bound[whole.name] = new_z
        self._domain_d6_z[part.name] = new_z
        return new_z

    def d6_z(self, domain) -> float:
        return self._domain_d6_z[domain.name]

    # -- Combined Domain structure (spec 15.1) --

    def domain_structural_position(self, domain):
        """PD(D) = (D5(D), D6(D)) -- spec 15.1. Mirrors noun structural
        representation (N(C) = (D1(C), D2(C))) at Domain scale."""
        return (self.d5_z(domain), self.d6_z(domain))

    def domain_structural_distance(self, a, b) -> float:
        """Euclidean distance over PD(A)/PD(B) -- spec 15.1's own "This
        mirrors noun structural representation", applied the same way
        noun_structural_distance applies to N(C) (spec 12.1)."""
        a5, a6 = self.domain_structural_position(a)
        b5, b6 = self.domain_structural_position(b)
        return ((a5 - b5) ** 2 + (a6 - b6) ** 2) ** 0.5

    def classify_domain_identity(self, a, b) -> str:
        """Spec 41.3's three-way identity classification, applied to
        domain_structural_distance -- same thresholds, same "evidence,
        not an automatic merge" discipline as classify_noun_identity."""
        distance = self.domain_structural_distance(a, b)
        if distance <= self.epsilon_merge:
            return "MergeCandidate"
        if distance <= self.epsilon_review:
            return "ReviewCandidate"
        return "Distinct"
