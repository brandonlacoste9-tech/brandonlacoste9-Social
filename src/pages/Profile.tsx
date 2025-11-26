/**
 * Profile Page - User profile with stats and posts
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { FeedGrid } from '../components/layout/FeedGrid';
import { supabase } from '../lib/supabase';
import { formatNumber } from '../lib/utils';
import type { User, Post } from '../types';

export const Profile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [user, setUser] = React.useState<User | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'posts' | 'fires' | 'saved'>('posts');

  const isOwnProfile = slug === 'me' || user?.id === currentUser?.id;

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (data) setCurrentUser(data);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch profile user
  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        let query;

        if (slug === 'me' && currentUser) {
          query = supabase
            .from('users')
            .select('*, followers_count:follows!following_id(count), following_count:follows!follower_id(count), posts_count:posts(count)')
            .eq('id', currentUser.id)
            .single();
        } else {
          query = supabase
            .from('users')
            .select('*, followers_count:follows!following_id(count), following_count:follows!follower_id(count), posts_count:posts(count)')
            .eq('username', slug)
            .single();
        }

        const { data, error } = await query;

        if (error) throw error;
        if (data) setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchUser();
    }
  }, [slug, currentUser, navigate]);

  // Fetch user posts
  React.useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('posts')
        .select('*, user:users(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setPosts(data);
    };

    fetchPosts();
  }, [user]);

  // Check if following
  React.useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !currentUser || isOwnProfile) return;

      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id)
        .single();

      setIsFollowing(!!data);
    };

    checkFollowing();
  }, [user, currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !currentUser) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id);
      setIsFollowing(false);
    } else {
      await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.id,
          following_id: user.id,
        });
      setIsFollowing(true);
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
      <Header showBack={true} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <Avatar
              src={user.avatar_url}
              size="2xl"
              isVerified={user.is_verified}
              isOnline={user.is_online}
            />

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user.display_name || user.username}
              </h1>
              <p className="text-white/60">@{user.username}</p>

              {user.bio && (
                <p className="mt-3 text-white/80">{user.bio}</p>
              )}

              {user.city && (
                <p className="mt-2 text-gold-400 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {user.city}
                </p>
              )}

              {/* Stats */}
              <div className="mt-4 flex gap-6">
                <div>
                  <span className="text-2xl font-bold text-gold-400">
                    {formatNumber(user.posts_count || 0)}
                  </span>
                  <span className="text-white/60 text-sm ml-2">Posts</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gold-400">
                    {formatNumber(user.followers_count || 0)}
                  </span>
                  <span className="text-white/60 text-sm ml-2">Abonnés</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-orange-500">
                    {formatNumber(user.fire_score || 0)}
                  </span>
                  <span className="text-white/60 text-sm ml-2">Feux</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-3">
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/settings')}
                  >
                    Modifier le profil
                  </Button>
                ) : (
                  <Button
                    variant={isFollowing ? 'outline' : 'primary'}
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Suivi' : 'Suivre'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
          {(['posts', 'fires', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
                activeTab === tab
                  ? 'text-gold-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab === 'posts' && 'Posts'}
              {tab === 'fires' && 'Feux'}
              {tab === 'saved' && 'Sauvegardés'}

              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-gradient" />
              )}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {activeTab === 'posts' && (
          <FeedGrid posts={posts} isLoading={false} hasMore={false} />
        )}

        {activeTab === 'fires' && (
          <div className="text-center text-white/60 py-12">
            Posts aimés à venir...
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="text-center text-white/60 py-12">
            Posts sauvegardés à venir...
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
