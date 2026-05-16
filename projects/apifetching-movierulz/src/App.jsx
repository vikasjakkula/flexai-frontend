import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Import Montserrat font from Google Fonts for header
const fontMontserratLink = document.getElementById('montserrat-font-google');
if (!fontMontserratLink) {
  const link = document.createElement('link');
  link.id = 'montserrat-font-google';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap';
  document.head.appendChild(link);
}

const VIOLET = "#7C3AED"; // Purple similar to todo app

// Utility to safely extract a field with possible alternative spellings
function getField(obj, fields, fallback = "N/A") {
  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(obj, field) &&
      obj[field] !== undefined &&
      obj[field] !== null &&
      obj[field] !== ""
    ) {
      return obj[field];
    }
  }
  return fallback;
}

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(12); // Number of movies to show initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState([]); // Store favorite movie IDs
  const observerTarget = useRef(null);
  const navigate = useNavigate();

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteMovies');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('favoriteMovies', JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite status for a movie
  const toggleFavorite = (movieId, movieData) => {
    setFavorites((prev) => {
      if (prev.includes(movieId)) {
        // Remove from favorites
        const updated = prev.filter((id) => id !== movieId);
        // Remove from localStorage movies data
        const savedMovies = localStorage.getItem('favoriteMoviesData');
        if (savedMovies) {
          const moviesData = JSON.parse(savedMovies);
          const updatedMovies = moviesData.filter(movie => 
            (movie.imdbID || movie.id) !== movieId
          );
          localStorage.setItem('favoriteMoviesData', JSON.stringify(updatedMovies));
        }
        return updated;
      } else {
        // Add to favorites
        const updated = [...prev, movieId];
        // Save full movie data to localStorage
        const savedMovies = localStorage.getItem('favoriteMoviesData');
        const moviesData = savedMovies ? JSON.parse(savedMovies) : [];
        // Check if movie already exists
        const exists = moviesData.some(movie => (movie.imdbID || movie.id) === movieId);
        if (!exists && movieData) {
          moviesData.push(movieData);
          localStorage.setItem('favoriteMoviesData', JSON.stringify(moviesData));
        }
        return updated;
      }
    });
  };

  // Check if a movie is favorited
  const isFavorite = (movieId) => {
    return favorites.includes(movieId);
  };

  // All attributes we want from backend for card
  const BACKEND_KEYS = {
    title: ["title", "Title", "name"],
    year: ["year", "Year", "releaseYear"],
    poster: ["Poster", "poster", "image"],
    genres: ["genres", "Genres", "genre"],
    imdbID: ["imdbID", "id", "_id"],
    released: ["Released", "released"],
    rated: ["Rated", "rated"],
    runtime: ["Runtime", "runtime"],
    director: ["Director", "director"],
    writer: ["Writer", "writer"],
    actors: ["Actors", "actors"],
    plot: ["Plot", "plot"],
    language: ["Language", "language"],
    country: ["Country", "country"],
    awards: ["Awards", "awards"],
    type: ["Type", "type"],
    totalseasons: ["totalSeasons", "TotalSeasons", "totalseasons"]
  };

  const handleSearch = async () => {
    const trimmedQuery = search.trim();
    if (!trimmedQuery) {
      setMovies([]);
      setFiltered([]);
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Step 1: Search movies using OMDB API search endpoint
      const searchUrl = `https://www.omdbapi.com/?s=${encodeURIComponent(trimmedQuery)}&apikey=b078be02`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error("Failed to fetch movies from OMDB");
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.Response === "False" || !searchData.Search) {
        setMovies([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch full details for each movie to get IMDB Rating
      const moviesWithDetails = await Promise.all(
        searchData.Search.slice(0, 20).map(async (movie) => {
          try {
            const detailUrl = `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=b078be02`;
            const detailResponse = await fetch(detailUrl);
            const detailData = await detailResponse.json();
            
            return {
              Title: detailData.Title || movie.Title,
              Year: detailData.Year || movie.Year,
              imdbRating: detailData.imdbRating || "N/A",
              Type: detailData.Type || movie.Type,
              imdbID: detailData.imdbID || movie.imdbID,
              Poster: detailData.Poster || movie.Poster,
            };
          } catch (error) {
            // If detail fetch fails, use search result data
            return {
              Title: movie.Title,
              Year: movie.Year,
              imdbRating: "N/A",
              Type: movie.Type,
              imdbID: movie.imdbID,
              Poster: movie.Poster,
            };
          }
        })
      );

      setMovies(moviesWithDetails);
      setFiltered(moviesWithDetails);
      setDisplayedCount(12); // Reset to initial count on new search
    } catch (error) {
      console.error("Error fetching movies:", error);
      setMovies([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  // Handles 'Enter' key in search input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Create infinite loop of movies by duplicating the array
  const createInfiniteMovies = () => {
    if (filtered.length === 0) return [];
    const repetitions = Math.ceil(displayedCount / filtered.length) + 1;
    const infiniteArray = [];
    for (let i = 0; i < repetitions; i++) {
      infiniteArray.push(...filtered);
    }
    return infiniteArray.slice(0, displayedCount);
  };

  // Get movies to display (with infinite loop)
  const moviesToDisplay = filtered.length > 0 ? createInfiniteMovies() : [];
  const hasMoreMovies = true; // Always true for infinite scroll

  // Infinite scroll: Load more movies when user scrolls near bottom
  useEffect(() => {
    if (!hasSearched || filtered.length === 0) {
      return;
    }

    const loadMoreMovies = () => {
      if (isLoadingMore || loading) {
        return;
      }

      setIsLoadingMore(true);
      // Load more movies immediately (always add 12 more)
      setTimeout(() => {
        setDisplayedCount((prev) => prev + 12);
        setIsLoadingMore(false);
      }, 200);
    };

    // Method 1: IntersectionObserver (preferred)
    const currentTarget = observerTarget.current;
    let observer = null;

    if (currentTarget) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            loadMoreMovies();
          }
        },
        { 
          threshold: 0.01, // Trigger even when 1% visible
          rootMargin: '300px' // Start loading 300px before reaching the element
        }
      );

      observer.observe(currentTarget);
    }

    // Method 2: Window scroll event (fallback - more reliable)
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Trigger when within 400px of bottom
      if (documentHeight - scrollPosition < 400) {
        loadMoreMovies();
      }
    };

    // Use throttling for scroll event
    let scrollTimeout = null;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      if (observer && currentTarget) {
        observer.unobserve(currentTarget);
      }
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [displayedCount, filtered.length, isLoadingMore, loading, hasSearched]);

  return (
    // Main container - Full viewport with purple background, centered flex column layout
    <div className="min-h-screen w-full bg-violet text-white text-center p-0 m-0 flex flex-col items-center transition-all duration-300 ease-in-out">
      {/* Header with title and favorites button */}
      <div className="w-full max-w-7xl px-4 pt-8 pb-4 flex items-center justify-between">
        {/* Spacer for alignment */}
        <div className="w-20"></div>
        {/* Header Title - Compact, neat, simple font using Montserrat */}
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight transition-colors duration-300 drop-shadow-lg font-montserrat">
          Find Your Movie!
        </h1>
        {/* Favorites Button - Top right */}
        <button
          onClick={() => navigate('/favorites')}
          className="text-white text-lg font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill={favorites.length > 0 ? "#7C3AED" : "none"} 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="lucide lucide-heart"
          >
            <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
          </svg>
          Favorites
        </button>
      </div>
      
      {/* Search Bar Container - Flexbox row on desktop, column on mobile with gap between input and button */}
      <div className="flex flex-col md:flex-row justify-center items-center w-full gap-3 md:gap-3 mb-12 px-4">
        {/* Search Input - Rounded left side, semi-transparent white background with better styling */}
        <input
          type="text"
          placeholder="Search for a movie"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-base md:text-lg px-5 py-3.5 rounded-lg md:rounded-lg border-2 border-white outline-none bg-white/10 backdrop-blur-sm text-white placeholder-white/70 w-full md:w-80 max-w-md transition-all duration-300 shadow-lg focus:border-white focus:bg-white/20 focus:shadow-xl focus:scale-105"
        />
        {/* Search Button - Rounded right side, white background with violet text and hover effects */}
        <button
          onClick={handleSearch}
          className="rounded-lg md:rounded-lg border-none px-10 py-3.5 text-base md:text-lg font-semibold bg-white text-violet cursor-pointer transition-all duration-300 shadow-lg hover:bg-violet-50 hover:text-violet-dark hover:shadow-xl hover:scale-105 active:scale-95 w-full md:w-auto"
        >
          Search
        </button>
      </div>

      {/* Loading State - Simple text, no box */}
      {loading ? (
        <p className="text-xl md:text-2xl text-white my-8 font-medium">
          Loading...
        </p>
      ) : (
        hasSearched && (
          // Movies List Container - Flexbox grid with gap, responsive padding
          <div className="flex gap-8 flex-wrap justify-center py-6 px-4 pb-12 w-full transition-all duration-300 ease-in-out min-h-[100px] max-w-7xl">
            {filtered.length === 0 ? (
              // No Results Message - Simple text, no box
              <p className="text-xl md:text-2xl text-white my-8 font-medium">
                No movies found. Try a different search.
              </p>
            ) : (
              <>
                {moviesToDisplay.map((movie, index) => {
                // Extract only the required fields: Title, Year, IMDB Rating, Type
                const movieTitle = movie.Title || "Unknown";
                const movieYear = movie.Year || "N/A";
                const movieImdbRating = movie.imdbRating || "N/A";
                const movieType = movie.Type || "N/A";
                const moviePoster = movie.Poster || null;
                // Create unique key for each movie instance (including duplicates)
                const movieId = movie.imdbID || `movie-${index}`;
                const uniqueKey = `${movieId}-${index}`;

                return (
                  // Movie Card - White background, rounded corners, shadow, flex column layout with hover effects
                  <div
                    key={uniqueKey}
                    className="bg-white rounded-2xl shadow-xl min-w-[280px] max-w-[320px] min-h-[420px] p-6 flex flex-col items-center mb-6 transition-all duration-300 relative border-none break-words w-[90vw] md:w-auto max-w-[95vw] md:max-w-[320px] hover:shadow-2xl hover:scale-105 hover:-translate-y-2"
                  >
                    {/* Favorite Heart Icon - Top right corner */}
                    <button
                      onClick={() => toggleFavorite(movieId, movie)}
                      className="absolute top-4 right-4 z-10 cursor-pointer p-2 hover:scale-110 transition-transform"
                      aria-label={isFavorite(movieId) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill={isFavorite(movieId) ? "#7C3AED" : "none"} 
                        stroke={isFavorite(movieId) ? "#7C3AED" : "currentColor"} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="lucide lucide-heart"
                      >
                        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
                      </svg>
                    </button>
                    {/* Movie Poster or Placeholder - Better rounded corners and sizing */}
                    {moviePoster && moviePoster !== "N/A" ? (
                      <img
                        src={moviePoster}
                        alt={movieTitle}
                        className="w-full h-96 object-cover rounded-xl mb-5 bg-violet-100 shadow-md"
                      />
                    ) : (
                      // Placeholder for missing poster - Centered text, violet background with better styling
                      <div className="w-full h-96 rounded-xl mb-5 bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center text-violet italic text-lg font-medium shadow-md">
                        No Image
                      </div>
                    )}
                    {/* Movie Title - Violet color, bold, centered with better typography */}
                    <h2 className="text-violet text-xl font-bold m-0 mb-5 text-center tracking-wide leading-tight px-2">
                      {movieTitle}
                    </h2>
                    {/* Movie Details Container - Display only: Title, Year, IMDB Rating, Type with better spacing */}
                    <div className="w-full space-y-3 px-2">
                      {/* Year - Better styled */}
                      <p className="text-gray-800 text-base text-center break-words font-medium">
                        <strong className="text-violet font-bold mr-2">Year:</strong> 
                        <span className="text-gray-700">{movieYear}</span>
                      </p>
                      {/* IMDB Rating - Highlighted with better styling */}
                      <p className="text-gray-800 text-base text-center break-words font-medium">
                        <strong className="text-violet font-bold mr-2">IMDB Rating:</strong> 
                        <span className="text-gray-700 font-semibold">{movieImdbRating}</span>
                      </p>
                      {/* Type - Better styled */}
                      <p className="text-gray-800 text-base text-center break-words font-medium">
                        <strong className="text-violet font-bold mr-2">Type:</strong> 
                        <span className="text-gray-700 capitalize">{movieType}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Infinite scroll trigger element - always active for continuous loading with better styling */}
              {filtered.length > 0 && (
                <div 
                  ref={observerTarget} 
                  className="w-full min-h-[150px] mt-10 mb-8 flex justify-center items-center p-5"
                >
                  {isLoadingMore ? (
                    <p className="text-lg text-white my-4 font-medium">
                      Loading more movies...
                    </p>
                  ) : (
                    <div className="h-12 w-full"></div>
                  )}
                </div>
              )}
            </>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default App;
