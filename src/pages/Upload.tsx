/**
 * Upload Page - Create posts with Ti-Guy AI assistance
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { extractHashtags, generateId } from '../lib/utils';
import { QUEBEC_REGIONS } from '../lib/quebecFeatures';
import { generateCaption as generateAICaption, generateHashtags as generateAIHashtags, analyzeImage } from '../services/geminiService';
import { moderateContent, isUserBanned } from '../services/moderationService';
import { checkAchievements } from '../services/achievementService';
import { toast } from '../components/ui/Toast';

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
    if (!file) {
      toast.warning('Ajoute une image d\'abord!');
      return;
    }
    setIsGenerating(true);
    toast.info('Ti-Guy est en train de créer ta légende... 🤖');
    try {
      const aiCaption = await generateAICaption(file);
      setCaption(aiCaption);
      toast.success('Caption générée! 🔥');
    } catch (error: any) {
      console.error('Error generating caption:', error);
      if (error.message?.includes('Configuration')) {
        toast.error('Configure ton API Gemini dans .env.local');
      } else {
        toast.error('Erreur avec Ti-Guy. Réessaye!');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate hashtags with AI
  const handleGenerateHashtags = async () => {
    if (!file) {
      toast.warning('Ajoute une image d\'abord!');
      return;
    }
    toast.info('Génération des hashtags... 🏷️');
    try {
      const hashtags = await generateAIHashtags(file);
      const hashtagString = hashtags.join(' ');
      // Append hashtags to caption or replace existing ones
      const captionWithoutHashtags = caption.replace(/#\w+/g, '').trim();
      setCaption(`${captionWithoutHashtags} ${hashtagString}`.trim());
      toast.success(`${hashtags.length} hashtags ajoutés!`);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      toast.error('Erreur lors de la génération des hashtags');
    }
  };

  // Analyze image
  const handleAnalyzeImage = async () => {
    if (!file) return;
    toast.info('Analyse de l\'image...');
    try {
      const description = await analyzeImage(file);
      toast.info(description);
    } catch (error) {
      console.error('Error analyzing image:', error);
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
      // Check if user is banned
      const banStatus = await isUserBanned(user.id);
      if (banStatus.isBanned) {
        toast.error(
          banStatus.until
            ? `Tu es suspendu jusqu'au ${new Date(banStatus.until).toLocaleDateString('fr-CA')}`
            : 'Ton compte est banni définitivement'
        );
        setIsUploading(false);
        return;
      }
      // AI Moderation Check
      toast.info('Analyse du contenu en cours... 🛡️');
      const moderationResult = await moderateContent(
        { text: caption },
        'post',
        user.id
      );
      // Handle moderation result
      if (moderationResult.action === 'ban' || moderationResult.action === 'remove') {
        toast.error(`❌ ${moderationResult.reason}`);
        toast.warning('Ton contenu viole nos directives de la communauté');
        setIsUploading(false);
        return;
      }
      if (moderationResult.action === 'flag') {
        toast.warning('⚠️ Ton contenu sera révisé par notre équipe');
      }
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `media/${user.id}/${fileName}`;
      toast.info('Upload en cours... ⬆️');
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);
      if (uploadError) {
        // Check if bucket exists, provide helpful error
        if (uploadError.message.includes('not found')) {
          throw new Error('Le bucket "posts" n\'existe pas dans Supabase Storage. Crée-le d\'abord!');
        }
        throw uploadError;
      }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);
      // Extract hashtags
      const hashtags = extractHashtags(caption);
      // Create post
      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          media_url: publicUrl,
          caption,
          hashtags,
          region,
          city,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      // Log moderation with content ID
      if (newPost) {
        await moderateContent(
          { text: caption },
          'post',
          user.id,
          newPost.id
        );
        // Check achievements! 🏆
        await checkAchievements(user.id, {
          type: 'post_created',
          data: {
            hashtags,
            region,
            city,
          },
        });
      }
      // Success!
      if (moderationResult.action === 'flag') {
        toast.success('Post publié! En attente de révision.');
      } else {
        toast.success('Post publié avec succès! 🔥');
      }
      setTimeout(() => navigate('/'), 1000);
    } catch (error: any) {
      console.error('Error uploading post:', error);
      toast.error(error.message || 'Erreur lors du téléversement');
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
            className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 hover:border-gold-400 hover:bg-white/5 transition-all"
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
          {/* AI Actions */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCaption}
              isLoading={isGenerating}
              disabled={!file}
              leftIcon={<span>🤖</span>}
            >
              {isGenerating ? 'Ti-Guy réfléchit...' : 'Demande à Ti-Guy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateHashtags}
              disabled={!file}
              leftIcon={<span>🏷️</span>}
            >
              Hashtags
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAnalyzeImage}
              disabled={!file}
              leftIcon={<span>👁️</span>}
            >
              Analyser
            </Button>
          </div>
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