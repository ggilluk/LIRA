"""LIRA Host: the runtime unit scheduled by the Kubernetes / WASI
management plane. Owns host-level system state and the Domains it
currently hosts.

Every LIRAHost auto-creates a reserved Domain named "Common" (Rule 17
extension -- Cross-Domain Vocabulary, see
vocabulary/documentation/README.md): every other Domain this Host
creates has its Vocabulary seeded from Common's Dictionary, giving all
Domains on a Host a shared vocabulary baseline before anything
domain-specific is added. Common's own Dictionary is itself seeded, on
Host construction, with the mandatory 300-word English Common
Vocabulary Cache (WordSeeder, vocabulary/role/word_seeder.py) -- this
is how "every English LIRA Domain shall contain the 300 lexical forms"
is actually satisfied: seed Common once, and every Domain created
afterwards inherits them via the existing seed_from propagation."""

from .domain import Domain
from .host_system_properties import HostSystemProperties
from .host_system_tensor import HostSystemTensor
from .known_hosts import KnownHosts
from .hosted_domains import HostedDomains
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
        self.hosted_domains.add(common_domain)

    def get_or_create_domain(self, name: str, availability_zone: str = None) -> Domain:
        """Returns the named Domain if this Host already hosts it,
        otherwise creates it -- the domain-creation trigger for
        cross-domain word resolution (Cross-Domain Vocabulary, point 2):
        when a word's sense belongs in a Domain that doesn't exist yet,
        this is how that Domain comes into being. Every newly created
        Domain (other than Common itself) has its Vocabulary seeded from
        Common's Dictionary."""
        existing = self.hosted_domains.get(name)
        if existing is not None:
            return existing

        new_domain = Domain(name=name, availability_zone=availability_zone)
        if name != COMMON_DOMAIN_NAME:
            common_domain = self.hosted_domains.get(COMMON_DOMAIN_NAME)
            new_domain.vocabulary.dictionary.seed_from(common_domain.vocabulary.dictionary)
        self.hosted_domains.add(new_domain)
        return new_domain
