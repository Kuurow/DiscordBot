const RANGE_CELLS = ['⬛', '🔳', '🟦'];

export function buildRangeString(range) {
	const cols = range.grids.map(s => s.col);
	const rows = range.grids.map(s => s.row);
	const left   = Math.min(0, ...cols);
	const right  = Math.max(0, ...cols);
	const bottom = Math.min(0, ...rows);
	const top    = Math.max(0, ...rows);

	const arrCols = right - left + 1;
	const arrRows = top - bottom + 1;

	const rangeArr = Array.from({ length: arrCols }, () => new Array(arrRows).fill(0));
	for (const { col, row } of range.grids) {
		rangeArr[col - left][-row - bottom] = 1;
	}
	rangeArr[-left][-bottom] = 2;

	return Array.from({ length: arrRows }, (_, i) =>
		Array.from({ length: arrCols }, (_, j) => RANGE_CELLS[rangeArr[j][i]]).join('')
	).join('\n') + '\n';
}

export function stripHTMLTags(str) {
	return str.replace(/<[^>]*>/g, '');
}

export function resolveBlackboard(description, blackboard) {
	const values = Object.fromEntries(blackboard.map(({ key, value }) => [key, value]));

	return description.replace(/\{([^}:]+)(?::([^}]*))?\}/g, (_, key, format) => {
		const value = values[key];
		if (value === undefined) return `{${key}}`;
		if (!format) return String(value);

		if (format.includes('%')) {
			const decimals = (format.replace('%', '').split('.')[1] ?? '').length;
			return (value * 100).toFixed(decimals) + '%';
		}

		const decimals = (format.split('.')[1] ?? '').length;
		return value.toFixed(decimals);
	});
}

export function htmlToMarkdown(str) {
	return str
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<strong>|<b>/gi, '**')
		.replace(/<\/strong>|<\/b>/gi, '**')
		.replace(/<em>|<i>/gi, '*')
		.replace(/<\/em>|<\/i>/gi, '*')
		.replace(/<[^>]*>/g, '');
}

const PROFESSION_ICONS = {
	Caster:     '<:Caster:1386355445731688610>',
	Defender:   '<:Defender:1386355428933505145>',
	Guard:      '<:Guard:1386355459249803345>',
	Medic:      '<:Medic:1386355474303291597>',
	Sniper:     '<:Sniper:1386355497061580810>',
	Specialist: '<:Specialist:1386355509841629256>',
	Supporter:  '<:Supporter:1386355521920962680>',
	Vanguard:   '<:Vanguard:1386355533061034044>',
};

export function buildOperatorProfession(opProfession) {
	return `${PROFESSION_ICONS[opProfession] ?? ''}${opProfession}`;
}