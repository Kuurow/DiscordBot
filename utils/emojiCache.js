let emojiMap = null;

async function loadEmojis(client) {
	const emojis = await client.application.emojis.fetch();
	emojiMap = new Map(emojis.map(e => [e.name, e.toString()]));
}

async function ensureEmojisLoaded(client) {
	if (!emojiMap) await loadEmojis(client);
}

function getOperatorEmoji(operatorId) {
	return emojiMap?.get(operatorId) ?? '';
}

module.exports = { loadEmojis, ensureEmojisLoaded, getOperatorEmoji };
