import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchCategoriesThunk, searchCoursesThunk } from "@/store/courseSlice";
import { useDebounce } from "@/hooks/useDebounce";
import type { Course } from "@/types";

export function useExplore() {
  const dispatch = useDispatch<AppDispatch>();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("all");
  const [level, setLevel] = useState("All Levels");
  const [currentPage, setCurrentPage] = useState(1);

  const { courses: rawCourses, categories, loading } = useSelector((state: RootState) => state.course);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      searchCoursesThunk({
        query: debouncedQuery,
        category: category === "all" ? undefined : category,
        priceFilter: price === "all" ? undefined : price,
      })
    );
  }, [dispatch, debouncedQuery, category, price]);

  const courses: Course[] = level !== "All Levels"
    ? rawCourses.filter((c: Course) => c.level === level)
    : rawCourses;

  const hasFilters = !!query || category !== "all" || price !== "all" || level !== "All Levels";

  useEffect(() => {
    setCurrentPage(1);
  }, [query, category, price, level]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setPrice("all");
    setLevel("All Levels");
  };

  return {
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
  };
}
