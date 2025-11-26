/**
 * Feed Page - Main home page with stories and video grid
 */

import React from 'react';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { StoryCarousel } from '../components/features/StoryCircle';
import { FeedGrid } from '../components/layout/FeedGrid';
import { supabase } from '../lib/supabase';
import type { Post, User, Story } from '../types';

export const Feed: React.FC = () => {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [stories, setStories] = React.useState<Array<{ user: User; story?: Story; isViewed?: boolean }>>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(0);

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) setCurrentUser(data);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch posts
  const fetchPosts = React.useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          user_fire:fires(fire_level)
        `)
        .order('created_at', { ascending: false })
        .range(pageNum * 20, (pageNum + 1) * 20 - 1);

      if (error) throw error;

      if (data) {
        if (pageNum === 0) {
          setPosts(data);
        } else {
          setPosts(prev => [...prev, ...data]);
        }
        setHasMore(data.length === 20);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stories
  React.useEffect(() => {
    const fetchStories = async () => {
      // TODO: Implement stories query
      // For now, empty array
      setStories([]);
    };

    fetchStories();
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // Subscribe to real-time updates
  React.useEffect(() => {
    const channel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          // Add new post to feed
          setPosts(prev => [payload.new as Post, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header showSearch={true} />

      {/* Stories */}
      {stories.length > 0 && (
        <StoryCarousel
          stories={stories}
          currentUser={currentUser || undefined}
          className="border-b border-white/10"
        />
      )}

      {/* Feed Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <FeedGrid
          posts={posts}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;
