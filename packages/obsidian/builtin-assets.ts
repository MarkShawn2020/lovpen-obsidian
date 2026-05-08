import type {TemplateCollection} from '@lovpen/shared';

import templateKits from '../assets/template-kits.json';
import themesConfig from '../assets/themes.json';
import highlightsConfig from '../assets/highlights.json';
import anthropicStyleTemplate from '../assets/templates/Anthropic Style.html';
import bento1Template from '../assets/templates/Bento 1.html';
import bento2Template from '../assets/templates/Bento 2.html';
import unifiedTemplate from '../assets/templates/Unified.html';
import wabiSabiTemplate from '../assets/templates/Wabi-Sabi.html';
import defaultTemplate from '../assets/templates/default.html';
import zhangXiaojunTemplate from '../assets/templates/张小珺风格.html';

import theme_bentoCss from '../assets/themes/bento.css';
import theme_bento_darkCss from '../assets/themes/bento-dark.css';
import theme_wabi_sabiCss from '../assets/themes/wabi-sabi.css';
import theme_mweb_ayuCss from '../assets/themes/mweb-ayu.css';
import theme_mweb_bear_defaultCss from '../assets/themes/mweb-bear-default.css';
import theme_mweb_contrastCss from '../assets/themes/mweb-contrast.css';
import theme_mweb_d_boringCss from '../assets/themes/mweb-d-boring.css';
import theme_mweb_defaultCss from '../assets/themes/mweb-default.css';
import theme_mweb_duotone_heatCss from '../assets/themes/mweb-duotone-heat.css';
import theme_mweb_duotone_lightCss from '../assets/themes/mweb-duotone-light.css';
import theme_mweb_gandalfCss from '../assets/themes/mweb-gandalf.css';
import theme_mweb_indigoCss from '../assets/themes/mweb-indigo.css';
import theme_mweb_jzmanCss from '../assets/themes/mweb-jzman.css';
import theme_mweb_lark_bold_colorCss from '../assets/themes/mweb-lark-bold-color.css';
import theme_mweb_larkCss from '../assets/themes/mweb-lark.css';
import theme_mweb_olive_dunkCss from '../assets/themes/mweb-olive-dunk.css';
import theme_mweb_red_graphiteCss from '../assets/themes/mweb-red-graphite.css';
import theme_mweb_smartblueCss from '../assets/themes/mweb-smartblue.css';
import theme_mweb_solarized_lightCss from '../assets/themes/mweb-solarized-light.css';
import theme_mweb_typoCss from '../assets/themes/mweb-typo.css';
import theme_mweb_v_greenCss from '../assets/themes/mweb-v-green.css';
import theme_mweb_vueCss from '../assets/themes/mweb-vue.css';
import theme_mweb_ayu_mirageCss from '../assets/themes/mweb-ayu-mirage.css';
import theme_mweb_charcoalCss from '../assets/themes/mweb-charcoal.css';
import theme_mweb_cobaltCss from '../assets/themes/mweb-cobalt.css';
import theme_mweb_dark_graphiteCss from '../assets/themes/mweb-dark-graphite.css';
import theme_mweb_dieciCss from '../assets/themes/mweb-dieci.css';
import theme_mweb_draculaCss from '../assets/themes/mweb-dracula.css';
import theme_mweb_gothamCss from '../assets/themes/mweb-gotham.css';
import theme_mweb_lighthouseCss from '../assets/themes/mweb-lighthouse.css';
import theme_mweb_nordCss from '../assets/themes/mweb-nord.css';
import theme_mweb_panicCss from '../assets/themes/mweb-panic.css';
import theme_mweb_solarized_darkCss from '../assets/themes/mweb-solarized-dark.css';
import theme_mweb_toothpasteCss from '../assets/themes/mweb-toothpaste.css';
import theme_typora_newsprintCss from '../assets/themes/typora-newsprint.css';

import highlight_a11y_darkCss from '../assets/highlights/a11y-dark.css';
import highlight_a11y_lightCss from '../assets/highlights/a11y-light.css';
import highlight_agateCss from '../assets/highlights/agate.css';
import highlight_an_old_hopeCss from '../assets/highlights/an-old-hope.css';
import highlight_androidstudioCss from '../assets/highlights/androidstudio.css';
import highlight_arduino_lightCss from '../assets/highlights/arduino-light.css';
import highlight_artaCss from '../assets/highlights/arta.css';
import highlight_asceticCss from '../assets/highlights/ascetic.css';
import highlight_atom_one_darkCss from '../assets/highlights/atom-one-dark.css';
import highlight_atom_one_dark_reasonableCss from '../assets/highlights/atom-one-dark-reasonable.css';
import highlight_atom_one_lightCss from '../assets/highlights/atom-one-light.css';
import highlight_brown_paperCss from '../assets/highlights/brown-paper.css';
import highlight_codepen_embedCss from '../assets/highlights/codepen-embed.css';
import highlight_color_brewerCss from '../assets/highlights/color-brewer.css';
import highlight_darkCss from '../assets/highlights/dark.css';
import highlight_defaultCss from '../assets/highlights/default.css';
import highlight_devibeansCss from '../assets/highlights/devibeans.css';
import highlight_doccoCss from '../assets/highlights/docco.css';
import highlight_farCss from '../assets/highlights/far.css';
import highlight_felipecCss from '../assets/highlights/felipec.css';
import highlight_foundationCss from '../assets/highlights/foundation.css';
import highlight_githubCss from '../assets/highlights/github.css';
import highlight_github_darkCss from '../assets/highlights/github-dark.css';
import highlight_github_dark_dimmedCss from '../assets/highlights/github-dark-dimmed.css';
import highlight_gmlCss from '../assets/highlights/gml.css';
import highlight_googlecodeCss from '../assets/highlights/googlecode.css';
import highlight_gradient_darkCss from '../assets/highlights/gradient-dark.css';
import highlight_gradient_lightCss from '../assets/highlights/gradient-light.css';
import highlight_grayscaleCss from '../assets/highlights/grayscale.css';
import highlight_hybridCss from '../assets/highlights/hybrid.css';
import highlight_ideaCss from '../assets/highlights/idea.css';
import highlight_intellij_lightCss from '../assets/highlights/intellij-light.css';
import highlight_ir_blackCss from '../assets/highlights/ir-black.css';
import highlight_isbl_editor_darkCss from '../assets/highlights/isbl-editor-dark.css';
import highlight_isbl_editor_lightCss from '../assets/highlights/isbl-editor-light.css';
import highlight_kimbie_darkCss from '../assets/highlights/kimbie-dark.css';
import highlight_kimbie_lightCss from '../assets/highlights/kimbie-light.css';
import highlight_lightfairCss from '../assets/highlights/lightfair.css';
import highlight_lioshiCss from '../assets/highlights/lioshi.css';
import highlight_magulaCss from '../assets/highlights/magula.css';
import highlight_mono_blueCss from '../assets/highlights/mono-blue.css';
import highlight_monokaiCss from '../assets/highlights/monokai.css';
import highlight_monokai_sublimeCss from '../assets/highlights/monokai-sublime.css';
import highlight_night_owlCss from '../assets/highlights/night-owl.css';
import highlight_nnfx_darkCss from '../assets/highlights/nnfx-dark.css';
import highlight_nnfx_lightCss from '../assets/highlights/nnfx-light.css';
import highlight_nordCss from '../assets/highlights/nord.css';
import highlight_obsidianCss from '../assets/highlights/obsidian.css';
import highlight_panda_syntax_darkCss from '../assets/highlights/panda-syntax-dark.css';
import highlight_panda_syntax_lightCss from '../assets/highlights/panda-syntax-light.css';
import highlight_paraiso_darkCss from '../assets/highlights/paraiso-dark.css';
import highlight_paraiso_lightCss from '../assets/highlights/paraiso-light.css';
import highlight_pojoaqueCss from '../assets/highlights/pojoaque.css';
import highlight_pojoaque_jpgCss from '../assets/highlights/pojoaque.jpg.css';
import highlight_purebasicCss from '../assets/highlights/purebasic.css';
import highlight_qtcreator_darkCss from '../assets/highlights/qtcreator-dark.css';
import highlight_qtcreator_lightCss from '../assets/highlights/qtcreator-light.css';
import highlight_rainbowCss from '../assets/highlights/rainbow.css';
import highlight_routerosCss from '../assets/highlights/routeros.css';
import highlight_school_bookCss from '../assets/highlights/school-book.css';
import highlight_shades_of_purpleCss from '../assets/highlights/shades-of-purple.css';
import highlight_srceryCss from '../assets/highlights/srcery.css';
import highlight_stackoverflow_darkCss from '../assets/highlights/stackoverflow-dark.css';
import highlight_stackoverflow_lightCss from '../assets/highlights/stackoverflow-light.css';
import highlight_sunburstCss from '../assets/highlights/sunburst.css';
import highlight_tokyo_night_darkCss from '../assets/highlights/tokyo-night-dark.css';
import highlight_tokyo_night_lightCss from '../assets/highlights/tokyo-night-light.css';
import highlight_tomorrow_night_blueCss from '../assets/highlights/tomorrow-night-blue.css';
import highlight_tomorrow_night_brightCss from '../assets/highlights/tomorrow-night-bright.css';
import highlight_vsCss from '../assets/highlights/vs.css';
import highlight_vs2015Css from '../assets/highlights/vs2015.css';
import highlight_wabi_sabiCss from '../assets/highlights/wabi-sabi.css';
import highlight_xcodeCss from '../assets/highlights/xcode.css';
import highlight_xt256Css from '../assets/highlights/xt256.css';

export const BUILTIN_TEMPLATE_KITS = templateKits as TemplateCollection;
export const BUILTIN_THEMES_CONFIG = themesConfig;
export const BUILTIN_HIGHLIGHTS_CONFIG = highlightsConfig;

export const BUILTIN_HTML_TEMPLATES: Record<string, string> = {
	'Anthropic Style': anthropicStyleTemplate,
	'Bento 1': bento1Template,
	'Bento 2': bento2Template,
	Unified: unifiedTemplate,
	'Wabi-Sabi': wabiSabiTemplate,
	default: defaultTemplate,
	'张小珺风格': zhangXiaojunTemplate,
};

export const BUILTIN_THEME_CSS: Record<string, string> = {
	'bento': theme_bentoCss,
	'bento-dark': theme_bento_darkCss,
	'wabi-sabi': theme_wabi_sabiCss,
	'mweb-ayu': theme_mweb_ayuCss,
	'mweb-bear-default': theme_mweb_bear_defaultCss,
	'mweb-contrast': theme_mweb_contrastCss,
	'mweb-d-boring': theme_mweb_d_boringCss,
	'mweb-default': theme_mweb_defaultCss,
	'mweb-duotone-heat': theme_mweb_duotone_heatCss,
	'mweb-duotone-light': theme_mweb_duotone_lightCss,
	'mweb-gandalf': theme_mweb_gandalfCss,
	'mweb-indigo': theme_mweb_indigoCss,
	'mweb-jzman': theme_mweb_jzmanCss,
	'mweb-lark-bold-color': theme_mweb_lark_bold_colorCss,
	'mweb-lark': theme_mweb_larkCss,
	'mweb-olive-dunk': theme_mweb_olive_dunkCss,
	'mweb-red-graphite': theme_mweb_red_graphiteCss,
	'mweb-smartblue': theme_mweb_smartblueCss,
	'mweb-solarized-light': theme_mweb_solarized_lightCss,
	'mweb-typo': theme_mweb_typoCss,
	'mweb-v-green': theme_mweb_v_greenCss,
	'mweb-vue': theme_mweb_vueCss,
	'mweb-ayu-mirage': theme_mweb_ayu_mirageCss,
	'mweb-charcoal': theme_mweb_charcoalCss,
	'mweb-cobalt': theme_mweb_cobaltCss,
	'mweb-dark-graphite': theme_mweb_dark_graphiteCss,
	'mweb-dieci': theme_mweb_dieciCss,
	'mweb-dracula': theme_mweb_draculaCss,
	'mweb-gotham': theme_mweb_gothamCss,
	'mweb-lighthouse': theme_mweb_lighthouseCss,
	'mweb-nord': theme_mweb_nordCss,
	'mweb-panic': theme_mweb_panicCss,
	'mweb-solarized-dark': theme_mweb_solarized_darkCss,
	'mweb-toothpaste': theme_mweb_toothpasteCss,
	'typora-newsprint': theme_typora_newsprintCss,
};

export const BUILTIN_HIGHLIGHT_CSS: Record<string, string> = {
	'a11y-dark': highlight_a11y_darkCss,
	'a11y-light': highlight_a11y_lightCss,
	'agate': highlight_agateCss,
	'an-old-hope': highlight_an_old_hopeCss,
	'androidstudio': highlight_androidstudioCss,
	'arduino-light': highlight_arduino_lightCss,
	'arta': highlight_artaCss,
	'ascetic': highlight_asceticCss,
	'atom-one-dark': highlight_atom_one_darkCss,
	'atom-one-dark-reasonable': highlight_atom_one_dark_reasonableCss,
	'atom-one-light': highlight_atom_one_lightCss,
	'brown-paper': highlight_brown_paperCss,
	'codepen-embed': highlight_codepen_embedCss,
	'color-brewer': highlight_color_brewerCss,
	'dark': highlight_darkCss,
	'default': highlight_defaultCss,
	'devibeans': highlight_devibeansCss,
	'docco': highlight_doccoCss,
	'far': highlight_farCss,
	'felipec': highlight_felipecCss,
	'foundation': highlight_foundationCss,
	'github': highlight_githubCss,
	'github-dark': highlight_github_darkCss,
	'github-dark-dimmed': highlight_github_dark_dimmedCss,
	'gml': highlight_gmlCss,
	'googlecode': highlight_googlecodeCss,
	'gradient-dark': highlight_gradient_darkCss,
	'gradient-light': highlight_gradient_lightCss,
	'grayscale': highlight_grayscaleCss,
	'hybrid': highlight_hybridCss,
	'idea': highlight_ideaCss,
	'intellij-light': highlight_intellij_lightCss,
	'ir-black': highlight_ir_blackCss,
	'isbl-editor-dark': highlight_isbl_editor_darkCss,
	'isbl-editor-light': highlight_isbl_editor_lightCss,
	'kimbie-dark': highlight_kimbie_darkCss,
	'kimbie-light': highlight_kimbie_lightCss,
	'lightfair': highlight_lightfairCss,
	'lioshi': highlight_lioshiCss,
	'magula': highlight_magulaCss,
	'mono-blue': highlight_mono_blueCss,
	'monokai': highlight_monokaiCss,
	'monokai-sublime': highlight_monokai_sublimeCss,
	'night-owl': highlight_night_owlCss,
	'nnfx-dark': highlight_nnfx_darkCss,
	'nnfx-light': highlight_nnfx_lightCss,
	'nord': highlight_nordCss,
	'obsidian': highlight_obsidianCss,
	'panda-syntax-dark': highlight_panda_syntax_darkCss,
	'panda-syntax-light': highlight_panda_syntax_lightCss,
	'paraiso-dark': highlight_paraiso_darkCss,
	'paraiso-light': highlight_paraiso_lightCss,
	'pojoaque': highlight_pojoaqueCss,
	'pojoaque.jpg': highlight_pojoaque_jpgCss,
	'purebasic': highlight_purebasicCss,
	'qtcreator-dark': highlight_qtcreator_darkCss,
	'qtcreator-light': highlight_qtcreator_lightCss,
	'rainbow': highlight_rainbowCss,
	'routeros': highlight_routerosCss,
	'school-book': highlight_school_bookCss,
	'shades-of-purple': highlight_shades_of_purpleCss,
	'srcery': highlight_srceryCss,
	'stackoverflow-dark': highlight_stackoverflow_darkCss,
	'stackoverflow-light': highlight_stackoverflow_lightCss,
	'sunburst': highlight_sunburstCss,
	'tokyo-night-dark': highlight_tokyo_night_darkCss,
	'tokyo-night-light': highlight_tokyo_night_lightCss,
	'tomorrow-night-blue': highlight_tomorrow_night_blueCss,
	'tomorrow-night-bright': highlight_tomorrow_night_brightCss,
	'vs': highlight_vsCss,
	'vs2015': highlight_vs2015Css,
	'wabi-sabi': highlight_wabi_sabiCss,
	'xcode': highlight_xcodeCss,
	'xt256': highlight_xt256Css,
};
