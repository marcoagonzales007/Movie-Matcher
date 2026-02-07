import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';

const MovieCard = ({ movie, onSwipe }) => {
  const [exitX, setExitX] = useState(0);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Color overlays based on swipe direction
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100;
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      // Determine swipe direction
      const direction = info.offset.x > 0 ? 'right' : 'left';
      
      // Set exit animation direction
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      
      // Notify parent component
      onSwipe(direction, movie.id);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        opacity
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl h-full overflow-hidden relative">
        {/* LIKE overlay */}
        <motion.div
          className="absolute inset-0 bg-green-500/20 backdrop-blur-sm z-10 flex items-center justify-center"
          style={{ opacity: likeOpacity }}
        >
          <div className="border-8 border-green-500 text-green-500 text-6xl font-bold px-8 py-4 rounded-2xl rotate-[-25deg]">
            LIKE
          </div>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          className="absolute inset-0 bg-red-500/20 backdrop-blur-sm z-10 flex items-center justify-center"
          style={{ opacity: nopeOpacity }}
        >
          <div className="border-8 border-red-500 text-red-500 text-6xl font-bold px-8 py-4 rounded-2xl rotate-[25deg]">
            NOPE
          </div>
        </motion.div>

        {/* Movie poster */}
        <div className="h-2/3 relative overflow-hidden">
          <img
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://via.placeholder.com/500x750?text=No+Image'
            }
            alt={movie.title}
            className="w-full h-full object-cover"
            draggable="false"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Movie details */}
        <div className="h-1/3 p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-2">
            {movie.title}
          </h2>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-700">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>

            {movie.release_date && (
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm line-clamp-3">
            {movie.overview || 'No description available.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
