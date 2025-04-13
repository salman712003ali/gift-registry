"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import debounce from "lodash/debounce";
import { ArrowLeft, Search } from 'lucide-react'

interface Registry {
  id: string;
  title: string;
  description: string;
  occasion: string;
  event_date: string;
  created_at: string;
  user_id: string;
  privacy_settings: {
    is_private: boolean;
    show_contributor_names: boolean;
    allow_anonymous_contributions: boolean;
  };
  profiles?: {
    full_name: string | null;
  };
}

type SortOption = "relevance" | "date_newest" | "date_oldest" | "title_asc" | "title_desc";

export default function FindRegistryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [occasionFilter, setOccasionFilter] = useState<string>("");
  const [occasions, setOccasions] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router, supabase]);

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        // Simplified query - fetch all occasions
        const { data, error } = await supabase
          .from('registries')
          .select('occasion')
          .not('occasion', 'is', null);

        if (error) {
          console.error('Error fetching occasions:', error);
          return;
        }

        console.log(`Found ${data.length} registries with occasions`);
        
        if (data && data.length > 0) {
          const uniqueOccasions = Array.from(
            new Set(
              data
                .map(r => r.occasion as string)
                .filter(Boolean)
            )
          );
          console.log('Unique occasions:', uniqueOccasions);
          setOccasions(uniqueOccasions);
        } else {
          console.log('No occasions found');
        }
      } catch (error) {
        console.error('Error fetching occasions:', error);
      }
    };
    fetchOccasions();
  }, []);

  const searchRegistries = async (term: string, sort: SortOption, occasion: string) => {
    setLoading(true);
    console.log(`Searching registries with term: "${term}", sort: ${sort}, occasion: "${occasion}"`);
    
    try {
      // Simplified query - fetch all registries for now
      let query = supabase
        .from('registries')
        .select('*, profiles(full_name)')
      
      // Skip privacy filter for debugging
      // query = query.or(
      //   `privacy_settings->is_private.eq.false,` +
      //   `privacy_settings.is.null`
      // );

      if (term) {
        query = query.or(
          `title.ilike.%${term}%,description.ilike.%${term}%,occasion.ilike.%${term}%`
        );
      }

      if (occasion) {
        query = query.eq('occasion', occasion);
      }

      // Simplified sort - just use created_at
      query = query.order('created_at', { ascending: false });

      console.log('Executing query to fetch ALL registries...');
      const { data, error } = await query;

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      // Cast the data to the Registry type
      const typedData = (data || []) as unknown as Registry[];
      console.log(`Found ${typedData.length} registries in total`);
      
      // Debug all registries
      if (typedData.length > 0) {
        typedData.forEach((registry, index) => {
          console.log(`Registry ${index + 1}:`, {
            id: registry.id,
            title: registry.title,
            privacy_settings: registry.privacy_settings
          });
        });
      } else {
        console.log('No registries found at all');
      }
      
      setRegistries(typedData);
    } catch (error: any) {
      console.error('Error searching registries:', error);
      toast.error(error.message || 'Failed to search registries');
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevanceScore = (registry: Registry, term: string) => {
    const termLower = term.toLowerCase();
    let score = 0;

    if (registry.title.toLowerCase().includes(termLower)) {
      score += 10;
      if (registry.title.toLowerCase() === termLower) score += 5;
      if (registry.title.toLowerCase().startsWith(termLower)) score += 3;
    }

    if (registry.description?.toLowerCase().includes(termLower)) {
      score += 3;
    }

    if (registry.occasion?.toLowerCase().includes(termLower)) {
      score += 5;
    }

    return score;
  };

  const debouncedSearch = useMemo(
    () => debounce((term: string, sort: SortOption, occasion: string) => {
      searchRegistries(term, sort, occasion);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    debouncedSearch(newTerm, sortBy, occasionFilter);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    searchRegistries(searchTerm, value, occasionFilter);
  };

  const handleOccasionChange = (value: string) => {
    // Convert "all" to empty string for the filter
    const filterValue = value === "all" ? "" : value;
    setOccasionFilter(filterValue);
    searchRegistries(searchTerm, sortBy, filterValue);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4 gap-1"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Find Registry</h1>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        searchRegistries(searchTerm, sortBy, occasionFilter);
      }} className="flex gap-2 mb-8">
        <Input 
          type="text" 
          placeholder="Search by name, occasion, or description..." 
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-md"
        />
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-muted-foreground">Searching registries...</p>
        </div>
      ) : registries.length > 0 ? (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Found {registries.length} {registries.length === 1 ? 'registry' : 'registries'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registries.map((registry) => (
              <Card
                key={registry.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/registry/${registry.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{registry.title}</CardTitle>
                      <CardDescription>{registry.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {registry.occasion}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Created by: {registry.profiles?.full_name || 'Anonymous'}</span>
                      <span>•</span>
                      <span>Event date: {new Date(registry.event_date).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" className="ml-4">
                      View Registry →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm
              ? 'No registries found matching your search. Try different keywords or filters.'
              : 'Start typing to search for registries.'}
          </p>
        </div>
      )}
    </div>
  );
} 