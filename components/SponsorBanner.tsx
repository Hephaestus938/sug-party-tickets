'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ExternalLink, Megaphone } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  banner_url: string;
  link_url: string | null;
  category: string;
  expires_at: string | null;
}

export default function SponsorBanner() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const { data, error } = await supabase
          .from('sponsors')
          .select('id, name, banner_url, link_url, category, expires_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Filter out ads that have passed their expiration date
          const now = new Date();
          const validSponsors = data.filter((item) => {
            if (!item.expires_at) return true;
            return new Date(item.expires_at) > now;
          });
          setSponsors(validSponsors);
        }
      } catch (err) {
        console.error('Error loading sponsors:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSponsors();
  }, []);

  if (loading || sponsors.length === 0) return null;

  return (
    <div className="w-full my-8">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Official Campus Partners & Sponsors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sponsors.map((item) => {
          const ContentWrapper = item.link_url ? 'a' : 'div';
          const linkProps = item.link_url
            ? { href: item.link_url, target: '_blank', rel: 'noreferrer' }
            : {};

          return (
            <ContentWrapper
              key={item.id}
              {...linkProps}
              className="group relative bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
            >
              {item.banner_url && (
                <div className="h-36 w-full overflow-hidden bg-slate-950 relative">
                  <img
                    src={item.banner_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    {item.category}
                  </div>
                </div>
              )}

              <div className="p-4 flex justify-between items-center bg-slate-900/90">
                <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                  {item.name}
                </span>

                {item.link_url && (
                  <span className="flex items-center gap-1 text-xs text-purple-400 group-hover:text-purple-300 font-semibold">
                    <span>Visit</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </ContentWrapper>
          );
        })}
      </div>
    </div>
  );
}