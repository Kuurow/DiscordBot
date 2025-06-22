export function buildRangeString(range) {
	let left = 0, right = 0, top = 0, bottom = 0;
	for (const square of range.grids) {
		if (square.col < left) { left = square.col; }
		else if (square.col > right) { right = square.col; }
		if (square.row < bottom) { bottom = square.row; }
		else if (square.row > top) { top = square.row; }
	}

	const arrCols = right - left + 1;
	const arrRows = top - bottom + 1;
	const rangeArr = new Array(arrCols);
	for (let i = 0; i < arrCols; i++) {
		rangeArr[i] = new Array(arrRows);
	}
	for (const square of range.grids) {
		rangeArr[square.col - left][-square.row - bottom] = 1;
	}
	rangeArr[-left][-bottom] = 2;

	let rangeString = '';
	for (let i = 0; i < arrRows; i++) {
		for (let j = 0; j < arrCols; j++) {
			switch (rangeArr[j][i]) {
				case (1):
					rangeString += '🔳';
					break;
				case (2):
					rangeString += '🟦';
					break;
				default:
					rangeString += '⬛';
					break;
			}
		}
		rangeString += '\n';
	}
	return rangeString;
}

export function stripHTMLTags(str) {
	return str.replace(/<[^>]*>/g, '');
}

export function buildOperatorProfession(opProfession) {
	let icon = '';
	switch (opProfession) {
		case 'Caster':
			icon = '<:Caster:1386355445731688610>';
			break;

		case 'Defender':
			icon = '<:Defender:1386355428933505145>';
			break;

		case 'Guard':
			icon = '<:Guard:1386355459249803345>';
			break;

		case 'Medic':
			icon = '<:Medic:1386355474303291597>';
			break;

		case 'Sniper':
			icon = '<:Sniper:1386355497061580810>';
			break;

		case 'Specialist':
			icon = '<:Specialist:1386355509841629256>';
			break;

		case 'Supporter':
			icon = '<:Supporter:1386355521920962680>';
			break;
		case 'Vanguard':
			icon = '<:Vanguard:1386355533061034044>';
			break;

		default:
			break;
	}
	return `${icon}${opProfession}`;
}