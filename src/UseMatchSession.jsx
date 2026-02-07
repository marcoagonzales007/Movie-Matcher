import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const generateSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const useMatchSession = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [userId] = useState(() => `user_${Math.random().toString(36).substring(2, 11)}`);
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);

  // Listen for matches in the active session
  useEffect(() => {
    if (!activeSession) return;

    const sessionRef = doc(db, 'sessions', activeSession);
    
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Update matches list
        if (data.matches) {
          setMatches(data.matches);
        }

        // Check for new matches since last check
        const newMatches = data.matches || [];
        if (newMatches.length > matches.length) {
          // There's a new match!
          const latestMatch = newMatches[newMatches.length - 1];
          setCurrentMatch(latestMatch);
          setShowMatchModal(true);
        }
      }
    });

    return () => unsubscribe();
  }, [activeSession, matches.length]);

  const createSession = async () => {
    const sessionCode = generateSessionCode();
    
    try {
      const sessionRef = doc(db, 'sessions', sessionCode);
      
      await setDoc(sessionRef, {
        code: sessionCode,
        createdAt: serverTimestamp(),
        createdBy: userId,
        users: [userId],
        swipes: {},
        matches: [],
        active: true
      });

      setActiveSession(sessionCode);
      return sessionCode;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const joinSession = async (sessionCode) => {
    try {
      const sessionRef = doc(db, 'sessions', sessionCode.toUpperCase());
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return false;
      }

      const sessionData = sessionSnap.data();

      // Check if session already has 2 users
      if (sessionData.users && sessionData.users.length >= 2) {
        alert('This session is full!');
        return false;
      }

      // Add user to session
      await updateDoc(sessionRef, {
        users: arrayUnion(userId)
      });

      setActiveSession(sessionCode.toUpperCase());
      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      return false;
    }
  };

  const recordSwipe = async (movieId, liked) => {
    if (!activeSession) return;

    try {
      const sessionRef = doc(db, 'sessions', activeSession);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) return;

      const sessionData = sessionSnap.data();
      const swipes = sessionData.swipes || {};

      // Initialize movie swipes if not exists
      if (!swipes[movieId]) {
        swipes[movieId] = {};
      }

      // Record this user's swipe
      swipes[movieId][userId] = liked;

      // Check if both users have swiped on this movie
      const userIds = Object.keys(swipes[movieId]);
      
      if (userIds.length === 2 && liked) {
        // Both users have swiped, check if both liked it
        const bothLiked = Object.values(swipes[movieId]).every(vote => vote === true);

        if (bothLiked) {
          // IT'S A MATCH!
          // Fetch movie details from TMDB
          const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`
          );
          const movieData = await response.json();

          // Add to matches array
          await updateDoc(sessionRef, {
            swipes: swipes,
            matches: arrayUnion({
              movieId,
              title: movieData.title,
              poster_path: movieData.poster_path,
              vote_average: movieData.vote_average,
              matchedAt: new Date().toISOString()
            })
          });
        } else {
          // Not a match, just update swipes
          await updateDoc(sessionRef, {
            swipes: swipes
          });
        }
      } else {
        // Only one user has swiped so far
        await updateDoc(sessionRef, {
          swipes: swipes
        });
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  const leaveSession = async () => {
    if (activeSession) {
      try {
        // Optionally clean up the session
        // For now, just leave it active for the other user
        setActiveSession(null);
        setMatches([]);
      } catch (error) {
        console.error('Error leaving session:', error);
      }
    }
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setCurrentMatch(null);
  };

  return {
    userId,
    createSession,
    joinSession,
    recordSwipe,
    leaveSession,
    activeSession,
    matches,
    showMatchModal,
    currentMatch,
    closeMatchModal
  };
};

export default useMatchSession;