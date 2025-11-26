/**
 * Signup Page - User registration
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { signUp } from '../lib/supabase';

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit avoir au moins 3 caractères');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit avoir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, username);

      if (error) throw error;

      alert('Compte créé! Vérifie ton courriel pour confirmer ton compte.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-white flex items-center justify-center gap-2 mb-2">
            <span className="text-gold-400">⚜️</span>
            <span>Zyeuté</span>
          </div>
          <p className="text-white/60">Rejoins la communauté québécoise</p>
        </div>

        {/* Signup Form */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Inscription
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                placeholder="tonusername"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
              />
              <p className="text-white/40 text-xs mt-1">
                Lettres minuscules, chiffres et _ seulement
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
              />
              <p className="text-white/40 text-xs mt-1">
                Minimum 6 caractères
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Créer mon compte
            </Button>
          </form>

          {/* Terms */}
          <p className="text-center text-white/40 text-xs mt-4">
            En t'inscrivant, tu acceptes nos{' '}
            <a href="/terms" className="text-gold-400 hover:underline">
              conditions d'utilisation
            </a>
          </p>

          {/* Login link */}
          <p className="text-center text-white/60 text-sm mt-6">
            Déjà un compte?{' '}
            <Link to="/login" className="text-gold-400 hover:underline font-semibold">
              Connecte-toi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
