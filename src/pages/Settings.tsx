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
import type { User } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = React.useState<User | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [city, setCity] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

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
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Save profile
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          bio,
          city,
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Profil mis à jour!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
        {/* Profile Picture */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.avatar_url}
              size="xl"
              isVerified={user.is_verified}
            />
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Photo de profil</h3>
              <p className="text-white/60 text-sm">
                @{user.username}
              </p>
            </div>
            <Button variant="outline" size="sm">
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

          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
            isLoading={isSaving}
          >
            Sauvegarder
          </Button>
        </div>

        {/* Account Settings */}
        <div className="glass-card rounded-2xl p-6 mb-4 space-y-3">
          <h3 className="text-white font-bold mb-3">Compte</h3>

          <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white">
            Confidentialité et sécurité
          </button>

          <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white">
            Notifications
          </button>

          <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white">
            Langue
          </button>

          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-red-500 font-semibold"
          >
            Se déconnecter
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
