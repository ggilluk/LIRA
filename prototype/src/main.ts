import { ServiceStatusBoard } from "lira/knowledge/data/service_status";
import { PortalDomainRegistry } from "lira/knowledge/data/portal_domain";
import { LoadingScreen } from "lira/knowledge/ui/loading_screen";
import { PortalShell } from "lira/knowledge/ui/portal_shell";
import { VocabularyWorkerClient } from "lira/vocabulary/role/web_worker/vocabulary_worker_client";
import { LinguisticsWorkerClient } from "lira/linguistics/role/web_worker/linguistics_worker_client";

/** Boots the Portal: registers one Background Service per Architectural
 * Layer with a UI component (Vocabulary and Linguistics are real today;
 * Knowledge is a permanent "Not ported yet" row -- see
 * knowledge/data/service_status.ts), shows the LoadingScreen while the
 * Vocabulary Service worker registers its (empty) Domains and the
 * Linguistic Service worker seeds its own copy of the Common Vocabulary
 * Cache and configures its grammar, both off the main thread in
 * parallel, then swaps to the real PortalShell once both report ready.
 * The Vocabulary Service seeds nothing at startup -- "Seed Vocabulary"
 * and "Load WordNet", both in the Vocabulary tab's own toolbar
 * (knowledge/ui/portal_shell.ts's own renderVocabToolbar()), are
 * on-demand actions a user reaches for once the Portal is already up,
 * not a cost every session pays whether or not the Vocabulary UI is
 * ever opened. */
function main(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  app.style.height = "100vh";

  const statusBoard = new ServiceStatusBoard();
  statusBoard.register("vocabulary", "Vocabulary Service", "idle", "Starting…");
  statusBoard.register("linguistics", "Linguistic Service", "idle", "Starting…");
  statusBoard.register("knowledge", "Knowledge Service", "not-ported");

  const loadingScreen = new LoadingScreen(statusBoard, "LIRA");
  loadingScreen.mount(app);

  const vocabularyClient = new VocabularyWorkerClient();
  vocabularyClient.onStatus((state, detail, progress) => statusBoard.update("vocabulary", state, detail, progress));

  const linguisticsClient = new LinguisticsWorkerClient();
  linguisticsClient.onStatus((state, detail) => statusBoard.update("linguistics", state, detail));

  // Hands each worker one end of a direct MessageChannel so the
  // Linguistic Service can resolve raw text against the Vocabulary
  // Service's own real seeded Dictionary instead of maintaining an
  // independent copy of its own (vocabulary/role/web_worker/
  // dictionary_query_protocol.ts's own docstring) -- this is the one
  // and only time the main thread is involved: every lookup afterward
  // goes worker-to-worker directly over the transferred ports.
  const dictionaryQueryChannel = new MessageChannel();
  vocabularyClient.linkPort(dictionaryQueryChannel.port1);
  linguisticsClient.linkVocabularyPort(dictionaryQueryChannel.port2);

  Promise.all([vocabularyClient.init(), linguisticsClient.init()])
    .then(([domains]) => {
      loadingScreen.destroy();
      const registry = new PortalDomainRegistry(domains);
      const shell = new PortalShell(registry, vocabularyClient, linguisticsClient, statusBoard, { title: "LIRA" });
      shell.mount(app);
    })
    .catch((error: unknown) => {
      statusBoard.update("vocabulary", "error", error instanceof Error ? error.message : String(error));
    });
}

main();
