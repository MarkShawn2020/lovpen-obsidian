import {useEffect, useState} from 'react';
import {HighlightOption, resourceLoader, TemplateOption, ThemeOption} from '../services/resourceLoader';

export const useResources = () => {
	const [themes, setThemes] = useState<ThemeOption[]>([]);
	const [highlights, setHighlights] = useState<HighlightOption[]>([]);
	const [templates, setTemplates] = useState<TemplateOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadResources = async () => {
			try {
				setLoading(true);
				const [themesData, highlightsData, templatesData] = await Promise.all([
					resourceLoader.loadThemes(),
					resourceLoader.loadHighlights(),
					resourceLoader.loadTemplates()
				]);

				setThemes(themesData);
				setHighlights(highlightsData);
				setTemplates(templatesData);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load resources');
			} finally {
				setLoading(false);
			}
		};

		loadResources();
	}, []);

	return {themes, highlights, templates, loading, error};
};
