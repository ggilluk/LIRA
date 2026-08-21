/** Assembles PAGE_TEMPLATE -- the self-contained HTML page DictionaryView.render()
 * substitutes @@TOKEN@@ values into -- from every ui/client/ piece, reproducing
 * the literal skeleton and exact declaration order the original monolithic
 * dictionary_view.ts's own PAGE_TEMPLATE template literal had, character for
 * character. This is the only ui/client/ file dictionary_controller.ts imports
 * from.
 *
 * The ${...} interpolations inside <script> below are listed in true physical
 * declaration order from the original script body (verified by direct read of
 * dictionary_view.ts's own git history), NOT the tidier "four tabs, then detail
 * panel, then hierarchy, then cyclic" order an earlier illustrative sketch of
 * this split assumed -- the original script actually interleaves Words-tab
 * over-capacity handling after the Senses tab, and the Relationships tab's own
 * row rendering sits near the very end, after Hierarchy and Cyclic. Reordering
 * any of this to read more tidily would change render()'s own output text,
 * which must stay byte-identical to today's -- so physical order wins over a
 * tidier-looking one every time. */
import { CLIENT_STYLES } from "./client_styles";
import { CLIENT_SHELL_HTML } from "./client_shell_html";
import { CLIENT_RENDER_HELPER_HTML } from "./client_render_helper_html";
import { CLIENT_WORDS_TAB_VIEW } from "./client_words_tab_view";
import { CLIENT_PHRASES_TAB_VIEW } from "./client_phrases_tab_view";
import { CLIENT_SENSES_TAB_VIEW } from "./client_senses_tab_view";
import { CLIENT_WORDS_TAB_OVERCAPACITY } from "./client_words_tab_overcapacity";
import { CLIENT_SENSES_SECTION_HTML } from "./client_senses_section_html";
import { CLIENT_DETAIL_PANEL_CONTROLLER } from "./client_detail_panel_controller";
import { CLIENT_HIERARCHY_LAYOUT } from "./client_hierarchy_layout";
import { CLIENT_HIERARCHY_SVG_VIEW } from "./client_hierarchy_svg_view";
import { CLIENT_HIERARCHY_PANEL_CONTROLLER } from "./client_hierarchy_panel_controller";
import { CLIENT_CYCLIC_LAYOUT } from "./client_cyclic_layout";
import { CLIENT_CYCLIC_SVG_VIEW } from "./client_cyclic_svg_view";
import { CLIENT_CYCLIC_PANEL_CONTROLLER } from "./client_cyclic_panel_controller";
import { CLIENT_RELATIONSHIPS_TAB_VIEW } from "./client_relationships_tab_view";
import { CLIENT_BOOTSTRAP_CONTROLLER } from "./client_bootstrap_controller";

export const PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@ -- compiled @@COMPILED_AT@@</title>
<style>
${CLIENT_STYLES}
</style>
</head>
${CLIENT_SHELL_HTML}
<script>
/*@@SCRIPT_FRAGMENT_START@@*/
${CLIENT_RENDER_HELPER_HTML}
${CLIENT_WORDS_TAB_VIEW}
${CLIENT_PHRASES_TAB_VIEW}
${CLIENT_SENSES_TAB_VIEW}
${CLIENT_WORDS_TAB_OVERCAPACITY}
${CLIENT_SENSES_SECTION_HTML}
${CLIENT_DETAIL_PANEL_CONTROLLER}
${CLIENT_HIERARCHY_LAYOUT}
${CLIENT_HIERARCHY_SVG_VIEW}
${CLIENT_HIERARCHY_PANEL_CONTROLLER}
${CLIENT_CYCLIC_LAYOUT}
${CLIENT_CYCLIC_SVG_VIEW}
${CLIENT_CYCLIC_PANEL_CONTROLLER}
${CLIENT_RELATIONSHIPS_TAB_VIEW}
${CLIENT_BOOTSTRAP_CONTROLLER}
/*@@SCRIPT_FRAGMENT_END@@*/
</script>
</body>
</html>
`;
