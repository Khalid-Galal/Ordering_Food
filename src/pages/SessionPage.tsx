// src/pages/SessionPage.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc, // Needed for checking existing member before adding
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';

// --- TypeScript Interfaces ---
type SessionStatus = 'open' | 'locked' | 'finalized';

interface SessionData {
  id: string;
  title: string;
  adminName?: string;
  adminPhone: string;
  adminId: string; 
  status: SessionStatus;
  createdAt: Timestamp;
  invoiceImageUrl?: string;
  vatPercentage?: number;
  deliveryFee?: number;
}

interface Order {
  id: string;
  memberName: string;
  memberId: string; // Name-based or client-generated ID
  itemDescription: string;
  price: number | null;
  createdAt: Timestamp;
}

interface Member {
  id: string; // Firestore Document ID (e.g., slugified name)
  name: string;
  isPaid: boolean;
  joinedAt: Timestamp;
}

const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [localAdminToken, setLocalAdminToken] = useState<string | null>(null);
  const [localAdminDisplayName, setLocalAdminDisplayName] = useState<string | null>(null);
  const [currentMemberName, setCurrentMemberName] = useState<string>(
    location.state?.memberName || localStorage.getItem(`memberName_${sessionId}`) || ''
  );

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [itemDescription, setItemDescription] = useState('');
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingPricesAndFees, setIsSavingPricesAndFees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [inputVatPercentage, setInputVatPercentage] = useState<string>('');
  const [inputDeliveryFee, setInputDeliveryFee] = useState<string>('');

  const isCurrentUserAdmin = useMemo(() =>
    !!(sessionData && localAdminToken && sessionData.adminId === localAdminToken),
    [sessionData, localAdminToken]
  );

  useEffect(() => {
    if (sessionId) {
      const token = localStorage.getItem(`adminToken_${sessionId}`);
      const adminDName = localStorage.getItem(`adminDisplayName_${sessionId}`);
      setLocalAdminToken(token);
      if (token && adminDName) {
          setCurrentMemberName(adminDName);
          setLocalAdminDisplayName(adminDName);
      } else {
        const generalMemberName = localStorage.getItem(`memberName_${sessionId}`);
        if (generalMemberName && !location.state?.memberName) {
            setCurrentMemberName(generalMemberName);
        }
      }
    }
  }, [sessionId, location.state?.memberName]);

  useEffect(() => {
    if (!sessionId) {
      setIsLoadingPage(false);
      setError(t('error.invalidSessionId', 'Invalid session ID.'));
      return;
    }
    setIsLoadingPage(true);
    const sessionRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<SessionData, 'id'>;
        if (!data.adminId) {
          setError(t('error.sessionInvalidAdmin'));
          setSessionData(null);
          setIsLoadingPage(false);
          // navigate('/'); // Consider if navigation is appropriate here
          return;
        }
        setSessionData({ id: docSnap.id, ...data });
        setError(null);
      } else {
        setError(t('error.sessionNotFound'));
        setSessionData(null);
      }
      setIsLoadingPage(false);
    }, (err) => {
      console.error("Error fetching session:", err);
      setError(t('error.fetchSessionFailed'));
      setIsLoadingPage(false);
    });
    return () => unsubscribe();
  }, [sessionId, navigate, t]);

  useEffect(() => {
    if (sessionData && isCurrentUserAdmin) {
      setInputVatPercentage(sessionData.vatPercentage?.toString() || '0');
      setInputDeliveryFee(sessionData.deliveryFee?.toString() || '0');
    } else if (!isCurrentUserAdmin && sessionData) { // Reset if user is not admin but session data exists
      setInputVatPercentage((sessionData.vatPercentage || 0).toString()); // Show actual value if set
      setInputDeliveryFee((sessionData.deliveryFee || 0).toString());
    }
  }, [sessionData, isCurrentUserAdmin]);

  useEffect(() => {
    if (!sessionId || !sessionData || !currentMemberName.trim()) return;

    const membersQuery = query(collection(db, 'sessions', sessionId, 'members'), orderBy('joinedAt', 'asc'));
    const unsubscribe = onSnapshot(membersQuery, async (querySnapshot) => {
      const fetchedMembers: Member[] = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Member));
      setMembers(fetchedMembers);

      const memberNameSlug = currentMemberName.trim().toLowerCase().replace(/\s+/g, '-');
      const currentUserIsListed = fetchedMembers.some(m => m.id === memberNameSlug);

      if (!currentUserIsListed && sessionData.status === 'open') {
        try {
          const memberRef = doc(db, 'sessions', sessionId, 'members', memberNameSlug);
          const existingMember = await getDoc(memberRef);
          if (!existingMember.exists()) {
            await setDoc(memberRef, {
              name: currentMemberName.trim(),
              isPaid: false,
              joinedAt: serverTimestamp(),
            });
          }
        } catch (addMemberError) {
          console.error("Error adding member to session:", addMemberError);
          toast({ title: t('error.title'), description: t('error.addMemberFailed'), variant: "destructive" });
        }
      }
    }, (err) => {
      console.error("Error fetching members:", err);
    });
    return () => unsubscribe();
  }, [sessionId, currentMemberName, sessionData, t]);

  useEffect(() => {
    if (!sessionId) return;
    const ordersQuery = query(collection(db, 'sessions', sessionId, 'orders'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
      const fetchedOrders: Order[] = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Order));
      setOrders(fetchedOrders);
    }, (err) => {
      console.error("Error fetching orders:", err);
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleSetCurrentMemberName = useCallback(() => {
    const nameInput = document.getElementById('sessionPageMemberNameInput') as HTMLInputElement;
    if (nameInput?.value.trim()) {
      const newName = nameInput.value.trim();
      setCurrentMemberName(newName);
      if (sessionId) {
        localStorage.setItem(`memberName_${sessionId}`, newName);
      }
    } else {
      toast({ title: t('error.title'), description: t('error.nameCannotBeEmpty'), variant: "destructive"});
    }
  }, [sessionId, t]);
  
  const handleAddOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedItemDescription = itemDescription.trim();
    const trimmedMemberName = currentMemberName.trim();

    if (!sessionId || !trimmedItemDescription || !trimmedMemberName) {
      toast({ title: t('error.title'), description: t('error.nameAndItemRequired'), variant: "destructive" });
      return;
    }
    if (sessionData?.status !== 'open') {
      toast({ title: t('notice.title'), description: t('error.orderingClosed'), variant: "default" });
      return;
    }

    setIsSubmittingOrder(true);
    try {
      await addDoc(collection(db, 'sessions', sessionId, 'orders'), {
        memberName: trimmedMemberName,
        memberId: trimmedMemberName.toLowerCase().replace(/\s+/g, '-'),
        itemDescription: trimmedItemDescription,
        price: null,
        createdAt: serverTimestamp(),
      });
      setItemDescription('');
      toast({ title: t('success.title'), description: t('success.orderAdded') });
    } catch (err) {
      console.error('Error adding order:', err);
      toast({ title: t('error.title'), description: t('error.addOrderFailed'), variant: "destructive" });
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [sessionId, itemDescription, currentMemberName, sessionData?.status, t]);

  const handlePriceChange = useCallback((orderId: string, value: string) => {
    setEditingPrices(prev => ({ ...prev, [orderId]: value }));
  }, []);

  const handleSavePricesAndFees = useCallback(async () => {
    if (!sessionId || !isCurrentUserAdmin || !sessionData || sessionData.status === 'open' || sessionData.status === 'finalized') return;
    
    setIsSavingPricesAndFees(true);
    const batch = writeBatch(db);
    const sessionRef = doc(db, 'sessions', sessionId);
    let priceChangesMade = 0;
    let feeVatChangesMade = false;

    orders.forEach(order => {
      const newPriceStr = editingPrices[order.id];
      if (newPriceStr !== undefined) {
        const newPrice = parseFloat(newPriceStr);
        if (!isNaN(newPrice) && (newPrice !== order.price || order.price === null)) {
          batch.update(doc(db, 'sessions', sessionId, 'orders', order.id), { price: newPrice });
          priceChangesMade++;
        } else if (newPriceStr === '' && order.price !== null) {
          batch.update(doc(db, 'sessions', sessionId, 'orders', order.id), { price: null });
          priceChangesMade++;
        }
      }
    });

    const newVat = parseFloat(inputVatPercentage);
    const newDeliveryFee = parseFloat(inputDeliveryFee);
    const sessionUpdates: Partial<SessionData> = {};

    if (!isNaN(newVat) && newVat >= 0 && newVat !== (sessionData.vatPercentage || 0)) {
      sessionUpdates.vatPercentage = newVat;
      feeVatChangesMade = true;
    }
    if (!isNaN(newDeliveryFee) && newDeliveryFee >= 0 && newDeliveryFee !== (sessionData.deliveryFee || 0)) {
      sessionUpdates.deliveryFee = newDeliveryFee;
      feeVatChangesMade = true;
    }

    if (Object.keys(sessionUpdates).length > 0) {
      batch.update(sessionRef, sessionUpdates);
    }

    if (priceChangesMade > 0 || feeVatChangesMade) {
      try {
        await batch.commit();
        toast({ title: t('success.title'), description: t('pricesAndFeesSavedSuccess')});
        setEditingPrices({});
      } catch (error) {
        console.error("Error saving prices and fees: ", error);
        toast({ title: t('error.title'), description: t('error.savePricesAndFeesFailed'), variant: "destructive"});
      }
    } else {
      toast({ title: t('notice.title'), description: t('noChangesToSave')});
    }
    setIsSavingPricesAndFees(false);
  }, [sessionId, isCurrentUserAdmin, orders, editingPrices, sessionData, inputVatPercentage, inputDeliveryFee, t]);
  
  const handleToggleSessionStatus = useCallback(async (newStatus: 'open' | 'locked') => {
    if (!sessionId || !isCurrentUserAdmin || !sessionData || sessionData.status === 'finalized') return;
    
    setIsUpdatingStatus(true);
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { status: newStatus });
      toast({ title: t('success.title'), description: t('sessionStatusUpdated', { status: t(newStatus) })});
    } catch (error) {
      console.error("Error updating session status: ", error);
      toast({ title: t('error.title'), description: t('error.updateStatusFailed'), variant: "destructive"});
    } finally {
        setIsUpdatingStatus(false);
    }
  }, [sessionId, isCurrentUserAdmin, sessionData, t]);

  const handleFinalizeAndDeleteSession = useCallback(async () => {
    if (!sessionId || !isCurrentUserAdmin) return;
    setIsUpdatingStatus(true);
    try {
        await deleteDoc(doc(db, 'sessions', sessionId));
        localStorage.removeItem(`adminToken_${sessionId}`);
        localStorage.removeItem(`adminDisplayName_${sessionId}`);
        localStorage.removeItem(`memberName_${sessionId}`);
        toast({ title: t('success.title'), description: t('sessionFinalizedDeleted')});
        navigate('/');
    } catch (error) {
        console.error("Error finalizing session: ", error);
        toast({ title: t('error.title'), description: t('error.finalizeSessionFailed'), variant: "destructive"});
        setIsUpdatingStatus(false);
    }
  }, [sessionId, isCurrentUserAdmin, navigate, t]);

  const togglePaidStatus = useCallback(async (memberDocId: string, memberNameForCheck: string, currentPaidStatus: boolean) => {
    if (!sessionId || !sessionData || sessionData.status === 'finalized') return;

    const canUpdate = isCurrentUserAdmin || (currentMemberName === memberNameForCheck && !currentPaidStatus);
    if (!canUpdate) {
        toast({ title: t('error.title'), description: t('error.cannotUpdateOthersPayment'), variant: "destructive"});
        return;
    }
    if(currentMemberName === memberNameForCheck && !isCurrentUserAdmin && currentPaidStatus){
        toast({ title: t('notice.title'), description: t('error.cannotUnmarkOwnPayment'), variant: "default"});
        return;
    }

    try {
        const memberRef = doc(db, 'sessions', sessionId, 'members', memberDocId);
        await updateDoc(memberRef, { isPaid: !currentPaidStatus });
        toast({ title: t('success.title'), description: t('success.paymentStatusUpdated')});
    } catch (error) {
        console.error("Error updating payment status: ", error);
        toast({ title: t('error.title'), description: t('error.updatePaymentFailed'), variant: "destructive"});
    }
  }, [sessionId, currentMemberName, isCurrentUserAdmin, sessionData, t]);

  const handleDeleteOrder = useCallback(async (orderId: string, orderMemberName: string) => {
    if (!sessionId || !sessionData) return;

    const order = orders.find(o => o.id === orderId);
    const canDelete = isCurrentUserAdmin || 
                      (currentMemberName === orderMemberName && 
                       sessionData.status === 'open' && 
                       order?.price === null);
    if (!canDelete) {
      toast({ title: t('error.title'), description: t('error.cannotDeleteOrder'), variant: "destructive"});
      return;
    }

    if (window.confirm(t('confirmDeleteOrder'))) {
      try {
        await deleteDoc(doc(db, 'sessions', sessionId, 'orders', orderId));
        toast({ title: t('success.title'), description: t('success.orderDeleted') });
      } catch (e) {
        console.error("Error deleting order:", e);
        toast({ title: t('error.title'), description: t('error.deleteOrderFailed'), variant: "destructive"});
      }
    }
  }, [sessionId, currentMemberName, isCurrentUserAdmin, sessionData, orders, t]);

  const renderNameInputIfNeeded = () => {
    if (!currentMemberName && sessionData && sessionData.status !== 'finalized') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t('enterYourNameTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input
              id="sessionPageMemberNameInput"
              type="text"
              placeholder={t('yourNameLabel')}
              className="flex-grow"
            />
            <Button onClick={handleSetCurrentMemberName}>{t('setNameButton')}</Button>
          </CardContent>
          <CardFooter>
             <CardDescription>{t('nameNeededForOrder')}</CardDescription>
          </CardFooter>
        </Card>
      );
    }
    return null;
  };
  
  const distinctMemberNamesWithOrders = useMemo(() => {
    const names = new Set<string>();
    orders.forEach(order => {
      if (order.price !== null && order.price > 0) {
        names.add(order.memberName);
      }
    });
    return Array.from(names);
  }, [orders]);

  const deliveryFeePerMember = useMemo(() => {
    if (!sessionData?.deliveryFee || distinctMemberNamesWithOrders.length === 0) {
      return 0;
    }
    return sessionData.deliveryFee / distinctMemberNamesWithOrders.length;
  }, [sessionData?.deliveryFee, distinctMemberNamesWithOrders]);

  const memberTotals = useMemo(() => {
    const totals: Record<string, { subTotal: number; vatAmount: number; totalWithVat: number; finalTotal: number }> = {};
    const currentVatPercentage = sessionData?.vatPercentage || 0;

    distinctMemberNamesWithOrders.forEach(memberName => {
      const memberOrders = orders.filter(o => o.memberName === memberName && o.price !== null && o.price > 0);
      const subTotal = memberOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      const vatAmount = subTotal * (currentVatPercentage / 100);
      const totalWithVat = subTotal + vatAmount;
      const finalTotal = totalWithVat + deliveryFeePerMember;

      totals[memberName] = { subTotal, vatAmount, totalWithVat, finalTotal };
    });
    return totals;
  }, [orders, sessionData?.vatPercentage, deliveryFeePerMember, distinctMemberNamesWithOrders]);

  const overallTotalBill = useMemo(() => {
    let total = 0;
    Object.values(memberTotals).forEach(member => {
      total += member.finalTotal;
    });
    return total;
  }, [memberTotals]);

  if (isLoadingPage) {
    return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
  }

  if (error && !sessionData) {
    return (
        <div className="container mx-auto p-4">
            <Alert variant="destructive" className="m-4">
                <AlertTitle>{t('error.anErrorOccurred')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/')} className="mt-4">{t('goHome')}</Button>
        </div>
    );
  }
  
  if (!sessionData) {
      return <div className="flex justify-center items-center h-screen">{t('error.sessionNotFound')}</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="text-2xl">{sessionData.title}</CardTitle>
                <CardDescription>
                    {t('sessionIdLabel')}: {sessionId}
                </CardDescription>
                {sessionData.adminName && (
                    <CardDescription className="mt-1">{t('adminNameLabel')}: {sessionData.adminName}</CardDescription>
                )}
            </div>
            <Badge variant={sessionData.status === 'open' ? 'default' : sessionData.status === 'locked' ? 'secondary' : 'destructive'} className="self-start sm:self-center">
                {t(sessionData.status)}
            </Badge>
          </div>
           {sessionData.adminPhone && ( <CardDescription className="mt-1">{t('adminPhoneNumber')}: {sessionData.adminPhone}</CardDescription> )}
           {isCurrentUserAdmin && <Badge variant="outline" className="mt-2 inline-block">{t('adminRole')}</Badge>}
        </CardHeader>
      </Card>

      {renderNameInputIfNeeded()}

      {isCurrentUserAdmin && sessionData.status !== 'finalized' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('adminControlsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {sessionData.status === 'open' && <Button onClick={() => handleToggleSessionStatus('locked')} variant="outline" disabled={isUpdatingStatus}>{isUpdatingStatus && sessionData.status === 'open' ? t('loading') :t('lockOrderingButton')}</Button>}
            {sessionData.status === 'locked' && <Button onClick={() => handleToggleSessionStatus('open')} variant="outline" disabled={isUpdatingStatus}>{isUpdatingStatus && sessionData.status === 'locked' ? t('loading') : t('unlockOrderingButton')}</Button>}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isUpdatingStatus}>{isUpdatingStatus ? t('loading') : t('finalizeSessionButton')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription> {t('finalizeWarning')} </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalizeAndDeleteSession}>{t('continue')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {isCurrentUserAdmin && sessionData.status === 'locked' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{t('checkoutFeesTitle')}</span>
              <Badge variant="secondary" className="text-xs">{t('adminOnlyBadge')}</Badge>
            </CardTitle>
            <CardDescription>{t('feesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
          <Label htmlFor="vatPercentageInput" className="flex items-center gap-2">
            {t('vatPercentageLabel', 'VAT Percentage')}
            <Badge variant="outline" className="font-normal">%</Badge>
          </Label>
          <div className="relative">
            <Input
              id="vatPercentageInput"
              type="number"
              min="0"
              step="0.01"
              value={inputVatPercentage}
              onChange={(e) => setInputVatPercentage(e.target.value)}
              placeholder="e.g., 15"
              className="pl-2 pr-8"
              disabled={isSavingPricesAndFees}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
              </div>

              <div className="space-y-2">
          <Label htmlFor="deliveryFeeInput" className="flex items-center gap-2">
            {t('deliveryFeeLabel', 'Delivery Fee')}
            <Badge variant="outline" className="font-normal">Total</Badge>
          </Label>
          <div className="relative">
            <Input
              id="deliveryFeeInput"
              type="number"
              min="0"
              step="0.01"
              value={inputDeliveryFee}
              onChange={(e) => setInputDeliveryFee(e.target.value)}
              placeholder="e.g., 25.50"
              className="pl-2 pr-8"
              disabled={isSavingPricesAndFees}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 mt-4">
            <Button
              onClick={handleSavePricesAndFees}
              disabled={isSavingPricesAndFees}
              className="min-w-[120px]"
            >
              {isSavingPricesAndFees ? (
          <span className="inline-flex items-center gap-2">
            {t('saving')}...
          </span>
              ) : (
          t('saveFees', 'Save Fees')
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {sessionData.status === 'open' && currentMemberName && (
        <Card>
          <CardHeader>
            <CardTitle>{t('addItemPrompt')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddOrder} className="space-y-3">
              <div>
                <Label htmlFor="itemDescription" className="sr-only">{t('itemDescriptionLabel')}</Label>
                <Textarea
                  id="itemDescription"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder={t('itemPlaceholder')}
                  required
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isSubmittingOrder} className="w-full">
                {isSubmittingOrder ? t('loading') : t('addItemButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {sessionData.status === 'locked' && !isCurrentUserAdmin && (
         <Alert>
            <AlertTitle>{t('orderingLockedTitle')}</AlertTitle>
            <AlertDescription>{t('sessionLockedMessage')}</AlertDescription>
         </Alert>
      )}
      {sessionData.status === 'finalized' && (
         <Alert variant="destructive">
            <AlertTitle>{t('sessionFinalizedTitle')}</AlertTitle>
            <AlertDescription>{t('sessionFinalizedMessage')}</AlertDescription>
         </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('liveOrderBoardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noOrdersYet')}</p>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('itemLabel')}</TableHead>
                    <TableHead>{t('orderedByLabel')}</TableHead>
                    {(isCurrentUserAdmin || (sessionData.status !== 'open' && orders.some(o => o.price !== null))) &&
                        <TableHead className="text-right">{t('priceLabel')}</TableHead>
                    }
                    <TableHead className="text-right">{t('actionLabel')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium break-all">{order.itemDescription}</TableCell>
                        <TableCell className="whitespace-nowrap">{order.memberName}</TableCell>
                        {(isCurrentUserAdmin || (sessionData.status !== 'open' && orders.some(o => o.price !== null))) &&
                            <TableCell className="text-right whitespace-nowrap">
                            {isCurrentUserAdmin && sessionData.status === 'locked' ? (
                                <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder={t('enterPricePlaceholder')}
                                    defaultValue={editingPrices[order.id] ?? (order.price !== null ? order.price.toFixed(2) : '')}
                                    onChange={(e) => handlePriceChange(order.id, e.target.value)}
                                    className="w-24 h-8 text-right ml-auto"
                                    disabled={isSavingPricesAndFees}
                                />
                            ) : order.price !== null ? (
                                order.price?.toFixed(2)
                            ) : (
                                t('pendingPrice')
                            )}
                            </TableCell>
                        }
                        <TableCell className="text-right">
                        {(isCurrentUserAdmin || (currentMemberName === order.memberName && sessionData.status === 'open' && order.price === null)) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteOrder(order.id, order.memberName)}
                                disabled={sessionData.status === 'finalized'}
                                className="text-red-500 hover:text-red-700"
                            >
                            {t('deleteButton')}
                            </Button>
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
          {isCurrentUserAdmin && sessionData.status === 'locked' && orders.length > 0 && (
            <div className="flex justify-end mt-4">
                <Button onClick={handleSavePricesAndFees} disabled={isSavingPricesAndFees}>
                    {isSavingPricesAndFees ? t('loading') : t('savePricesAndFeesButton')}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {sessionData.status !== 'open' && members.length > 0 && (
        <Card>
            <CardHeader>
              <CardTitle>{t('invoiceSummaryTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('memberNameLabel')}</TableHead>
                                <TableHead className="text-right">{t('subTotalLabel')}</TableHead>
                                <TableHead className="text-right">{t('vatAmountLabel')}</TableHead>
                                <TableHead className="text-right">{t('deliveryShareLabel')}</TableHead>
                                <TableHead className="text-right font-semibold">{t('memberTotalLabel')}</TableHead>
                                <TableHead>{t('statusLabel')}</TableHead>
                                <TableHead className="text-right">{t('actionLabel')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => {
                                const totals = memberTotals[member.name];
                                return (
                                    <TableRow key={member.id}>
                                      <TableCell className="whitespace-nowrap">{member.name}</TableCell>
                                      <TableCell className="text-right">
                                        {totals ? totals.subTotal.toFixed(2) : '-'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {totals ? totals.vatAmount.toFixed(2) : '-'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {deliveryFeePerMember > 0 ? deliveryFeePerMember.toFixed(2) : '-'}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {totals ? totals.finalTotal.toFixed(2) : '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={member.isPaid ? 'default' : 'outline'}>
                                          {member.isPaid ? t('paidStatus') : t('unpaidStatus')}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(isCurrentUserAdmin || (currentMemberName === member.name && !member.isPaid)) && (
                                          <Button 
                                            variant="link" 
                                            size="sm"
                                            onClick={() => togglePaidStatus(member.id, member.name, member.isPaid)}
                                            disabled={sessionData.status === 'finalized'}
                                          >
                                            {member.isPaid ? 
                                              (isCurrentUserAdmin ? t('markAsUnpaidButton') : t('paidStatus')) : 
                                              t('markAsPaidButton')}
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row font-semibold justify-between items-center mt-4 gap-2">
                <div className="text-sm text-muted-foreground">
                    {sessionData.vatPercentage > 0 && (
                      <span className="mr-4">{t('vatAppliedLabel')}: {sessionData.vatPercentage}%</span>
                    )}
                    {sessionData.deliveryFee > 0 && (
                      <span>{t('totalDeliveryFeeLabel')}: {sessionData.deliveryFee.toFixed(2)}</span>
                    )}
                </div>
                <div className="text-lg">
                    {t('grandTotalLabel')}: {overallTotalBill.toFixed(2)}
                </div>
            </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SessionPage;