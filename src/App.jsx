import React, { useState, useEffect } from 'react';
import { Film, Users, User, Heart, X, Code, ArrowLeft } from 'lucide-react';
import MovieCard from './components/MovieCard';
import useMatchSession from './hooks/useMatchSession';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function App() {
  const [mode, setMode] = useState(null); // null, 'solo', 'couple'
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  
  // Couple mode states
  const [sessionCode, setSessionCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  const {
    createSession,
    joinSession,
    recordSwipe,
    matches,
    activeSession,
    leaveSession,
    showMatchModal,
    currentMatch,
    closeMatchModal
  } = useMatchSession();

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('movieWatchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // Fetch popular movies from TMDB
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${Math.floor(Math.random() * 10) + 1}`
      );
      const data = await response.json();
      setMovies(data.results);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mode && movies.length === 0) {
      fetchMovies();
    }
  }, [mode]);

  const handleSwipe = async (direction, movieId) => {
    if (direction === 'right') {
      const movie = movies[currentIndex];
      
      if (mode === 'solo') {
        // Add to local watchlist
        const newWatchlist = [...watchlist, movie];
        setWatchlist(newWatchlist);
        localStorage.setItem('movieWatchlist', JSON.stringify(newWatchlist));
      } else if (mode === 'couple' && activeSession) {
        // Record swipe in Firebase
        await recordSwipe(movieId, true);
      }
    } else if (mode === 'couple' && activeSession) {
      // Record pass in Firebase
      await recordSwipe(movieId, false);
    }

    // Move to next movie
    setTimeout(() => {
      if (currentIndex < movies.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Fetch more movies when we run out
        fetchMovies();
      }
    }, 300);
  };

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    const code = await createSession();
    if (code) {
      setSessionCode(code);
      setMode('couple');
    }
    setIsCreatingSession(false);
  };

  const handleJoinSession = async () => {
    const success = await joinSession(inputCode);
    if (success) {
      setMode('couple');
    } else {
      alert('Invalid session code. Please try again.');
    }
  };

  const handleLeaveSession = () => {
    leaveSession();
    setMode(null);
    setSessionCode('');
    setInputCode('');
    setCurrentIndex(0);
  };

  const removeFromWatchlist = (movieId) => {
    const newWatchlist = watchlist.filter(m => m.id !== movieId);
    setWatchlist(newWatchlist);
    localStorage.setItem('movieWatchlist', JSON.stringify(newWatchlist));
  };

  // Mode Selection Screen
  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Film className="w-12 h-12 text-white" />
              <h1 className="text-5xl font-bold text-white">MovieMatch</h1>
            </div>
            <p className="text-white/90 text-lg">Swipe. Match. Watch.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('solo')}
              className="w-full bg-white hover:bg-gray-50 text-purple-600 font-bold py-6 px-6 rounded-2xl shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <User className="w-6 h-6" />
              <div className="text-left">
                <div className="text-xl">Solo Mode</div>
                <div className="text-sm font-normal text-gray-600">Build your personal watchlist</div>
              </div>
            </button>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-pink-600" />
                <h2 className="text-xl font-bold text-gray-800">Couple Mode</h2>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                >
                  {isCreatingSession ? 'Creating...' : 'Create Session'}
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm text-gray-500">OR</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-pink-600 focus:outline-none text-center text-lg font-mono"
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={inputCode.length !== 6}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 rounded-xl transition-all disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Watchlist View (Solo Mode)
  if (showWatchlist && mode === 'solo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowWatchlist(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">My Watchlist ({watchlist.length})</h2>
            <div className="w-10"></div>
          </div>

          <div className="space-y-4">
            {watchlist.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No movies in your watchlist yet.</p>
                <p className="text-gray-500 text-sm mt-2">Start swiping to add movies!</p>
              </div>
            ) : (
              watchlist.map((movie) => (
                <div key={movie.id} className="bg-white rounded-xl overflow-hidden shadow-lg flex">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    className="w-24 h-36 object-cover"
                  />
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{movie.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-600">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(movie.id)}
                      className="text-red-500 text-sm hover:bg-red-50 px-3 py-1 rounded self-start"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Swipe Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLeaveSession}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">MovieMatch</h1>
            {mode === 'couple' && sessionCode && (
              <div className="flex items-center gap-2 justify-center mt-1">
                <Code className="w-4 h-4 text-white/80" />
                <span className="text-white/80 text-sm font-mono">{sessionCode}</span>
              </div>
            )}
          </div>

          {mode === 'solo' ? (
            <button
              onClick={() => setShowWatchlist(true)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all relative"
            >
              <Heart className="w-6 h-6" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {watchlist.length}
                </span>
              )}
            </button>
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        {mode === 'couple' && matches.length > 0 && (
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-white text-sm font-medium">
              🎉 {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
            </p>
          </div>
        )}
      </div>

      {/* Movie Cards */}
      <div className="max-w-md mx-auto relative h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Loading movies...</div>
          </div>
        ) : movies.length > 0 ? (
          <>
            {/* Stack effect - show next 2 cards behind current */}
            {movies.slice(currentIndex, currentIndex + 3).map((movie, index) => (
              <div
                key={movie.id}
                className="absolute inset-0 transition-all duration-300"
                style={{
                  zIndex: 3 - index,
                  transform: `scale(${1 - index * 0.05}) translateY(${index * -10}px)`,
                  opacity: index === 0 ? 1 : 0.5,
                  pointerEvents: index === 0 ? 'auto' : 'none'
                }}
              >
                {index === 0 && (
                  <MovieCard
                    movie={movie}
                    onSwipe={handleSwipe}
                  />
                )}
                {index > 0 && (
                  <div className="bg-white rounded-3xl shadow-2xl h-full overflow-hidden">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-2/3 object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">No more movies!</div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-md mx-auto mt-8 text-center">
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mb-2">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <span className="text-white text-sm">Swipe Left</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mb-2">
              <Heart className="w-8 h-8 text-green-400" />
            </div>
            <span className="text-white text-sm">Swipe Right</span>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {showMatchModal && currentMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-pink-600 mb-2">It's a Match!</h2>
            <p className="text-gray-600 mb-6">You both liked this movie!</p>
            
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <img
                src={`https://image.tmdb.org/t/p/w500${currentMatch.poster_path}`}
                alt={currentMatch.title}
                className="w-32 h-48 object-cover rounded-xl mx-auto mb-3 shadow-lg"
              />
              <h3 className="font-bold text-xl">{currentMatch.title}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-yellow-500">★</span>
                <span className="text-gray-600">{currentMatch.vote_average.toFixed(1)}</span>
              </div>
            </div>

            <button
              onClick={closeMatchModal}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              Keep Swiping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;