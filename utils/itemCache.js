const axios = require('axios');
const { paths } = require('../constants.json');

const cache = new Map();

async function getItemName(id) {
	if (cache.has(id)) return cache.get(id);
	try {
		const { data } = await axios.get(`${paths.apiUrl}/item/${id}`);
		const name = data.value?.data?.name ?? id;
		cache.set(id, name);
		return name;
	}
	catch {
		cache.set(id, id);
		return id;
	}
}

async function resolveCosts(costs) {
	return Promise.all(
		costs.map(async ({ id, count }) => `${count}× ${await getItemName(id)}`),
	);
}

module.exports = { resolveCosts };
