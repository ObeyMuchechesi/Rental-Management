import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, Image as ImageIcon, Clapperboard, Loader2 } from 'lucide-react';
import { api, getToken } from '../api';
import { PageHeader, Spinner, Empty } from './ui';

// On Vercel, files upload directly from the browser to Blob storage
// (no serverless body-size limits, works for videos up to 200 MB).
// Set VITE_UPLOAD_MODE=blob in the Vercel project env vars.
const BLOB_MODE = import.meta.env.VITE_UPLOAD_MODE === 'blob';

export default function MediaAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('gallery');
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try { setItems((await api('/admin/media')).items); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      if (BLOB_MODE) {
        // 1) Browser uploads the file straight to Vercel Blob using a
        //    short-lived token issued by our authenticated server route.
        const { upload: blobUpload } = await import('@vercel/blob/client');
        const blob = await blobUpload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/media/upload',
          headers: { Authorization: `Bearer ${getToken()}` },
          onUploadProgress: (e) => setProgress(e.percentage || 0),
        });
        // 2) Register the resulting URL in our database
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        await api('/admin/media', {
          method: 'POST',
          body: {
            url: blob.url,
            type,
            title: title || file.name,
            category,
            mimeType: file.type,
            size: file.size,
          },
        });
      } else {
        // Local / self-hosted: classic multipart upload to the server
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', title || file.name);
        fd.append('category', category);
        const token = getToken();
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
      }
      setTitle('');
      setProgress(0);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function togglePublished(item) {
    await api(`/admin/media/${item._id}`, { method: 'PATCH', body: { published: !item.published } });
    load();
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.title || item.url}"? This also removes the file from storage.`)) return;
    await api(`/admin/media/${item._id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <PageHeader
        title="Media & Videos"
        subtitle={
          BLOB_MODE
            ? 'Uploads go straight to Vercel Blob storage - images and videos up to 200 MB'
            : 'Upload images and videos, then publish them to the website'
        }
        actions={
          <div className="flex items-center gap-3">
            <input className="input max-w-[140px] !py-2 text-xs" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="input max-w-[140px] !py-2 text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="gallery">Gallery</option>
              <option value="video">Video</option>
              <option value="hero">Hero</option>
            </select>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary !py-2.5 text-xs">
              {uploading ? <><Loader2 size={14} className="animate-spin" /> {Math.round(progress)}%</> : <><Upload size={14} /> Upload</>}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </div>
        }
      />

      {uploading && (
        <div className="mb-5 rounded-xl border border-brand-100 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-700">
            <span>Uploading {BLOB_MODE ? 'to Blob storage' : 'to server'}...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${progress || 4}%` }} />
          </div>
        </div>
      )}

      {loading ? <Spinner /> : items.length === 0 ? <Empty message="No media yet. Upload images (jpg, png, gif, webp) or videos (mp4, webm) up to 200 MB." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((m) => (
            <div key={m._id} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
              {m.type === 'image' ? (
                <div className="aspect-video w-full overflow-hidden bg-brand-50">
                  <img src={m.url} alt={m.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="relative flex aspect-video w-full items-center justify-center bg-brand-950">
                  <video src={m.url} controls preload="metadata" className="h-full w-full" />
                </div>
              )}
              <div className="p-4">
                <p className="truncate text-sm font-semibold text-brand-950">{m.title || m.url}</p>
                <p className="mt-0.5 text-xs text-brand-500">
                  {m.type === 'image' ? <><ImageIcon size={11} className="mr-1 inline" />{m.mimeType}</> : <><Clapperboard size={11} className="mr-1 inline" />{m.mimeType}</>}
                  {' · '}{(m.size / 1024 / 1024).toFixed(1)} MB · {m.category}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-brand-400">{m.url}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => togglePublished(m)} className={`chip flex-1 justify-center border px-3 py-1.5 ${m.published ? 'border-green-200 bg-green-50 text-green-800' : 'border-brand-200 bg-brand-50 text-brand-600'}`}>
                    {m.published ? <><Eye size={12} /> Published</> : <><EyeOff size={12} /> Hidden</>}
                  </button>
                  <button onClick={() => remove(m)} className="chip border border-red-200 bg-red-50 px-3 py-1.5 text-red-600 hover:bg-red-100"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}