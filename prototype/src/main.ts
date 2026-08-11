import { RelationshipSeeder, WordSeeder } from "lira/vocabulary";
import { createPortalDomain, PortalDomainRegistry } from "lira/knowledge/data/portal_domain";
import { PortalShell } from "lira/knowledge/ui/portal_shell";

/** Seeds the "Common" Domain from the bundled Common Vocabulary Cache,
 * then bootstraps a "Physics" Domain the same way the real system
 * bootstraps any freshly created Domain: `Dictionary.seedFrom(common)`
 * copies every Common Word in (see vocabulary/data/dictionary.py's own
 * docstring) -- Physics genuinely starts as "everything Common knows,
 * nothing Physics-specific yet", not a fabricated stand-in. Registers
 * both in a PortalDomainRegistry (Physics nested under Common, mirroring
 * the real D6 composition fact this session's Python side already
 * registers: Physics is a meronym of Common) and mounts PortalShell --
 * the actual Explorer/Portal shell, not the earlier static mockup. */
async function main(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `<p style="font:14px system-ui;padding:16px">Seeding the Common Vocabulary Cache…</p>`;

  const commonDomain = createPortalDomain("Common");
  const wordSeeder = new WordSeeder("en");
  const wordsSeeded = wordSeeder.seedDomain(commonDomain);

  const relationshipSeeder = new RelationshipSeeder("en");
  const relationshipsSeeded = await relationshipSeeder.seedDomain(commonDomain);

  console.info(`Seeded ${wordsSeeded} words and ${relationshipsSeeded} relationships into the Common Domain.`);

  const physicsDomain = createPortalDomain("Physics", "Common");
  physicsDomain.vocabulary.dictionary.seedFrom(commonDomain.vocabulary.dictionary);

  const registry = new PortalDomainRegistry();
  registry.add(commonDomain);
  registry.add(physicsDomain);

  const shell = new PortalShell(registry, { title: "LIRA" });
  app.innerHTML = "";
  app.style.height = "100vh";
  shell.mount(app);
}

void main();
