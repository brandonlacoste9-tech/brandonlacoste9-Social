/**
 * Upload Page - Create posts with Ti-Guy AI assistance
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { extractHashtags, generateId } from '../lib/utils';
import { QUEBEC_REGIONS } from '../../quebecFeatures';

export const Upload: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [city, setCity] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Generate caption with Ti-Guy AI (Gemini)
  const handleGenerateCaption = async () => {
    if (!file) return;

    setIsGenerating(true);
    try {
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        alert('Gemini API key not configured');
        return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Tu es Ti-Guy, l'assistant IA de Zyeuté, le réseau social québécois. Génère une caption en joual québécois pour cette image. Sois créatif, drôle, et authentique. Utilise des expressions québécoises. Ajoute 2-3 hashtags québécois pertinents à la fin. Maximum 280 caractères.`,
                    },
                    {
                      inline_data: {
                        mime_type: file.type,
                        data: base64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        const data = await response.json();

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          setCaption(data.candidates[0].content.parts[0].text);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error generating caption:', error);
      alert('Erreur lors de la génération de la caption');
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload post
  const handleUpload = async () => {
    if (!file) {
      alert('Sélectionne une photo ou vidéo!');
      return;
    }

    setIsUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Tu dois être connecté!');
        navigate('/login');
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `media/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      // Extract hashtags
      const hashtags = extractHashtags(caption);

      // Create post
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          media_url: publicUrl,
          caption,
          hashtags,
          region,
          city,
        });

      if (insertError) throw insertError;

      // Success! Navigate to feed
      navigate('/');
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Erreur lors du téléversement');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header showBack={true} title="Créer un post" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preview */}
        {preview ? (
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 mb-6">
            {file?.type.startsWith('video/') ? (
              <video
                src={preview}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}

            {/* Change file button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-4 right-4 px-4 py-2 bg-black/80 rounded-xl text-white text-sm hover:bg-black transition-colors"
            >
              Changer
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 hover:border-gold-400 hover:bg-white/5 transition-all mb-6"
          >
            <svg
              className="w-16 h-16 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-white/60 text-lg">
              Clique pour ajouter une photo ou vidéo
            </span>
          </button>
        )}

        {/* Caption */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <label className="block text-white font-semibold mb-2">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Écris quelque chose de nice..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400 resize-none"
            rows={4}
          />

          {/* Ti-Guy AI button */}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleGenerateCaption}
            isLoading={isGenerating}
            disabled={!file}
            leftIcon={<span>🤖</span>}
          >
            {isGenerating ? 'Ti-Guy réfléchit...' : 'Demande à Ti-Guy'}
          </Button>
        </div>

        {/* Region & City */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Région
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-400"
              >
                <option value="">Sélectionne</option>
                {QUEBEC_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Montréal"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>

        {/* Upload button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleUpload}
          isLoading={isUploading}
          disabled={!file}
        >
          {isUploading ? 'Téléversement...' : 'Publier 🔥'}
        </Button>
      </div>
    </div>
  );
};

export default Upload;
