'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Video, Plus, Trash2, Loader2, PlayCircle, Eye, EyeOff } from 'lucide-react';

interface SupportVideo {
    id: number;
    category: string;
    title: string;
    youtube_id: string;
    category_order: number;
    video_order: number;
    is_active: boolean;
}

export default function LearningVaultManager() {
    const [videos, setVideos] = useState<SupportVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        youtube_id: '',
        category_order: 1,
        video_order: 1
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_videos')
                .select('*')
                .order('category_order', { ascending: true })
                .order('video_order', { ascending: true });

            if (error) throw error;
            setVideos(data as any);
        } catch (err) {
            console.error('Error fetching videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('support_videos')
                .insert([formData])
                .select()
                .single();

            if (error) throw error;
            
            // local update
            setVideos([...videos, data as any].sort((a, b) => {
                if (a.category_order !== b.category_order) return a.category_order - b.category_order;
                return a.video_order - b.video_order;
            }));
            setShowAddForm(false);
            setFormData({ category: '', title: '', youtube_id: '', category_order: 1, video_order: 1 });
        } catch (err) {
            console.error('Error adding video:', err);
            alert('Failed to add video');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('support_videos')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setVideos(videos.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
        } catch (err) {
            console.error('Error toggling status:', err);
            alert('Failed to update status');
        }
    };

    const deleteVideo = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this video from the Vault?")) return;
        
        try {
            const { error } = await supabase
                .from('support_videos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setVideos(videos.filter(v => v.id !== id));
        } catch (err) {
            console.error('Error deleting video:', err);
            alert('Failed to delete video');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div>
                    <h2 className="text-xl font-medium text-white flex items-center gap-2">
                        <Video className="w-5 h-5 text-brand" />
                        Video Library 
                        <span className="bg-brand/20 text-brand px-2 py-0.5 rounded-full text-xs ml-2">{videos.length} videos</span>
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">These videos are streamed to the clients&apos; desktop Support Hub.</p>
                </div>
                
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand text-black font-semibold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(76,186,73,0.3)]"
                >
                    {showAddForm ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showAddForm ? 'Cancel' : 'Add New Video'}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddVideo} className="bg-white/5 border border-brand/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(76,186,73,0.1)]">
                    <h3 className="text-lg font-bold text-white mb-4">Add Video to Vault</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Category Name</label>
                            <input 
                                required
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                placeholder="e.g. Dashboard & Basics"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-brand outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Video Title</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. How to use POS"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-brand outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">YouTube Video ID</label>
                            <input 
                                required
                                value={formData.youtube_id}
                                onChange={e => setFormData({...formData, youtube_id: e.target.value})}
                                placeholder="e.g. cK2X_5b3A6M"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-brand outline-none transition-colors"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-400 mb-2">Category Order</label>
                                <input 
                                    type="number"
                                    required
                                    value={formData.category_order}
                                    onChange={e => setFormData({...formData, category_order: parseInt(e.target.value)})}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-brand outline-none transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-400 mb-2">Video Order</label>
                                <input 
                                    type="number"
                                    required
                                    value={formData.video_order}
                                    onChange={e => setFormData({...formData, video_order: parseInt(e.target.value)})}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-brand outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="bg-brand text-black px-6 py-2.5 rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Publish Video
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                </div>
            ) : videos.length === 0 ? (
                 <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10">
                    <PlayCircle className="w-12 h-12 text-gray-500 mx-auto mb-4 hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-medium text-white mb-2">Vault is empty</h3>
                    <p className="text-gray-400">Add your first tutorial video so clients can start learning.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {videos.map(video => (
                        <div key={video.id} className={`bg-white/5 border ${video.is_active ? 'border-white/10' : 'border-red-500/30 opacity-70'} rounded-2xl overflow-hidden hover:border-brand/40 transition-colors group flex flex-col`}>
                            <div className="aspect-video relative bg-black/50">
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={`https://www.youtube.com/embed/${video.youtube_id}`} 
                                    title="YouTube video" 
                                    frameBorder="0" 
                                    allowFullScreen
                                />
                                {!video.is_active && (
                                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none backdrop-blur-sm">
                                        <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm tracking-widest shadow-xl">
                                            HIDDEN
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="text-xs font-bold text-brand uppercase tracking-wider mb-2">
                                    {video.category}
                                </div>
                                <h4 className="text-white font-medium text-lg leading-tight mb-4 flex-1">
                                    {video.title}
                                </h4>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                                    <div className="text-xs text-gray-500">
                                        Cat Ord: {video.category_order} • Vid Ord: {video.video_order}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => toggleActive(video.id, video.is_active)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title={video.is_active ? "Hide from clients" : "Show to clients"}
                                        >
                                            {video.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                                        </button>
                                        <button 
                                            onClick={() => deleteVideo(video.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                                            title="Delete permanently"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
