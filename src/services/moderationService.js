const { Collection } = require('discord.js');

const MAX_BULK_DELETE = 100;
const MAX_FETCH_LIMIT = 10000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function parseRegex(pattern) {
  if (!pattern || typeof pattern !== 'string') return null;
  try {
    if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
      const lastSlash = pattern.lastIndexOf('/');
      const body = pattern.slice(1, lastSlash);
      const flags = pattern.slice(lastSlash + 1);
      return new RegExp(body, flags);
    }
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
}

async function fetchMessages(channel, limit) {
  const capped = Number.isFinite(limit) ? clamp(limit, 1, MAX_FETCH_LIMIT) : MAX_FETCH_LIMIT;
  let lastId;
  const all = new Collection();

  while (all.size < capped) {
    const remaining = capped - all.size;
    const batch = await channel.messages.fetch({
      limit: Math.min(100, remaining),
      before: lastId,
    });

    if (!batch.size) break;

    batch.forEach((msg, id) => all.set(id, msg));
    lastId = batch.last().id;
  }

  return all;
}

function applyFilters(messages, criteria, commandMessageId) {
  const now = Date.now();
  const regex = parseRegex(criteria.regex);

  return messages.filter((msg) => {
    if (!msg) return false;
    if (msg.id === commandMessageId) return false;
    if (msg.system) return false;
    if (msg.pinned) return false;

    if (!criteria.includeBots && msg.author?.bot) return false;

    if (criteria.authorId && msg.author?.id !== criteria.authorId) return false;
    if (criteria.contains && !msg.content.toLowerCase().includes(String(criteria.contains).toLowerCase())) return false;
    if (criteria.startsWith && !msg.content.toLowerCase().startsWith(String(criteria.startsWith).toLowerCase())) return false;
    if (criteria.endsWith && !msg.content.toLowerCase().endsWith(String(criteria.endsWith).toLowerCase())) return false;
    if (criteria.hasAttachments === true && msg.attachments.size === 0) return false;
    if (criteria.hasLinks === true && !/(https?:\/\/|www\.)/i.test(msg.content)) return false;
    if (typeof criteria.minLength === 'number' && msg.content.length < criteria.minLength) return false;
    if (typeof criteria.maxLength === 'number' && msg.content.length > criteria.maxLength) return false;
    if (regex && !regex.test(msg.content)) return false;

    if (typeof criteria.beforeHours === 'number') {
      const cutoff = now - criteria.beforeHours * 60 * 60 * 1000;
      if (msg.createdTimestamp > cutoff) return false;
    }

    if (typeof criteria.afterHours === 'number') {
      const cutoff = now - criteria.afterHours * 60 * 60 * 1000;
      if (msg.createdTimestamp < cutoff) return false;
    }

    return true;
  });
}

async function deleteMessages(channel, selected) {
  const fresh = selected.filter((m) => Date.now() - m.createdTimestamp < TWO_WEEKS_MS);
  const old = selected.filter((m) => Date.now() - m.createdTimestamp >= TWO_WEEKS_MS);

  let deleted = 0;

  if (fresh.size) {
    const freshArray = Array.from(fresh.values());
    for (let i = 0; i < freshArray.length; i += MAX_BULK_DELETE) {
      const chunk = freshArray.slice(i, i + MAX_BULK_DELETE);
      const ids = chunk.map((m) => m.id);
      const result = await channel.bulkDelete(ids, true);
      deleted += result.size;
    }
  }

  if (old.size) {
    for (const msg of old.values()) {
      try {
        await msg.delete();
        deleted += 1;
      } catch {
        // Ignore individual delete failures
      }
    }
  }

  return deleted;
}

async function executeModeration(channel, commandMessage, action) {
  const criteria = action.criteria || {};
  const isSimpleCount = typeof criteria.count === 'number' && Object.keys(criteria).length === 1;
  const scanAll = action.scanAll === true || (!isSimpleCount && !Number.isFinite(action.searchLimit));

  const fetchLimit = scanAll
    ? MAX_FETCH_LIMIT
    : isSimpleCount
    ? clamp(criteria.count + 20, 1, MAX_FETCH_LIMIT)
    : clamp(action.searchLimit || 300, 1, MAX_FETCH_LIMIT);

  const all = await fetchMessages(channel, fetchLimit);
  let filtered = applyFilters(all, criteria, commandMessage.id);

  if (typeof criteria.count === 'number') {
    const amount = clamp(criteria.count, 1, MAX_FETCH_LIMIT);
    filtered = new Collection(Array.from(filtered.entries()).slice(0, amount));
  }

  const deleted = await deleteMessages(channel, filtered);

  return {
    deleted,
    matched: filtered.size,
    scanned: all.size,
  };
}

module.exports = { executeModeration };
