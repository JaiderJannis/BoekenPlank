import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import { 
    BookOpen, Plus, Library, Flame, Settings, Share2, 
    CheckCircle2, X, Trash2, Edit3, Camera, Search, Book, 
    BarChart, AlertCircle, Check, Info, LogOut, Users, Shield, ArrowLeftRight,
    Menu, History
} from 'https://esm.sh/lucide-react@0.292.0';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCVlFFp4QiianYl27RSGKjkA0HDzUyu1Q4",
    authDomain: "boekenplank-5a410.firebaseapp.com",
    projectId: "boekenplank-5a410",
    storageBucket: "boekenplank-5a410.firebasestorage.app",
    messagingSenderId: "608659427714",
    appId: "1:608659427714:web:7f002b18277117489c3f9b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'boeken-app-pro';
const initToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

// Datum Hulpfuncties
const isYesterday = (d) => { if (!d) return false; const date = new Date(d); const y = new Date(); y.setDate(y.getDate() - 1); return date.toDateString() === y.toDateString(); };
const isToday = (d) => { if (!d) return false; return new Date(d).toDateString() === new Date().toDateString(); };

// Changelog Data
const CHANGELOG = [
    { version: "3.0.0", date: "Oktober 2026", changes: ["Mobielvriendelijk (Responsive) met inklapbaar menu toegevoegd", "Schappen (categorieën) kunnen nu achteraf bewerkt worden", "Versiegeschiedenis paneel toegevoegd", "Copyright by Jaider toegevoegd in menu"] },
    { version: "2.1.0", date: "September 2026", changes: ["Wissel-account (impersonation) toegevoegd voor beheerders", "Nieuw Pro-design met Tailwind CSS", "Camera barcode scanner voor ISBN geïntegreerd"] },
    { version: "1.0.0", date: "Augustus 2026", changes: ["Lancering app", "Boeken toevoegen via OpenLibrary database", "Leesvoortgang meten met streaks"] }
];

function BoekenApp() {
    // Authenticatie & Profiel State
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [allUsers, setAllUsers] = useState([]);
    const [dbError, setDbError] = useState(false);

    // Impersonation State & Mobile Menu
    const [impersonatedUser, setImpersonatedUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const activeUserId = impersonatedUser ? impersonatedUser.uid : (user ? user.uid : null);

    // App Data State
    const [books, setBooks] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [stats, setStats] = useState({ currentStreak: 0, lastReadDate: null });

    // UI State
    const [activeTab, setActiveTab] = useState('schappen');
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null); 
    const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, text: '', action: null });

    // Form States
    const initialBookState = { title: '', author: '', shelfId: '', cover: '', isbn: '', totalPages: '', pagesRead: 0 };
    const [newBook, setNewBook] = useState(initialBookState);
    const [newShelf, setNewShelf] = useState({ name: '', description: '' });
    
    // Edit Shelf State
    const [editShelfData, setEditShelfData] = useState({ isOpen: false, id: '', name: '', description: '' });

    const scannerRef = useRef(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const fallbackTimer = setTimeout(() => {
                    setLoading(false);
                    setDbError(true);
                }, 4000);

                const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    clearTimeout(fallbackTimer);
                    setDbError(false);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                        setShowLogin(false);
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                }, (err) => { 
                    clearTimeout(fallbackTimer);
                    console.error("Firestore Error:", err); 
                    setDbError(true);
                    setLoading(false); 
                });
            } else {
                setUserData(null); setImpersonatedUser(null); setShowLogin(true); setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!activeUserId) return;
        const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'users', activeUserId, 'books'), s => setBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        const unsubShelves = onSnapshot(collection(db, 'artifacts', appId, 'users', activeUserId, 'shelves'), s => setShelves(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', activeUserId, 'profile', 'stats'), d => { 
            if(d.exists()) setStats(d.data()); else setStats({ currentStreak: 0, lastReadDate: null });
        }, console.error);
        return () => { unsubBooks(); unsubShelves(); unsubStats(); };
    }, [activeUserId]);

    useEffect(() => {
        if (userData && userData.role === 'admin') {
            const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), s => setAllUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))), console.error);
            return () => unsubUsers();
        } else {
            setAllUsers([]); if(impersonatedUser) setImpersonatedUser(null);
        }
    }, [userData]);

    useEffect(() => {
        if (isScannerOpen && window.Html5QrcodeScanner) {
            setTimeout(() => {
                const scanner = new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 }, false);
                scannerRef.current = scanner;
                scanner.render((text) => {
                    setNewBook(p => ({ ...p, isbn: text })); setIsScannerOpen(false); scanner.clear(); fetchBookData(text);
                }, () => {});
            }, 100);
        }
        return () => { if (scannerRef.current) scannerRef.current.clear().catch(console.error); };
    }, [isScannerOpen]);

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        try { 
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider); 
        } catch (err) { 
            console.error("Login fout:", err); 
            setLoading(false); 
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        if (!user || !profileForm.name || !profileForm.email) return;
        let isAdmin = false;
        try { const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'users')); if (usersSnap.empty) isAdmin = true; } catch (e) { console.error(e); }
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userRef, { name: profileForm.name, email: profileForm.email, role: isAdmin ? 'admin' : 'user', createdAt: new Date().toISOString() });
    };

    const handleLogout = async () => { await signOut(auth); setActiveTab('schappen'); };

    const requestConfirm = (text, action) => setConfirmDialog({ isOpen: true, text, action });
    const executeConfirm = () => { if (confirmDialog.action) confirmDialog.action(); setConfirmDialog({ isOpen: false, text: '', action: null }); };

    const fetchBookData = async (isbnToFetch) => {
        const queryIsbn = isbnToFetch || newBook.isbn;
        if (!queryIsbn) return;
        setIsFetchingIsbn(true); setErrorMsg('');
        try {
            const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${queryIsbn}&format=json&jscmd=data`);
            const data = await res.json();
            const info = data[`ISBN:${queryIsbn}`];
            if (info) {
                setNewBook(p => ({ ...p, title: info.title || p.title, author: info.authors?.[0]?.name || p.author, cover: info.cover?.large || info.cover?.medium || p.cover, totalPages: info.number_of_pages || p.totalPages }));
            } else setErrorMsg('Niet gevonden in database. Vul handmatig in.');
        } catch (e) { setErrorMsg('Fout bij ophalen van gegevens.'); } 
        finally { setIsFetchingIsbn(false); }
    };

    const handleAddShelf = async (e) => {
        e.preventDefault(); if (!activeUserId || !newShelf.name) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'shelves'), { ...newShelf, createdAt: new Date().toISOString() });
        setNewShelf({ name: '', description: '' }); setIsShelfModalOpen(false);
    };

    const handleUpdateShelf = async (e) => {
        e.preventDefault(); if(!activeUserId || !editShelfData.id) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', editShelfData.id), {
            name: editShelfData.name,
            description: editShelfData.description
        });
        setEditShelfData({ isOpen: false, id: '', name: '', description: '' });
    };

    const handleAddBook = async (e) => {
        e.preventDefault(); if (!activeUserId || !newBook.title || !newBook.shelfId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'books'), { ...newBook, author: newBook.author || 'Onbekend', totalPages: parseInt(newBook.totalPages) || 0, pagesRead: parseInt(newBook.pagesRead) || 0, addedAt: new Date().toISOString() });
        setNewBook(initialBookState); setIsBookModalOpen(false);
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault(); if (!activeUserId || !selectedBook) return;
        const bookRef = doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id);
        const newPages = parseInt(selectedBook.pagesRead) || 0;
        await updateDoc(bookRef, { pagesRead: newPages });
        const orig = books.find(b => b.id === selectedBook.id);
        if (newPages > (orig?.pagesRead || 0)) await handleLogReading(true);
        setSelectedBook(null);
    };

    const handleDeleteBook = async () => {
        if (!activeUserId || !selectedBook) return;
        requestConfirm(`Weet je zeker dat je "${selectedBook.title}" wilt verwijderen?`, async () => {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id)); setSelectedBook(null);
        });
    };

    const handleDeleteShelf = async (shelfId, shelfName) => {
         if (!activeUserId) return;
         const shelfBooks = books.filter(b => b.shelfId === shelfId);
         if(shelfBooks.length > 0) {
             requestConfirm(`Let op: Er zitten nog ${shelfBooks.length} boeken in "${shelfName}". Verwijder of verplaats deze eerst!`, () => {}); return;
         }
         requestConfirm(`Schap "${shelfName}" definitief verwijderen?`, async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', shelfId)); });
    };

    const handleLogReading = async (silent = false) => {
        if (!activeUserId) return;
        const today = new Date().toISOString();
        let streak = stats.currentStreak || 0;
        if (isToday(stats.lastReadDate)) { if(!silent) return; }
        else if (isYesterday(stats.lastReadDate)) streak += 1; else streak = 1;
        await setDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'profile', 'stats'), { currentStreak: streak, lastReadDate: today }, { merge: true });
    };

    const toggleAdminRole = async (targetUid, currentRole) => {
        if(!userData || userData.role !== 'admin') return;
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        requestConfirm(`Wil je de rol wijzigen naar ${newRole}?`, async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUid), { role: newRole }); });
    };

    const switchTab = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

    if (loading) return <div className="flex h-screen items-center justify-center bg-stone-100"><div className="animate-spin text-amber-600"><BookOpen size={48} /></div></div>;

    if (dbError) {
        return (
            <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-2 border-red-500">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="text-red-500" size={40}/></div>
                    <h2 className="text-2xl font-black text-stone-800 mb-4">Database niet gevonden!</h2>
                    <p className="text-stone-600 font-medium mb-6">Het inloggen is succesvol, maar de app kan niet starten omdat de <b>Firestore Database</b> nog niet is geactiveerd in jouw Firebase project.</p>
                    <div className="text-left bg-stone-50 p-4 rounded-xl text-sm font-medium text-stone-700 space-y-2">
                        <p>1. Ga naar de <b>Firebase Console</b>.</p>
                        <p>2. Klik links in het menu op <b>Firestore Database</b>.</p>
                        <p>3. Klik op de knop <b>Create database</b>.</p>
                        <p>4. <b>Belangrijk:</b> Kies "Start in testmodus" (Start in Test mode) en sla op.</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="mt-8 w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-800 transition-colors shadow-lg">Ik heb dit gedaan, laad de app</button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><Library className="text-white" size={40} /></div>
                    <h1 className="text-3xl font-black text-stone-800 mb-2">Boeken<span className="text-amber-500">Plank</span> Pro</h1>
                    <p className="text-stone-500 font-medium mb-10">Beheer je bibliotheek in de cloud.</p>
                    <button onClick={handleLogin} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Inloggen met Google
                    </button>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-black text-stone-800 mb-2">Welkom! 🎉</h2>
                    <p className="text-stone-500 mb-8 font-medium">Laten we je profiel afmaken om je bibliotheek te starten.</p>
                    <form onSubmit={handleCreateProfile}>
                        <div className="mb-4"><label className="block text-sm font-bold text-stone-700 mb-1">Je Naam</label><input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none font-medium" placeholder="Bijv. Jan de Lezer" /></div>
                        <div className="mb-8"><label className="block text-sm font-bold text-stone-700 mb-1">E-mailadres</label><input type="email" required value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none font-medium" placeholder="jan@voorbeeld.nl" /></div>
                        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/30 transition-all">Start met Lezen!</button>
                    </form>
                </div>
            </div>
        );
    }

    const hasReadToday = isToday(stats.lastReadDate);

    return (
        <div className="flex flex-col bg-stone-100 h-full overflow-hidden relative">
            
            {/* Top Banners (Mobile Top Bar + Impersonation) - Nu gescheiden van de flex-row! */}
            <div className="w-full flex flex-col z-30 flex-shrink-0">
                {impersonatedUser && (
                    <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center shadow-md animate-pulse">
                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                            <ArrowLeftRight size={16} /> <span className="hidden sm:inline">LET OP: Je beheert nu het account van</span> {impersonatedUser.name}
                        </div>
                        <button onClick={() => setImpersonatedUser(null)} className="bg-black/30 hover:bg-black/50 px-3 py-1 rounded-lg text-xs font-bold transition-colors">Terug</button>
                    </div>
                )}
                
                {/* Mobile Top Bar */}
                <div className="md:hidden bg-stone-900 text-white p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2 font-bold text-xl"><Library size={24} className="text-amber-500" /> Boeken<span className="text-amber-500">Plank</span></div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-stone-800 rounded-lg transition"><Menu size={28} /></button>
                </div>
            </div>

            {/* Hoofd Layout: Zijbalk + Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}

                {/* Sidebar Menu */}
                <nav className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 text-stone-100 flex flex-col shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 pb-2 border-b border-stone-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl shadow-lg"><Library className="text-white" size={28} /></div>
                                <h1 className="text-2xl font-bold tracking-wide leading-none">Boeken<span className="text-amber-500">Plank</span></h1>
                            </div>
                            <button className="md:hidden text-stone-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                        </div>

                        <div className="flex items-center gap-3 mb-6 bg-stone-800/50 p-3 rounded-2xl border border-stone-700">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-stone-600 to-stone-500 flex items-center justify-center font-bold text-lg border-2 border-stone-700">{userData.name.charAt(0).toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate text-white">{userData.name}</p>
                                <p className="text-xs text-stone-400 truncate">{userData.role === 'admin' ? 'Beheerder' : 'Gebruiker'}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-white bg-stone-800 rounded-xl transition-colors" title="Uitloggen"><LogOut size={16}/></button>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                        <div className="bg-stone-800 rounded-2xl p-5 mb-8 border border-stone-700 shadow-inner relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-10"><Flame size={100} /></div>
                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <span className="text-sm text-stone-400 font-medium">Lees Streak</span>
                                <Flame className={`${hasReadToday ? 'text-orange-500 animate-pulse' : 'text-stone-500'}`} size={20} />
                            </div>
                            <div className="text-4xl font-black mb-4 relative z-10 text-white">{stats.currentStreak} <span className="text-base font-normal text-stone-400">dagen</span></div>
                            <button onClick={() => handleLogReading(false)} disabled={hasReadToday} className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all relative z-10 ${hasReadToday ? 'bg-stone-700/50 text-stone-400 cursor-not-allowed border border-stone-700' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20'}`}>
                                {hasReadToday ? <><CheckCircle2 size={18}/> Vandaag Gelezen!</> : 'Ik heb gelezen!'}
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2">Bibliotheek</p>
                            <button onClick={() => switchTab('schappen')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'schappen' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><Library size={20} /> Schappen</button>
                            <button onClick={() => switchTab('alle')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'alle' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><BookOpen size={20} /> Alle Boeken</button>
                            
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2 mt-4">Beheer</p>
                            <button onClick={() => switchTab('beheer')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'beheer' ? 'bg-stone-800 text-white border border-stone-700' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><Settings size={20} /> Schappen Beheren</button>
                            <button onClick={() => switchTab('changelog')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'changelog' ? 'bg-stone-800 text-white border border-stone-700' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><History size={20} /> Versiegeschiedenis</button>
                            
                            {userData.role === 'admin' && (
                                <button onClick={() => switchTab('admin')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><Shield size={20} /> Systeem Admin</button>
                            )}
                        </div>

                        {/* Copyright Vermelding */}
                        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
                            <p className="text-xs font-bold text-stone-600 tracking-wider">© Copyright by Jaider</p>
                        </div>
                    </div>
                </nav>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto bg-stone-100 p-4 md:p-10 pb-24 relative z-0">
                    <div className="max-w-7xl mx-auto">
                        
                        {(activeTab === 'schappen' || activeTab === 'alle') && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10 gap-4">
                                <h2 className="text-3xl sm:text-4xl font-black text-stone-800 tracking-tight">
                                    {activeTab === 'schappen' ? 'Mijn Schappen' : 'Bibliotheek'}
                                </h2>
                                <button onClick={() => setIsBookModalOpen(true)} className="flex w-full sm:w-auto justify-center items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-stone-900/20">
                                    <Plus size={20} /> Boek Toevoegen
                                </button>
                            </div>
                        )}

                        {activeTab === 'schappen' && (
                            <div className="space-y-8 sm:space-y-12">
                                {shelves.length === 0 ? (
                                    <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border-2 border-stone-200 border-dashed shadow-sm px-4">
                                        <div className="bg-stone-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Library className="text-stone-400" size={32} /></div>
                                        <h3 className="text-2xl font-bold text-stone-800 mb-2">Je hebt nog geen schappen</h3>
                                        <p className="text-stone-500 mb-8 max-w-md mx-auto">Ga naar Beheer om je eerste schap (bijv. Fantasy, Studie) aan te maken.</p>
                                        <button onClick={() => switchTab('beheer')} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold">Ga naar Beheer</button>
                                    </div>
                                ) : (
                                    shelves.map(shelf => {
                                        const shelfBooks = books.filter(b => b.shelfId === shelf.id);
                                        return (
                                            <div key={shelf.id} className="bg-white rounded-3xl p-5 sm:p-8 shadow-md border border-stone-200/60 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                                                <div className="mb-6 sm:mb-8 border-b border-stone-100 pb-4">
                                                    <h3 className="text-2xl sm:text-3xl font-black text-stone-800 flex items-center gap-3 tracking-tight">{shelf.name} <span className="text-sm font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{shelfBooks.length}</span></h3>
                                                    {shelf.description && <p className="text-stone-500 mt-2 font-medium">{shelf.description}</p>}
                                                </div>
                                                {shelfBooks.length === 0 ? <div className="bg-stone-50 rounded-2xl border border-stone-200 border-dashed p-6 sm:p-8 text-center"><p className="text-stone-500 font-medium">Dit schap is nog leeg.</p></div> : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"><BookList books={shelfBooks} onSelect={setSelectedBook} /></div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'alle' && (
                            <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-md border border-stone-200/60">
                                {books.length === 0 ? <div className="text-center py-16 sm:py-20"><BookOpen className="mx-auto text-stone-300 mb-4" size={48} /><h3 className="text-xl font-bold text-stone-700 mb-2">Je bibliotheek is leeg</h3></div> : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"><BookList books={books} onSelect={setSelectedBook} /></div>
                                )}
                            </div>
                        )}

                        {activeTab === 'beheer' && (
                            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                    <h2 className="text-3xl sm:text-4xl font-black text-stone-800 tracking-tight">Beheer Schappen</h2>
                                    <button onClick={() => setIsShelfModalOpen(true)} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20">
                                        <Plus size={20} /> Nieuw Schap
                                    </button>
                                </div>

                                <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-md border border-stone-200/60">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Library size={20} className="text-amber-500"/> Jouw Schappen</h3>
                                    {shelves.length === 0 ? <p className="text-stone-500 italic">Geen schappen gevonden.</p> : (
                                        <div className="space-y-4">
                                            {shelves.map(shelf => (
                                                <div key={shelf.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-stone-50 rounded-2xl border border-stone-200 gap-4">
                                                    <div>
                                                        <p className="font-bold text-lg">{shelf.name}</p>
                                                        <p className="text-sm text-stone-500">{books.filter(b=>b.shelfId === shelf.id).length} boeken</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                        <button onClick={() => setEditShelfData({ isOpen: true, id: shelf.id, name: shelf.name, description: shelf.description || '' })} className="flex-1 sm:flex-none flex justify-center items-center gap-1 bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-800 px-3 py-2 rounded-xl transition-colors text-sm font-bold shadow-sm">
                                                            <Edit3 size={16}/> Bewerk
                                                        </button>
                                                        <button onClick={() => handleDeleteShelf(shelf.id, shelf.name)} className="flex-none text-red-500 hover:bg-red-50 p-2 border border-transparent hover:border-red-200 rounded-xl transition-colors" title="Verwijder schap">
                                                            <Trash2 size={20}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'changelog' && (
                            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                                <h2 className="text-3xl sm:text-4xl font-black text-stone-800 tracking-tight flex items-center gap-3">
                                    <History className="text-amber-500" size={36}/> Versiegeschiedenis
                                </h2>
                                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-md border border-stone-200/60">
                                    <div className="space-y-8">
                                        {CHANGELOG.map((log, index) => (
                                            <div key={index} className="relative pl-6 border-l-2 border-stone-200">
                                                <div className="absolute w-4 h-4 bg-amber-500 rounded-full -left-[9px] top-1 border-2 border-white shadow-sm"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-3">
                                                    <h3 className="text-xl font-bold text-stone-800">Versie {log.version}</h3>
                                                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full self-start sm:self-auto">{log.date}</span>
                                                </div>
                                                <ul className="list-disc list-outside ml-4 text-stone-600 space-y-2 font-medium">
                                                    {log.changes.map((change, cIdx) => (
                                                        <li key={cIdx}>{change}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'admin' && userData.role === 'admin' && (
                            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
                                <h2 className="text-3xl sm:text-4xl font-black text-stone-800 tracking-tight flex items-center gap-3">
                                    <Shield className="text-red-500" size={36}/> Systeem Beheer
                                </h2>
                                <p className="text-stone-600 font-medium">Beheer alle gebruikers en neem tijdelijk accounts over om te helpen met support.</p>

                                <div className="bg-white rounded-3xl shadow-md border border-stone-200/60 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left whitespace-nowrap">
                                            <thead className="bg-stone-100 text-stone-600 text-sm">
                                                <tr>
                                                    <th className="p-4 font-bold">Naam</th>
                                                    <th className="p-4 font-bold">Email</th>
                                                    <th className="p-4 font-bold">Rol</th>
                                                    <th className="p-4 font-bold text-right">Acties</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {allUsers.map(u => (
                                                    <tr key={u.uid} className="hover:bg-stone-50 transition-colors">
                                                        <td className="p-4 font-bold text-stone-800">
                                                            {u.name} {u.uid === user.uid && <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Jij</span>}
                                                        </td>
                                                        <td className="p-4 text-stone-600 text-sm">{u.email}</td>
                                                        <td className="p-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-700'}`}>
                                                                {u.role === 'admin' ? 'Admin' : 'Gebruiker'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 flex justify-end gap-2">
                                                            {u.uid !== user.uid && (
                                                                <>
                                                                    <button onClick={() => { setImpersonatedUser(u); switchTab('schappen'); }} className="text-sm flex items-center gap-1 bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors font-medium shadow-sm">
                                                                        <ArrowLeftRight size={14}/> Beheer
                                                                    </button>
                                                                    <button onClick={() => toggleAdminRole(u.uid, u.role)} className="text-sm flex items-center gap-1 bg-white border border-stone-300 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors font-medium">
                                                                        <Shield size={14}/> {u.role === 'admin' ? 'Maak User' : 'Maak Admin'}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center transform transition-all scale-100 mx-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="text-red-500" size={32}/></div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">Weet je het zeker?</h3>
                        <p className="text-stone-500 font-medium mb-6">{confirmDialog.text}</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => setConfirmDialog({ isOpen: false, text: '', action: null })} className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors">Annuleren</button>
                            <button onClick={executeConfirm} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Bevestigen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Shelf Modal */}
            {editShelfData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-stone-100 bg-stone-50"><h3 className="text-2xl font-black">Schap Bewerken</h3></div>
                        <form onSubmit={handleUpdateShelf} className="p-6 md:p-8">
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-stone-700 mb-2">Naam van het schap</label>
                                <input type="text" required value={editShelfData.name} onChange={e => setEditShelfData({...editShelfData, name: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-4 focus:border-amber-500 outline-none font-bold text-lg bg-stone-50 focus:bg-white transition-colors" />
                            </div>
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-stone-700 mb-2">Beschrijving (optioneel)</label>
                                <textarea value={editShelfData.description} onChange={e => setEditShelfData({...editShelfData, description: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none font-medium resize-none h-24 bg-stone-50 focus:bg-white transition-colors" />
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button type="button" onClick={() => setEditShelfData({ isOpen: false, id: '', name: '', description: '' })} className="w-full sm:w-auto px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-stone-900 text-white font-bold hover:bg-stone-800 rounded-xl shadow-lg shadow-stone-900/20">Opslaan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View/Edit Book Modal */}
            {selectedBook && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh]">
                        <div className="md:w-5/12 bg-stone-100 relative h-48 md:h-auto border-r border-stone-200 flex-shrink-0">
                            {selectedBook.cover ? (
                                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 p-6 text-center"><Book size={64} /></div>
                            )}
                            <button onClick={() => setSelectedBook(null)} className="md:hidden absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 md:p-8 md:w-7/12 flex flex-col bg-white overflow-y-auto">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight mb-1 sm:mb-2">{selectedBook.title}</h3>
                                    <p className="text-base sm:text-lg text-stone-500 font-medium">{selectedBook.author}</p>
                                </div>
                                <button onClick={() => setSelectedBook(null)} className="hidden md:block text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            {selectedBook.isbn && <p className="text-xs text-stone-400 mb-6 flex items-center gap-1 font-mono bg-stone-50 inline-block px-2 py-1 rounded-md"><Info size={14}/> ISBN: {selectedBook.isbn}</p>}

                            <form onSubmit={handleUpdateProgress} className="mt-auto bg-stone-50 p-5 rounded-2xl border border-stone-200">
                                <label className="block text-sm font-bold text-stone-700 mb-3 uppercase tracking-wider">Leesvoortgang updaten</label>
                                <div className="flex items-center gap-4 mb-4">
                                    <input type="number" min="0" max={selectedBook.totalPages || 9999} required value={selectedBook.pagesRead} onChange={e => setSelectedBook({...selectedBook, pagesRead: e.target.value})} className="w-24 sm:w-28 text-xl sm:text-2xl font-black border-2 border-stone-300 rounded-xl px-3 py-2 sm:py-3 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-center bg-white" />
                                    <span className="text-stone-500 font-bold text-base sm:text-lg">van {selectedBook.totalPages || '?'} pag.</span>
                                </div>
                                
                                <div className="w-full bg-stone-200 rounded-full h-3 sm:h-4 mb-6 overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 ease-out" style={{ width: `${selectedBook.totalPages ? Math.min(100, (selectedBook.pagesRead / selectedBook.totalPages) * 100) : 0}%` }}></div>
                                </div>

                                <div className="flex justify-between items-center gap-3 pt-4 border-t border-stone-200">
                                    <button type="button" onClick={handleDeleteBook} className="text-red-500 hover:bg-red-100 p-3 rounded-xl transition-colors flex items-center justify-center" title="Verwijder boek"><Trash2 size={24} /></button>
                                    <button type="submit" className="flex-1 bg-stone-900 text-white font-black text-lg py-3 px-4 rounded-xl hover:bg-stone-800 transition-colors shadow-lg">Opslaan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Book Modal */}
            {isBookModalOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[90] backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-4 sm:my-8">
                        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-stone-100 bg-stone-50">
                            <h3 className="text-xl sm:text-2xl font-black text-stone-800">Boek Toevoegen</h3>
                            <button onClick={() => setIsBookModalOpen(false)} className="text-stone-400 hover:text-stone-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
                        </div>

                        <div className="p-5 sm:p-8">
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                                <label className="block text-sm font-bold text-amber-900 mb-3 flex items-center gap-2"><Search size={16}/> Snel toevoegen via ISBN</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input type="text" placeholder="Typ ISBN..." value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} className="flex-1 border border-amber-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none font-medium bg-white" />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => fetchBookData()} disabled={isFetchingIsbn} className="flex-1 sm:flex-none bg-amber-200 hover:bg-amber-300 text-amber-900 px-5 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
                                            {isFetchingIsbn ? <div className="w-5 h-5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div> : "Zoek"}
                                        </button>
                                        <button type="button" onClick={() => setIsScannerOpen(true)} className="flex-1 sm:flex-none bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md font-bold">
                                            <Camera size={18} /> Scan
                                        </button>
                                    </div>
                                </div>
                                {errorMsg && <p className="text-red-600 font-medium text-sm mt-3 flex items-center gap-1 bg-red-100 p-2 rounded-lg"><AlertCircle size={16}/> {errorMsg}</p>}
                            </div>

                            <form onSubmit={handleAddBook} className="space-y-4 sm:space-y-5">
                                {shelves.length === 0 && <div className="bg-red-50 text-red-700 p-4 rounded-xl font-bold border border-red-200 text-sm">Maak eerst een schap aan via het Beheer menu!</div>}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Titel *</label>
                                        <input type="text" required disabled={shelves.length === 0} value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors font-medium bg-stone-50 focus:bg-white" placeholder="De Hobbit" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Auteur</label>
                                        <input type="text" disabled={shelves.length === 0} value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors font-medium bg-stone-50 focus:bg-white" placeholder="J.R.R. Tolkien" />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Totaal Pagina's</label>
                                        <input type="number" disabled={shelves.length === 0} value={newBook.totalPages} onChange={e => setNewBook({...newBook, totalPages: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors font-medium bg-stone-50 focus:bg-white" placeholder="300" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Al Gelezen</label>
                                        <input type="number" disabled={shelves.length === 0} value={newBook.pagesRead} onChange={e => setNewBook({...newBook, pagesRead: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors font-medium bg-stone-50 focus:bg-white" placeholder="0" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Plaats in Schap *</label>
                                        <select required disabled={shelves.length === 0} value={newBook.shelfId} onChange={e => setNewBook({...newBook, shelfId: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors font-bold bg-white text-stone-800">
                                            <option value="" disabled>Kies een schap...</option>
                                            {shelves.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-stone-100">
                                    <button type="button" onClick={() => setIsBookModalOpen(false)} className="w-full sm:w-auto px-6 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors">Annuleren</button>
                                    <button type="submit" disabled={shelves.length === 0} className="w-full sm:w-auto px-8 py-3 bg-amber-500 text-white font-bold hover:bg-amber-600 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20 text-lg">Opslaan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Shelf Modal */}
            {isShelfModalOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-stone-100 bg-stone-50"><h3 className="text-2xl font-black">Nieuw Schap</h3></div>
                        <form onSubmit={handleAddShelf} className="p-6 md:p-8">
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-stone-700 mb-2">Naam van het schap</label>
                                <input type="text" required value={newShelf.name} onChange={e => setNewShelf({...newShelf, name: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-4 focus:border-amber-500 outline-none font-bold text-lg bg-stone-50 focus:bg-white transition-colors" placeholder="Bijv. Fantasy" />
                            </div>
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-stone-700 mb-2">Beschrijving (optioneel)</label>
                                <textarea value={newShelf.description} onChange={e => setNewShelf({...newShelf, description: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-amber-500 outline-none font-medium resize-none h-24 bg-stone-50 focus:bg-white transition-colors" placeholder="Waar is dit schap voor bedoeld?" />
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button type="button" onClick={() => setIsShelfModalOpen(false)} className="w-full sm:w-auto px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors">Annuleren</button>
                                <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-stone-900 text-white font-bold hover:bg-stone-800 rounded-xl shadow-lg shadow-stone-900/20 transition-colors">Aanmaken</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Camera Scanner Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4 z-[100] backdrop-blur-md">
                    <div className="w-full max-w-md bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
                        <div className="p-5 text-white flex justify-between items-center border-b border-stone-800">
                            <h3 className="font-bold flex items-center gap-2"><Camera size={20}/> Scan Barcode (ISBN)</h3>
                            <button onClick={() => setIsScannerOpen(false)} className="hover:bg-stone-800 p-2 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div id="reader" className="w-full bg-black min-h-[300px]"></div>
                        <div className="p-5 text-center text-sm font-bold text-stone-400 bg-stone-900">
                            Houd de barcode op de achterkant van het boek goed verlicht in beeld.
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function BookList({ books, onSelect }) {
    return (
        <React.Fragment>
            {books.map(book => {
                const progress = book.totalPages > 0 ? Math.min(100, Math.round((book.pagesRead / book.totalPages) * 100)) : 0;
                const isFinished = progress === 100 && book.totalPages > 0;
                
                return (
                    <div key={book.id} className="group relative flex flex-col cursor-pointer transition-all hover:-translate-y-2" onClick={() => onSelect(book)}>
                        <div className="aspect-[2/3] bg-stone-200 rounded-2xl overflow-hidden shadow-md mb-2 sm:mb-3 relative group-hover:shadow-xl transition-all duration-300 border border-stone-200/50">
                            {book.cover && !book.cover.includes('placeholder') ? (
                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 p-3 sm:p-4 text-center">
                                    <Book className="text-stone-300 mb-2 sm:mb-3" size={36} />
                                    <span className="font-serif font-bold text-stone-500 text-xs sm:text-sm leading-tight px-1 sm:px-2 line-clamp-3">{book.title}</span>
                                </div>
                            )}
                            
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/90 to-transparent p-2 sm:p-3 pt-8 sm:pt-12 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-[10px] sm:text-xs text-white font-bold text-center tracking-wider uppercase">
                                    {book.pagesRead} / {book.totalPages || '?'} pag.
                                </p>
                            </div>

                            {isFinished && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 sm:p-1.5 rounded-full shadow-lg border-2 border-white"><Check size={14} strokeWidth={4} /></div>
                            )}
                        </div>
                        
                        <div className="w-full bg-stone-200/80 rounded-full h-1.5 sm:h-2 mb-1.5 sm:mb-2 overflow-hidden shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isFinished ? 'bg-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${progress}%` }}></div>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-stone-800 leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors" title={book.title}>{book.title}</h4>
                        <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 sm:mt-1 truncate font-medium">{book.author}</p>
                    </div>
                );
            })}
        </React.Fragment>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<BoekenApp />);
