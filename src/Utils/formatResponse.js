function cleanResponse(text) {
  return text.trim().replace(/\n{3,}/g, '\n\n');
}

function truncate(text, maxLength = 4000) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

module.exports = { cleanResponse, truncate };
