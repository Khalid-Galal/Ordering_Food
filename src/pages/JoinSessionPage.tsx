import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged, User } from 'firebase/auth'; 


const JoinSessionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [yourName, setYourName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (user.displayName && !yourName) { 
            setYourName(user.displayName);
        }
      } else {
        setCurrentUser(null);
        setError(t('error.mustBeLoggedInToJoin', 'You must be logged in to join a session.'));
      }
    });
    return () => unsubscribe();
  }, [navigate, t, yourName]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError(t('error.mustBeLoggedInToJoin', 'You must be logged in to join a session.'));
      return;
    }
    if (!sessionId.trim() || !yourName.trim()) {
      setError(t('error.fillAllFields'));
      return;
    }
    setIsLoading(true);
    setError(null);

    const trimmedSessionId = sessionId.trim();

    try {
      const sessionRef = doc(db, 'sessions', trimmedSessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        setError(t('error.sessionNotFound', 'Session not found. Please check the ID.'));
        setIsLoading(false);
        return;
      }
      if (sessionSnap.data().status !== 'open') {
        setError(t('error.sessionNotOpen', 'This session is not currently open for joining.'));
        setIsLoading(false);
        return;
      }

      const memberRef = doc(db, 'sessions', trimmedSessionId, 'members', currentUser.uid);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists()) {
        await setDoc(memberRef, {
          uid: currentUser.uid,
          name: yourName.trim(),
          isPaid: false,
          joinedAt: serverTimestamp(),
        });
      } else if (memberSnap.data()?.name !== yourName.trim()) {
        await updateDoc(memberRef, { name: yourName.trim() });
      }
      
      navigate(`/session/${trimmedSessionId}`, { state: { memberName: yourName.trim() } });

    } catch (err) {
      console.error('Error joining session:', err);
      setError(t('error.joinSessionFailed', 'Failed to join session. Please try again.'));
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">{t('joinSessionTitle')}</h2>
      {!currentUser && error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleJoinSession} className="space-y-4">
        <div>
          <Label htmlFor="sessionId">{t('enterSessionCodeLabel')}</Label>
          <Input
            id="sessionId"
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder={t('sessionCodePlaceholder', 'Enter session ID')}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="yourName">{t('yourNameLabel')}</Label>
          <Input
            id="yourName"
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            placeholder={t('yourNamePlaceholder', 'Enter your name for the order')}
            required
            className="mt-1"
          />
        </div>
        {error && currentUser && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={isLoading || !currentUser} className="w-full">
          {isLoading ? t('loading') : t('joinButton')}
        </Button>
      </form>
    </div>
  );
};

export default JoinSessionPage;