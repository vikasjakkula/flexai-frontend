import { useState, useEffect } from "react";
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

function Favorites() {
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const navigate = useNavigate();

  // Load favorite movies from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteMoviesData');
    if (savedFavorites) {
      try {
        const favoritesData = JSON.parse(savedFavorites);
        setFavoriteMovies(favoritesData);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Remove movie from favorites
  const removeFavorite = (movieId) => {
    const updated = favoriteMovies.filter(movie => 
      (movie.imdbID || movie.id) !== movieId
    );
    setFavoriteMovies(updated);
    localStorage.setItem('favoriteMoviesData', JSON.stringify(updated));
    
    // Also update the favorites IDs list
    const savedIds = localStorage.getItem('favoriteMovies');
    if (savedIds) {
      const ids = JSON.parse(savedIds);
      const updatedIds = ids.filter(id => id !== movieId);
      localStorage.setItem('favoriteMovies', JSON.stringify(updatedIds));
    }
  };

  return (
    // Main container - Full viewport with purple background
    <div className="min-h-screen w-full bg-violet text-white text-center p-0 m-0 flex flex-col items-center">
      {/* Header with title and back button */}
      <div className="w-full max-w-7xl px-4 pt-8 pb-4 flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="text-white text-lg font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
        >
          ← Back
        </button>
        {/* Header Title - Compact, neat, simple font using Montserrat */}
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight transition-colors duration-300 drop-shadow-lg font-montserrat">
          Favorite Movies
        </h1>
        {/* Spacer for alignment */}
        <div className="w-20"></div>
      </div>

      {/* Favorites Movies List */}
      {favoriteMovies.length === 0 ? (
        <p className="text-xl md:text-2xl text-white my-8 font-medium">
          No favorite movies yet. Add some from the main page!
        </p>
      ) : (
        <div className="flex gap-8 flex-wrap justify-center py-6 px-4 pb-12 w-full min-h-[100px] max-w-7xl">
          {favoriteMovies.map((movie, index) => {
            const movieTitle = movie.Title || "Unknown";
            const movieYear = movie.Year || "N/A";
            const movieImdbRating = movie.imdbRating || "N/A";
            const movieType = movie.Type || "N/A";
            const moviePoster = movie.Poster || null;
            const movieId = movie.imdbID || movie.id || `movie-${index}`;

            return (
              // Movie Card - White background, rounded corners, shadow
              <div
                key={movieId}
                className="bg-white rounded-2xl shadow-xl min-w-[280px] max-w-[320px] min-h-[420px] p-6 flex flex-col items-center mb-6 transition-all duration-300 relative border-none break-words w-[90vw] md:w-auto max-w-[95vw] md:max-w-[320px] hover:shadow-2xl hover:scale-105 hover:-translate-y-2"
              >
                {/* Remove from Favorites Button - Top right corner */}
                <button
                  onClick={() => removeFavorite(movieId)}
                  className="absolute top-4 right-4 z-10 cursor-pointer p-2 hover:scale-110 transition-transform"
                  aria-label="Remove from favorites"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="#7C3AED" 
                    stroke="#7C3AED" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="lucide lucide-heart"
                  >
                    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
                  </svg>
                </button>
                {/* Movie Poster or Placeholder */}
                {moviePoster && moviePoster !== "N/A" ? (
                  <img
                    src={moviePoster}
                    alt={movieTitle}
                    className="w-full h-96 object-cover rounded-xl mb-5 bg-violet-100 shadow-md"
                  />
                ) : (
                  <div className="w-full h-96 rounded-xl mb-5 bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center text-violet italic text-lg font-medium shadow-md">
                    No Image
                  </div>
                )}
                {/* Movie Title */}
                <h2 className="text-violet text-xl font-bold m-0 mb-5 text-center tracking-wide leading-tight px-2">
                  {movieTitle}
                </h2>
                {/* Movie Details */}
                <div className="w-full space-y-3 px-2">
                  <p className="text-gray-800 text-base text-center break-words font-medium">
                    <strong className="text-violet font-bold mr-2">Year:</strong> 
                    <span className="text-gray-700">{movieYear}</span>
                  </p>
                  <p className="text-gray-800 text-base text-center break-words font-medium">
                    <strong className="text-violet font-bold mr-2">IMDB Rating:</strong> 
                    <span className="text-gray-700 font-semibold">{movieImdbRating}</span>
                  </p>
                  <p className="text-gray-800 text-base text-center break-words font-medium">
                    <strong className="text-violet font-bold mr-2">Type:</strong> 
                    <span className="text-gray-700 capitalize">{movieType}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Favorites;

