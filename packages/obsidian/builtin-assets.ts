import type {TemplateCollection} from '@lovpen/shared';

import templateKits from '../assets/template-kits.json';
import anthropicStyleTemplate from '../assets/templates/Anthropic Style.html';
import bento1Template from '../assets/templates/Bento 1.html';
import bento2Template from '../assets/templates/Bento 2.html';
import unifiedTemplate from '../assets/templates/Unified.html';
import wabiSabiTemplate from '../assets/templates/Wabi-Sabi.html';
import defaultTemplate from '../assets/templates/default.html';
import zhangXiaojunTemplate from '../assets/templates/张小珺风格.html';

export const BUILTIN_TEMPLATE_KITS = templateKits as TemplateCollection;

export const BUILTIN_HTML_TEMPLATES: Record<string, string> = {
	'Anthropic Style': anthropicStyleTemplate,
	'Bento 1': bento1Template,
	'Bento 2': bento2Template,
	Unified: unifiedTemplate,
	'Wabi-Sabi': wabiSabiTemplate,
	default: defaultTemplate,
	'张小珺风格': zhangXiaojunTemplate,
};
