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

interface Registry {
  id: string;
  title: string;
  description: string;
  occasion: string;
  event_date: string;
  created_at: string;
  user_id: string;
  is_private: boolean;
  users?: {
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
      const { data, error } = await supabase
        .from('registries')
        .select('occasion')
        .eq('is_private', false)
        .not('occasion', 'is', null);

      if (!error && data) {
        const uniqueOccasions = Array.from(new Set(data.map(r => r.occasion))).filter(Boolean);
        setOccasions(uniqueOccasions);
      }
    };
    fetchOccasions();
  }, []);

  const searchRegistries = async (term: string, sort: SortOption, occasion: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('registries')
        .select('*, users(full_name)')
        .eq('is_private', false);

      if (term) {
        query = query.or(
          `title.ilike.%${term}%,description.ilike.%${term}%,occasion.ilike.%${term}%`
        );
      }

      if (occasion) {
        query = query.eq('occasion', occasion);
      }

      switch (sort) {
        case 'date_newest':
          query = query.order('event_date', { ascending: false });
          break;
        case 'date_oldest':
          query = query.order('event_date', { ascending: true });
          break;
        case 'title_asc':
          query = query.order('title', { ascending: true });
          break;
        case 'title_desc':
          query = query.order('title', { ascending: false });
          break;
        case 'relevance':
        default:
          if (term) {
            query = query.order('created_at', { ascending: false });
          } else {
            query = query.order('created_at', { ascending: false });
          }
      }

      const { data, error } = await query;

      if (error) throw error;

      setRegistries(data || []);
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Find a Registry</h1>
          <p className="text-muted-foreground">
            Search for gift registries by name, occasion, or description
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search registries</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Enter registry name, occasion, or description..."
                  className="w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label>Filter by occasion</Label>
                  <Select value={occasionFilter} onValueChange={handleOccasionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All occasions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All occasions</SelectItem>
                      {occasions.map((occasion) => (
                        occasion && (
                          <SelectItem key={occasion} value={occasion}>
                            {occasion}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Sort by</Label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most relevant</SelectItem>
                      <SelectItem value="date_newest">Newest first</SelectItem>
                      <SelectItem value="date_oldest">Oldest first</SelectItem>
                      <SelectItem value="title_asc">Title A-Z</SelectItem>
                      <SelectItem value="title_desc">Title Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
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
                        <span>Created by: {registry.users?.full_name || 'Anonymous'}</span>
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
      </div>
    </div>
  );
} 