import React, { useState, useRef } from 'react';
import { Upload, Link, CheckCircle2, Film, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface MediaDropzoneProps {
  type: 'image' | 'video';
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  theme: 'dark' | 'light';
  maxSizeMB?: number;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  type,
  label,
  accept,
  value,
  onChange,
  theme,
  maxSizeMB = 30
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File is too large (${formatBytes(file.size)}). Max allowed is ${maxSizeMB}MB.`);
      return;
    }

    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    setIsUploading(true);

    // 1. If Supabase is connected, attempt direct bucket upload
    if (isSupabaseConfigured() && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || (type === 'image' ? 'jpg' : 'mp4');
        const filePath = `${type}s/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('argon-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError) {
          const { data } = supabase.storage.from('argon-assets').getPublicUrl(filePath);
          if (data && data.publicUrl) {
            onChange(data.publicUrl);
            setIsUploading(false);
            return;
          }
        } else {
          console.warn('Supabase storage upload failed, using local DataURL fallback:', uploadError);
        }
      } catch (err) {
        console.warn('Storage upload error, using local fallback:', err);
      }
    }

    // 2. Local Fallback: Convert to Data URL or ObjectURL
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read image file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } else {
      // For video, create a persistent object URL for immediate high-speed playback
      const objectUrl = URL.createObjectURL(file);
      onChange(objectUrl);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const clearAsset = () => {
    onChange('');
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Header with Mode Tabs */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-300">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
              tab === 'upload'
                ? 'bg-[#D4AF37] text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-2.5 h-2.5" />
            <span>Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
              tab === 'url'
                ? 'bg-[#D4AF37] text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Link className="w-2.5 h-2.5" />
            <span>URL</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Drag-and-Drop Uploader */}
      {tab === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          {value ? (
            /* Media Preview Box */
            <div className={`relative rounded-xl border overflow-hidden transition-all group ${
              isDark ? 'bg-neutral-950 border-neutral-700/80' : 'bg-neutral-100 border-neutral-300'
            }`}>
              {type === 'image' ? (
                <div className="relative h-44 w-full">
                  <img src={value} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Target Compiled</span>
                  </div>
                </div>
              ) : (
                <div className="relative h-44 w-full bg-black">
                  <video
                    src={value}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                    <Film className="w-3 h-3 text-emerald-400" />
                    <span>Video Texture Ready</span>
                  </div>
                </div>
              )}

              {/* Bottom Meta & Replace button */}
              <div className="p-2.5 px-3 flex items-center justify-between text-xs bg-neutral-900/90 border-t border-neutral-800">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-neutral-200 block truncate">
                    {fileName || (type === 'image' ? 'Selected Artwork' : 'Selected Video')}
                  </span>
                  {fileSize && <span className="text-[10px] text-neutral-400">{fileSize}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#D4AF37] hover:underline"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={clearAsset}
                    className="p-1 rounded-md text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Dropzone Target */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 gold-glow scale-[1.01]'
                  : isDark
                  ? 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-600 hover:bg-neutral-900/50'
                  : 'border-neutral-300 bg-neutral-50 hover:border-[#D4AF37] hover:bg-neutral-100'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                  <span className="text-xs font-semibold text-[#D4AF37]">Processing {type}...</span>
                </div>
              ) : (
                <>
                  <div className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-[#D4AF37] mb-2 shadow-sm">
                    {type === 'image' ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-medium text-neutral-200">
                    <span className="text-[#D4AF37] font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {type === 'image' ? 'PNG, JPG, or WEBP (Max 30MB)' : 'MP4, WEBM, or MOV (Max 50MB)'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Direct URL Input */
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={type === 'image' ? 'https://example.com/artwork.jpg' : 'https://example.com/clip.mp4'}
            className="w-full text-xs px-3 py-2 rounded-lg bg-neutral-900/80 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-[#D4AF37]"
          />
          {value && (
            <div className="relative h-28 w-full rounded-lg overflow-hidden border border-neutral-800">
              {type === 'image' ? (
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={value} controls className="w-full h-full object-contain bg-black" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-[11px] text-rose-400 font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
};
