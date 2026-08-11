import { ServiceStatusBoard } from "lira/knowledge/data/service_status";
import { PortalDomainRegistry } from "lira/knowledge/data/portal_domain";
import { LoadingScreen } from "lira/knowledge/ui/loading_screen";
import { PortalShell } from "lira/knowledge/ui/portal_shell";
import { VocabularyWorkerClient } from "lira/vocabulary/role/vocabulary_worker_client";

/** Boots the Portal: registers one Background Service per Architectural
 * Layer with a UI component (only Vocabulary is real today; Linguistic
 * and Knowledge are permanent "Not ported yet" rows -- see
 * knowledge/data/service_status.ts), shows the LoadingScreen while the
 * Vocabulary Service worker seeds the Common Vocabulary Cache and
 * bootstraps Physics off the main thread, then swaps to the real
 * PortalShell once it reports ready. */
function main(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  app.style.height = "100vh";

  const statusBoard = new ServiceStatusBoard();
  statusBoard.register("vocabulary", "Vocabulary Service", "idle", "Starting…");
  statusBoard.register("linguistics", "Linguistic Service", "not-ported");
  statusBoard.register("knowledge", "Knowledge Service", "not-ported");

  const loadingScreen = new LoadingScreen(statusBoard, "LIRA");
  loadingScreen.mount(app);

  const vocabularyClient = new VocabularyWorkerClient();
  vocabularyClient.onStatus((state, detail) => statusBoard.update("vocabulary", state, detail));

  vocabularyClient
    .init()
    .then((domains) => {
      loadingScreen.destroy();
      const registry = new PortalDomainRegistry(domains);
      const shell = new PortalShell(registry, vocabularyClient, statusBoard, { title: "LIRA" });
      shell.mount(app);
    })
    .catch((error: unknown) => {
      statusBoard.update("vocabulary", "error", error instanceof Error ? error.message : String(error));
    });
}

main();
