import { DictionaryView, RelationshipSeeder, VocabularyLayer, WordSeeder } from "lira/vocabulary";

/** Seeds a "Common" Domain's Vocabulary Layer straight from the bundled
 * Common Vocabulary Cache and Relationship Cache, then mounts
 * DictionaryView's rendered page in an <iframe srcdoc>. DictionaryView.render()
 * returns a complete, self-contained HTML document (its own
 * <!DOCTYPE>/<html>/<head>/<script>) -- exactly the shape it's meant to
 * be opened in, whether as a standalone file or embedded here -- so an
 * iframe is the correct host: setting it directly as innerHTML would
 * both mangle the document structure and silently skip running its
 * embedded <script> (script tags injected via innerHTML never
 * execute). A minimal `{ name, vocabulary }` object stands in for the
 * Knowledge Layer's `Domain` here (not ported yet) -- WordSeeder.seedDomain
 * and RelationshipSeeder.seedDomain only ever need that shape. */
async function main(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `<p style="font:14px system-ui;padding:16px">Seeding the Common Vocabulary Cache…</p>`;

  const commonDomain = { name: "Common", vocabulary: new VocabularyLayer("Common") };

  const wordSeeder = new WordSeeder("en");
  const wordsSeeded = wordSeeder.seedDomain(commonDomain);

  const relationshipSeeder = new RelationshipSeeder("en");
  const relationshipsSeeded = await relationshipSeeder.seedDomain(commonDomain);

  console.info(`Seeded ${wordsSeeded} words and ${relationshipsSeeded} relationships into the Common Domain.`);

  const view = new DictionaryView(commonDomain.vocabulary.dictionary, commonDomain.vocabulary.lexicalRelationships, {
    title: "LIRA Common Dictionary",
    domainName: "Common",
  });

  const frame = document.createElement("iframe");
  frame.title = "LIRA Common Dictionary";
  frame.style.cssText = "width:100%;height:100vh;border:0;display:block";
  frame.srcdoc = view.render();

  app.innerHTML = "";
  app.appendChild(frame);
}

void main();
