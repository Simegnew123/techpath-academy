export function getYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  let id: string | null = null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/,
    /^([A-Za-z0-9_-]{6,})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      id = match[1];
      break;
    }
  }

  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function getVimeoEmbed(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export function getVideoEmbed(url: string): string | null {
  return getYouTubeEmbed(url) ?? getVimeoEmbed(url);
}
