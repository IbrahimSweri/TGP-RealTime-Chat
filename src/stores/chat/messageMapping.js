export function decodeHTMLEntities(text) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

export function mapDbMessage(dbMessage) {
  return {
    id: dbMessage.id,
    content: decodeHTMLEntities(dbMessage.content),
    username: dbMessage.profiles?.username ?? dbMessage.username ?? 'Anonymous',
    avatarUrl: dbMessage.profiles?.avatar_url || dbMessage.avatar_url,
    userId: dbMessage.user_id ?? null,
    createdAt: dbMessage.created_at,
  }
}

