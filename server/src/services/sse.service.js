const connections = new Map();

function addConnection(userId, res) {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);
}

function removeConnection(userId, res) {
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.delete(res);
    if (userConns.size === 0) connections.delete(userId);
  }
}

function sendToUser(userId, eventType, data) {
  const userConns = connections.get(userId);
  if (!userConns) return;
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of userConns) {
    res.write(payload);
  }
}

function broadcastToAll(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [, userConns] of connections) {
    for (const res of userConns) {
      res.write(payload);
    }
  }
}

module.exports = { addConnection, removeConnection, sendToUser, broadcastToAll };
