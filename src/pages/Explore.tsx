/**
 * Explore Page - Discover trending content
 */

import React from 'react';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { FeedGrid } from '../components/layout/FeedGrid';
import { supabase } from '../lib/supabase';
import { QUEBEC_HASHTAGS, QUEBEC_REGIONS } from '../../quebecFeatures';
import type { Post } from '../types';

export const Explore: React.FC = () => {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRegion, setSelectedRegion] = React.useState('');
  const [selectedHashtag, setSelectedHashtag] = React.useState('');

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*, user:users(*)')
        .order('fire_count', { ascending: false });

      // Filter by region
      if (selectedRegion) {
        query = query.eq('region', selectedRegion);
      }

      // Filter by hashtag
      if (selectedHashtag) {
        query = query.contains('hashtags', [selectedHashtag]);
      }

      // Search in caption
      if (searchQuery) {
        query = query.ilike('caption', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      if (data) setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion, selectedHashtag, searchQuery]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header showSearch={false} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche des posts, hashtags..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-gold-400"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="mb-6">
          <h2 className="text-white font-bold mb-3">Hashtags populaires</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {QUEBEC_HASHTAGS.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedHashtag(selectedHashtag === tag ? '' : tag)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedHashtag === tag
                    ? 'bg-gold-gradient text-black'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Region Filter */}
        <div className="mb-6">
          <h2 className="text-white font-bold mb-3">Par région</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedRegion('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedRegion === ''
                  ? 'bg-gold-gradient text-black'
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              Toutes
            </button>
            {QUEBEC_REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(selectedRegion === region.id ? '' : region.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedRegion === region.id
                    ? 'bg-gold-gradient text-black'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                {region.emoji} {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div>
          <h2 className="text-white font-bold mb-4">
            {selectedHashtag || selectedRegion || searchQuery
              ? 'Résultats'
              : 'Tendances'}
          </h2>
          <FeedGrid
            posts={posts}
            isLoading={isLoading}
            hasMore={false}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Explore;
