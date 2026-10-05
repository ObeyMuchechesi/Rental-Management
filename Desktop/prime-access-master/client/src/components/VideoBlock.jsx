import { PlayCircle, Clapperboard } from 'lucide-react';

function embedUrl(url) {
  const u = String(url || '').trim();
  // YouTube
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return { type: 'iframe', src: `https://www.youtube.com/embed/${m[1]}` };
  // Vimeo
  m = u.match(/vimeo\.com\/(\d+)/);
  if (m) return { type: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  // Local upload
  if (u.startsWith('/uploads/')) return { type: 'file', src: u };
  return { type: 'file', src: u };
}

export default function VideoBlock({ video }) {
  if (!video) return null;
  const { type, src } = embedUrl(video.url);
  return (
    <figure className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-950 shadow-card">
      {type === 'iframe' ? (
        <div className="aspect-video w-full">
          <iframe
            className="h-full w-full"
            src={src}
            title={video.title || 'Prime Access video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video className="aspect-video w-full" controls preload="metadata" poster={undefined}>
          <source src={src} />
          Your browser does not support video playback.
        </video>
      )}
      <figcaption className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white">
        {type === 'iframe' ? <PlayCircle size={16} className="text-gold-400" /> : <Clapperboard size={16} className="text-gold-400" />}
        {video.title || 'Prime Access video'}
      </figcaption>
    </figure>
  );
}