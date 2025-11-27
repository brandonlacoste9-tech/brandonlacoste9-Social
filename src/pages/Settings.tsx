/**
 * Settings Page - User settings and profile edit
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { generateId } from '../lib/utils';
import { QUEBEC_REGIONS } from '../lib/quebecFeatures';
import { useTheme, PRESET_THEMES } from '../contexts/ThemeContext';
import type { User } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { edgeLighting, setEdgeLighting, currentTheme, setTheme, isAnimated, setIsAnimated, glowIntensity, setGlowIntensity } = useTheme();

  const [user, setUser] = React.useState<User | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [city, setCity] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch current user
  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          navigate('/login');
          return;
        }

        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (data) {
          setUser(data);
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
          setCity(data.city || '');
          setRegion(data.region || '');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Sélectionne une image!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image est trop grosse (max 5MB)');
      return;
    }

    setIsUploadingAvatar(true);
    toast.info('Upload de l\'avatar... 📸');

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${generateId()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          throw new Error('Le bucket "avatars" n\'existe pas. Crée-le dans Supabase Storage!');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setUser({ ...user, avatar_url: publicUrl });
      toast.success('Avatar mis à jour! 🎉');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!displayName.trim()) {
      toast.warning('Entre un nom d\'affichage!');
      return;
    }

    setIsSaving(true);
    toast.info('Sauvegarde en cours...');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          bio,
          city,
          region,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil mis à jour! ⚜️');
      
      // Update local state
      setUser({
        ...user,
        display_name: displayName,
        bio,
        city,
        region,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    const confirmed = window.confirm('Es-tu sûr de vouloir te déconnecter?');
    if (!confirmed) return;

    toast.info('Déconnexion...');
    await supabase.auth.signOut();
    toast.success('À la prochaine! 👋');
    setTimeout(() => navigate('/login'), 500);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION: Cette action est irréversible!\n\nVeux-tu vraiment supprimer ton compte?'
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'Es-tu VRAIMENT sûr? Toutes tes données seront perdues!'
    );
    if (!doubleConfirm) return;

    toast.warning('Suppression du compte...');
    
    try {
      // TODO: Implement account deletion
      // This should delete user data, posts, etc.
      toast.error('Fonctionnalité pas encore disponible. Contacte le support.');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Paramètres" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hidden file input for avatar */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />

        {/* Profile Picture */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                src={user.avatar_url}
                size="xl"
                isVerified={user.is_verified}
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Photo de profil</h3>
              <p className="text-white/60 text-sm">
                @{user.username}
              </p>
              {user.is_verified && (
                <p className="text-gold-400 text-xs mt-1">✓ Compte vérifié</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              Changer
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="glass-card rounded-2xl p-6 mb-4 space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              Nom d'affichage
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ton nom"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parle de toi..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400 resize-none"
            />
          </div>

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

          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
            isLoading={isSaving}
          >
            Sauvegarder
          </Button>
        </div>

        {/* Edge Lighting Settings */}
        <div className="glass-card rounded-2xl p-6 mb-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold">Éclairage des bords ✨</h3>
              <p className="text-white/60 text-sm">Personnalise l'aura de ton app</p>
            </div>
            <div 
              className="w-12 h-12 rounded-full border-4 edge-glow"
              style={{ borderColor: edgeLighting, boxShadow: `0 0 20px ${edgeLighting}` }}
            />
          </div>

          {/* Preset Themes */}
          <div>
            <label className="block text-white font-semibold mb-3 text-sm">
              Thèmes prédéfinis
            </label>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    toast.success(`Thème ${theme.name} activé! ✨`);
                  }}
                  className={`relative p-3 rounded-xl transition-all hover:scale-105 ${
                    currentTheme === key ? 'ring-2 ring-white' : ''
                  }`}
                  style={{ 
                    backgroundColor: theme.edgeLighting + '20',
                    border: `2px solid ${theme.edgeLighting}`
                  }}
                >
                  <div 
                    className="w-full aspect-square rounded-lg"
                    style={{ backgroundColor: theme.edgeLighting }}
                  />
                  <p className="text-white text-xs mt-2 text-center truncate">
                    {theme.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              Couleur personnalisée
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={edgeLighting}
                onChange={(e) => {
                  setEdgeLighting(e.target.value);
                  toast.info('Couleur personnalisée appliquée! 🎨');
                }}
                className="w-20 h-12 rounded-xl cursor-pointer border-2 border-white/20"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={edgeLighting}
                  onChange={(e) => setEdgeLighting(e.target.value)}
                  placeholder="#F5C842"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Animation Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-semibold text-sm">
                Animation pulsante
              </label>
              <p className="text-white/60 text-xs">Effet lumineux animé</p>
            </div>
            <button
              onClick={() => {
                setIsAnimated(!isAnimated);
                toast.success(isAnimated ? 'Animation désactivée' : 'Animation activée! ✨');
              }}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isAnimated ? 'bg-gold-gradient' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isAnimated ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Glow Intensity Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white font-semibold text-sm">
                Intensité de la lueur
              </label>
              <span className="text-white/60 text-sm">{glowIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${edgeLighting} 0%, ${edgeLighting} ${glowIntensity}%, rgba(255,255,255,0.2) ${glowIntensity}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          {/* Preview Card */}
          <div className="mt-4">
            <label className="block text-white font-semibold mb-2 text-sm">
              Aperçu
            </label>
            <div 
              className="card-edge p-6 text-center"
              style={{ 
                boxShadow: `0 0 ${glowIntensity/5}px ${edgeLighting}, 0 0 ${glowIntensity/2.5}px ${edgeLighting}`
              }}
            >
              <div className="text-4xl mb-2">⚜️</div>
              <p className="text-white font-bold">Zyeuté</p>
              <p className="text-white/60 text-sm">Le réseau social québécois</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="glass-card rounded-2xl p-6 mb-4 space-y-3">
          <h3 className="text-white font-bold mb-3">Compte</h3>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl mb-4">
            <div className="text-center">
              <div className="text-gold-400 font-bold text-xl">{user.coins}</div>
              <div className="text-white/60 text-xs">Cennes</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-bold text-xl">{user.fire_score}</div>
              <div className="text-white/60 text-xs">Score 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-xl">{user.posts_count || 0}</div>
              <div className="text-white/60 text-xs">Posts</div>
            </div>
          </div>

          <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white flex items-center justify-between">
            <span>Confidentialité et sécurité</span>
            <span className="text-white/40">›</span>
          </button>

          <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white flex items-center justify-between">
            <span>Notifications</span>
            <span className="text-white/40">›</span>
          </button>

          <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white flex items-center justify-between">
            <span>Langue</span>
            <span className="text-white/60 text-sm">Français 🇨🇦</span>
          </button>

          <div className="border-t border-white/10 my-2" />

          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-red-400 font-semibold"
          >
            Se déconnecter
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full text-left px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors text-red-500 text-sm"
          >
            Supprimer mon compte
          </button>
        </div>

        {/* App Info */}
        <div className="text-center text-white/40 text-sm">
          <p>Zyeuté v1.0.0</p>
          <p className="mt-1">Fait avec fierté québécoise ⚜️</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
