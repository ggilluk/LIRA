import { ServiceStatusBoard } from "lira/knowledge/data/service_status";
import { PortalDomainRegistry } from "lira/knowledge/data/portal_domain";
import { LoadingScreen } from "lira/knowledge/ui/loading_screen";
import { PortalShell } from "lira/knowledge/ui/portal_shell";
import { VocabularyWorkerClient } from "lira/vocabulary/role/vocabulary_worker_client";
import { LinguisticsWorkerClient } from "lira/linguistics/role/linguistics_worker_client";

/** Boots the Portal: registers one Background Service per Architectural
 * Layer with a UI component (Vocabulary and Linguistics are real today;
 * Knowledge is a permanent "Not ported yet" row -- see
 * knowledge/data/service_status.ts), shows the LoadingScreen while the
 * Vocabulary Service worker seeds the Common Vocabulary Cache and
 * bootstraps Physics, and the Linguistic Service worker seeds its own
 * copy of the same cache and configures its grammar, both off the main
 * thread in parallel, then swaps to the real PortalShell once both
 * report ready. */
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
  vocabularyClient.onStatus((state, detail) => statusBoard.update("vocabulary", state, detail));

  const linguisticsClient = new LinguisticsWorkerClient();
  linguisticsClient.onStatus((state, detail) => statusBoard.update("linguistics", state, detail));

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
