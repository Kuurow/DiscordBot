const axios = require('axios');
const { paths, gameConsts } = require('../constants.json');

let cachedPool = null;

async function getRecruitPool() {
	if (cachedPool) return cachedPool;

	const { data } = await axios.get(`${paths.apiUrl}/recruitpool`);
	const ids = data[0].value;

	cachedPool = await Promise.all(
		ids.map(async (id) => {
			try {
				const { data: op } = await axios.get(`${paths.apiUrl}/operator/${id}`);
				const v = op.value;
				const professionTag = gameConsts.professions[v.data.profession]?.toLowerCase();
				const tags = (v.data.tagList ?? []).map(t => t.toLowerCase());
				if (professionTag) tags.push(professionTag);
				const rarityIndex = gameConsts.rarity[v.data.rarity] ?? 0;
				if (rarityIndex <= 1) tags.push('starter');
				if (rarityIndex >= 4) tags.push('senior');
				if (rarityIndex >= 5) tags.push('top');
				return { id, name: v.data.name, rarity: v.data.rarity, tags, avatarId: v.skins?.[0]?.avatarId ?? null };
			}
			catch {
				return null;
			}
		}),
	);

	cachedPool = cachedPool.filter(Boolean);
	return cachedPool;
}

module.exports = { getRecruitPool };
