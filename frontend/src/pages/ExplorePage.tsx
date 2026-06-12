import { useExplore } from "@/hooks/useExplore";
import { ExploreFilters } from "@/components/explore/ExploreFilters";
import { ExploreCourseGrid } from "@/components/explore/ExploreCourseGrid";

export function ExplorePage() {
  const {
    query,
    setQuery,
    category,
    setCategory,
    price,
    setPrice,
    level,
    setLevel,
    currentPage,
    setCurrentPage,
    courses,
    categories,
    loading,
    hasFilters,
    clearFilters,
  } = useExplore();

  return (
    <div className="min-h-screen bg-slate-50">
      <ExploreFilters
        query={query}
        setQuery={setQuery}
        category={category}
        setCategory={setCategory}
        price={price}
        setPrice={setPrice}
        level={level}
        setLevel={setLevel}
        categories={categories}
        hasFilters={hasFilters}
        clearFilters={clearFilters}
      />

      <ExploreCourseGrid
        courses={courses}
        loading={loading}
        hasFilters={hasFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
