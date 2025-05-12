// /src/pages/CreateSessionPage.tsx
import React, { useState } from 'react'; // Removed useEffect, onAuthStateChanged, User
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase'; // auth is no longer needed here
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const CreateSessionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessionTitle, setSessionTitle] = useState('');
  const [adminName, setAdminName] = useState(''); // This will be the "identifier" for the admin
  const [adminPhone, setAdminPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // General form error

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionTitle.trim() || !adminName.trim() || !adminPhone.trim()) {
      const errMsg = t('error.fillAllFieldsPlusAdminName', 'Please fill in session title, your name as admin, and phone number.');
      setError(errMsg);
      toast({ title: t('error.title', 'Error'), description: errMsg, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);

    // Generate a simple "admin secret" or use the adminName directly.
    // For slightly better (but still weak) obscurity, you could combine adminName with something or hash it lightly.
    // For this example, we'll store adminName directly as the identifier.
    // A more robust (but still client-side) approach might involve generating a random token.
    const adminIdentifier = adminName.trim(); // Or a generated token

    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        title: sessionTitle.trim(),
        adminName: adminName.trim(), // Store the display name
        adminPhone: adminPhone.trim(),
        adminId: adminIdentifier,   // <<< THIS IS NOW THE NAME-BASED (or token-based) IDENTIFIER
                                    // It's NOT a Firebase Auth UID.
        createdAt: serverTimestamp(),
        status: 'open',
      });
      console.log('Session created with ID: ', docRef.id);

      // Store this identifier locally so the creator is "recognized" as admin for this session on their device.
      // THIS IS THE CORE OF THE INSECURITY.
      localStorage.setItem(`adminToken_${docRef.id}`, adminIdentifier);
      localStorage.setItem(`adminDisplayName_${docRef.id}`, adminName.trim());


      navigate(`/session/${docRef.id}`);
    } catch (err) {
      console.error('Error creating session:', err);
      const errMsg = t('error.createSessionFailed');
      setError(errMsg);
      toast({ title: t('error.title', 'Error'), description: errMsg, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">{t('createSessionTitle')}</h2>
      <form onSubmit={handleCreateSession} className="space-y-4">
        <div>
          <Label htmlFor="sessionTitle">{t('sessionTitleLabel')}</Label>
          <Input
            id="sessionTitle"
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder={t('sessionTitlePlaceholder')}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="adminName">{t('yourNameLabel', "Your Name (as Admin)")}</Label>
          <Input
            id="adminName"
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder={t('adminNamePlaceholder', "Enter your name")}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="adminPhone">{t('phoneNumberLabel')}</Label>
          <Input
            id="adminPhone"
            type="tel"
            value={adminPhone}
            onChange={(e) => setAdminPhone(e.target.value)}
            placeholder={t('phoneNumberPlaceholder')}
            required
            className="mt-1"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t('loading') : t('createSessionButton')}
        </Button>
      </form>
    </div>
  );
};

export default CreateSessionPage;