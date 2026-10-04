import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import { 
    BookOpen, Plus, Library, Flame, Settings, Share2, 
    CheckCircle2, X, Trash2, Edit3, Camera, Search, Book, 
    BarChart, AlertCircle, Check, Info, LogOut, Users, Shield, ArrowLeftRight,
    Menu, History, Calendar, ChevronLeft, ChevronRight, CalendarDays, UserX, Save,
    ArrowUp, ArrowDown, Star, BookmarkPlus, GripVertical, Move, Loader2,
    Quote, FileText, Send, UserCheck, UserMinus, Clock, ChevronDown, ChevronUp, Tag
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

// Datum Hulpfuncties
const isYesterday = (d) => { if (!d) return false; const date = new Date(d); const y = new Date(); y.setDate(y.getDate() - 1); return date.toDateString() === y.toDateString(); };
const isToday = (d) => { if (!d) return false; return new Date(d).toDateString() === new Date().toDateString(); };
const getTodayString = () => new Date().toISOString().split('T')[0]; 
const toDateString = (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Uitgebreid palet aan kleuren voor schappen
const SHELF_COLORS = [
    // Rood & Oranje
    'bg-red-400', 'bg-red-500', 'bg-red-600',
    'bg-orange-400', 'bg-orange-500', 'bg-orange-600',
    // Geel & Amber
    'bg-amber-400', 'bg-amber-500', 'bg-amber-600',
    'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600',
    // Groen
    'bg-lime-400', 'bg-lime-500', 'bg-lime-600',
    'bg-green-400', 'bg-green-500', 'bg-green-600',
    'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600',
    // Cyaan & Teal
    'bg-teal-400', 'bg-teal-500', 'bg-teal-600',
    'bg-cyan-400', 'bg-cyan-500', 'bg-cyan-600',
    // Blauw
    'bg-sky-400', 'bg-sky-500', 'bg-sky-600',
    'bg-blue-400', 'bg-blue-500', 'bg-blue-600',
    // Paars & Roze
    'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600',
    'bg-violet-400', 'bg-violet-500', 'bg-violet-600',
    'bg-purple-400', 'bg-purple-500', 'bg-purple-600',
    'bg-fuchsia-400', 'bg-fuchsia-500', 'bg-fuchsia-600',
    'bg-pink-400', 'bg-pink-500', 'bg-pink-600',
    'bg-rose-400', 'bg-rose-500', 'bg-rose-600',
    // Neutraal / Grijstinten
    'bg-slate-500', 'bg-slate-800',
    'bg-zinc-500', 'bg-zinc-800',
    'bg-stone-500', 'bg-stone-800'
];

// Changelog Data
const CHANGELOG = [
    { version: "12.1.0", date: "Oktober 2026", changes: ["Gigantische uitbreiding van kleurenpalet voor schappen (50+ tinten!)", "Kleur-kiezer pop-up scrolbaar gemaakt voor smartphones"] },
    { version: "12.0.0", date: "Oktober 2026", changes: ["NIEUW: Inklapbare schappen (klik op de titel!)", "NIEUW: Schappen een eigen kleur geven", "NIEUW: Tags & Genres toevoegen aan boeken", "NIEUW: 'Mooie Quote-kaart' generator voor screenshots", "Lees-streak gigantisch gemaakt op computerschermen", "Spatie-bug gefixt in mobiel menu"] },
    { version: "11.4.0", date: "Oktober 2026", changes: ["Bugfix: Uitvinken van de lees-streak verwijdert nu ook direct netjes de vlammetjes van vandaag uit de kalender"] },
    { version: "11.3.0", date: "Oktober 2026", changes: ["NIEUW: Je kunt je lees-streak voor vandaag nu 'Uitvinken' (ongedaan maken) als je een foutje hebt gemaakt", "Uitgelezen boeken blijven nu 100% zichtbaar in Alle Boeken en Schappen (met vinkje)"] },
    { version: "11.0.0", date: "Oktober 2026", changes: ["NIEUW: Notities & Quotes per boek toevoegen", "NIEUW: Uitleenbeheer! Houd bij aan wie je een boek hebt uitgeleend", "Boek-details menu omgebouwd met tabbladen"] },
];

function BoekenApp() {
    // Authenticatie & Profiel State
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
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
    const [readingLogs, setReadingLogs] = useState([]); 
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState('schappen');
    const [collapsedShelves, setCollapsedShelves] = useState([]); // Nieuw: Inklapbare schappen
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    // Modal & Book States
    const [selectedBook, setSelectedBook] = useState(null); 
    const [bookModalTab, setBookModalTab] = useState('overzicht'); // 'overzicht', 'notities', 'uitleen'
    const [isEditingBook, setIsEditingBook] = useState(false);
    const [editBookData, setEditBookData] = useState(null);
    const [newNote, setNewNote] = useState({ text: '', type: 'quote' });
    const [lendData, setLendData] = useState({ name: '', date: getTodayString() });
    const [quoteCard, setQuoteCard] = useState(null); // Nieuw: Voor de screenshot generator

    const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [apiLimitError, setApiLimitError] = useState(false); 
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, text: '', action: null });
    const [isDragMode, setIsDragMode] = useState(false);

    // States voor Kalender & Streak Navigatie
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [calendarLogData, setCalendarLogData] = useState({ isOpen: false, dateStr: '', bookId: '' });
    const [shareShelfData, setShareShelfData] = useState({ isOpen: false, shelfId: '', shelfName: '', email: '', loading: false, msg: '' });
    const [streakWeekOffset, setStreakWeekOffset] = useState(0);

    // Autocomplete State
    const [titleSuggestions, setTitleSuggestions] = useState([]);
    const [isSearchingTitle, setIsSearchingTitle] = useState(false);

    // Form States
    const initialBookState = { title: '', author: '', shelfId: '', cover: '', isbn: '', totalPages: '', pagesRead: 0, tags: '' };
    const [newBook, setNewBook] = useState(initialBookState);
    const [newShelf, setNewShelf] = useState({ name: '', description: '', color: 'bg-amber-500' });
    const [editShelfData, setEditShelfData] = useState({ isOpen: false, id: '', name: '', description: '', color: 'bg-amber-500' });
    
    // Refs
    const scannerRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const fallbackTimer = setTimeout(() => { setLoading(false); setDbError(true); }, 4000);
                const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    clearTimeout(fallbackTimer);
                    setDbError(false);
                    if (docSnap.exists()) { setUserData(docSnap.data()); } 
                    else { setUserData(null); }
                    setLoading(false);
                }, (err) => { clearTimeout(fallbackTimer); setDbError(true); setLoading(false); });
            } else {
                setUserData(null); setImpersonatedUser(null); setLoading(false);
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
        const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', activeUserId, 'readingLog'), s => setReadingLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        
        return () => { unsubBooks(); unsubShelves(); unsubStats(); unsubLogs(); };
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
                    setNewBook(p => ({ ...p, isbn: text })); 
                    setIsScannerOpen(false); 
                    scanner.clear(); 
                    fetchBookData(text); 
                }, () => {});
            }, 100);
        }
        return () => { if (scannerRef.current) scannerRef.current.clear().catch(console.error); };
    }, [isScannerOpen]);

    const handleLogin = async (e) => {
        e.preventDefault(); setLoading(true);
        try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); } 
        catch (err) { console.error("Login fout:", err); setLoading(false); }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault(); if (!user || !profileForm.name || !profileForm.email) return;
        let isAdmin = false;
        try { const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'users')); if (usersSnap.empty) isAdmin = true; } catch (e) {}
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userRef, { name: profileForm.name, email: profileForm.email, role: isAdmin ? 'admin' : 'user', createdAt: new Date().toISOString() });
    };

    const handleLogout = async () => { await signOut(auth); setActiveTab('schappen'); };
    const requestConfirm = (text, action) => setConfirmDialog({ isOpen: true, text, action });
    const executeConfirm = () => { if (confirmDialog.action) confirmDialog.action(); setConfirmDialog({ isOpen: false, text: '', action: null }); };

    // API Fetches met verbeterde 429 Error Handling
    const fetchBookData = async (isbnToFetch) => {
        const queryIsbn = isbnToFetch || newBook.isbn;
        if (!queryIsbn) return;
        setIsFetchingIsbn(true); setErrorMsg(''); setApiLimitError(false);
        let foundBook = null;
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${queryIsbn}`);
            if (res.status === 429) { setApiLimitError(true); }
            else if(res.ok) {
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    const info = data.items[0].volumeInfo;
                    foundBook = { title: info.title, author: info.authors?.[0], cover: info.imageLinks?.thumbnail?.replace('http:', 'https:'), totalPages: info.pageCount };
                }
            }
        } catch (e) { console.warn('Google Books ISBN fetch error:', e); }
        if (!foundBook && !apiLimitError) {
            try {
                const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${queryIsbn}&format=json&jscmd=data`);
                if(res.ok) {
                    const data = await res.json();
                    const info = data[`ISBN:${queryIsbn}`];
                    if (info) foundBook = { title: info.title, author: info.authors?.[0]?.name, cover: info.cover?.large || info.cover?.medium, totalPages: info.number_of_pages };
                }
            } catch (e) { console.warn('OpenLibrary ISBN fetch error:', e); }
        }
        if (foundBook) setNewBook(p => ({ ...p, title: foundBook.title || p.title, author: foundBook.author || p.author, cover: foundBook.cover || p.cover, totalPages: foundBook.totalPages || p.totalPages }));
        else if (apiLimitError) setErrorMsg('Te veel opdrachten! API tijdelijk geblokkeerd. Typ hieronder handmatig de titel en gebruik de Google-knoppen.');
        else setErrorMsg('Geen boek gevonden op dit ISBN.');
        
        setIsFetchingIsbn(false);
    };

    const handleTitleChange = (e) => {
        const q = e.target.value;
        setNewBook({...newBook, title: q});
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if(q.length < 3) { setTitleSuggestions([]); setIsSearchingTitle(false); setApiLimitError(false); return; }
        
        setIsSearchingTitle(true);
        setApiLimitError(false);
        
        searchTimeoutRef.current = setTimeout(async () => {
            let combinedResults = [];
            let hitLimit = false;

            try {
                const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`);
                if (res.status === 429) {
                    hitLimit = true;
                    setApiLimitError(true);
                } else if(res.ok) {
                    const data = await res.json();
                    if (data.items) {
                        const gbResults = data.items.map(item => ({ id: item.id, title: item.volumeInfo.title, author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : null, totalPages: item.volumeInfo.pageCount, cover: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') }));
                        combinedResults = [...combinedResults, ...gbResults];
                    }
                }
            } catch(err) {}
            
            try {
                const res = await fetch(`https://search.openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=4`);
                if(res.ok) {
                    const data = await res.json();
                    if (data.docs) {
                        const olResults = data.docs.map(doc => ({ id: doc.key, title: doc.title, author: doc.author_name ? doc.author_name[0] : null, totalPages: doc.number_of_pages_median, cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null }));
                        combinedResults = [...combinedResults, ...olResults];
                    }
                }
            } catch(err) {}
            
            const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.title?.toLowerCase(), item])).values());
            setTitleSuggestions(uniqueResults.slice(0, 6));
            setIsSearchingTitle(false);
        }, 1500); 
    };

    const selectTitleSuggestion = (item) => {
        setNewBook(p => ({ ...p, title: item.title || p.title, author: item.author || p.author, totalPages: item.totalPages || p.totalPages, cover: item.cover || p.cover }));
        setTitleSuggestions([]);
    };

    // Schappen Inklappen
    const toggleShelf = (shelfId) => {
        setCollapsedShelves(prev => prev.includes(shelfId) ? prev.filter(id => id !== shelfId) : [...prev, shelfId]);
    };

    // Schappen & Boeken CRUD
    const handleAddShelf = async (e) => {
        e.preventDefault(); if (!activeUserId || !newShelf.name) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'shelves'), { ...newShelf, color: newShelf.color || 'bg-amber-500', order: shelves.length, createdAt: new Date().toISOString() });
        setNewShelf({ name: '', description: '', color: 'bg-amber-500' }); setIsShelfModalOpen(false);
    };

    const handleUpdateShelf = async (e) => {
        e.preventDefault(); if(!activeUserId || !editShelfData.id) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', editShelfData.id), { name: editShelfData.name, description: editShelfData.description, color: editShelfData.color });
        setEditShelfData({ isOpen: false, id: '', name: '', description: '', color: 'bg-amber-500' });
    };

    const handleAddBook = async (e) => {
        e.preventDefault(); if (!activeUserId || !newBook.title || !newBook.shelfId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'books'), { 
            ...newBook, 
            author: newBook.author || 'Onbekend', 
            totalPages: parseInt(newBook.totalPages) || 0, 
            pagesRead: parseInt(newBook.pagesRead) || 0, 
            tags: newBook.tags || '',
            rating: 0, 
            review: '', 
            notes: [],
            lentTo: null,
            lentDate: null,
            addedAt: new Date().toISOString() 
        });
        setNewBook(initialBookState); setIsBookModalOpen(false); setTitleSuggestions([]);
    };

    const handleUpdateBookDetails = async (e) => {
        e.preventDefault(); if (!activeUserId || !editBookData.id) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', editBookData.id), { title: editBookData.title, author: editBookData.author, cover: editBookData.cover, tags: editBookData.tags || '', totalPages: parseInt(editBookData.totalPages) || 0, shelfId: editBookData.shelfId });
        setSelectedBook(p => ({...p, ...editBookData})); setIsEditingBook(false);
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault(); if (!activeUserId || !selectedBook) return;
        const bookRef = doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id);
        const newPages = parseInt(selectedBook.pagesRead) || 0;
        await updateDoc(bookRef, { pagesRead: newPages });
        
        const orig = books.find(b => b.id === selectedBook.id);
        if (newPages > (orig?.pagesRead || 0)) {
            const todayStr = getTodayString();
            await setDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'readingLog', `${todayStr}_${selectedBook.id}`), { date: todayStr, bookId: selectedBook.id, title: selectedBook.title, cover: selectedBook.cover || null }, { merge: true });
            
            // Streak automatisch updaten (silent = true)
            await handleLogReading(true);
        }
        
        setSelectedBook(p => ({...p, pagesRead: newPages}));
    };
    
    const handleUpdateReview = async () => {
        if (!activeUserId || !selectedBook) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id), { rating: selectedBook.rating || 0, review: selectedBook.review || '' });
        alert("Beoordeling opgeslagen!");
    };

    // Notities & Quotes
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!activeUserId || !selectedBook || !newNote.text) return;
        const updatedNotes = [...(selectedBook.notes || []), { ...newNote, date: new Date().toISOString(), id: Date.now().toString() }];
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id), { notes: updatedNotes });
        setSelectedBook({...selectedBook, notes: updatedNotes});
        setNewNote({ text: '', type: 'quote' });
    };

    const handleDeleteNote = async (noteId) => {
        if (!activeUserId || !selectedBook) return;
        requestConfirm("Weet je zeker dat je deze notitie wilt verwijderen?", async () => {
            const updatedNotes = (selectedBook.notes || []).filter(n => n.id !== noteId);
            await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id), { notes: updatedNotes });
            setSelectedBook({...selectedBook, notes: updatedNotes});
        });
    };

    // Uitleenbeheer
    const handleLendBook = async (e) => {
        e.preventDefault();
        if (!activeUserId || !selectedBook || !lendData.name) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id), { lentTo: lendData.name, lentDate: lendData.date });
        setSelectedBook({...selectedBook, lentTo: lendData.name, lentDate: lendData.date});
        setLendData({ name: '', date: getTodayString() });
    };

    const handleReturnBook = async () => {
        if (!activeUserId || !selectedBook) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', selectedBook.id), { lentTo: null, lentDate: null });
        setSelectedBook({...selectedBook, lentTo: null, lentDate: null});
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
         if(shelfBooks.length > 0) { requestConfirm(`Let op: Er zitten nog ${shelfBooks.length} boeken in "${shelfName}". Verwijder of verplaats deze eerst!`, () => {}); return; }
         requestConfirm(`Schap "${shelfName}" definitief verwijderen?`, async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', shelfId)); });
    };

    // --- Drag/Drop ---
    const sortedShelves = [...shelves].sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleMoveShelf = async (index, direction) => {
        if (!activeUserId) return;
        if (index + direction < 0 || index + direction >= sortedShelves.length) return;
        const updatedShelves = [...sortedShelves];
        const temp = updatedShelves[index];
        updatedShelves[index] = updatedShelves[index + direction];
        updatedShelves[index + direction] = temp;
        
        for (let i = 0; i < updatedShelves.length; i++) {
            if (updatedShelves[i].order !== i) {
                await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', updatedShelves[i].id), { order: i });
            }
        }
    };

    const onDragStartBook = (e, bookId) => {
        if(isDragMode) e.dataTransfer.setData('bookId', bookId);
    };

    const onDropBookToShelf = async (e, shelfId) => {
        if(!isDragMode || !activeUserId) return;
        const bookId = e.dataTransfer.getData('bookId');
        if (bookId) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'books', bookId), { shelfId });
            setIsDragMode(false); 
        }
    };

    // Delen & Loggen
    const handleShareShelfSubmit = async (e) => {
        e.preventDefault();
        setShareShelfData(p => ({...p, loading: true, msg: ''}));
        try {
            const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
            let targetUid = null;
            usersSnap.forEach(d => { if (d.data().email.toLowerCase() === shareShelfData.email.toLowerCase()) targetUid = d.id; });
            if (!targetUid) return setShareShelfData(p => ({...p, loading: false, msg: 'Gebruiker niet gevonden in het systeem.'}));
            if (targetUid === activeUserId) return setShareShelfData(p => ({...p, loading: false, msg: 'Je kunt dit niet met jezelf delen.'}));
            const shelfToCopy = shelves.find(s => s.id === shareShelfData.shelfId);
            if (shelfToCopy.sharedWith && shelfToCopy.sharedWith.some(s => s.uid === targetUid)) {
                return setShareShelfData(p => ({...p, loading: false, msg: 'Dit schap is al gedeeld met deze gebruiker.'}));
            }
            const newShelfRef = await addDoc(collection(db, 'artifacts', appId, 'users', targetUid, 'shelves'), { name: `${shelfToCopy.name} (Gedeeld)`, description: `Gedeeld door ${userData.name}. ${shelfToCopy.description || ''}`, order: 99, createdAt: new Date().toISOString() });
            const booksToCopy = books.filter(b => b.shelfId === shareShelfData.shelfId);
            for (const b of booksToCopy) { await addDoc(collection(db, 'artifacts', appId, 'users', targetUid, 'books'), { ...b, shelfId: newShelfRef.id, addedAt: new Date().toISOString() }); }
            const currentShared = shelfToCopy.sharedWith || [];
            await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', shareShelfData.shelfId), { sharedWith: [...currentShared, { uid: targetUid, email: shareShelfData.email, targetShelfId: newShelfRef.id }] });
            setShareShelfData({ isOpen: false, shelfId: '', shelfName: '', email: '', loading: false, msg: '' });
        } catch (err) { setShareShelfData(p => ({...p, loading: false, msg: 'Fout bij het delen.'})); }
    };

    const handleRevokeShare = async (shelfId, shareObj) => {
        requestConfirm(`Toegang intrekken voor ${shareObj.email}? Dit verwijdert het schap en de boeken bij deze gebruiker.`, async () => {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', shareObj.uid, 'shelves', shareObj.targetShelfId));
                const targetBooksSnap = await getDocs(collection(db, 'artifacts', appId, 'users', shareObj.uid, 'books'));
                targetBooksSnap.forEach(async (b) => { if (b.data().shelfId === shareObj.targetShelfId) await deleteDoc(doc(db, 'artifacts', appId, 'users', shareObj.uid, 'books', b.id)); });
                const shelf = shelves.find(s => s.id === shelfId);
                const newSharedWith = (shelf.sharedWith || []).filter(s => s.uid !== shareObj.uid);
                await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', shelfId), { sharedWith: newSharedWith });
            } catch (err) {}
        });
    };

    const toggleAdminRole = async (targetUid, currentRole) => {
        if(!userData || userData.role !== 'admin') return;
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        requestConfirm(`Wil je de rol wijzigen naar ${newRole}?`, async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUid), { role: newRole }); });
    };

    const handleRetroactiveLog = async (e) => {
        e.preventDefault(); if (!activeUserId || !calendarLogData.bookId) return;
        const book = books.find(b => b.id === calendarLogData.bookId); if (!book) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'readingLog', `${calendarLogData.dateStr}_${book.id}`), { date: calendarLogData.dateStr, bookId: book.id, title: book.title, cover: book.cover || null }, { merge: true });
        if(calendarLogData.dateStr === getTodayString()) handleLogReading(true);
        setCalendarLogData({ isOpen: false, dateStr: '', bookId: '' });
    };

    const handleLogReading = async (silent = false) => {
        if (!activeUserId) return;
        const today = new Date().toISOString();
        let streak = stats.currentStreak || 0;
        
        if (isToday(stats.lastReadDate)) { 
            if (!silent) return; 
        } else if (isYesterday(stats.lastReadDate)) {
            streak += 1; 
        } else {
            streak = 1; 
        }
        
        await setDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'profile', 'stats'), { currentStreak: streak, lastReadDate: today }, { merge: true });
    };

    // Functie om lees-streak ongedaan te maken en logboek-vlammetjes te verwijderen
    const handleUndoLogReading = async () => {
        if (!activeUserId) return;
        requestConfirm("Heb je je vergist en wil je de lees-streak van vandaag ongedaan maken?", async () => {
            // 1. Verlaag het nummer van de streak
            let newStreak = Math.max(0, (stats.currentStreak || 1) - 1);
            let newLastReadDate = null;
            if (newStreak > 0) {
                const y = new Date();
                y.setDate(y.getDate() - 1); // Terugzetten naar gisteren
                newLastReadDate = y.toISOString();
            }
            await setDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'profile', 'stats'), { currentStreak: newStreak, lastReadDate: newLastReadDate }, { merge: true });
            
            // 2. Wis ALLE logboek registraties van vandaag zodat het vlammetje weggaat
            const todayStr = getTodayString();
            const logsToDelete = readingLogs.filter(log => log.date === todayStr);
            for (const log of logsToDelete) {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'readingLog', log.id));
            }
        });
    };

    const switchTab = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); setSearchQuery(''); setIsDragMode(false); setTitleSuggestions([]); setApiLimitError(false); };

    // Conditionele Weergaven
    if (loading) return <div className="flex h-screen items-center justify-center bg-stone-100"><div className="animate-spin text-amber-600"><BookOpen size={48} /></div></div>;
    if (dbError) return <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen"><div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-2 border-red-500"><h3>Database Fout</h3><button onClick={() => window.location.reload()} className="mt-4 bg-stone-900 text-white font-bold py-2 px-4 rounded-xl">Herladen</button></div></div>;
    if (!user) return <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen"><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"><div className="bg-gradient-to-br from-amber-400 to-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><Library className="text-white" size={40} /></div><h1 className="text-3xl font-black text-stone-800 mb-2">Boeken<span className="text-amber-500">Plank</span> Pro</h1><p className="text-stone-500 font-medium mb-10">Beheer je bibliotheek in de cloud.</p><button onClick={handleLogin} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 px-6 rounded-xl shadow-xl">Inloggen met Google</button></div></div>;
    if (!userData) return <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen"><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"><h2 className="text-2xl font-black text-stone-800 mb-2">Welkom! 🎉</h2><form onSubmit={handleCreateProfile}><div className="mb-4"><label>Naam</label><input required value={profileForm.name} onChange={e=>setProfileForm({...profileForm, name: e.target.value})} className="w-full border-2 p-2 rounded-xl" /></div><div className="mb-4"><label>E-mail</label><input required type="email" value={profileForm.email} onChange={e=>setProfileForm({...profileForm, email: e.target.value})} className="w-full border-2 p-2 rounded-xl" /></div><button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl">Start!</button></form></div></div>;

    const hasReadToday = isToday(stats.lastReadDate);
    const logsByDate = readingLogs.reduce((acc, log) => { if (!acc[log.date]) acc[log.date] = []; acc[log.date].push(log); return acc; }, {});

    // Filters voor lijsten
    const isBookFinished = (b) => b.totalPages > 0 && parseInt(b.pagesRead) >= parseInt(b.totalPages);
    
    // Zorg dat gelezen boeken OVERAL zichtbaar blijven (behalve op de wensenlijst tab)
    let baseBooks = books;
    if (activeTab === 'wensenlijst') {
        baseBooks = books.filter(b => b.shelfId === 'wishlist');
    } else if (activeTab === 'gelezen') {
        baseBooks = books.filter(b => isBookFinished(b) && b.shelfId !== 'wishlist');
    } else {
        baseBooks = books.filter(b => b.shelfId !== 'wishlist');
    }

    const filteredBooks = baseBooks.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Kalender opbouw
    const calYear = currentMonthDate.getFullYear();
    const calMonth = currentMonthDate.getMonth();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    let firstDayIndex = new Date(calYear, calMonth, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;
    const monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];
    
    const renderCalendarDays = () => {
        let days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-stone-50 rounded-xl border border-stone-100 opacity-50"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = toDateString(new Date(calYear, calMonth, day));
            const dayLogs = logsByDate[dateStr] || [];
            const isCurrentDay = dateStr === getTodayString();
            const hasRead = dayLogs.length > 0;

            days.push(
                <div key={day} onClick={() => setCalendarLogData({ isOpen: true, dateStr: dateStr, bookId: '' })} className={`h-24 sm:h-32 p-2 rounded-xl border relative cursor-pointer hover:bg-amber-50 transition-colors overflow-hidden ${isCurrentDay ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-stone-200 bg-white'}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold ${isCurrentDay ? 'text-amber-600' : 'text-stone-500'}`}>{day}</span>
                        {hasRead && <Flame size={14} className="text-orange-500" />}
                    </div>
                    <div className="absolute top-7 left-1 right-1 bottom-1 flex gap-1 overflow-x-auto hide-scrollbar items-end">
                        {dayLogs.map((log, idx) => (
                            <div key={idx} className="w-8 h-12 sm:w-10 sm:h-14 flex-shrink-0 rounded shadow-sm overflow-hidden bg-stone-200 border border-stone-300">
                                {log.cover ? <img src={log.cover} className="w-full h-full object-cover" title={log.title}/> : <Book size={16} className="m-auto text-stone-400 mt-3"/>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    const renderWeeklyStreak = () => {
        const today = new Date();
        const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayIndex + (streakWeekOffset * 7));

        const days = [];
        for(let i=0; i<7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dStr = toDateString(d);
            const hasRead = logsByDate[dStr] ? true : false;
            const dayName = d.toLocaleDateString('nl-NL', {weekday: 'short'});
            const shortDate = `${d.getDate()}/${d.getMonth() + 1}`; 
            
            days.push(
                <div key={i} className="flex flex-col items-center gap-1 md:gap-2 min-w-[28px] sm:min-w-[32px] md:min-w-[56px]">
                    <div className={`w-7 h-7 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${hasRead ? 'bg-orange-100 shadow-sm' : 'bg-stone-100 border border-stone-200'}`}>
                        {hasRead ? <Flame className="w-4 h-4 md:w-6 md:h-6 text-orange-500" /> : <span className="text-[10px] md:text-sm text-stone-400 font-bold">{dayName.charAt(0)}</span>}
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] md:text-xs text-stone-500 font-bold uppercase leading-none">{dayName}</span>
                        <span className="text-[8px] md:text-[10px] text-stone-400 font-medium leading-none mt-1 md:mt-1.5">{shortDate}</span>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 w-full lg:w-auto mt-2 lg:mt-0 bg-stone-50 p-2 md:p-4 rounded-xl md:rounded-2xl border border-stone-100">
                <button onClick={() => setStreakWeekOffset(p => p - 1)} className="p-1 md:p-2 text-stone-400 hover:text-stone-800 transition"><ChevronLeft className="w-4 h-4 md:w-6 md:h-6"/></button>
                <div className="flex gap-1.5 sm:gap-2 md:gap-4 justify-between flex-1 lg:flex-none">{days}</div>
                <button onClick={() => setStreakWeekOffset(p => p + 1)} disabled={streakWeekOffset >= 0} className={`p-1 md:p-2 transition ${streakWeekOffset >= 0 ? 'text-stone-200 cursor-not-allowed' : 'text-stone-400 hover:text-stone-800'}`}><ChevronRight className="w-4 h-4 md:w-6 md:h-6"/></button>
            </div>
        );
    };

    return (
        <div className="flex flex-col bg-stone-100 h-screen overflow-hidden relative">
            
            <div className="w-full flex flex-col z-30 flex-shrink-0">
                {impersonatedUser && (
                    <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center shadow-md animate-pulse">
                        <div className="flex items-center gap-2 font-bold text-sm"><ArrowLeftRight size={16} /> LET OP: Beheer account van {impersonatedUser.name}</div>
                        <button onClick={() => setImpersonatedUser(null)} className="bg-black/30 hover:bg-black/50 px-3 py-1 rounded-lg text-xs font-bold transition-colors">Terug</button>
                    </div>
                )}
                <div className="md:hidden bg-stone-900 text-white p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2 font-bold text-xl"><Library size={24} className="text-amber-500" />Boeken<span className="text-amber-500">Plank</span></div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-stone-800 rounded-lg transition"><Menu size={28} /></button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}

                <nav className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 text-stone-100 flex flex-col shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 pb-2 border-b border-stone-800">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl"><Library className="text-white" size={28} /></div><h1 className="text-2xl font-bold">Boeken<span className="text-amber-500">Plank</span></h1></div>
                            <button className="md:hidden text-stone-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="flex items-center gap-3 mb-4 bg-stone-800/50 p-3 rounded-2xl border border-stone-700">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-stone-600 to-stone-500 flex items-center justify-center font-bold text-lg border-2 border-stone-700">{userData.name.charAt(0).toUpperCase()}</div>
                            <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate text-white">{userData.name}</p><p className="text-xs text-stone-400 truncate">{userData.role === 'admin' ? 'Beheerder' : 'Gebruiker'}</p></div>
                            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-white bg-stone-800 rounded-xl transition-colors"><LogOut size={16}/></button>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                        <div className="flex flex-col gap-2 flex-1">
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2">Bibliotheek</p>
                            <button onClick={() => switchTab('schappen')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'schappen' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><Library size={20} /> Schappen</button>
                            <button onClick={() => switchTab('alle')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'alle' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><BookOpen size={20} /> Alle Boeken</button>
                            
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2 mt-4">Mijn Lijsten</p>
                            <button onClick={() => switchTab('wensenlijst')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'wensenlijst' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><BookmarkPlus size={20} /> Wensenlijst</button>
                            <button onClick={() => switchTab('gelezen')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'gelezen' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><CheckCircle2 size={20} /> Gelezen</button>
                            <button onClick={() => switchTab('kalender')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'kalender' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><CalendarDays size={20} /> Kalender</button>

                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2 mt-4">Beheer</p>
                            <button onClick={() => switchTab('beheer')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'beheer' ? 'bg-stone-800 text-white border border-stone-700' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><Settings size={20} /> Schappen Beheren</button>
                            <button onClick={() => switchTab('changelog')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'changelog' ? 'bg-stone-800 text-white border border-stone-700' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><History size={20} /> Versiegeschiedenis</button>
                            
                            {userData.role === 'admin' && (
                                <button onClick={() => switchTab('admin')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`}><Shield size={20} /> Systeem Admin</button>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-800 text-center"><p className="text-xs font-bold text-stone-600 tracking-wider">© Copyright by Jaider</p></div>
                    </div>
                </nav>

                <main className="flex-1 overflow-y-auto bg-stone-100 p-4 md:p-10 pb-24 relative z-0">
                    <div className="max-w-7xl mx-auto">
                        
                        {(activeTab === 'schappen' || activeTab === 'alle' || activeTab === 'wensenlijst' || activeTab === 'gelezen') && (
                            <div className="mb-8">
                                <div className="bg-white rounded-3xl p-4 sm:p-5 mb-8 shadow-sm border border-stone-200/60 flex flex-col lg:flex-row items-center justify-between gap-4">
                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-2xl mt-1">
                                                    <Flame className={`${hasReadToday ? 'text-orange-500 animate-pulse' : 'text-stone-400'}`} size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Lees Streak</p>
                                                    <p className="text-4xl md:text-5xl lg:text-6xl font-black text-stone-800 leading-none tracking-tighter mt-1">
                                                        {stats.currentStreak} 
                                                        <span className="text-base md:text-xl lg:text-2xl text-stone-400 font-medium tracking-normal ml-1">dagen</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="hidden sm:block w-px h-16 md:h-20 bg-stone-200 mx-2 md:mx-4"></div>
                                        
                                        <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                                            {renderWeeklyStreak()}
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-auto flex justify-end mt-2 lg:mt-0">
                                        <button onClick={() => hasReadToday ? handleUndoLogReading() : handleLogReading(false)} className={`w-full lg:w-auto px-4 py-3 sm:py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md text-sm sm:text-base ${hasReadToday ? 'bg-white text-green-600 border-2 border-green-500 hover:bg-red-50 hover:text-red-600 hover:border-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg'}`}>
                                            {hasReadToday ? <><CheckCircle2 size={18}/> Gelezen Vandaag <span className="text-[10px] sm:text-xs text-stone-400 ml-1 font-normal underline">(Uitvinken)</span></> : 'Gelezen!'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-3xl sm:text-4xl font-black text-stone-800 tracking-tight">
                                        {activeTab === 'schappen' ? 'Mijn Schappen' : activeTab === 'wensenlijst' ? 'Mijn Wensenlijst' : activeTab === 'gelezen' ? 'Gelezen Boeken' : 'Alle Boeken'}
                                    </h2>
                                    <div className="flex w-full sm:w-auto flex-wrap items-center gap-3">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={16} />
                                            <input type="text" placeholder="Zoek boek of auteur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 focus:border-amber-500 outline-none text-sm bg-white" />
                                        </div>
                                        {activeTab === 'schappen' && (
                                            <button onClick={() => setIsDragMode(!isDragMode)} className={`flex justify-center items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-sm border-2 ${isDragMode ? 'bg-amber-100 border-amber-500 text-amber-800 animate-pulse' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
                                                <Move size={16} /> {isDragMode ? 'Slepen Klaar' : 'Slepen aanzetten'}
                                            </button>
                                        )}
                                        <button onClick={() => setIsBookModalOpen(true)} className="flex justify-center items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg text-sm"><Plus size={16} /> Boek</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'schappen' && (
                            <div className="space-y-8 sm:space-y-12">
                                {sortedShelves.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-stone-200 border-dashed"><Library className="text-stone-400 mx-auto mb-4" size={48}/><h3 className="text-2xl font-bold mb-4">Geen schappen</h3><button onClick={() => switchTab('beheer')} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold">Ga naar Beheer</button></div>
                                ) : (
                                    sortedShelves.map(shelf => {
                                        const isCollapsed = collapsedShelves.includes(shelf.id);
                                        const shelfBooks = filteredBooks.filter(b => b.shelfId === shelf.id);
                                        if (searchQuery && shelfBooks.length === 0) return null;
                                        
                                        return (
                                            <div 
                                                key={shelf.id} 
                                                className={`bg-white rounded-3xl p-5 shadow-md relative overflow-hidden transition-all ${isDragMode ? 'border-2 border-dashed border-amber-400 bg-amber-50/30' : 'border border-stone-200/60'}`}
                                                onDragOver={(e) => isDragMode && e.preventDefault()}
                                                onDrop={(e) => onDropBookToShelf(e, shelf.id)}
                                            >
                                                {!isDragMode && <div className={`absolute top-0 left-0 w-2 h-full ${shelf.color || 'bg-amber-500'}`}></div>}
                                                
                                                <div 
                                                    className={`mb-4 border-b border-stone-100 pb-2 flex justify-between items-center ${!isDragMode ? 'cursor-pointer group' : ''}`}
                                                    onClick={() => !isDragMode && toggleShelf(shelf.id)}
                                                >
                                                    <div>
                                                        <h3 className="text-2xl font-black flex items-center gap-3">{shelf.name} <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{shelfBooks.length}</span></h3>
                                                        {shelf.description && <p className="text-sm text-stone-500 mt-2 font-medium bg-stone-50 p-2 rounded-lg inline-block border border-stone-100">{shelf.description}</p>}
                                                    </div>
                                                    {!isDragMode && (
                                                        <button className="p-2 bg-stone-50 group-hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                                                            {isCollapsed ? <ChevronDown size={24}/> : <ChevronUp size={24}/>}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {!isCollapsed && (
                                                    shelfBooks.length === 0 ? (
                                                        <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDragMode ? 'border-amber-300 bg-amber-50' : 'border-stone-200'}`}>
                                                            <p className="text-stone-400 font-bold">{isDragMode ? 'Laat boek hier los!' : 'Geen boeken in dit schap.'}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                                            <BookList books={shelfBooks} onSelect={(b) => { setSelectedBook(b); setBookModalTab('overzicht'); }} isDragMode={isDragMode} onDragStart={onDragStartBook} />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {(activeTab === 'alle' || activeTab === 'wensenlijst' || activeTab === 'gelezen') && (
                            <div className="bg-white rounded-3xl p-5 shadow-md border border-stone-200/60">
                                {filteredBooks.length === 0 ? (
                                    <div className="text-center py-10">
                                        <BookOpen className="text-stone-300 mx-auto mb-4" size={48}/>
                                        <p className="text-stone-500 font-bold text-lg">Geen boeken gevonden in deze lijst.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                        <BookList books={filteredBooks} onSelect={(b) => { setSelectedBook(b); setBookModalTab('overzicht'); }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'kalender' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-stone-200/60 gap-4">
                                    <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3"><CalendarDays className="text-amber-500" size={32}/> Kalender</h2>
                                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end bg-stone-50 p-2 sm:p-0 rounded-xl sm:bg-transparent">
                                        <button onClick={() => setCurrentMonthDate(new Date(calYear, calMonth - 1, 1))} className="p-2 hover:bg-stone-200 sm:hover:bg-stone-100 rounded-full transition"><ChevronLeft size={24}/></button>
                                        <h3 className="text-lg sm:text-xl font-bold text-stone-800 w-32 sm:w-40 text-center truncate">{monthNames[calMonth]} {calYear}</h3>
                                        <button onClick={() => setCurrentMonthDate(new Date(calYear, calMonth + 1, 1))} className="p-2 hover:bg-stone-200 sm:hover:bg-stone-100 rounded-full transition"><ChevronRight size={24}/></button>
                                    </div>
                                </div>

                                <div className="bg-white p-3 sm:p-6 rounded-3xl shadow-sm border border-stone-200/60">
                                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                                        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                                            <div key={d} className="text-center font-bold text-stone-400 text-[10px] sm:text-xs uppercase tracking-wider">{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 sm:gap-3">
                                        {renderCalendarDays()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'beheer' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-stone-800">Beheer Schappen</h2>
                                        <p className="text-stone-500 font-medium">Beheer je lijsten en pas de volgorde aan.</p>
                                    </div>
                                    <button onClick={() => setIsShelfModalOpen(true)} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg w-full sm:w-auto justify-center"><Plus size={20} /> Nieuw Schap</button>
                                </div>
                                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border border-stone-200/60">
                                    <div className="space-y-4">
                                        {sortedShelves.map((shelf, index) => (
                                            <div key={shelf.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 pl-6 bg-stone-50 rounded-2xl border border-stone-200 gap-4 transition-all hover:bg-stone-100 relative overflow-hidden">
                                                <div className={`absolute top-0 left-0 w-3 h-full ${shelf.color || 'bg-amber-500'}`}></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-1 hidden sm:flex">
                                                        <button onClick={() => handleMoveShelf(index, -1)} disabled={index === 0} className="text-stone-400 hover:text-amber-500 disabled:opacity-30"><ArrowUp size={18}/></button>
                                                        <button onClick={() => handleMoveShelf(index, 1)} disabled={index === sortedShelves.length - 1} className="text-stone-400 hover:text-amber-500 disabled:opacity-30"><ArrowDown size={18}/></button>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg text-stone-800">{shelf.name}</p>
                                                        {shelf.description && <p className="text-xs text-stone-500 truncate max-w-xs">{shelf.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <div className="flex sm:hidden mr-auto gap-2">
                                                        <button onClick={() => handleMoveShelf(index, -1)} disabled={index === 0} className="p-2 bg-white rounded-lg border border-stone-200 text-stone-500 disabled:opacity-30"><ArrowUp size={16}/></button>
                                                        <button onClick={() => handleMoveShelf(index, 1)} disabled={index === sortedShelves.length - 1} className="p-2 bg-white rounded-lg border border-stone-200 text-stone-500 disabled:opacity-30"><ArrowDown size={16}/></button>
                                                    </div>
                                                    <button onClick={() => setShareShelfData({ isOpen: true, shelfId: shelf.id, shelfName: shelf.name, email: '', loading: false, msg: '' })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-100"><Share2 size={16}/> Deel</button>
                                                    <button onClick={() => setEditShelfData({ isOpen: true, id: shelf.id, name: shelf.name, description: shelf.description || '', color: shelf.color || 'bg-amber-500' })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-100"><Edit3 size={16}/> Bewerk</button>
                                                    <button onClick={() => handleDeleteShelf(shelf.id, shelf.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                                                </div>
                                                
                                                {shelf.sharedWith && shelf.sharedWith.length > 0 && (
                                                    <div className="w-full mt-2 pt-3 border-t border-stone-200">
                                                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Gedeeld met:</p>
                                                        <div className="space-y-2">
                                                            {shelf.sharedWith.map((share, idx) => (
                                                                <div key={idx} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-stone-200">
                                                                    <span className="text-sm font-medium text-stone-700">{share.email}</span>
                                                                    <button onClick={() => handleRevokeShare(shelf.id, share)} className="text-xs flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded-md font-bold transition-colors"><UserX size={14}/> Stop Delen</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'changelog' && (
                            <div className="max-w-3xl mx-auto space-y-6">
                                <h2 className="text-3xl font-black flex items-center gap-3"><History className="text-amber-500" size={36}/> Versiegeschiedenis</h2>
                                <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-200">
                                    <div className="space-y-8">
                                        {CHANGELOG.map((log, index) => (
                                            <div key={index} className="relative pl-6 border-l-2 border-stone-200">
                                                <div className="absolute w-4 h-4 bg-amber-500 rounded-full -left-[9px] top-1"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-3"><h3 className="text-xl font-bold">Versie {log.version}</h3><span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full self-start sm:self-auto">{log.date}</span></div>
                                                <ul className="list-disc ml-4 text-stone-600 font-medium text-sm sm:text-base">{log.changes.map((change, cIdx) => <li key={cIdx}>{change}</li>)}</ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'admin' && userData.role === 'admin' && (
                            <div className="max-w-5xl mx-auto space-y-6">
                                <h2 className="text-3xl font-black flex items-center gap-3"><Shield className="text-red-500" size={36}/> Systeem Beheer</h2>
                                
                                <div className="bg-white rounded-3xl shadow-md overflow-hidden">
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-stone-100 text-stone-600 text-sm"><tr><th className="p-4">Naam</th><th className="p-4">Email</th><th className="p-4">Rol</th><th className="p-4 text-right">Acties</th></tr></thead>
                                            <tbody>
                                                {allUsers.map(u => (
                                                    <tr key={u.uid} className="border-t border-stone-100 hover:bg-stone-50">
                                                        <td className="p-4 font-bold">{u.name}</td>
                                                        <td className="p-4 text-sm text-stone-600">{u.email}</td>
                                                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-700'}`}>{u.role}</span></td>
                                                        <td className="p-4 flex justify-end gap-2">
                                                            {u.uid !== user.uid && (
                                                                <>
                                                                    <button onClick={() => { setImpersonatedUser(u); switchTab('schappen'); }} className="text-xs flex items-center gap-1 bg-stone-900 text-white px-2 py-1.5 rounded-lg"><ArrowLeftRight size={14}/> Beheer</button>
                                                                    <button onClick={() => toggleAdminRole(u.uid, u.role)} className="text-xs flex items-center gap-1 bg-white border border-stone-300 text-stone-700 px-2 py-1.5 rounded-lg hover:bg-stone-100 font-medium"><Shield size={14}/> {u.role === 'admin' ? 'Maak User' : 'Maak Admin'}</button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="block md:hidden divide-y divide-stone-100">
                                        {allUsers.map(u => (
                                            <div key={u.uid} className="p-4 flex flex-col gap-2 sm:gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0 mr-3">
                                                        <p className="font-bold text-base text-stone-800 truncate">{u.name}</p>
                                                        <p className="text-xs text-stone-500 truncate">{u.email}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-700'}`}>{u.role.toUpperCase()}</span>
                                                </div>
                                                {u.uid !== user.uid && (
                                                    <div className="flex gap-2 mt-1">
                                                        <button onClick={() => { setImpersonatedUser(u); switchTab('schappen'); }} className="flex-1 flex justify-center items-center gap-1 bg-stone-900 text-white py-2 rounded-lg text-xs font-bold shadow-sm"><ArrowLeftRight size={14}/> Beheer</button>
                                                        <button onClick={() => toggleAdminRole(u.uid, u.role)} className="flex-1 flex justify-center items-center gap-1 bg-white border border-stone-300 text-stone-700 py-2 rounded-lg hover:bg-stone-100 text-xs font-bold"><Shield size={14}/> {u.role === 'admin' ? 'Maak User' : 'Maak Admin'}</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Boek Toevoegen Modal */}
            {isBookModalOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-2 sm:p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh]">
                        <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-stone-50 flex-shrink-0">
                            <h3 className="text-xl font-black text-stone-800">Boek Toevoegen</h3>
                            <button onClick={() => setIsBookModalOpen(false)} className="text-stone-400 hover:text-stone-700 bg-white p-1.5 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto hide-scrollbar">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                                <label className="block text-xs font-bold text-amber-900 mb-2 flex items-center gap-1"><Search size={14}/> Snel via ISBN</label>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Typ ISBN..." value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} className="flex-1 border border-amber-300/50 rounded-lg px-3 py-2 bg-white outline-none text-sm" />
                                    <button type="button" onClick={() => fetchBookData()} disabled={isFetchingIsbn} className="bg-amber-200 text-amber-900 px-3 py-2 rounded-lg font-bold text-sm min-w-[70px] flex justify-center items-center">
                                        {isFetchingIsbn ? <Loader2 size={16} className="animate-spin" /> : 'Zoek'}
                                    </button>
                                    <button type="button" onClick={() => setIsScannerOpen(true)} className="bg-stone-900 text-white px-3 py-2 rounded-lg font-bold flex justify-center items-center"><Camera size={16} /></button>
                                </div>
                                <p className="text-[9px] text-amber-700 mt-2 font-medium">Lukt scannen niet? Typ de cijfers over. Werkt zoeken niet door een blokkade? Gebruik dan de Google-knoppen hieronder.</p>
                                {errorMsg && <p className="text-red-600 font-medium text-xs mt-2">{errorMsg}</p>}
                                {apiLimitError && <p className="text-red-600 font-bold text-[10px] mt-2 bg-red-100 p-2 rounded-lg border border-red-200 flex items-center gap-1"><AlertCircle size={14} className="flex-shrink-0"/> Google blokkeert zoekopdrachten tijdelijk (te veel verzoeken tegelijk op jouw WiFi).</p>}
                            </div>
                            <form onSubmit={handleAddBook} className={`space-y-3 relative ${titleSuggestions.length > 0 || isSearchingTitle ? 'pb-48' : ''}`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2 relative">
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Titel of Auteur (typt voor suggesties) *</label>
                                        <input type="text" required value={newBook.title} onChange={handleTitleChange} className={`w-full border-2 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm transition-colors ${apiLimitError ? 'border-red-400' : 'border-stone-200 focus:border-amber-400'}`} placeholder="Bijv. De Hobbit of Tolkien" />
                                        
                                        {/* De nieuwe handmatige 'Plan B' Google knoppen */}
                                        {newBook.title && (
                                            <div className="flex flex-wrap gap-2 mt-2 z-10 relative">
                                                <a href={`https://www.google.be/search?tbm=isch&q=${encodeURIComponent('boek cover ' + newBook.title)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1.5 rounded-md border border-blue-200 font-bold flex items-center transition-colors shadow-sm">
                                                    <Search size={12} className="mr-1"/> Zoek Kaft op Google
                                                </a>
                                                <a href={`https://www.google.be/search?tbm=bks&q=${encodeURIComponent(newBook.title)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-stone-100 text-stone-600 hover:bg-stone-200 px-2 py-1.5 rounded-md border border-stone-200 font-bold flex items-center transition-colors shadow-sm">
                                                    <Search size={12} className="mr-1"/> Zoek Boek Info
                                                </a>
                                            </div>
                                        )}

                                        {isSearchingTitle && !apiLimitError && (
                                            <div className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white border-2 border-amber-300 rounded-xl shadow-2xl p-4 text-center">
                                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                <p className="text-xs font-bold text-amber-700">Boeken zoeken...</p>
                                            </div>
                                        )}

                                        {titleSuggestions.length > 0 && !apiLimitError && (
                                            <div className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white border-2 border-amber-400 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                                                <div className="bg-amber-50 px-3 py-2 border-b border-amber-200">
                                                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Kies een boek uit de lijst</p>
                                                </div>
                                                {titleSuggestions.map((item, idx) => (
                                                    <div key={idx} onClick={() => selectTitleSuggestion(item)} className="px-3 py-3 hover:bg-amber-50 cursor-pointer border-b border-stone-100 last:border-0 flex items-center gap-3 transition-colors">
                                                        {item.cover ? (
                                                            <img src={item.cover} alt="cover" className="w-8 h-12 object-cover rounded shadow-sm border border-stone-200" />
                                                        ) : (
                                                            <div className="w-8 h-12 bg-stone-100 flex items-center justify-center rounded shadow-sm border border-stone-200"><Book size={14} className="text-stone-400"/></div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm text-stone-800 truncate">{item.title}</p>
                                                            <p className="text-xs text-stone-500 truncate">{item.author || 'Onbekende auteur'}</p>
                                                        </div>
                                                        <Plus size={16} className="text-amber-500 flex-shrink-0 opacity-50" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2"><label className="block text-xs font-bold text-stone-700 mb-1">Auteur</label><input type="text" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="Auteur" /></div>
                                    <div className="sm:col-span-2"><label className="block text-xs font-bold text-stone-700 mb-1">Tags / Genres</label><input type="text" value={newBook.tags} onChange={e => setNewBook({...newBook, tags: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="Bijv. Thriller, Magie (gescheiden door komma)" /></div>
                                    <div className="sm:col-span-2"><label className="block text-xs font-bold text-stone-700 mb-1">Afbeelding URL (optioneel)</label><input type="text" value={newBook.cover} onChange={e => setNewBook({...newBook, cover: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="https://link-naar-plaatje.jpg" /></div>
                                    <div><label className="block text-xs font-bold text-stone-700 mb-1">Totaal Pagina's</label><input type="number" value={newBook.totalPages} onChange={e => setNewBook({...newBook, totalPages: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 outline-none text-sm" placeholder="300" /></div>
                                    <div><label className="block text-xs font-bold text-stone-700 mb-1">Al Gelezen</label><input type="number" value={newBook.pagesRead} onChange={e => setNewBook({...newBook, pagesRead: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 outline-none text-sm" placeholder="0" /></div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Plaats in Schap of Lijst *</label>
                                        <select required value={newBook.shelfId} onChange={e => setNewBook({...newBook, shelfId: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 font-bold bg-white outline-none text-sm">
                                            <option value="" disabled>Kies een locatie...</option>
                                            <option value="wishlist" className="text-amber-600 font-black">⭐ Wensenlijst</option>
                                            {sortedShelves.map(s => <option key={s.id} value={s.id}>📚 {s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100"><button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 font-bold hover:bg-stone-100 rounded-lg text-sm">Annuleren</button><button type="submit" disabled={!newBook.shelfId} className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg shadow-md text-sm">Opslaan</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Retroactive Calendar Log Modal */}
            {calendarLogData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 bg-stone-50 border-b border-stone-100">
                            <h3 className="text-xl font-black flex items-center gap-2"><CalendarDays size={20} className="text-amber-500"/> Logboek toevoegen</h3>
                            <p className="text-sm text-stone-500 mt-1">Gelezen op: {calendarLogData.dateStr}</p>
                        </div>
                        <form onSubmit={handleRetroactiveLog} className="p-6">
                            {books.length === 0 ? <p className="text-red-500 mb-4 font-bold">Je hebt nog geen boeken in je bibliotheek.</p> : (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-stone-700 mb-2">Welk boek heb je gelezen?</label>
                                    <select required value={calendarLogData.bookId} onChange={e => setCalendarLogData({...calendarLogData, bookId: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 outline-none focus:bg-white focus:border-amber-500">
                                        <option value="" disabled>Selecteer een boek...</option>
                                        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setCalendarLogData({ isOpen: false, dateStr: '', bookId: '' })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" disabled={books.length === 0} className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 disabled:opacity-50">Log Opslaan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Shelf Modal */}
            {shareShelfData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 bg-stone-50 border-b border-stone-100">
                            <h3 className="text-2xl font-black flex items-center gap-2"><Share2 size={24} className="text-amber-500"/> Schap Delen</h3>
                            <p className="text-sm text-stone-500 mt-1">Kopieer "{shareShelfData.shelfName}" naar een andere gebruiker.</p>
                        </div>
                        <form onSubmit={handleShareShelfSubmit} className="p-6">
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-stone-700 mb-2">E-mailadres ontvanger</label>
                                <input type="email" required value={shareShelfData.email} onChange={e => setShareShelfData({...shareShelfData, email: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 focus:bg-white outline-none focus:border-amber-500" placeholder="bijv. naam@email.com" />
                            </div>
                            {shareShelfData.msg && <p className="text-red-500 font-bold mb-4 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{shareShelfData.msg}</p>}
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button type="button" onClick={() => setShareShelfData({ isOpen: false, shelfId: '', shelfName: '', email: '', loading: false, msg: '' })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" disabled={shareShelfData.loading} className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 justify-center">
                                    {shareShelfData.loading ? 'Bezig...' : 'Deel Schap'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"><div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center mx-4"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="text-red-500" size={32}/></div><h3 className="text-xl font-bold text-stone-800 mb-2">Weet je het zeker?</h3><p className="text-stone-500 font-medium mb-6">{confirmDialog.text}</p><div className="flex gap-3"><button onClick={() => setConfirmDialog({ isOpen: false, text: '', action: null })} className="flex-1 px-4 py-3 bg-stone-100 font-bold rounded-xl">Annuleren</button><button onClick={executeConfirm} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl">Bevestigen</button></div></div></div>
            )}

            {/* View/Edit Book Modal */}
            {selectedBook && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-2 sm:p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[90vh]">
                        
                        {/* Linkerkant (Cover) */}
                        <div className="md:w-2/5 bg-stone-100 relative h-48 md:h-auto border-r border-stone-200 flex-shrink-0">
                            {selectedBook.cover ? (<img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 p-6"><Book size={64} /></div>)}
                            <button onClick={() => { setSelectedBook(null); setIsEditingBook(false); }} className="md:hidden absolute top-4 right-4 text-white bg-black/40 p-2 rounded-full"><X size={20} /></button>
                            {selectedBook.shelfId === 'wishlist' && <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-md">Wensenlijst</div>}
                        </div>
                        
                        {/* Rechterkant (Inhoud) */}
                        <div className="p-0 flex flex-col bg-white overflow-hidden md:w-3/5 flex-1">
                            
                            {/* Header met Titel en Acties */}
                            <div className="p-5 md:p-6 pb-0 border-b border-stone-100 flex-shrink-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-2">
                                        <h3 className="text-xl sm:text-2xl font-black mb-1 leading-tight">{selectedBook.title}</h3>
                                        <p className="text-base sm:text-lg text-stone-500 font-medium">{selectedBook.author}</p>
                                        
                                        {/* Tags rendering */}
                                        {selectedBook.tags && !isEditingBook && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {selectedBook.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                                    <span key={i} className="bg-stone-100 text-stone-600 px-2 py-1 rounded border border-stone-200 text-[10px] font-bold flex items-center gap-1"><Tag size={10}/> {tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {!isEditingBook && (
                                            <button onClick={() => { setEditBookData(selectedBook); setIsEditingBook(true); }} className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl font-bold transition-colors text-sm">
                                                <Edit3 size={16}/> <span>Bewerk</span>
                                            </button>
                                        )}
                                        <button onClick={() => { setSelectedBook(null); setIsEditingBook(false); }} className="hidden md:block bg-stone-100 hover:bg-stone-200 transition-colors p-2 rounded-xl"><X size={20} /></button>
                                    </div>
                                </div>
                                
                                {/* Tabs Navigatie */}
                                {!isEditingBook && (
                                    <div className="flex gap-4 overflow-x-auto hide-scrollbar -mb-[1px]">
                                        <button onClick={() => setBookModalTab('overzicht')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${bookModalTab === 'overzicht' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>Overzicht</button>
                                        <button onClick={() => setBookModalTab('notities')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${bookModalTab === 'notities' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>Notities <span className="bg-stone-100 text-stone-500 text-[10px] px-1.5 py-0.5 rounded-full">{selectedBook.notes?.length || 0}</span></button>
                                        <button onClick={() => setBookModalTab('uitleen')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${bookModalTab === 'uitleen' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
                                            Uitleenbeheer {selectedBook.lentTo && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Content Area */}
                            <div className="p-5 md:p-6 overflow-y-auto flex-1 flex flex-col bg-stone-50/50">
                                {isEditingBook && editBookData ? (
                                    <form onSubmit={handleUpdateBookDetails} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-amber-900">Boekgegevens wijzigen</h4>
                                            <button type="button" onClick={() => setIsEditingBook(false)} className="text-amber-700 hover:text-amber-900"><X size={20}/></button>
                                        </div>
                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Titel</label><input type="text" required value={editBookData.title} onChange={e => setEditBookData({...editBookData, title: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Auteur</label><input type="text" value={editBookData.author} onChange={e => setEditBookData({...editBookData, author: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Tags / Genres (komma gescheiden)</label><input type="text" value={editBookData.tags || ''} onChange={e => setEditBookData({...editBookData, tags: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Afbeelding URL</label><input type="text" value={editBookData.cover || ''} onChange={e => setEditBookData({...editBookData, cover: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-stone-700 mb-1">Locatie</label>
                                                <select required value={editBookData.shelfId} onChange={e => setEditBookData({...editBookData, shelfId: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none font-bold">
                                                    <option value="wishlist" className="text-amber-600">⭐ Wensenlijst</option>
                                                    {sortedShelves.map(s => <option key={s.id} value={s.id}>📚 {s.name}</option>)}
                                                </select>
                                            </div>
                                            <div><label className="block text-xs font-bold text-stone-700 mb-1">Totaal Pagina's</label><input type="number" value={editBookData.totalPages} onChange={e => setEditBookData({...editBookData, totalPages: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        </div>
                                        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 shadow-md"><Save size={18}/> Wijzigingen Opslaan</button>
                                    </form>
                                ) : (
                                    <>
                                        {/* TAB: OVERZICHT */}
                                        {bookModalTab === 'overzicht' && (
                                            <div className="mt-auto space-y-4 flex-1 flex flex-col">
                                                {selectedBook.lentTo && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-500 p-2 rounded-full text-white"><UserCheck size={20}/></div>
                                                            <div><p className="text-sm font-bold text-blue-900">Uitgeleend aan {selectedBook.lentTo}</p><p className="text-xs text-blue-700">Sinds {selectedBook.lentDate}</p></div>
                                                        </div>
                                                        <button onClick={() => setBookModalTab('uitleen')} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-lg font-bold shadow-sm border border-blue-100">Beheer</button>
                                                    </div>
                                                )}

                                                {/* Star Rating UI for finished books */}
                                                {isBookFinished(selectedBook) && (
                                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                                        <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><Star size={16}/> Jouw Beoordeling</h4>
                                                        <div className="flex gap-1 mb-3">
                                                            {[1,2,3,4,5].map(star => (
                                                                <Star key={star} onClick={() => setSelectedBook({...selectedBook, rating: star})} className={`cursor-pointer transition-transform hover:scale-110 ${selectedBook.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} size={28}/>
                                                            ))}
                                                        </div>
                                                        <textarea value={selectedBook.review || ''} onChange={e => setSelectedBook({...selectedBook, review: e.target.value})} placeholder="Wat vond je van dit boek? (Optioneel)" className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm resize-none h-20 outline-none focus:border-amber-400"></textarea>
                                                        <button onClick={handleUpdateReview} className="mt-2 text-xs font-bold bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">Beoordeling Opslaan</button>
                                                    </div>
                                                )}

                                                <form onSubmit={handleUpdateProgress} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-auto">
                                                    <label className="block text-sm font-bold text-stone-700 mb-3">Leesvoortgang updaten</label>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <input type="number" min="0" max={selectedBook.totalPages || 9999} required value={selectedBook.pagesRead} onChange={e => setSelectedBook({...selectedBook, pagesRead: e.target.value})} className="w-24 text-2xl font-black border-2 rounded-xl px-3 py-2 outline-none text-center bg-stone-50 focus:bg-white" />
                                                        <span className="text-stone-500 font-bold">van {selectedBook.totalPages || '?'} pag.</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-stone-100">
                                                        <button type="button" onClick={handleDeleteBook} className="text-red-500 p-3 rounded-xl hover:bg-red-50"><Trash2 size={24} /></button>
                                                        <button type="submit" className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-black py-3 rounded-xl shadow-lg transition-colors">Voortgang Opslaan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        {/* TAB: NOTITIES & QUOTES */}
                                        {bookModalTab === 'notities' && (
                                            <div className="flex-1 flex flex-col">
                                                <form onSubmit={handleAddNote} className="mb-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex-shrink-0">
                                                    <div className="flex gap-2 mb-3">
                                                        <button type="button" onClick={() => setNewNote({...newNote, type: 'quote'})} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${newNote.type === 'quote' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-500 border-stone-200'}`}><Quote size={14}/> Quote</button>
                                                        <button type="button" onClick={() => setNewNote({...newNote, type: 'note'})} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${newNote.type === 'note' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-500 border-stone-200'}`}><FileText size={14}/> Notitie</button>
                                                    </div>
                                                    <textarea required value={newNote.text} onChange={e => setNewNote({...newNote, text: e.target.value})} placeholder={newNote.type === 'quote' ? "Typ een mooie zin uit het boek..." : "Wat zijn je gedachten hierbij?"} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm resize-none h-20 outline-none focus:border-amber-400 focus:bg-white mb-2"></textarea>
                                                    <div className="flex justify-end">
                                                        <button type="submit" disabled={!newNote.text} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50"><Send size={14}/> Toevoegen</button>
                                                    </div>
                                                </form>

                                                <div className="space-y-3 overflow-y-auto flex-1 hide-scrollbar">
                                                    {(!selectedBook.notes || selectedBook.notes.length === 0) ? (
                                                        <div className="text-center p-6 text-stone-400 font-medium">Je hebt nog geen notities of quotes toegevoegd aan dit boek.</div>
                                                    ) : (
                                                        selectedBook.notes.sort((a,b) => new Date(b.date) - new Date(a.date)).map(note => (
                                                            <div key={note.id} className={`p-4 rounded-2xl relative group border ${note.type === 'quote' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-stone-200 shadow-sm'}`}>
                                                                <button onClick={() => handleDeleteNote(note.id)} className="absolute top-2 right-2 text-stone-300 hover:text-red-500 p-1 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                                                {note.type === 'quote' ? (
                                                                    <>
                                                                        <div className="flex gap-2"><Quote size={18} className="text-amber-400 flex-shrink-0 mt-0.5"/><p className="text-sm font-medium text-stone-800 italic leading-relaxed">"{note.text}"</p></div>
                                                                        {/* Nieuwe knop voor Screenshot Quote Generator */}
                                                                        <button onClick={() => setQuoteCard({text: note.text, author: selectedBook.author, title: selectedBook.title, cover: selectedBook.cover})} className="mt-3 ml-6 bg-stone-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-amber-500 transition-colors"><Camera size={12}/> Mooie Quote-kaart maken</button>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex gap-2"><FileText size={16} className="text-stone-400 flex-shrink-0 mt-0.5"/><p className="text-sm text-stone-700 leading-relaxed">{note.text}</p></div>
                                                                )}
                                                                <p className="text-[10px] text-stone-400 mt-2 ml-6 text-right font-medium">{new Date(note.date).toLocaleDateString('nl-NL')} - {new Date(note.date).toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit'})}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: UITLEEN BEHEER */}
                                        {bookModalTab === 'uitleen' && (
                                            <div className="flex-1 flex flex-col">
                                                {selectedBook.lentTo ? (
                                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 text-center flex flex-col items-center justify-center h-full">
                                                        <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-inner"><UserCheck size={40}/></div>
                                                        <h4 className="text-2xl font-black text-blue-900 mb-1">Uitgeleend</h4>
                                                        <p className="text-blue-700 mb-6 font-medium">Dit boek is in het bezit van <strong className="font-black">{selectedBook.lentTo}</strong> sinds {selectedBook.lentDate}.</p>
                                                        <button onClick={handleReturnBook} className="bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-sm"><UserMinus size={18}/> Boek is teruggebracht</button>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm h-full flex flex-col">
                                                        <div className="mb-6">
                                                            <h4 className="text-xl font-black text-stone-800 mb-2 flex items-center gap-2"><Share2 className="text-blue-500"/> Leen dit boek uit</h4>
                                                            <p className="text-sm text-stone-500">Houd bij aan welke vriend(in) je dit fysieke boek hebt meegegeven.</p>
                                                        </div>
                                                        <form onSubmit={handleLendBook} className="space-y-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-stone-700 mb-1">Naam van persoon</label>
                                                                <input type="text" required value={lendData.name} onChange={e => setLendData({...lendData, name: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 bg-stone-50 outline-none focus:bg-white focus:border-blue-400 font-bold" placeholder="Bijv. Sarah" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-stone-700 mb-1">Datum uitgeleend</label>
                                                                <input type="date" required value={lendData.date} onChange={e => setLendData({...lendData, date: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 bg-stone-50 outline-none focus:bg-white focus:border-blue-400 font-bold text-stone-700" />
                                                            </div>
                                                            <button type="submit" disabled={!lendData.name} className="w-full mt-4 bg-blue-500 text-white font-black py-3 px-4 rounded-xl shadow-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">Uitlenen Bevestigen</button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mooie Quote-Kaart Screenshot Modal */}
            {quoteCard && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
                    <button onClick={() => setQuoteCard(null)} className="absolute top-6 right-6 text-white p-3 hover:bg-white/20 rounded-full transition"><X size={32}/></button>
                    
                    <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-8 text-center border-4 border-stone-800">
                        {/* Background */}
                        {quoteCard.cover ? (
                            <>
                                <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110" style={{ backgroundImage: `url(${quoteCard.cover})` }}></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-stone-900/80 to-stone-900"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-black"></div>
                        )}
                        
                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white w-full">
                            <Quote size={48} className="text-amber-400 mb-6 opacity-80"/>
                            <p className="text-xl sm:text-2xl font-serif italic font-medium leading-relaxed mb-6 break-words">"{quoteCard.text}"</p>
                            <div className="mt-auto pt-4 border-t border-white/20 w-3/4">
                                <p className="font-bold text-sm tracking-widest uppercase text-amber-400">{quoteCard.author}</p>
                                <p className="text-xs text-white/60 mt-1">{quoteCard.title}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-10 left-0 right-0 text-center animate-bounce">
                        <p className="text-white/70 text-sm font-bold bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur-md">✨ Maak een screenshot om te delen!</p>
                    </div>
                </div>
            )}

            {/* Add Shelf Modal met Kleuren */}
            {isShelfModalOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-stone-50 flex-shrink-0"><h3 className="text-2xl font-black">Nieuw Schap</h3></div>
                        <form onSubmit={handleAddShelf} className="p-6 overflow-y-auto hide-scrollbar">
                            <label className="block text-sm font-bold text-stone-700 mb-1">Naam</label>
                            <input type="text" required value={newShelf.name} onChange={e => setNewShelf({...newShelf, name: e.target.value})} className="w-full border-2 rounded-xl px-4 py-3 mb-4 font-bold bg-stone-50" placeholder="Bijv. Fantasy" />
                            
                            <label className="block text-sm font-bold text-stone-700 mb-1">Beschrijving (optioneel)</label>
                            <textarea value={newShelf.description} onChange={e => setNewShelf({...newShelf, description: e.target.value})} className="w-full border-2 rounded-xl px-4 py-3 mb-4 bg-stone-50 h-20 resize-none" placeholder="Waar is dit schap voor?" />
                            
                            <label className="block text-sm font-bold text-stone-700 mb-2">Kleur voor schap</label>
                            <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto hide-scrollbar p-1">
                                {SHELF_COLORS.map(c => (
                                    <button type="button" key={c} onClick={() => setNewShelf({...newShelf, color: c})} className={`w-8 h-8 rounded-full ${c} border-2 transition-transform ${newShelf.color === c ? 'border-stone-900 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}></button>
                                ))}
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-auto">
                                <button type="button" onClick={() => setIsShelfModalOpen(false)} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg">Aanmaken</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Shelf Modal met Kleuren */}
            {editShelfData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-stone-50 border-b border-stone-100 flex-shrink-0"><h3 className="text-2xl font-black">Schap Bewerken</h3></div>
                        <form onSubmit={handleUpdateShelf} className="p-6 overflow-y-auto hide-scrollbar">
                            <label className="block text-sm font-bold text-stone-700 mb-1">Naam</label>
                            <input type="text" required value={editShelfData.name} onChange={e => setEditShelfData({...editShelfData, name: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 mb-4 font-bold bg-stone-50" />
                            
                            <label className="block text-sm font-bold text-stone-700 mb-1">Beschrijving (optioneel)</label>
                            <textarea value={editShelfData.description} onChange={e => setEditShelfData({...editShelfData, description: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 mb-4 bg-stone-50 h-20 resize-none" placeholder="Waar is dit schap voor?" />
                            
                            <label className="block text-sm font-bold text-stone-700 mb-2">Kleur voor schap</label>
                            <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto hide-scrollbar p-1">
                                {SHELF_COLORS.map(c => (
                                    <button type="button" key={c} onClick={() => setEditShelfData({...editShelfData, color: c})} className={`w-8 h-8 rounded-full ${c} border-2 transition-transform ${editShelfData.color === c ? 'border-stone-900 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}></button>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 mt-auto"><button type="button" onClick={() => setEditShelfData({ isOpen: false, id: '', name: '', description: '', color: 'bg-amber-500' })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button><button type="submit" className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg">Opslaan</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Camera Scanner Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4 z-[100] backdrop-blur-md"><div className="w-full max-w-md bg-stone-900 rounded-3xl overflow-hidden border border-stone-800"><div className="p-5 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Camera size={20}/> Scan Barcode</h3><button onClick={() => setIsScannerOpen(false)} className="p-2 rounded-full hover:bg-stone-800"><X size={24}/></button></div><div id="reader" className="w-full bg-black min-h-[300px]"></div></div></div>
            )}
        </div>
    );
}

function BookList({ books, onSelect, isDragMode, onDragStart }) {
    return (
        <React.Fragment>
            {books.map(book => {
                const progress = book.totalPages > 0 ? Math.min(100, Math.round((book.pagesRead / book.totalPages) * 100)) : 0;
                const isFinished = progress === 100 && book.totalPages > 0;
                return (
                    <div 
                        key={book.id} 
                        draggable={isDragMode}
                        onDragStart={(e) => isDragMode && onDragStart(e, book.id)}
                        className={`group relative flex flex-col transition-all hover:-translate-y-2 ${isDragMode ? 'cursor-move animate-pulse-slow ring-2 ring-amber-500 rounded-2xl bg-white p-1' : 'cursor-pointer'}`} 
                        onClick={() => !isDragMode && onSelect(book)}
                    >
                        <div className="aspect-[2/3] bg-stone-200 rounded-2xl overflow-hidden shadow-md mb-2 relative border border-stone-200/50">
                            {book.cover && !book.cover.includes('placeholder') ? (<img src={book.cover} alt={book.title} className="w-full h-full object-cover" draggable="false" />) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br p-2 text-center"><Book className="text-stone-300 mb-1" size={24} /></div>)}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/90 to-transparent p-1 pt-6 transform translate-y-full group-hover:translate-y-0 transition-transform"><p className="text-[9px] sm:text-[10px] text-white font-bold text-center">{book.pagesRead} / {book.totalPages || '?'} p.</p></div>
                            {isFinished && (<div className="absolute top-1.5 right-1.5 bg-green-500 text-white p-1 rounded-full shadow-md"><Check size={12} strokeWidth={4} /></div>)}
                            {book.shelfId === 'wishlist' && (<div className="absolute top-1.5 left-1.5 bg-amber-500 text-white p-1 rounded-full"><Star size={12} fill="white" strokeWidth={0} /></div>)}
                            {book.lentTo && !isFinished && (<div className="absolute top-1.5 right-1.5 bg-blue-500 text-white p-1 rounded-full shadow-md"><UserCheck size={12} strokeWidth={3} /></div>)}
                            {isDragMode && (<div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center backdrop-blur-[1px]"><GripVertical size={32} className="text-white drop-shadow-md"/></div>)}
                        </div>
                        {!isDragMode && <div className="w-full bg-stone-200/80 rounded-full h-1 mb-1"><div className={`h-full rounded-full ${isFinished ? 'bg-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${progress}%` }}></div></div>}
                        <h4 className="font-bold text-[10px] sm:text-xs text-stone-800 leading-tight line-clamp-2">{book.title}</h4>
                    </div>
                );
            })}
        </React.Fragment>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<BoekenApp />);
