import { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

interface ImageUploadSlotProps {
  examId: string;
  questionId: string;
  imageUrl: string | null;
  isDark: boolean;
  onUploaded: (url: string | null) => void;
}

export default function ImageUploadSlot({
  examId,
  questionId,
  imageUrl,
  isDark,
  onUploaded,
}: ImageUploadSlotProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, JPG, WEBP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    const path = `${examId || 'new'}/${questionId}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from('exam-question-images')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('exam-question-images')
      .getPublicUrl(path);

    onUploaded(publicUrlData.publicUrl);
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    onUploaded(null);
  }

  if (imageUrl) {
    return (
      <div className="relative group mt-3">
        <div
          className={`relative rounded-xl overflow-hidden border ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <img
            src={imageUrl}
            alt="Question visual"
            className="w-full max-h-48 object-contain bg-black/5"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 text-white 
              opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
              hover:bg-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border-2 border-dashed 
          cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : isDark
              ? 'border-white/15 bg-white/5 hover:border-primary/40 hover:bg-primary/5'
              : 'border-slate-300 bg-slate-50 hover:border-primary/40 hover:bg-primary/5'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            <ImageIcon className={`w-4 h-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
          </div>
        )}
        <span
          className={`text-[11px] font-medium ${
            isDark ? 'text-text-muted' : 'text-slate-400'
          }`}
        >
          {uploading ? 'Uploading...' : 'Drop image or click to upload'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-accent-warm font-medium">{error}</p>
      )}
    </div>
  );
}
