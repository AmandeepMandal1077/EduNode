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
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">

          <div className="input-glow flex-1 flex items-center gap-2.5 border border-slate-200 rounded-xl bg-white px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Input
              id="explore-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, topics, or instructors..."
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent p-0 h-auto text-sm"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>


          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44 rounded-xl border-slate-200 text-sm h-10" id="explore-category-filter">
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
              <SelectTrigger className="w-36 rounded-xl border-slate-200 text-sm h-10" id="explore-price-filter">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_FILTERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-40 rounded-xl border-slate-200 text-sm h-10" id="explore-level-filter">
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
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2 cursor-pointer"
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
