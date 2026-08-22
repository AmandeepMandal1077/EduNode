import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExploreFiltersProps {
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (c: string) => void;
  price: string;
  setPrice: (p: string) => void;
  level: string;
  setLevel: (l: string) => void;
  categories: string[];
  hasFilters: boolean;
  clearFilters: () => void;
}

const PRICE_FILTERS = [
  { value: "all", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "under50", label: "Under $50" },
  { value: "under100", label: "Under $100" },
  { value: "paid", label: "Paid" },
];

const LEVEL_FILTERS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

export function ExploreFilters({
  query,
  setQuery,
  category,
  setCategory,
  price,
  setPrice,
  level,
  setLevel,
  categories,
  hasFilters,
  clearFilters,
}: ExploreFiltersProps) {
  return (
    <div className="bg-secondary-background border-b-4 border-border sticky top-16 z-30 shadow-[0px_4px_0px_0px_#000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1 w-full flex items-center">
            <Search className="w-4 h-4 text-foreground/60 absolute left-3 pointer-events-none z-10" />
            <Input
              id="explore-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, topics, or instructors..."
              className="pl-9 pr-9 bg-background font-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 text-foreground/60 hover:text-foreground cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-foreground hidden sm:block" />

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44 font-heading font-bold" id="explore-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger className="w-full sm:w-36 font-heading font-bold" id="explore-price-filter">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_FILTERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-full sm:w-40 font-heading font-bold" id="explore-level-filter">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_FILTERS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-heading font-black bg-main text-main-foreground px-3 py-2 border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
