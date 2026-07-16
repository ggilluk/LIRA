"""LIRA Host: the runtime unit scheduled by the Kubernetes / WASI
management plane. Owns host-level system state and the Domains it
currently hosts.

Every LIRAHost auto-creates a reserved Domain named "Common" (Rule 17
extension -- Cross-Domain Vocabulary, see
vocabulary/documentation/README.md): every other Domain this Host
creates has its Vocabulary seeded from Common's Dictionary, giving all
Domains on a Host a shared vocabulary baseline before anything
domain-specific is added. Common's own Dictionary is itself seeded, on
Host construction, with the mandatory 376-word English Common
Vocabulary Cache (including punctuation, symbols, and numerals -- there
is no separate Punctuation class, see
vocabulary/documentation/README.md, 4.1) plus 143 supplementary
open-class metalinguistic terms (519 Words total;
WordSeeder, vocabulary/role/word_seeder.py) -- this
is how "every English LIRA Domain shall contain the mandatory lexical
forms defined by the English Common Closed-Class Cache" is actually
satisfied: seed Common once, and every Domain created afterwards
inherits them via the existing seed_from propagation.

Every Domain -- Common included -- also gets its own
LexicalRelationship graph seeded immediately after its Words
(RelationshipSeeder, vocabulary/role/relationship_seeder.py). Unlike
Words, relationships can't be copied between Domains: a
LexicalRelationship references specific Word UUIDs, and every Domain
has its own distinct Word instances (Dictionary.seed_from
shallow-copies each Word). So relationships are re-resolved and
re-created fresh for every Domain, against that Domain's own
Dictionary, rather than propagated from Common the way Words are."""

from .domain import Domain
from .host_system_properties import HostSystemProperties
from .host_system_tensor import HostSystemTensor
from .known_hosts import KnownHosts
from .hosted_domains import HostedDomains
from ...vocabulary.role.relationship_seeder import RelationshipSeeder
from ...vocabulary.role.word_seeder import WordSeeder

COMMON_DOMAIN_NAME = "Common"
COMMON_DOMAIN_LANGUAGE_CODE = "en"


class LIRAHost:
    def __init__(self, name: str):
        self.name = name
        self.system_tensor = HostSystemTensor()
        self.system_properties = HostSystemProperties(self.system_tensor)  # by-reference view (Rule 14)
        self.known_hosts = KnownHosts()  # by reference
        self.hosted_domains = HostedDomains()

        common_domain = Domain(name=COMMON_DOMAIN_NAME)
        WordSeeder(language_code=COMMON_DOMAIN_LANGUAGE_CODE).seed_closed_class_words(common_domain.vocabulary.dictionary)
        RelationshipSeeder(language_code=COMMON_DOMAIN_LANGUAGE_CODE).seed_domain(common_domain)
        self.hosted_domains.add(common_domain)

    def get_or_create_domain(self, name: str, availability_zone: str = None) -> Domain:
        """Returns the named Domain if this Host already hosts it,
        otherwise creates it -- the domain-creation trigger for
        cross-domain word resolution (Cross-Domain Vocabulary, point 2):
        when a word's sense belongs in a Domain that doesn't exist yet,
        this is how that Domain comes into being. Every newly created
        Domain (other than Common itself) has its Vocabulary seeded from
        Common's Dictionary, then its own relationship graph built fresh
        against those newly seeded Words."""
        existing = self.hosted_domains.get(name)
        if existing is not None:
            return existing

        new_domain = Domain(name=name, availability_zone=availability_zone)
        if name != COMMON_DOMAIN_NAME:
            common_domain = self.hosted_domains.get(COMMON_DOMAIN_NAME)
            new_domain.vocabulary.dictionary.seed_from(common_domain.vocabulary.dictionary)
            RelationshipSeeder(language_code=COMMON_DOMAIN_LANGUAGE_CODE).seed_domain(new_domain)
        self.hosted_domains.add(new_domain)
        return new_domain
