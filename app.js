import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import { 
    BookOpen, Plus, Library, Flame, Settings, Share2, 
    CheckCircle2, X, Trash2, Edit3, Camera, Search, Book, 
    BarChart, AlertCircle, Check, Info, LogOut, Users, Shield, ArrowLeftRight,
    Menu, History, Calendar, ChevronLeft, ChevronRight, CalendarDays, UserX, Save,
    ArrowUp, ArrowDown, Star, BookmarkPlus, GripVertical, Move, Loader2,
    Quote, FileText, Send, UserCheck, UserMinus, Clock, ChevronDown, ChevronUp, Tag,
    Headphones, Tablet, Play, Square, Upload, FileUp, Filter, Copy, SendToBack
} from 'https://esm.sh/lucide-react@0.292.0';

import Papa from 'https://esm.sh/papaparse@5.4.1';
import Tesseract from 'https://esm.sh/tesseract.js@5.0.5';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDocs, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

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

const isYesterday = (d) => { if (!d) return false; const date = new Date(d); const y = new Date(); y.setDate(y.getDate() - 1); return date.toDateString() === y.toDateString(); };
const isToday = (d) => { if (!d) return false; return new Date(d).toDateString() === new Date().toDateString(); };
const getTodayString = () => new Date().toISOString().split('T')[0]; 
const toDateString = (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SHELF_COLORS = [
    'bg-black', 'bg-stone-900', 'bg-zinc-900', 'bg-slate-900',
    'bg-slate-500', 'bg-zinc-500', 'bg-stone-500', 'bg-gray-500',
    'bg-slate-300', 'bg-zinc-300', 'bg-stone-300', 'bg-gray-200', 'bg-white',
    'bg-orange-900', 'bg-amber-900', 'bg-yellow-900', 'bg-stone-700', 'bg-stone-800', 'bg-orange-800',
    'bg-red-200', 'bg-orange-200', 'bg-amber-200', 'bg-yellow-200', 
    'bg-lime-200', 'bg-green-200', 'bg-emerald-200', 'bg-teal-200', 
    'bg-cyan-200', 'bg-sky-200', 'bg-blue-200', 'bg-indigo-200', 
    'bg-violet-200', 'bg-purple-200', 'bg-fuchsia-200', 'bg-pink-200', 'bg-rose-200',
    'bg-red-400', 'bg-red-500', 'bg-red-600',
    'bg-orange-400', 'bg-orange-500', 'bg-orange-600',
    'bg-amber-400', 'bg-amber-500', 'bg-amber-600',
    'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600',
    'bg-lime-400', 'bg-lime-500', 'bg-lime-600',
    'bg-green-400', 'bg-green-500', 'bg-green-600',
    'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600',
    'bg-teal-400', 'bg-teal-500', 'bg-teal-600',
    'bg-cyan-400', 'bg-cyan-500', 'bg-cyan-600',
    'bg-sky-400', 'bg-sky-500', 'bg-sky-600',
    'bg-blue-400', 'bg-blue-500', 'bg-blue-600',
    'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600',
    'bg-violet-400', 'bg-violet-500', 'bg-violet-600',
    'bg-purple-400', 'bg-purple-500', 'bg-purple-600',
    'bg-fuchsia-400', 'bg-fuchsia-500', 'bg-fuchsia-600',
    'bg-pink-400', 'bg-pink-500', 'bg-pink-600',
    'bg-rose-400', 'bg-rose-500', 'bg-rose-600'
];

const CHANGELOG = [
    { version: "25.0.0", date: "Oktober 2026", changes: ["Alle bewerk- en deelfuncties voor schappen en bibliotheken volledig hersteld!", "Database error-preventie ingebouwd."] },
    { version: "24.0.0", date: "Oktober 2026", changes: ["Optie toegevoegd voor Admins om bij het pushen van schappen te kiezen of ze de boeken óók mee willen pushen, of enkel een leeg schap willen overzetten."] },
    { version: "23.0.0", date: "Oktober 2026", changes: ["Admins kunnen nu volledige Schappen (inclusief alle boeken) én Bibliotheken met één klik pushen naar andere gebruikers!"] },
    { version: "22.0.0", date: "Oktober 2026", changes: ["'Bibliotheken' toegevoegd! Maak uitleenlocaties aan met eigen kleuren.", "Het 'Geleend' label toont nu de naam van de specifieke bibliotheek (in hun kleur) of vriend(in)."] },
    { version: "21.0.0", date: "Oktober 2026", changes: ["'Samenvoegen' functionaliteit toegevoegd voor Admins: bekijk boeken van andere gebruikers naadloos samen met je eigen boeken, met duidelijke labels.", "Topbalk verwijderd en Admin-menu verplaatst naar de zijbalk."] }
];

function ReadingTimer({ book, onSave }) {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [endPage, setEndPage] = useState(book.pagesRead || 0);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ':' : ''}${h > 0 && m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const unit = book.format === 'audio' ? 'minuut' : 'pagina';

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl h-full border border-stone-200 shadow-inner">
            <div className="text-5xl sm:text-7xl font-black text-amber-500 mb-8 font-mono tracking-wider drop-shadow-sm">{formatTime(seconds)}</div>
            <div className="flex gap-4 mb-6">
                {!isRunning ? (
                    <button onClick={() => setIsRunning(true)} className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"><Play fill="currentColor" size={32}/></button>
                ) : (
                    <button onClick={() => setIsRunning(false)} className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"><Square fill="currentColor" size={32}/></button>
                )}
            </div>
            
            {!isRunning && seconds > 0 && (
                <div className="w-full max-w-xs bg-white p-5 rounded-2xl shadow-xl border border-stone-200 text-center animate-fade-in mt-4">
                    <p className="font-bold text-stone-700 mb-3">Op welke {unit} ben je gestopt?</p>
                    <input type="number" value={endPage} onChange={e => setEndPage(e.target.value)} className="w-full text-3xl font-black text-center border-2 border-stone-200 rounded-xl py-3 mb-4 bg-stone-50 focus:bg-white outline-none focus:border-amber-400 transition-colors" />
                    <div className="flex gap-2">
                        <button onClick={() => {setSeconds(0); setIsRunning(false); setEndPage(book.pagesRead);}} className="flex-1 px-3 py-3 text-stone-500 font-bold hover:bg-stone-100 rounded-xl text-sm transition-colors">Wissen</button>
                        <button onClick={() => onSave(endPage, seconds)} className="flex-1 px-3 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-md text-sm hover:bg-amber-600 transition-colors">Opslaan</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function BoekenApp() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [allUsers, setAllUsers] = useState([]);
    const [dbError, setDbError] = useState(false);

    const [impersonatedUser, setImpersonatedUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    
    // Essentiële variabele die bugs voorkomt
    const activeUserId = impersonatedUser ? impersonatedUser.uid : (user ? user.uid : null);

    const [myBooks, setMyBooks] = useState([]);
    const [myShelves, setMyShelves] = useState([]);
    const [myLogs, setMyLogs] = useState([]);
    const [myLibraries, setMyLibraries] = useState([]);
    const [myStats, setMyStats] = useState({ currentStreak: 0, lastReadDate: null });

    const [impBooks, setImpBooks] = useState([]);
    const [impShelves, setImpShelves] = useState([]);
    const [impLogs, setImpLogs] = useState([]);
    const [impLibraries, setImpLibraries] = useState([]);

    const books = [...myBooks, ...impBooks];
    const shelves = [...myShelves, ...impShelves];
    const readingLogs = [...myLogs, ...impLogs];
    const allLibraries = [...myLibraries, ...impLibraries];
    const stats = myStats; 
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('az'); 

    const [activeTab, setActiveTab] = useState('alle');
    const [expandedShelves, setExpandedShelves] = useState([]); 
    
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    const [selectedBook, setSelectedBook] = useState(null); 
    const [bookModalTab, setBookModalTab] = useState('overzicht');
    const [isEditingBook, setIsEditingBook] = useState(false);
    const [editBookData, setEditBookData] = useState(null);
    const [newNote, setNewNote] = useState({ text: '', type: 'quote' });
    const [lendData, setLendData] = useState({ name: '', date: getTodayString() });
    const [quoteCard, setQuoteCard] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [apiLimitError, setApiLimitError] = useState(false); 
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState('');

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, text: '', action: null });
    const [isDragMode, setIsDragMode] = useState(false);

    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [calendarLogData, setCalendarLogData] = useState({ isOpen: false, dateStr: '', bookId: '', pagesRead: '' });
    const [shareShelfData, setShareShelfData] = useState({ isOpen: false, shelfId: '', shelfName: '', email: '', loading: false, msg: '' });
    const [streakWeekOffset, setStreakWeekOffset] = useState(0);

    const [titleSuggestions, setTitleSuggestions] = useState([]);
    const [isSearchingTitle, setIsSearchingTitle] = useState(false);

    const initialBookState = { title: '', author: '', shelfId: '', cover: '', isbn: '', totalPages: '', pagesRead: 0, tags: '', format: 'fysiek', seriesName: '', seriesNumber: '', isBorrowed: false, borrowedLibraryId: '', borrowedPerson: '' };
    const [newBook, setNewBook] = useState(initialBookState);
    const [newShelf, setNewShelf] = useState({ name: '', description: '', color: 'bg-amber-500', tags: '' });
    const [editShelfData, setEditShelfData] = useState({ isOpen: false, id: '', name: '', description: '', color: 'bg-amber-500', tags: '', _ownerUid: '' });
    
    const [newLibrary, setNewLibrary] = useState({ name: '', color: 'bg-blue-500' });
    const [editLibraryData, setEditLibraryData] = useState({ isOpen: false, id: '', name: '', color: 'bg-blue-500', _ownerUid: '' });

    const [isImporting, setIsImporting] = useState(false);
    const [importStats, setImportStats] = useState({ total: 0, current: 0 });
    const fileInputRef = useRef(null);
    const fileInputRefOcr = useRef(null);
    const searchTimeoutRef = useRef(null);

    const [allowEmailInput, setAllowEmailInput] = useState('');
    const [viewingPublicUser, setViewingPublicUser] = useState(null);
    const [publicBooks, setPublicBooks] = useState([]);
    const [publicShelves, setPublicShelves] = useState([]);
    const [publicLibraries, setPublicLibraries] = useState([]);
    const [copyBookData, setCopyBookData] = useState({ isOpen: false, book: null, targetShelfId: '' });

    const [adminPushData, setAdminPushData] = useState({ isOpen: false, type: 'book', item: null, targetUid: '', targetShelfId: '', includeBooks: true });
    const [adminPushShelves, setAdminPushShelves] = useState([]);

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
        if (!user) return;
        const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'books'), s => setMyBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        const unsubShelves = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'shelves'), s => setMyShelves(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'readingLog'), s => setMyLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        const unsubLibraries = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'libraries'), s => setMyLibraries(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error);
        const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), d => { 
            if(d.exists()) setMyStats(d.data()); else setMyStats({ currentStreak: 0, lastReadDate: null });
        }, console.error);
        
        return () => { unsubBooks(); unsubShelves(); unsubLogs(); unsubLibraries(); unsubStats(); };
    }, [user]);

    useEffect(() => {
        if (!impersonatedUser || !user || impersonatedUser.uid === user.uid) {
            setImpBooks([]); setImpShelves([]); setImpLogs([]); setImpLibraries([]); return;
        }
        const unsubBooks = onSnapshot(collection(db, 'artifacts', appId, 'users', impersonatedUser.uid, 'books'), s => setImpBooks(s.docs.map(d => ({ id: d.id, ...d.data(), _owner: impersonatedUser.name, _ownerUid: impersonatedUser.uid }))), console.error);
        const unsubShelves = onSnapshot(collection(db, 'artifacts', appId, 'users', impersonatedUser.uid, 'shelves'), s => setImpShelves(s.docs.map(d => ({ id: d.id, ...d.data(), _owner: impersonatedUser.name, _ownerUid: impersonatedUser.uid }))), console.error);
        const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', impersonatedUser.uid, 'readingLog'), s => setImpLogs(s.docs.map(d => ({ id: d.id, ...d.data(), _owner: impersonatedUser.name, _ownerUid: impersonatedUser.uid }))), console.error);
        const unsubLibraries = onSnapshot(collection(db, 'artifacts', appId, 'users', impersonatedUser.uid, 'libraries'), s => setImpLibraries(s.docs.map(d => ({ id: d.id, ...d.data(), _ownerUid: impersonatedUser.uid }))), console.error);

        return () => { unsubBooks(); unsubShelves(); unsubLogs(); unsubLibraries(); };
    }, [impersonatedUser, user]);

    useEffect(() => {
        if (!viewingPublicUser) {
            setPublicBooks([]); setPublicShelves([]); setPublicLibraries([]); return;
        }
        const unsubPubBooks = onSnapshot(collection(db, 'artifacts', appId, 'users', viewingPublicUser.uid, 'books'), s => setPublicBooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubPubShelves = onSnapshot(collection(db, 'artifacts', appId, 'users', viewingPublicUser.uid, 'shelves'), s => setPublicShelves(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubPubLibraries = onSnapshot(collection(db, 'artifacts', appId, 'users', viewingPublicUser.uid, 'libraries'), s => setPublicLibraries(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        
        return () => { unsubPubBooks(); unsubPubShelves(); unsubPubLibraries(); };
    }, [viewingPublicUser]);

    useEffect(() => {
        if (user) {
            const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), s => setAllUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))), console.error);
            return () => unsubUsers();
        } else {
            setAllUsers([]);
        }
    }, [user]);

    useEffect(() => {
        if(adminPushData.targetUid && adminPushData.type === 'book') {
            getDocs(collection(db, 'artifacts', appId, 'users', adminPushData.targetUid, 'shelves')).then(snap => {
                setAdminPushShelves(snap.docs.map(d => ({id: d.id, ...d.data()})));
            });
        } else {
            setAdminPushShelves([]);
        }
    }, [adminPushData.targetUid, adminPushData.type]);

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
        await setDoc(userRef, { name: profileForm.name, email: profileForm.email.toLowerCase(), role: isAdmin ? 'admin' : 'user', allowedCopiers: [], createdAt: new Date().toISOString() });
    };

    const handleLogout = async () => { await signOut(auth); setActiveTab('alle'); };
    
    const requestConfirm = (text, action) => setConfirmDialog({ isOpen: true, text, action });
    const executeConfirm = () => { if (confirmDialog.action) confirmDialog.action(); setConfirmDialog({ isOpen: false, text: '', action: null }); };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
    };

    const handleAddAllowedUser = async (e) => {
        e.preventDefault();
        if (!allowEmailInput || !userData) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
                allowedCopiers: arrayUnion(allowEmailInput.toLowerCase())
            });
            setAllowEmailInput('');
            showToast("Gebruiker toegevoegd aan je toegangslijst!");
        } catch (err) { showToast("Fout bij toevoegen", "error"); }
    };

    const handleRemoveAllowedUser = async (emailToRemove) => {
        if (!userData) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
                allowedCopiers: arrayRemove(emailToRemove)
            });
            showToast("Toegang ingetrokken.", "info");
        } catch (err) {}
    };

    const handleCopyBookConfirm = async (e) => {
        e.preventDefault();
        if (!user || !copyBookData.book || !copyBookData.targetShelfId) return;
        
        const bookToCopy = copyBookData.book;
        const newBookData = {
            title: bookToCopy.title || 'Onbekend',
            author: bookToCopy.author || 'Onbekend',
            cover: bookToCopy.cover || '',
            isbn: bookToCopy.isbn || '',
            totalPages: parseInt(bookToCopy.totalPages) || 0,
            tags: bookToCopy.tags || '',
            format: bookToCopy.format || 'fysiek',
            seriesName: bookToCopy.seriesName || '',
            seriesNumber: bookToCopy.seriesNumber || '',
            shelfId: copyBookData.targetShelfId,
            pagesRead: 0,
            rating: 0,
            review: '',
            notes: [],
            lentTo: null,
            lentDate: null,
            isBorrowed: false,
            borrowedLibraryId: '',
            borrowedPerson: '',
            addedAt: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'books'), newBookData);
            setCopyBookData({ isOpen: false, book: null, targetShelfId: '' });
            showToast(`"${newBookData.title}" is gekopieerd naar je bibliotheek!`);
        } catch (err) {
            showToast("Er ging iets mis met kopiëren.", "error");
        }
    };

    const handleAdminPushConfirm = async (e) => {
        e.preventDefault();
        if (!userData || userData.role !== 'admin' || !adminPushData.item || !adminPushData.targetUid) return;

        try {
            if (adminPushData.type === 'book') {
                if (!adminPushData.targetShelfId) return;
                const bookToCopy = adminPushData.item;
                const newBookData = {
                    title: bookToCopy.title || 'Onbekend',
                    author: bookToCopy.author || 'Onbekend',
                    cover: bookToCopy.cover || '',
                    isbn: bookToCopy.isbn || '',
                    totalPages: parseInt(bookToCopy.totalPages) || 0,
                    tags: bookToCopy.tags || '',
                    format: bookToCopy.format || 'fysiek',
                    seriesName: bookToCopy.seriesName || '',
                    seriesNumber: bookToCopy.seriesNumber || '',
                    shelfId: adminPushData.targetShelfId,
                    pagesRead: 0,
                    rating: 0,
                    review: '',
                    notes: [],
                    lentTo: null,
                    lentDate: null,
                    isBorrowed: false,
                    borrowedLibraryId: '',
                    borrowedPerson: '',
                    addedAt: new Date().toISOString()
                };
                await addDoc(collection(db, 'artifacts', appId, 'users', adminPushData.targetUid, 'books'), newBookData);
                showToast(`Boek succesvol naar de gebruiker gepusht!`);
            } 
            else if (adminPushData.type === 'shelf') {
                const shelfToCopy = adminPushData.item;
                
                const newShelfRef = await addDoc(collection(db, 'artifacts', appId, 'users', adminPushData.targetUid, 'shelves'), {
                    name: shelfToCopy.name,
                    description: shelfToCopy.description || '',
                    color: shelfToCopy.color || 'bg-amber-500',
                    tags: shelfToCopy.tags || '',
                    order: 99,
                    createdAt: new Date().toISOString()
                });
                
                if (adminPushData.includeBooks) {
                    const ownerUid = shelfToCopy._ownerUid || user.uid;
                    const booksToCopy = books.filter(b => b.shelfId === shelfToCopy.id && (b._ownerUid === ownerUid || (!b._ownerUid && ownerUid === user.uid)));
                    
                    for (const b of booksToCopy) {
                        await addDoc(collection(db, 'artifacts', appId, 'users', adminPushData.targetUid, 'books'), {
                            title: b.title || 'Onbekend',
                            author: b.author || 'Onbekend',
                            cover: b.cover || '',
                            isbn: b.isbn || '',
                            totalPages: parseInt(b.totalPages) || 0,
                            tags: b.tags || '',
                            format: b.format || 'fysiek',
                            seriesName: b.seriesName || '',
                            seriesNumber: b.seriesNumber || '',
                            shelfId: newShelfRef.id, 
                            pagesRead: 0,
                            rating: 0,
                            review: '',
                            notes: [],
                            lentTo: null,
                            lentDate: null,
                            isBorrowed: false,
                            borrowedLibraryId: '',
                            borrowedPerson: '',
                            addedAt: new Date().toISOString()
                        });
                    }
                    showToast(`Schap mét boeken succesvol gepusht!`);
                } else {
                    showToast(`Leeg schap succesvol gepusht!`);
                }
            }
            else if (adminPushData.type === 'library') {
                const libToCopy = adminPushData.item;
                await addDoc(collection(db, 'artifacts', appId, 'users', adminPushData.targetUid, 'libraries'), {
                    name: libToCopy.name,
                    color: libToCopy.color || 'bg-blue-500',
                    createdAt: new Date().toISOString()
                });
                showToast(`Bibliotheek locatie succesvol gepusht!`);
            }

            setAdminPushData({ isOpen: false, type: 'book', item: null, targetUid: '', targetShelfId: '', includeBooks: true });
        } catch(err) {
            showToast("Fout bij pushen.", "error");
        }
    };

    const handlePhotoScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setIsOcrLoading(true);
        setErrorMsg('');
        setTitleSuggestions([]);
        setOcrProgress('Kaft analyseren met AI...');
        
        try {
            const result = await Tesseract.recognize(file, 'nld+eng', {
                logger: m => {
                    if(m.status === 'recognizing text') {
                        setOcrProgress(`Tekst lezen: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            
            const rawText = result.data.text || '';
            let cleanText = rawText.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
            if(cleanText.length > 60) cleanText = cleanText.substring(0, 60);

            if(cleanText.length > 3) {
                setNewBook(p => ({...p, title: cleanText}));
                setOcrProgress('Zoeken in database...');
                await performBookSearch(cleanText);
                setOcrProgress('Kies het juiste boek hieronder!');
            } else {
                setErrorMsg('Oeps! Kon geen duidelijke titel op de kaft vinden. Zorg voor genoeg licht.');
                setOcrProgress('');
            }
        } catch (err) {
            console.error('OCR Error:', err);
            setErrorMsg('Er ging iets mis met het analyseren van de foto.');
            setOcrProgress('');
        }
        setIsOcrLoading(false);
        e.target.value = ''; 
    };

    const performBookSearch = async (query) => {
        if (!query || query.length < 3) {
            setTitleSuggestions([]);
            return;
        }
        setIsSearchingTitle(true);
        setApiLimitError(false);
        
        let combinedResults = [];
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
            if (res.status === 429) {
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
            const res = await fetch(`https://search.openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=4`);
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
    };

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
        
        searchTimeoutRef.current = setTimeout(() => {
            performBookSearch(q);
        }, 1200); 
    };

    const selectTitleSuggestion = (item) => {
        setNewBook(p => ({ ...p, title: item.title || p.title, author: item.author || p.author, totalPages: item.totalPages || p.totalPages, cover: item.cover || p.cover }));
        setTitleSuggestions([]);
        setOcrProgress(''); 
    };

    const toggleShelf = (shelfId) => {
        setExpandedShelves(prev => prev.includes(shelfId) ? prev.filter(id => id !== shelfId) : [...prev, shelfId]);
    };

    const handleAddShelf = async (e) => {
        e.preventDefault(); if (!activeUserId || !newShelf.name) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'shelves'), { ...newShelf, color: newShelf.color || 'bg-amber-500', tags: newShelf.tags || '', order: myShelves.length, createdAt: new Date().toISOString() });
        setNewShelf({ name: '', description: '', color: 'bg-amber-500', tags: '' }); setIsShelfModalOpen(false);
        showToast("Nieuw schap toegevoegd!");
    };

    const handleUpdateShelf = async (e) => {
        e.preventDefault(); if(!activeUserId || !editShelfData.id) return;
        const ownerUid = editShelfData._ownerUid || activeUserId;
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'shelves', editShelfData.id), { name: editShelfData.name, description: editShelfData.description, color: editShelfData.color, tags: editShelfData.tags || '' });
        setEditShelfData({ isOpen: false, id: '', name: '', description: '', color: 'bg-amber-500', tags: '', _ownerUid: '' });
        showToast("Schap succesvol bewerkt!");
    };

    const handleAddLibrary = async (e) => {
        e.preventDefault(); if (!activeUserId || !newLibrary.name) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'libraries'), { ...newLibrary, color: newLibrary.color || 'bg-blue-500', createdAt: new Date().toISOString() });
        setNewLibrary({ name: '', color: 'bg-blue-500' }); setIsLibraryModalOpen(false);
        showToast("Bibliotheek toegevoegd!");
    };

    const handleUpdateLibrary = async (e) => {
        e.preventDefault(); if(!activeUserId || !editLibraryData.id) return;
        const ownerUid = editLibraryData._ownerUid || activeUserId;
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'libraries', editLibraryData.id), { name: editLibraryData.name, color: editLibraryData.color });
        setEditLibraryData({ isOpen: false, id: '', name: '', color: 'bg-blue-500', _ownerUid: '' });
        showToast("Bibliotheek succesvol bewerkt!");
    };

    const handleDeleteLibrary = async (id, name, ownerUid) => {
         if (!activeUserId) return;
         const targetUid = ownerUid || activeUserId;
         requestConfirm(`Bibliotheek "${name}" definitief verwijderen?`, async () => { 
             await deleteDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'libraries', id)); 
             showToast("Bibliotheek verwijderd.", "info");
         });
    };

    const handleAddBook = async (e) => {
        e.preventDefault(); if (!activeUserId || !newBook.title || !newBook.shelfId) return;
        
        let targetUid = activeUserId;
        if (newBook.shelfId !== 'wishlist') {
            const selectedShelf = shelves.find(s => s.id === newBook.shelfId);
            if (selectedShelf && selectedShelf._ownerUid) targetUid = selectedShelf._ownerUid;
        }

        await addDoc(collection(db, 'artifacts', appId, 'users', targetUid, 'books'), { 
            ...newBook, 
            author: newBook.author || 'Onbekend', 
            totalPages: parseInt(newBook.totalPages) || 0, 
            pagesRead: parseInt(newBook.pagesRead) || 0, 
            tags: newBook.tags || '',
            format: newBook.format || 'fysiek',
            seriesName: newBook.seriesName || '',
            seriesNumber: newBook.seriesNumber || '',
            isBorrowed: newBook.isBorrowed || false,
            borrowedLibraryId: newBook.borrowedLibraryId || '',
            borrowedPerson: newBook.borrowedPerson || '',
            rating: 0, 
            review: '', 
            notes: [],
            lentTo: null,
            lentDate: null,
            addedAt: new Date().toISOString() 
        });
        setNewBook(initialBookState); setIsBookModalOpen(false); setTitleSuggestions([]); setOcrProgress('');
        showToast("Boek toegevoegd aan bibliotheek!");
    };

    const handleUpdateBookDetails = async (e) => {
        e.preventDefault(); if (!activeUserId || !editBookData.id) return;
        const ownerUid = editBookData._ownerUid || activeUserId;
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', editBookData.id), { 
            title: editBookData.title, 
            author: editBookData.author, 
            cover: editBookData.cover, 
            tags: editBookData.tags || '', 
            format: editBookData.format || 'fysiek',
            seriesName: editBookData.seriesName || '',
            seriesNumber: editBookData.seriesNumber || '',
            totalPages: parseInt(editBookData.totalPages) || 0, 
            shelfId: editBookData.shelfId,
            isBorrowed: editBookData.isBorrowed || false,
            borrowedLibraryId: editBookData.borrowedLibraryId || '',
            borrowedPerson: editBookData.borrowedPerson || ''
        });
        setSelectedBook(p => ({...p, ...editBookData})); setIsEditingBook(false);
        showToast("Boekgegevens succesvol bijgewerkt!");
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault(); if (!activeUserId || !selectedBook) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        const bookRef = doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id);
        const newPages = parseInt(selectedBook.pagesRead) || 0;
        await updateDoc(bookRef, { pagesRead: newPages });
        
        const orig = books.find(b => b.id === selectedBook.id);
        if (newPages > (orig?.pagesRead || 0)) {
            const todayStr = getTodayString();
            await setDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'readingLog', `${todayStr}_${selectedBook.id}`), { date: todayStr, bookId: selectedBook.id, title: selectedBook.title, cover: selectedBook.cover || null }, { merge: true });
        }
        
        setSelectedBook(p => ({...p, pagesRead: newPages}));
        showToast("Leesvoortgang opgeslagen!");
    };
    
    const handleUpdateReview = async () => {
        if (!activeUserId || !selectedBook) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id), { rating: selectedBook.rating || 0, review: selectedBook.review || '' });
        showToast("Jouw beoordeling is opgeslagen!");
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!activeUserId || !selectedBook || !newNote.text) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        const updatedNotes = [...(selectedBook.notes || []), { ...newNote, date: new Date().toISOString(), id: Date.now().toString() }];
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id), { notes: updatedNotes });
        setSelectedBook({...selectedBook, notes: updatedNotes});
        setNewNote({ text: '', type: 'quote' });
        showToast("Notitie succesvol toegevoegd!");
    };

    const handleDeleteNote = async (noteId) => {
        if (!activeUserId || !selectedBook) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        requestConfirm("Weet je zeker dat je deze notitie wilt verwijderen?", async () => {
            const updatedNotes = (selectedBook.notes || []).filter(n => n.id !== noteId);
            await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id), { notes: updatedNotes });
            setSelectedBook({...selectedBook, notes: updatedNotes});
            showToast("Notitie verwijderd.", "info");
        });
    };

    const handleLendBook = async (e) => {
        e.preventDefault();
        if (!activeUserId || !selectedBook || !lendData.name) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id), { lentTo: lendData.name, lentDate: lendData.date });
        setSelectedBook({...selectedBook, lentTo: lendData.name, lentDate: lendData.date});
        setLendData({ name: '', date: getTodayString() });
        showToast(`Boek uitgeleend aan ${lendData.name}!`);
    };

    const handleReturnBook = async () => {
        if (!activeUserId || !selectedBook) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id), { lentTo: null, lentDate: null });
        setSelectedBook({...selectedBook, lentTo: null, lentDate: null});
        showToast("Boek is weer terug!");
    };

    const handleDeleteBook = async () => {
        if (!activeUserId || !selectedBook) return;
        const ownerUid = selectedBook._ownerUid || activeUserId;
        requestConfirm(`Weet je zeker dat je "${selectedBook.title}" wilt verwijderen?`, async () => {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id)); setSelectedBook(null);
            showToast("Boek definitief verwijderd.", "info");
        });
    };

    const handleDeleteShelf = async (shelfId, shelfName, ownerUid) => {
         if (!activeUserId) return;
         const targetUid = ownerUid || activeUserId;
         const shelfBooks = books.filter(b => b.shelfId === shelfId);
         if(shelfBooks.length > 0) { requestConfirm(`Let op: Er zitten nog ${shelfBooks.length} boeken in "${shelfName}". Verwijder of verplaats deze eerst!`, () => {}); return; }
         requestConfirm(`Schap "${shelfName}" definitief verwijderen?`, async () => { 
             await deleteDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'shelves', shelfId)); 
             showToast("Schap definitief verwijderd.", "info");
         });
    };

    const handleMoveShelf = async (index, direction) => {
        if (!activeUserId) return;
        const sortedMyShelves = [...myShelves].sort((a, b) => (a.order || 0) - (b.order || 0));
        if (index + direction < 0 || index + direction >= sortedMyShelves.length) return;
        
        const temp = sortedMyShelves[index];
        sortedMyShelves[index] = sortedMyShelves[index + direction];
        sortedMyShelves[index + direction] = temp;
        
        for (let i = 0; i < sortedMyShelves.length; i++) {
            if (sortedMyShelves[i].order !== i) {
                await updateDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'shelves', sortedMyShelves[i].id), { order: i });
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
            const book = books.find(b => b.id === bookId);
            if(!book) return;
            const ownerUid = book._ownerUid || activeUserId;
            await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', bookId), { shelfId });
            setIsDragMode(false); 
            showToast("Boek succesvol verplaatst!");
        }
    };

    const handleShareShelfSubmit = async (e) => {
        e.preventDefault();
        setShareShelfData(p => ({...p, loading: true, msg: ''}));
        try {
            let targetUid = null;
            allUsers.forEach(d => { if (d.email.toLowerCase() === shareShelfData.email.toLowerCase()) targetUid = d.uid; });
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
            showToast(`Schap succesvol gedeeld met ${shareShelfData.email}!`);
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
                showToast(`Schap wordt niet meer gedeeld met ${shareObj.email}.`, "info");
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
        const targetUid = book._ownerUid || activeUserId;

        const newPages = parseInt(calendarLogData.pagesRead);
        if (!isNaN(newPages) && newPages !== parseInt(book.pagesRead)) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'books', book.id), { pagesRead: newPages });
        }

        await setDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'readingLog', `${calendarLogData.dateStr}_${book.id}`), { date: calendarLogData.dateStr, bookId: book.id, title: book.title, cover: book.cover || null }, { merge: true });
        
        setCalendarLogData({ isOpen: false, dateStr: '', bookId: '', pagesRead: '' });
        showToast("Leessessie en voortgang opgeslagen in je kalender!");
    };

    const handleDeleteLog = async (logId, ownerUid) => {
        if (!activeUserId) return;
        const targetUid = ownerUid || activeUserId;
        requestConfirm("Weet je zeker dat je dit boek van deze dag wilt verwijderen?", async () => {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'readingLog', logId));
            showToast("Log succesvol verwijderd uit de kalender.", "info");
        });
    };

    const handleUndoLogReading = async () => {
        if (!activeUserId) return;
        requestConfirm("Heb je je vergist en wil je de lees-streak van vandaag ongedaan maken?", async () => {
            const todayStr = getTodayString();
            const logsToDelete = myLogs.filter(log => log.date === todayStr);
            for (const log of logsToDelete) {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', activeUserId, 'readingLog', log.id));
            }
            showToast("Lees-streak geannuleerd.", "info");
        });
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file || !activeUserId) return;
        setIsImporting(true);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data;
                setImportStats({ total: rows.length, current: 0 });
                
                let importedShelfId = '';
                const existingShelf = myShelves.find(s => s.name.toLowerCase() === 'geïmporteerd' || s.name.toLowerCase() === 'imported');
                if (existingShelf) {
                    importedShelfId = existingShelf.id;
                } else {
                    try {
                        const newShelfRef = await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'shelves'), {
                            name: 'Geïmporteerd', description: 'Boeken toegevoegd via CSV import', color: 'bg-blue-500', order: myShelves.length, createdAt: new Date().toISOString()
                        });
                        importedShelfId = newShelfRef.id;
                    } catch(e) {
                        console.error("Fout bij aanmaken schap", e);
                        setIsImporting(false);
                        return;
                    }
                }

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    
                    const title = row['Title'] || row['titel'] || row['Boektitel'] || row['book_title'] || 'Onbekend Boek';
                    const author = row['Author'] || row['Auteur'] || row['author_name'] || 'Onbekende Auteur';
                    const isbn = row['ISBN13'] || row['ISBN'] || row['isbn'] || '';
                    const totalPagesStr = row['Number of Pages'] || row['Pages'] || row['Pagina\'s'] || row['pages'] || '0';
                    const totalPages = parseInt(String(totalPagesStr).replace(/[^0-9]/g, '')) || 0;
                    
                    const ratingStr = row['My Rating'] || row['Rating'] || row['rating'] || '0';
                    const rating = parseInt(ratingStr) || 0;
                    const review = row['My Review'] || row['Review'] || row['review'] || '';
                    
                    const tags = row['Bookshelves'] || row['Tags'] || row['genres'] || '';

                    await addDoc(collection(db, 'artifacts', appId, 'users', activeUserId, 'books'), {
                        title,
                        author,
                        isbn: String(isbn).replace(/[^0-9X]/gi, ''),
                        totalPages,
                        pagesRead: rating > 0 ? totalPages : 0,
                        rating,
                        review,
                        shelfId: importedShelfId,
                        cover: '',
                        tags: String(tags).replace(/,/g, ', '),
                        format: 'fysiek',
                        addedAt: new Date().toISOString()
                    });
                    
                    setImportStats({ total: rows.length, current: i + 1 });
                }
                
                setIsImporting(false);
                showToast(`Import succesvol! Er zijn ${rows.length} boeken toegevoegd.`);
                switchTab('schappen');
            },
            error: (err) => {
                alert("Er is een fout opgetreden bij het lezen van het bestand.");
                setIsImporting(false);
            }
        });
        
        event.target.value = null;
    };

    const switchTab = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); setSearchQuery(''); setIsDragMode(false); setTitleSuggestions([]); setApiLimitError(false); setViewingPublicUser(null); };

    if (loading) return <div className="flex h-screen items-center justify-center bg-stone-100"><div className="animate-spin text-amber-600"><BookOpen size={48} /></div></div>;
    if (dbError) return <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen"><div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-2 border-red-500"><h3>Database Fout</h3><button onClick={() => window.location.reload()} className="mt-4 bg-stone-900 text-white font-bold py-2 px-4 rounded-xl">Herladen</button></div></div>;
    if (!user) return <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen"><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"><div className="bg-gradient-to-br from-amber-400 to-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><Library className="text-white" size={40} /></div><h1 className="text-3xl font-black text-stone-800 mb-2">Boeken<span className="text-amber-500">Plank</span> Pro</h1><p className="text-stone-500 font-medium mb-10">Beheer je bibliotheek in de cloud.</p><button onClick={handleLogin} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 px-6 rounded-xl shadow-xl">Inloggen met Google</button></div></div>;
    if (!userData) return <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 min-h-screen"><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"><h2 className="text-2xl font-black text-stone-800 mb-2">Welkom! 🎉</h2><form onSubmit={handleCreateProfile}><div className="mb-4"><label>Naam</label><input required value={profileForm.name} onChange={e=>setProfileForm({...profileForm, name: e.target.value})} className="w-full border-2 p-2 rounded-xl" /></div><div className="mb-4"><label>E-mail</label><input required type="email" value={profileForm.email} onChange={e=>setProfileForm({...profileForm, email: e.target.value})} className="w-full border-2 p-2 rounded-xl" /></div><button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl">Start!</button></form></div></div>;

    // Dynamische Streak: Gebruikt ALLEEN myLogs om de admin's eigen streak accuraat te houden
    const myLogsByDate = myLogs.reduce((acc, log) => { 
        if (!acc[log.date]) acc[log.date] = []; 
        acc[log.date].push(log); 
        return acc; 
    }, {});
    
    const todayStr = getTodayString();
    const hasReadToday = !!myLogsByDate[todayStr];

    const calculateDynamicStreak = () => {
        if (Object.keys(myLogsByDate).length === 0) return 0;
        let streak = 0;
        const today = new Date();
        let checkDate = new Date(today);
        
        if (!myLogsByDate[toDateString(checkDate)]) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (!myLogsByDate[toDateString(checkDate)]) {
                return 0; 
            }
        }
        
        while (myLogsByDate[toDateString(checkDate)]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return streak;
    };
    const currentStreak = calculateDynamicStreak();

    // Kalender: Gebruikt ALLE logs (Mijn + Impersonated)
    const allLogsByDate = readingLogs.reduce((acc, log) => { 
        if (!acc[log.date]) acc[log.date] = []; 
        acc[log.date].push(log); 
        return acc; 
    }, {});

    const isBookFinished = (b) => b.totalPages > 0 && parseInt(b.pagesRead) >= parseInt(b.totalPages);
    
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

    const processedBooks = [...filteredBooks].sort((a, b) => {
        if (sortOption === 'az') return (a.title || '').localeCompare(b.title || '');
        if (sortOption === 'za') return (b.title || '').localeCompare(a.title || '');
        
        const dateA = new Date(a.addedAt || 0).getTime();
        const dateB = new Date(b.addedAt || 0).getTime();
        
        if (sortOption === 'newest') return dateB - dateA;
        if (sortOption === 'oldest') return dateA - dateB;
        return 0;
    });

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
            const dayLogs = allLogsByDate[dateStr] || [];
            const isCurrentDay = dateStr === todayStr;
            const hasRead = dayLogs.length > 0;

            days.push(
                <div key={day} onClick={() => setCalendarLogData({ isOpen: true, dateStr: dateStr, bookId: '', pagesRead: '' })} className={`h-24 sm:h-32 p-2 rounded-xl border relative cursor-pointer hover:bg-amber-50 transition-colors overflow-hidden ${isCurrentDay ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-stone-200 bg-white'}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold ${isCurrentDay ? 'text-amber-600' : 'text-stone-500'}`}>{day}</span>
                        {hasRead && <Flame size={14} className="text-orange-500" />}
                    </div>
                    <div className="absolute top-7 left-1 right-1 bottom-1 flex gap-1 overflow-x-auto hide-scrollbar items-end">
                        {dayLogs.map((log, idx) => (
                            <div key={idx} className={`w-8 h-12 sm:w-10 sm:h-14 flex-shrink-0 rounded shadow-sm overflow-hidden border ${log._owner ? 'border-purple-400 bg-purple-50 relative' : 'border-stone-300 bg-stone-200'}`}>
                                {log.cover ? <img src={log.cover} className="w-full h-full object-cover" title={log.title}/> : <Book size={16} className="m-auto text-stone-400 mt-3"/>}
                                {log._owner && <div className="absolute bottom-0 inset-x-0 bg-purple-600 text-white text-[6px] font-bold text-center leading-none py-0.5 truncate">{log._owner}</div>}
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
            const hasRead = allLogsByDate[dStr] ? true : false;
            const dayName = d.toLocaleDateString('nl-NL', {weekday: 'short'});
            const shortDate = `${d.getDate()}/${d.getMonth() + 1}`; 
            
            days.push(
                <div key={i} className="flex flex-col items-center gap-1 md:gap-3 min-w-[28px] sm:min-w-[32px] md:min-w-[70px]">
                    <div className={`w-7 h-7 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${hasRead ? 'bg-orange-100 shadow-sm md:shadow-md' : 'bg-stone-100 border border-stone-200'}`}>
                        {hasRead ? <Flame className="w-4 h-4 md:w-8 md:h-8 text-orange-500" /> : <span className="text-[10px] md:text-xl text-stone-400 font-bold">{dayName.charAt(0)}</span>}
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] md:text-sm text-stone-500 font-bold uppercase leading-none">{dayName}</span>
                        <span className="text-[8px] md:text-xs text-stone-400 font-medium leading-none mt-1 md:mt-2">{shortDate}</span>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="flex items-center gap-1 sm:gap-2 md:gap-6 w-full lg:w-auto mt-2 lg:mt-0 bg-stone-50 p-2 md:p-5 rounded-xl md:rounded-3xl border border-stone-100 shadow-sm">
                <button onClick={() => setStreakWeekOffset(p => p - 1)} className="p-1 md:p-3 text-stone-400 hover:text-stone-800 bg-white rounded-full shadow-sm transition"><ChevronLeft className="w-4 h-4 md:w-8 md:h-8"/></button>
                <div className="flex gap-1.5 sm:gap-2 md:gap-6 justify-between flex-1 lg:flex-none">{days}</div>
                <button onClick={() => setStreakWeekOffset(p => p + 1)} disabled={streakWeekOffset >= 0} className={`p-1 md:p-3 transition rounded-full shadow-sm ${streakWeekOffset >= 0 ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-white text-stone-400 hover:text-stone-800'}`}><ChevronRight className="w-4 h-4 md:w-8 md:h-8"/></button>
            </div>
        );
    };

    // Filter community users
    const displayCommunityUsers = allUsers.filter(u => {
        if (u.uid === user.uid) return false; 
        if (userData.role === 'admin') return true; 
        return u.allowedCopiers && u.allowedCopiers.includes(userData.email.toLowerCase());
    });

    const sortedShelvesForDisplay = [
        ...myShelves.sort((a, b) => (a.order || 0) - (b.order || 0)),
        ...impShelves.sort((a, b) => (a.order || 0) - (b.order || 0))
    ];

    return (
        <div className="flex flex-col bg-stone-100 h-screen overflow-hidden relative">
            
            <div className="w-full flex flex-col z-30 flex-shrink-0">
                {userData && userData.role === 'admin' && (
                    <div className="bg-stone-900 border-b border-stone-700 text-white px-4 py-2 flex flex-col sm:flex-row justify-between items-center z-50 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 font-bold mb-2 sm:mb-0 text-amber-500">
                            <Shield size={16} /> Systeem Admin Actief
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-stone-400 whitespace-nowrap">Huidige weergave:</span>
                            <select
                                value={activeUserId || user.uid}
                                onChange={(e) => {
                                    const uid = e.target.value;
                                    if (uid === user.uid) setImpersonatedUser(null);
                                    else setImpersonatedUser(allUsers.find(u => u.uid === uid));
                                }}
                                className="bg-stone-800 border border-stone-600 text-white flex-1 sm:flex-none rounded-lg px-2 py-1 outline-none font-bold cursor-pointer"
                            >
                                <option value={user.uid}>Mijn Eigen Account</option>
                                <optgroup label="Andere Gebruikers">
                                    {allUsers.filter(u => u.uid !== user.uid).map(u => (
                                        <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    </div>
                )}
                
                <div className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between shadow-md">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-stone-800 rounded-lg transition"><Menu size={28} /></button>
                    <div className="flex items-center font-bold text-xl"><Library size={24} className="text-amber-500 mr-2" />Boeken<span className="text-amber-500">Plank</span></div>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}

                <nav className={`fixed inset-y-0 left-0 z-40 bg-stone-900 text-stone-100 flex flex-col shadow-2xl transform transition-all duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} ${isDesktopCollapsed ? 'md:w-20' : 'md:w-72'}`}>
                    <div className="p-6 pb-2 border-b border-stone-800">
                        <div className="flex justify-between items-center mb-6">
                            {!isDesktopCollapsed && (
                                <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl flex-shrink-0"><Library className="text-white" size={28} /></div><h1 className="text-2xl font-bold">Boeken<span className="text-amber-500">Plank</span></h1></div>
                            )}
                            {isDesktopCollapsed && (
                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl flex-shrink-0"><Library className="text-white" size={24} /></div>
                                    <button className="hidden md:block text-stone-400 hover:text-white bg-stone-800 rounded-full p-1.5 transition" onClick={() => setIsDesktopCollapsed(false)}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                            {!isDesktopCollapsed && (
                                <button className="hidden md:block text-stone-400 hover:text-white p-1 transition" onClick={() => setIsDesktopCollapsed(true)}>
                                    <ChevronLeft size={24} />
                                </button>
                            )}
                            <button className="md:hidden text-stone-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                        </div>
                        
                        <div className={`flex items-center gap-3 mb-4 bg-stone-800/50 rounded-2xl border border-stone-700 ${isDesktopCollapsed ? 'p-2 justify-center flex-col' : 'p-3'}`}>
                            <div className="relative rounded-full bg-gradient-to-tr from-stone-600 to-stone-500 flex items-center justify-center font-bold border-2 border-stone-700 flex-shrink-0 w-10 h-10 text-lg">
                                {userData.name.charAt(0).toUpperCase()}
                                {impersonatedUser && <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-stone-800"></div>}
                            </div>
                            {!isDesktopCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate text-white">{userData.name}</p>
                                    <p className="text-xs text-stone-400 truncate">{userData.role === 'admin' ? 'Beheerder' : 'Gebruiker'}</p>
                                </div>
                            )}
                            {!isDesktopCollapsed && !impersonatedUser && (
                                <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-white bg-stone-800 rounded-xl transition-colors flex-shrink-0"><LogOut size={16}/></button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                        <div className="flex flex-col gap-2 flex-1">
                            {!isDesktopCollapsed ? <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2">Bibliotheek</p> : <div className="h-4"></div>}
                            <button onClick={() => switchTab('alle')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'alle' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Alle Boeken" : ""}>
                                <BookOpen size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Alle Boeken</span>}
                            </button>
                            <button onClick={() => switchTab('schappen')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'schappen' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Schappen" : ""}>
                                <Library size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Schappen</span>}
                            </button>
                            
                            {!isDesktopCollapsed ? <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2 mt-4">Mijn Lijsten</p> : <div className="h-4"></div>}
                            <button onClick={() => switchTab('wensenlijst')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'wensenlijst' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Wensenlijst" : ""}>
                                <BookmarkPlus size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Wensenlijst</span>}
                            </button>
                            <button onClick={() => switchTab('gelezen')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'gelezen' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Gelezen" : ""}>
                                <CheckCircle2 size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Gelezen</span>}
                            </button>
                            <button onClick={() => switchTab('kalender')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'kalender' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Kalender" : ""}>
                                <CalendarDays size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Kalender</span>}
                            </button>

                            {!isDesktopCollapsed ? <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2 mt-4">Community</p> : <div className="h-4"></div>}
                            <button onClick={() => switchTab('ontdekken')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'ontdekken' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Ontdekken" : ""}>
                                <Users size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Ontdekken</span>}
                            </button>

                            {!isDesktopCollapsed ? <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 ml-2 mt-4">Beheer</p> : <div className="h-4"></div>}
                            <button onClick={() => switchTab('beheer')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'beheer' ? 'bg-stone-800 text-white border border-stone-700' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Schappen Beheren" : ""}>
                                <Settings size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Beheer & Instellingen</span>}
                            </button>
                            <button onClick={() => switchTab('changelog')} className={`flex items-center py-3 rounded-xl transition-all font-medium ${isDesktopCollapsed ? 'justify-center px-0 mx-2' : 'gap-3 px-4'} ${activeTab === 'changelog' ? 'bg-stone-800 text-white border border-stone-700' : 'hover:bg-stone-800 text-stone-300 border border-transparent'}`} title={isDesktopCollapsed ? "Versiegeschiedenis" : ""}>
                                <History size={20} className="flex-shrink-0"/>
                                {!isDesktopCollapsed && <span className="whitespace-nowrap">Versiegeschiedenis</span>}
                            </button>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
                            {!isDesktopCollapsed && <p className="text-xs font-bold text-stone-600 tracking-wider">© Copyright by Jaider</p>}
                        </div>
                    </div>
                </nav>

                <main className="flex-1 overflow-y-auto bg-stone-100 p-4 md:p-10 pb-24 relative z-0">
                    <div className="max-w-7xl mx-auto">
                        
                        {(activeTab === 'schappen' || activeTab === 'alle' || activeTab === 'wensenlijst' || activeTab === 'gelezen') && (
                            <div className="mb-8">
                                <div className="bg-white rounded-3xl p-4 sm:p-5 mb-8 shadow-sm border border-stone-200/60 flex flex-col lg:flex-row items-center justify-start gap-4 lg:gap-6 overflow-hidden">
                                    <div className="flex items-start gap-4 shrink-0 w-full lg:w-auto min-w-0">
                                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-2xl mt-1 shrink-0">
                                            <Flame className={`${hasReadToday ? 'text-orange-500 animate-pulse' : 'text-stone-400'}`} size={28} />
                                        </div>
                                        <div className="flex flex-col flex-1 lg:flex-none">
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Lees Streak</p>
                                            <p className="text-4xl md:text-8xl font-black text-stone-800 leading-none tracking-tighter mt-1">
                                                {currentStreak} 
                                                <span className="text-base md:text-3xl text-stone-400 font-medium tracking-normal ml-1">dagen</span>
                                            </p>
                                            
                                            {hasReadToday && (
                                                <button onClick={() => handleUndoLogReading()} className="hidden lg:flex mt-4 w-fit px-3 py-2 rounded-xl items-center gap-1.5 font-bold transition-all shadow-sm text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                                    <CheckCircle2 size={14} className="shrink-0"/>
                                                    <span className="whitespace-nowrap">Gelezen Vandaag</span>
                                                    <span className="text-stone-400 font-normal underline hover:text-red-500 whitespace-nowrap">(Uitvinken)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="hidden sm:block w-px h-16 md:h-32 bg-stone-200 mx-2 shrink-0"></div>
                                    
                                    <div className="w-full lg:flex-1 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar flex justify-start lg:justify-center">
                                        {renderWeeklyStreak()}
                                    </div>
                                    
                                    <div className="w-full lg:hidden flex justify-end mt-2 lg:mt-0">
                                        {hasReadToday && (
                                            <button onClick={() => handleUndoLogReading()} className="w-full px-3 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm text-sm bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                                <CheckCircle2 size={16} className="shrink-0"/> <span className="whitespace-nowrap">Gelezen Vandaag</span> <span className="text-[10px] text-stone-400 ml-1 font-normal underline whitespace-nowrap">(Uitvinken)</span>
                                            </button>
                                        )}
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

                                        <div className="relative flex items-center bg-white border border-stone-200 rounded-xl px-3 shadow-sm hover:border-amber-400 transition-colors">
                                            <Filter className="text-stone-400 mr-1" size={16} />
                                            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="py-2 pr-2 outline-none text-sm text-stone-700 font-bold bg-transparent cursor-pointer">
                                                <option value="az">A-Z</option>
                                                <option value="za">Z-A</option>
                                                <option value="newest">Nieuwste</option>
                                                <option value="oldest">Oudste</option>
                                            </select>
                                        </div>

                                        {activeTab === 'schappen' && (
                                            <button onClick={() => setIsDragMode(!isDragMode)} disabled={!!impersonatedUser} className={`flex justify-center items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-sm border-2 ${isDragMode ? 'bg-amber-100 border-amber-500 text-amber-800 animate-pulse' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'} ${impersonatedUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                                {sortedShelvesForDisplay.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-stone-200 border-dashed"><Library className="text-stone-400 mx-auto mb-4" size={48}/><h3 className="text-2xl font-bold mb-4">Geen schappen</h3><button onClick={() => switchTab('beheer')} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold">Ga naar Beheer</button></div>
                                ) : (
                                    sortedShelvesForDisplay.map(shelf => {
                                        const isExpanded = expandedShelves.includes(shelf.id);
                                        const shelfBooks = processedBooks.filter(b => b.shelfId === shelf.id);
                                        if (searchQuery && shelfBooks.length === 0) return null;
                                        
                                        return (
                                            <div 
                                                key={shelf.id} 
                                                className={`bg-white rounded-3xl p-5 shadow-md relative overflow-hidden transition-all ${isDragMode ? 'border-2 border-dashed border-amber-400 bg-amber-50/30' : 'border border-stone-200/60'}`}
                                                onDragOver={(e) => isDragMode && e.preventDefault()}
                                                onDrop={(e) => onDropBookToShelf(e, shelf.id)}
                                            >
                                                {!isDragMode && <div className={`absolute top-0 left-0 w-3 h-full ${shelf.color || 'bg-amber-500'}`}></div>}
                                                
                                                <div 
                                                    className={`border-stone-100 flex justify-between items-center pl-2 ${isExpanded ? 'mb-4 border-b pb-2' : ''} ${!isDragMode ? 'cursor-pointer group' : ''}`}
                                                    onClick={() => !isDragMode && toggleShelf(shelf.id)}
                                                >
                                                    <div>
                                                        <h3 className="text-2xl font-black flex items-center gap-3">
                                                            {shelf.name} 
                                                            <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{shelfBooks.length}</span>
                                                            {shelf._owner && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold whitespace-nowrap hidden sm:inline-block">👤 Van {shelf._owner}</span>}
                                                        </h3>
                                                        {shelf._owner && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold whitespace-nowrap sm:hidden mt-2 inline-block">👤 Van {shelf._owner}</span>}
                                                        
                                                        {shelf.description && isExpanded && <p className="text-sm text-stone-500 mt-2 font-medium bg-stone-50 p-2 rounded-lg inline-block border border-stone-100">{shelf.description}</p>}
                                                        {shelf.tags && isExpanded && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {shelf.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                                                    <span key={i} className="bg-stone-100 text-stone-600 px-2 py-1 rounded border border-stone-200 text-[10px] font-bold flex items-center gap-1"><Tag size={10}/> {tag}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!isDragMode && (
                                                        <button className="p-2 bg-stone-50 group-hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                                                            {isExpanded ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {isExpanded && (
                                                    shelfBooks.length === 0 ? (
                                                        <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDragMode ? 'border-amber-300 bg-amber-50' : 'border-stone-200'}`}>
                                                            <p className="text-stone-400 font-bold">{isDragMode ? 'Laat boek hier los!' : 'Geen boeken in dit schap.'}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                                            <BookList books={shelfBooks} onSelect={(b) => { setSelectedBook(b); setBookModalTab('overzicht'); }} isDragMode={isDragMode} onDragStart={onDragStartBook} allLibraries={allLibraries} />
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
                                {processedBooks.length === 0 ? (
                                    <div className="text-center py-10">
                                        <BookOpen className="text-stone-300 mx-auto mb-4" size={48}/>
                                        <p className="text-stone-500 font-bold text-lg">Geen boeken gevonden in deze lijst.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                        <BookList books={processedBooks} onSelect={(b) => { setSelectedBook(b); setBookModalTab('overzicht'); }} allLibraries={allLibraries} />
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

                        {activeTab === 'ontdekken' && (
                            <div className="max-w-6xl mx-auto space-y-6">
                                {!viewingPublicUser ? (
                                    <>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                            <div>
                                                <h2 className="text-3xl font-black text-stone-800 flex items-center gap-3"><Users className="text-amber-500"/> Ontdekken</h2>
                                                <p className="text-stone-500 font-medium">Bekijk boeken van andere gebruikers en kopieer ze naar jouw eigen schappen.</p>
                                            </div>
                                        </div>
                                        
                                        {displayCommunityUsers.length === 0 ? (
                                            <div className="bg-white rounded-3xl p-10 shadow-sm border border-stone-200 text-center">
                                                <Users size={48} className="text-stone-300 mx-auto mb-4"/>
                                                <h3 className="text-xl font-bold text-stone-700 mb-2">Geen gebruikers gevonden</h3>
                                                <p className="text-stone-500">Andere gebruikers moeten jouw e-mailadres toevoegen in hun privacy-instellingen voordat je hun boeken kunt bekijken.</p>
                                                {userData.role === 'admin' && <p className="text-amber-600 font-bold mt-2">Als Admin zie je normaal iedereen, maar blijkbaar is er nog niemand anders in de app.</p>}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                {displayCommunityUsers.map(u => (
                                                    <div key={u.uid} onClick={() => setViewingPublicUser(u)} className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-stone-200 to-stone-300 flex items-center justify-center font-black text-xl text-stone-600 group-hover:scale-110 transition-transform">
                                                                {u.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-lg text-stone-800">{u.name}</h4>
                                                                <p className="text-xs text-stone-500">Klik om boeken te bekijken</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-stone-200 flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => setViewingPublicUser(null)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition"><ChevronLeft size={24}/></button>
                                                <div>
                                                    <h2 className="text-2xl font-black text-stone-800">Bibliotheek van {viewingPublicUser.name}</h2>
                                                    <p className="text-sm text-stone-500">Kies een boek om te kopiëren naar jouw eigen profiel.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {publicShelves.length === 0 ? (
                                                <div className="text-center py-10 bg-white rounded-3xl border border-stone-200">
                                                    <p className="text-stone-500 font-bold">Deze gebruiker heeft nog geen schappen.</p>
                                                </div>
                                            ) : (
                                                publicShelves.sort((a,b) => (a.order||0)-(b.order||0)).map(shelf => {
                                                    const shelfBooks = publicBooks.filter(b => b.shelfId === shelf.id);
                                                    if (shelfBooks.length === 0) return null;
                                                    return (
                                                        <div key={shelf.id} className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 relative overflow-hidden">
                                                            <div className={`absolute top-0 left-0 w-2 h-full ${shelf.color || 'bg-amber-500'}`}></div>
                                                            <div className="mb-4 border-b border-stone-100 pb-2 pl-2">
                                                                <h3 className="text-2xl font-black flex items-center gap-3">{shelf.name} <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{shelfBooks.length}</span></h3>
                                                            </div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                                                {/* Public Book List Component (Reusing standard component but intercepting click) */}
                                                                {shelfBooks.map(book => {
                                                                    const library = book.borrowedLibraryId && publicLibraries ? publicLibraries.find(l => l.id === book.borrowedLibraryId) : null;
                                                                    const badgeColor = library ? library.color : 'bg-blue-500';
                                                                    const badgeText = library ? library.name : (book.borrowedPerson ? `Van ${book.borrowedPerson}` : 'Geleend');
                                                                    return (
                                                                        <div key={book.id} className="group relative flex flex-col cursor-pointer transition-all hover:-translate-y-2" onClick={() => setCopyBookData({ isOpen: true, book: book, targetShelfId: '' })}>
                                                                            <div className="aspect-[2/3] bg-stone-200 rounded-2xl overflow-hidden shadow-md mb-2 relative border border-stone-200">
                                                                                {book.cover ? <img src={book.cover} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br"><Book className="text-stone-300"/></div>}
                                                                                
                                                                                {book.isBorrowed && (
                                                                                    <div className={`absolute top-1.5 left-1/2 transform -translate-x-1/2 text-white px-2 py-0.5 rounded-md shadow-md text-[8px] font-black tracking-widest uppercase z-10 flex items-center gap-1 whitespace-nowrap ${badgeColor}`}>
                                                                                        <ArrowDown size={10} strokeWidth={3}/> {badgeText}
                                                                                    </div>
                                                                                )}

                                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                                                                    <button className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1"><Copy size={12}/> Kopieer</button>
                                                                                </div>
                                                                            </div>
                                                                            <h4 className="font-bold text-[10px] sm:text-xs text-stone-800 leading-tight line-clamp-2">{book.title}</h4>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {}
                        {activeTab === 'beheer' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-stone-800">Beheer & Instellingen</h2>
                                        <p className="text-stone-500 font-medium">Beheer je lijsten en privacy-instellingen.</p>
                                    </div>
                                    <button onClick={() => setIsShelfModalOpen(true)} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg w-full sm:w-auto justify-center"><Plus size={20} /> Nieuw Schap</button>
                                </div>
                                
                                {/* Privacy & Vrienden Instellingen */}
                                <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/60 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Users size={24}/></div>
                                        <div>
                                            <h3 className="text-lg font-black text-stone-800">Vrienden & Toegang (Kopiëren)</h3>
                                            <p className="text-sm text-stone-500">Wie mag jouw boeken zien en kopiëren in het tabblad 'Ontdekken'?</p>
                                        </div>
                                    </div>
                                    
                                    <form onSubmit={handleAddAllowedUser} className="flex gap-2 mb-4">
                                        <input type="email" required value={allowEmailInput} onChange={e => setAllowEmailInput(e.target.value)} placeholder="E-mailadres van vriend..." className="flex-1 border-2 border-stone-200 rounded-xl px-4 py-2 bg-stone-50 outline-none focus:border-blue-400 font-medium"/>
                                        <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-stone-800 shadow-sm">Toestaan</button>
                                    </form>

                                    <div className="space-y-2">
                                        {(!userData.allowedCopiers || userData.allowedCopiers.length === 0) ? (
                                            <p className="text-sm text-stone-400 font-medium p-3 border border-stone-100 rounded-xl bg-stone-50">Niemand heeft momenteel toegang tot jouw boeken.</p>
                                        ) : (
                                            userData.allowedCopiers.map((email, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-stone-50 border border-stone-200 p-3 rounded-xl">
                                                    <span className="font-bold text-stone-700">{email}</span>
                                                    <button onClick={() => handleRemoveAllowedUser(email)} className="text-xs text-red-500 font-bold hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><X size={14}/> Verwijder</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/60 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-black flex items-center gap-2 text-stone-800"><Upload size={18} className="text-amber-500"/> CSV Importeren</h3>
                                        <p className="text-sm text-stone-500 mt-1">Importeer boeken via een CSV bestand (bijv. van Bookshelf of Goodreads).</p>
                                    </div>
                                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <button onClick={() => fileInputRef.current.click()} disabled={isImporting} className="w-full sm:w-auto bg-stone-900 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-stone-800 disabled:opacity-50 min-w-[200px]">
                                        {isImporting ? <Loader2 className="animate-spin" size={18}/> : <FileUp size={18}/>} 
                                        {isImporting ? `Importeren... (${importStats.current}/${importStats.total})` : 'Kies .CSV Bestand'}
                                    </button>
                                </div>

                                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border border-stone-200/60">
                                    <h3 className="text-lg font-black text-stone-800 mb-4 pl-2">Mijn Schappen</h3>
                                    <div className="space-y-4">
                                        {myShelves.sort((a,b) => (a.order||0)-(b.order||0)).map((shelf, index) => (
                                            <div key={shelf.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 pl-6 bg-stone-50 rounded-2xl border border-stone-200 gap-4 transition-all hover:bg-stone-100 relative overflow-hidden">
                                                <div className={`absolute top-0 left-0 w-3 h-full ${shelf.color || 'bg-amber-500'}`}></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-1 hidden sm:flex">
                                                        <button onClick={() => handleMoveShelf(index, -1)} disabled={index === 0} className="text-stone-400 hover:text-amber-500 disabled:opacity-30"><ArrowUp size={18}/></button>
                                                        <button onClick={() => handleMoveShelf(index, 1)} disabled={index === myShelves.length - 1} className="text-stone-400 hover:text-amber-500 disabled:opacity-30"><ArrowDown size={18}/></button>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg text-stone-800">{shelf.name}</p>
                                                        {shelf.description && <p className="text-xs text-stone-500 truncate max-w-xs">{shelf.description}</p>}
                                                        {shelf.tags && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {shelf.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                                                    <span key={i} className="bg-white text-stone-500 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-200">{tag}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <div className="flex sm:hidden mr-auto gap-2">
                                                        <button onClick={() => handleMoveShelf(index, -1)} disabled={index === 0} className="p-2 bg-white rounded-lg border border-stone-200 text-stone-500 disabled:opacity-30"><ArrowUp size={16}/></button>
                                                        <button onClick={() => handleMoveShelf(index, 1)} disabled={index === myShelves.length - 1} className="p-2 bg-white rounded-lg border border-stone-200 text-stone-500 disabled:opacity-30"><ArrowDown size={16}/></button>
                                                    </div>
                                                    
                                                    {/* ADMIN PUSH BUTTON VOOR SCHAPPEN */}
                                                    {userData && userData.role === 'admin' && (
                                                        <button onClick={() => setAdminPushData({ isOpen: true, type: 'shelf', item: shelf, targetUid: '', targetShelfId: '', includeBooks: true })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-blue-100 border border-blue-200 text-blue-800 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-200">
                                                            <SendToBack size={16}/> Push
                                                        </button>
                                                    )}

                                                    <button onClick={() => setShareShelfData({ isOpen: true, shelfId: shelf.id, shelfName: shelf.name, email: '', loading: false, msg: '' })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-100"><Share2 size={16}/> Deel / Push</button>
                                                    <button onClick={() => setEditShelfData({ isOpen: true, id: shelf.id, name: shelf.name, description: shelf.description || '', color: shelf.color || 'bg-amber-500', tags: shelf.tags || '' })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-100"><Edit3 size={16}/> Bewerk</button>
                                                    <button onClick={() => handleDeleteShelf(shelf.id, shelf.name, shelf._ownerUid)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                                                </div>
                                                
                                                {shelf.sharedWith && shelf.sharedWith.length > 0 && (
                                                    <div className="w-full mt-2 pt-3 border-t border-stone-200">
                                                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Gepushed naar:</p>
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

                                    {/* SAMENGEVOEGDE SCHAPPEN WEERGAVE */}
                                    {impShelves.length > 0 && (
                                        <>
                                            <h3 className="text-lg font-black text-purple-800 mt-8 mb-4 pl-2">Schappen van {impersonatedUser.name}</h3>
                                            <div className="space-y-4">
                                                {impShelves.sort((a,b) => (a.order||0)-(b.order||0)).map((shelf, index) => (
                                                    <div key={shelf.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 pl-6 bg-purple-50 rounded-2xl border border-purple-200 gap-4 transition-all hover:bg-purple-100 relative overflow-hidden">
                                                        <div className={`absolute top-0 left-0 w-3 h-full ${shelf.color || 'bg-purple-500'}`}></div>
                                                        <div className="flex items-center gap-4">
                                                            <div>
                                                                <p className="font-bold text-lg text-purple-900">{shelf.name}</p>
                                                                {shelf.description && <p className="text-xs text-purple-600 truncate max-w-xs">{shelf.description}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            
                                                            {/* ADMIN PUSH BUTTON VOOR IMPERSONATED SCHAPPEN */}
                                                            {userData && userData.role === 'admin' && (
                                                                <button onClick={() => setAdminPushData({ isOpen: true, type: 'shelf', item: shelf, targetUid: '', targetShelfId: '', includeBooks: true })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-purple-100 border border-purple-300 text-purple-800 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-200">
                                                                    <SendToBack size={16}/> Push
                                                                </button>
                                                            )}

                                                            <button onClick={() => setEditShelfData({ isOpen: true, id: shelf.id, name: shelf.name, description: shelf.description || '', color: shelf.color || 'bg-amber-500', tags: shelf.tags || '', _ownerUid: shelf._ownerUid })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-purple-200 text-purple-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-50"><Edit3 size={16}/> Bewerk</button>
                                                            <button onClick={() => handleDeleteShelf(shelf.id, shelf.name, shelf._ownerUid)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {/* BEHEER BIBLIOTHEKEN / UITLEENLOCATIES */}
                                <div className="mt-12 mb-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                        <div>
                                            <h2 className="text-2xl font-black text-stone-800">Beheer Bibliotheken</h2>
                                            <p className="text-stone-500 font-medium">Uitleenlocaties met eigen label-kleuren.</p>
                                        </div>
                                        <button onClick={() => setIsLibraryModalOpen(true)} className="flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg w-full sm:w-auto justify-center"><Plus size={20} /> Nieuwe Bieb</button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border border-stone-200/60">
                                    <h3 className="text-lg font-black text-stone-800 mb-4 pl-2">Mijn Bibliotheken</h3>
                                    {myLibraries.length === 0 ? (
                                        <p className="text-stone-400 text-sm pl-2">Je hebt nog geen bibliotheken toegevoegd.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {myLibraries.map((lib) => (
                                                <div key={lib.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 pl-6 bg-stone-50 rounded-2xl border border-stone-200 gap-4 transition-all hover:bg-stone-100 relative overflow-hidden">
                                                    <div className={`absolute top-0 left-0 w-3 h-full ${lib.color || 'bg-blue-500'}`}></div>
                                                    <div>
                                                        <p className="font-bold text-lg text-stone-800">{lib.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        
                                                        {/* ADMIN PUSH BUTTON VOOR BIBLIOTHEKEN */}
                                                        {userData && userData.role === 'admin' && (
                                                            <button onClick={() => setAdminPushData({ isOpen: true, type: 'library', item: lib, targetUid: '', targetShelfId: '', includeBooks: true })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-blue-100 border border-blue-200 text-blue-800 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-200">
                                                                <SendToBack size={16}/> Push
                                                            </button>
                                                        )}

                                                        <button onClick={() => setEditLibraryData({ isOpen: true, id: lib.id, name: lib.name, color: lib.color || 'bg-blue-500', _ownerUid: lib._ownerUid })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-stone-200 text-stone-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-100"><Edit3 size={16}/> Bewerk</button>
                                                        <button onClick={() => handleDeleteLibrary(lib.id, lib.name, lib._ownerUid)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {impLibraries.length > 0 && (
                                        <>
                                            <h3 className="text-lg font-black text-purple-800 mt-8 mb-4 pl-2">Bibliotheken van {impersonatedUser.name}</h3>
                                            <div className="space-y-4">
                                                {impLibraries.map((lib) => (
                                                    <div key={lib.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 pl-6 bg-purple-50 rounded-2xl border border-purple-200 gap-4 transition-all hover:bg-purple-100 relative overflow-hidden">
                                                        <div className={`absolute top-0 left-0 w-3 h-full ${lib.color || 'bg-purple-500'}`}></div>
                                                        <div>
                                                            <p className="font-bold text-lg text-purple-900">{lib.name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            
                                                            {/* ADMIN PUSH BUTTON VOOR IMPERSONATED BIBLIOTHEKEN */}
                                                            {userData && userData.role === 'admin' && (
                                                                <button onClick={() => setAdminPushData({ isOpen: true, type: 'library', item: lib, targetUid: '', targetShelfId: '', includeBooks: true })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-purple-100 border border-purple-300 text-purple-800 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-200">
                                                                    <SendToBack size={16}/> Push
                                                                </button>
                                                            )}

                                                            <button onClick={() => setEditLibraryData({ isOpen: true, id: lib.id, name: lib.name, color: lib.color || 'bg-blue-500', _ownerUid: lib._ownerUid })} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-purple-200 text-purple-700 px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-50"><Edit3 size={16}/> Bewerk</button>
                                                            <button onClick={() => handleDeleteLibrary(lib.id, lib.name, lib._ownerUid)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
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

                        {activeTab === 'admin' && userData.role === 'admin' && !impersonatedUser && (
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
                                                                    <button onClick={() => { setImpersonatedUser(u); switchTab('schappen'); }} className="text-xs flex items-center gap-1 bg-stone-900 text-white px-2 py-1.5 rounded-lg"><ArrowLeftRight size={14}/> Samenvoegen</button>
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
                                                        <button onClick={() => { setImpersonatedUser(u); switchTab('schappen'); }} className="flex-1 flex justify-center items-center gap-1 bg-stone-900 text-white py-2 rounded-lg text-xs font-bold shadow-sm"><ArrowLeftRight size={14}/> Samenvoegen</button>
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

            {}
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
                                <label className="block text-xs font-bold text-amber-900 mb-2 flex items-center gap-1"><Camera size={14}/> Magische Kaft Scanner & ISBN</label>
                                
                                <div className="flex gap-2 mb-2">
                                    <input type="file" accept="image/*" capture="environment" ref={fileInputRefOcr} onChange={handlePhotoScan} className="hidden" />
                                    <button type="button" onClick={() => fileInputRefOcr.current.click()} disabled={isOcrLoading} className="flex-1 bg-stone-900 text-white px-3 py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md hover:bg-stone-800 transition-colors">
                                        {isOcrLoading ? <Loader2 size={18} className="animate-spin"/> : <Camera size={18} />}
                                        {isOcrLoading ? 'Kaft Lezen...' : 'Maak foto van de Kaft'}
                                    </button>
                                </div>
                                
                                <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200/50">
                                    <input type="text" placeholder="Of typ ISBN barcode..." value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} className="flex-1 border border-amber-300/50 rounded-lg px-3 py-2 bg-white outline-none text-sm" />
                                    <button type="button" onClick={() => fetchBookData()} disabled={isFetchingIsbn} className="bg-amber-200 text-amber-900 px-3 py-2 rounded-lg font-bold text-sm min-w-[70px] flex justify-center items-center">
                                        {isFetchingIsbn ? <Loader2 size={16} className="animate-spin" /> : 'Zoek'}
                                    </button>
                                </div>
                                
                                {ocrProgress && <p className="text-[10px] text-amber-700 font-bold mt-2 animate-pulse">{ocrProgress}</p>}
                                {errorMsg && <p className="text-red-600 font-bold text-xs mt-2">{errorMsg}</p>}
                                {apiLimitError && <p className="text-red-600 font-bold text-[10px] mt-2 bg-red-100 p-2 rounded-lg border border-red-200 flex items-center gap-1"><AlertCircle size={14} className="flex-shrink-0"/> Google blokkeert zoekopdrachten tijdelijk.</p>}
                            </div>

                            <form onSubmit={handleAddBook} className={`space-y-3 relative ${titleSuggestions.length > 0 || isSearchingTitle ? 'pb-48' : ''}`}>
                                
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-stone-700 mb-2">Formaat</label>
                                    <div className="flex gap-2">
                                        {['fysiek', 'ebook', 'audio'].map(fmt => (
                                            <button type="button" key={fmt} onClick={() => setNewBook({...newBook, format: fmt})} 
                                                className={`flex-1 flex justify-center items-center gap-1 sm:gap-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${newBook.format === fmt ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                                                {fmt === 'fysiek' && <Book size={16}/>}
                                                {fmt === 'ebook' && <Tablet size={16}/>}
                                                {fmt === 'audio' && <Headphones size={16}/>}
                                                <span className="capitalize">{fmt === 'audio' ? 'Audioboek' : fmt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <div className="sm:col-span-2 relative">
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Titel (typt voor suggesties) *</label>
                                        <input type="text" required value={newBook.title} onChange={handleTitleChange} className={`w-full border-2 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm transition-colors ${apiLimitError ? 'border-red-400' : 'border-stone-200 focus:border-amber-400'}`} placeholder="Bijv. De Hobbit" />
                                        
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
                                    
                                    <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 mb-1">Reeks / Serie</label>
                                            <input type="text" value={newBook.seriesName} onChange={e => setNewBook({...newBook, seriesName: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="Bijv. Harry Potter" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 mb-1">Deelnummer</label>
                                            <input type="text" value={newBook.seriesNumber} onChange={e => setNewBook({...newBook, seriesNumber: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="Bijv. 3" />
                                        </div>
                                    </div>
                                    
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Tags / Genres</label>
                                        <input type="text" value={newBook.tags} onChange={e => setNewBook({...newBook, tags: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="Bijv. Thriller, Magie (gescheiden met komma)" />
                                    </div>

                                    <div className="sm:col-span-2"><label className="block text-xs font-bold text-stone-700 mb-1">Afbeelding URL (optioneel)</label><input type="text" value={newBook.cover} onChange={e => setNewBook({...newBook, cover: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white outline-none text-sm" placeholder="https://link-naar-plaatje.jpg" /></div>
                                    <div><label className="block text-xs font-bold text-stone-700 mb-1">Totaal {newBook.format === 'audio' ? 'Minuten' : "Pagina's"}</label><input type="number" value={newBook.totalPages} onChange={e => setNewBook({...newBook, totalPages: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 outline-none text-sm" placeholder={newBook.format === 'audio' ? '600' : '300'} /></div>
                                    <div><label className="block text-xs font-bold text-stone-700 mb-1">{newBook.format === 'audio' ? 'Geluisterde Minuten' : 'Al Gelezen'}</label><input type="number" value={newBook.pagesRead} onChange={e => setNewBook({...newBook, pagesRead: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 bg-stone-50 outline-none text-sm" placeholder="0" /></div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Plaats in Schap of Lijst *</label>
                                        <select required value={newBook.shelfId} onChange={e => setNewBook({...newBook, shelfId: e.target.value})} className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 font-bold bg-white outline-none text-sm">
                                            <option value="" disabled>Kies een locatie...</option>
                                            <option value="wishlist" className="text-amber-600 font-black">⭐ Wensenlijst</option>
                                            <optgroup label="Mijn Schappen">
                                                {myShelves.sort((a,b)=>(a.order||0)-(b.order||0)).map(s => <option key={s.id} value={s.id}>📚 {s.name}</option>)}
                                            </optgroup>
                                            {impShelves.length > 0 && (
                                                <optgroup label={`Schappen van ${impersonatedUser.name}`}>
                                                    {impShelves.sort((a,b)=>(a.order||0)-(b.order||0)).map(s => <option key={s.id} value={s.id}>📚 {s.name}</option>)}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>
                                    
                                    <div className="sm:col-span-2 mt-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <label className="flex items-center gap-2 text-sm font-bold text-blue-900 cursor-pointer">
                                            <input type="checkbox" checked={newBook.isBorrowed || false} onChange={e => setNewBook({...newBook, isBorrowed: e.target.checked})} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                            Ik heb dit boek geleend
                                        </label>
                                        {newBook.isBorrowed && (
                                            <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-fade-in border-t border-blue-200/50 pt-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-blue-800 mb-1">Van een bibliotheek?</label>
                                                    <select value={newBook.borrowedLibraryId || ''} onChange={e => setNewBook({...newBook, borrowedLibraryId: e.target.value, borrowedPerson: ''})} className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-white outline-none text-sm font-bold text-blue-900">
                                                        <option value="">-- Geen / Kies --</option>
                                                        {allLibraries.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center justify-center pt-5">
                                                    <span className="text-xs font-bold text-blue-400 uppercase">OF</span>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-blue-800 mb-1">Van een persoon?</label>
                                                    <input type="text" value={newBook.borrowedPerson || ''} onChange={e => setNewBook({...newBook, borrowedPerson: e.target.value, borrowedLibraryId: ''})} className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-white outline-none text-sm" placeholder="Naam vriend(in)..." />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100"><button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 font-bold hover:bg-stone-100 rounded-lg text-sm">Annuleren</button><button type="submit" disabled={!newBook.shelfId} className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg shadow-md text-sm">Opslaan</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View/Edit Book Modal */}
            {selectedBook && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-2 sm:p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[90vh]">
                        
                        <div className="md:w-2/5 bg-stone-100 relative h-48 md:h-auto border-r border-stone-200 flex-shrink-0">
                            {selectedBook.cover ? (<img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 p-6"><Book size={64} /></div>)}
                            <button onClick={() => { setSelectedBook(null); setIsEditingBook(false); }} className="md:hidden absolute top-4 right-4 text-white bg-black/40 p-2 rounded-full"><X size={20} /></button>
                            {selectedBook.shelfId === 'wishlist' && <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-md">Wensenlijst</div>}
                            {selectedBook._owner && <div className="absolute bottom-4 left-4 right-4 bg-purple-600/90 backdrop-blur-md text-white px-3 py-2 rounded-xl font-bold text-xs shadow-lg text-center">Boek van {selectedBook._owner}</div>}
                        </div>
                        
                        <div className="p-0 flex flex-col bg-white overflow-hidden md:w-3/5 flex-1">
                            
                            <div className="p-5 md:p-6 pb-0 border-b border-stone-100 flex-shrink-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-2">
                                        <h3 className="text-xl sm:text-2xl font-black mb-1 leading-tight">{selectedBook.title}</h3>
                                        
                                        {selectedBook.seriesName && (
                                            <div className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider mb-2 border border-orange-200 shadow-sm">
                                                {selectedBook.seriesName} {selectedBook.seriesNumber ? `(Deel ${selectedBook.seriesNumber})` : ''}
                                            </div>
                                        )}
                                        
                                        <p className="text-base sm:text-lg text-stone-500 font-medium">{selectedBook.author}</p>
                                        
                                        {selectedBook.tags && !isEditingBook && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {selectedBook.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                                    <span key={i} className="bg-stone-100 text-stone-600 px-2 py-1 rounded border border-stone-200 text-[10px] font-bold flex items-center gap-1"><Tag size={10}/> {tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {/* ADMIN PUSH KNOP */}
                                        {userData && userData.role === 'admin' && !isEditingBook && (
                                            <button onClick={() => setAdminPushData({ isOpen: true, type: 'book', item: selectedBook, targetUid: '', targetShelfId: '', includeBooks: true })} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-xl font-bold transition-colors text-sm">
                                                <SendToBack size={16}/> <span className="hidden sm:inline">Push</span>
                                            </button>
                                        )}

                                        {!isEditingBook && (
                                            <button onClick={() => { setEditBookData(selectedBook); setIsEditingBook(true); }} className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl font-bold transition-colors text-sm">
                                                <Edit3 size={16}/> <span>Bewerk</span>
                                            </button>
                                        )}
                                        <button onClick={() => { setSelectedBook(null); setIsEditingBook(false); }} className="hidden md:block bg-stone-100 hover:bg-stone-200 transition-colors p-2 rounded-xl"><X size={20} /></button>
                                    </div>
                                </div>
                                
                                {!isEditingBook && (
                                    <div className="flex gap-4 overflow-x-auto hide-scrollbar -mb-[1px]">
                                        <button onClick={() => setBookModalTab('overzicht')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${bookModalTab === 'overzicht' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>Overzicht</button>
                                        <button onClick={() => setBookModalTab('leessessie')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${bookModalTab === 'leessessie' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}><Clock size={14}/> Leessessie</button>
                                        <button onClick={() => setBookModalTab('notities')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${bookModalTab === 'notities' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>Notities <span className="bg-stone-100 text-stone-500 text-[10px] px-1.5 py-0.5 rounded-full">{selectedBook.notes?.length || 0}</span></button>
                                        <button onClick={() => setBookModalTab('uitleen')} className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${bookModalTab === 'uitleen' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
                                            Uitleenbeheer {selectedBook.lentTo && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-5 md:p-6 overflow-y-auto flex-1 flex flex-col bg-stone-50/50">
                                {isEditingBook && editBookData ? (
                                    <form onSubmit={handleUpdateBookDetails} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-amber-900">Boekgegevens wijzigen</h4>
                                            <button type="button" onClick={() => setIsEditingBook(false)} className="text-amber-700 hover:text-amber-900"><X size={20}/></button>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <label className="block text-xs font-bold text-stone-700 mb-2">Formaat</label>
                                            <div className="flex gap-2">
                                                {['fysiek', 'ebook', 'audio'].map(fmt => (
                                                    <button type="button" key={fmt} onClick={() => setEditBookData({...editBookData, format: fmt})} 
                                                        className={`flex-1 flex justify-center items-center gap-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${editBookData.format === fmt ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                                                        {fmt === 'fysiek' && <Book size={14}/>}{fmt === 'ebook' && <Tablet size={14}/>}{fmt === 'audio' && <Headphones size={14}/>}
                                                        <span className="capitalize">{fmt === 'audio' ? 'Audioboek' : fmt}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Titel</label><input type="text" required value={editBookData.title} onChange={e => setEditBookData({...editBookData, title: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Auteur</label><input type="text" value={editBookData.author} onChange={e => setEditBookData({...editBookData, author: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><label className="block text-xs font-bold text-stone-700 mb-1">Reeks / Serie</label><input type="text" value={editBookData.seriesName || ''} onChange={e => setEditBookData({...editBookData, seriesName: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" placeholder="Harry Potter" /></div>
                                            <div><label className="block text-xs font-bold text-stone-700 mb-1">Deel</label><input type="text" value={editBookData.seriesNumber || ''} onChange={e => setEditBookData({...editBookData, seriesNumber: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" placeholder="3" /></div>
                                        </div>

                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Tags / Genres</label><input type="text" value={editBookData.tags || ''} onChange={e => setEditBookData({...editBookData, tags: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" placeholder="Bijv. Thriller, Spanning" /></div>
                                        <div><label className="block text-xs font-bold text-stone-700 mb-1">Afbeelding URL</label><input type="text" value={editBookData.cover || ''} onChange={e => setEditBookData({...editBookData, cover: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-stone-700 mb-1">Locatie</label>
                                                <select required value={editBookData.shelfId} onChange={e => setEditBookData({...editBookData, shelfId: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none font-bold">
                                                    <option value="wishlist" className="text-amber-600">⭐ Wensenlijst</option>
                                                    <optgroup label="Mijn Schappen">
                                                        {myShelves.sort((a,b)=>(a.order||0)-(b.order||0)).map(s => <option key={s.id} value={s.id}>📚 {s.name}</option>)}
                                                    </optgroup>
                                                    {impShelves.length > 0 && (
                                                        <optgroup label={`Schappen van ${impersonatedUser.name}`}>
                                                            {impShelves.sort((a,b)=>(a.order||0)-(b.order||0)).map(s => <option key={s.id} value={s.id}>📚 {s.name}</option>)}
                                                        </optgroup>
                                                    )}
                                                </select>
                                            </div>
                                            <div><label className="block text-xs font-bold text-stone-700 mb-1">Totaal {editBookData.format === 'audio' ? 'Minuten' : "Pagina's"}</label><input type="number" value={editBookData.totalPages} onChange={e => setEditBookData({...editBookData, totalPages: e.target.value})} className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white outline-none" /></div>
                                        </div>
                                        <div className="mt-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <label className="flex items-center gap-2 text-sm font-bold text-blue-900 cursor-pointer">
                                                <input type="checkbox" checked={editBookData.isBorrowed || false} onChange={e => setEditBookData({...editBookData, isBorrowed: e.target.checked})} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                                Ik heb dit boek geleend
                                            </label>
                                            {editBookData.isBorrowed && (
                                                <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-fade-in border-t border-blue-200/50 pt-4">
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-blue-800 mb-1">Van een bibliotheek?</label>
                                                        <select value={editBookData.borrowedLibraryId || ''} onChange={e => setEditBookData({...editBookData, borrowedLibraryId: e.target.value, borrowedPerson: ''})} className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-white outline-none text-sm font-bold text-blue-900">
                                                            <option value="">-- Geen / Kies --</option>
                                                            {allLibraries.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-center pt-5">
                                                        <span className="text-xs font-bold text-blue-400 uppercase">OF</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-blue-800 mb-1">Van een persoon?</label>
                                                        <input type="text" value={editBookData.borrowedPerson || ''} onChange={e => setEditBookData({...editBookData, borrowedPerson: e.target.value, borrowedLibraryId: ''})} className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-white outline-none text-sm" placeholder="Naam vriend(in)..." />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 shadow-md"><Save size={18}/> Wijzigingen Opslaan</button>
                                    </form>
                                ) : (
                                    <>
                                        {/* TAB: LEESSESSIE */}
                                        {bookModalTab === 'leessessie' && (
                                            <ReadingTimer 
                                                book={selectedBook} 
                                                onSave={async (endPage, timeInSeconds) => {
                                                    const ownerUid = selectedBook._ownerUid || activeUserId;
                                                    await updateDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'books', selectedBook.id), { pagesRead: parseInt(endPage) });
                                                    const origPages = parseInt(selectedBook.pagesRead) || 0;
                                                    if (parseInt(endPage) > origPages) {
                                                        const todayStr = getTodayString();
                                                        await setDoc(doc(db, 'artifacts', appId, 'users', ownerUid, 'readingLog', `${todayStr}_${selectedBook.id}`), {
                                                            date: todayStr, bookId: selectedBook.id, title: selectedBook.title, cover: selectedBook.cover || null
                                                        }, { merge: true });
                                                    }
                                                    setSelectedBook({...selectedBook, pagesRead: parseInt(endPage)});
                                                    setBookModalTab('overzicht');
                                                }} 
                                            />
                                        )}

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
                                                    <label className="block text-sm font-bold text-stone-700 mb-3">{selectedBook.format === 'audio' ? 'Luistervoortgang updaten' : 'Leesvoortgang updaten'}</label>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <input type="number" min="0" max={selectedBook.totalPages || 9999} required value={selectedBook.pagesRead} onChange={e => setSelectedBook({...selectedBook, pagesRead: e.target.value})} className="w-24 text-2xl font-black border-2 rounded-xl px-3 py-2 outline-none text-center bg-stone-50 focus:bg-white" />
                                                        <span className="text-stone-500 font-bold">van {selectedBook.totalPages || '?'} {selectedBook.format === 'audio' ? 'min.' : 'pag.'}</span>
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

            {/* Modal voor Kopiëren vanuit Ontdekken */}
            {copyBookData.isOpen && copyBookData.book && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 bg-stone-50 border-b border-stone-100">
                            <h3 className="text-xl font-black flex items-center gap-2"><Copy size={20} className="text-amber-500"/> Boek Kopiëren</h3>
                            <p className="text-sm text-stone-500 mt-1">Voeg "{copyBookData.book.title}" toe aan je eigen bibliotheek.</p>
                        </div>
                        <form onSubmit={handleCopyBookConfirm} className="p-6">
                            <div className="flex gap-4 items-center mb-6">
                                {copyBookData.book.cover ? <img src={copyBookData.book.cover} className="w-16 h-24 object-cover rounded shadow-md" /> : <div className="w-16 h-24 bg-stone-200 flex items-center justify-center rounded shadow-md"><Book className="text-stone-400"/></div>}
                                <div>
                                    <p className="font-bold text-stone-800">{copyBookData.book.title}</p>
                                    <p className="text-sm text-stone-500">{copyBookData.book.author}</p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-stone-700 mb-2">In welk van JOUW schappen wil je dit zetten?</label>
                                <select required value={copyBookData.targetShelfId} onChange={e => setCopyBookData({...copyBookData, targetShelfId: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 outline-none focus:bg-white focus:border-amber-500">
                                    <option value="" disabled>Selecteer een schap...</option>
                                    <option value="wishlist" className="text-amber-600">⭐ Wensenlijst</option>
                                    <optgroup label="Mijn Schappen">
                                        {myShelves.sort((a,b)=>(a.order||0)-(b.order||0)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setCopyBookData({ isOpen: false, book: null, targetShelfId: '' })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" disabled={!copyBookData.targetShelfId} className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 disabled:opacity-50">Kopieer Boek</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin PUSH Modal (Boeken, Schappen, Bibliotheken) */}
            {adminPushData.isOpen && adminPushData.item && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 bg-stone-50 border-b border-stone-100">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <SendToBack size={20} className="text-amber-500"/> 
                                {adminPushData.type === 'book' && 'Push Boek naar Gebruiker'}
                                {adminPushData.type === 'shelf' && 'Push Schap naar Gebruiker'}
                                {adminPushData.type === 'library' && 'Push Bibliotheek naar Gebruiker'}
                            </h3>
                            <p className="text-sm text-stone-500 mt-1">
                                {adminPushData.type === 'book' && `Kopieer "${adminPushData.item.title}" direct in het schap van iemand anders.`}
                                {adminPushData.type === 'shelf' && `Kopieer schap "${adminPushData.item.name}" direct naar iemand anders.`}
                                {adminPushData.type === 'library' && `Kopieer bibliotheek "${adminPushData.item.name}" direct naar iemand anders.`}
                            </p>
                        </div>
                        <form onSubmit={handleAdminPushConfirm} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-stone-700 mb-2">Kies de Ontvanger</label>
                                <select required value={adminPushData.targetUid} onChange={e => setAdminPushData({...adminPushData, targetUid: e.target.value, targetShelfId: ''})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 outline-none focus:bg-white focus:border-amber-500">
                                    <option value="" disabled>Selecteer gebruiker...</option>
                                    {allUsers.filter(u => u.uid !== user.uid).map(u => (
                                        <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            
                            {adminPushData.type === 'book' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-stone-700 mb-2">Kies hun Schap</label>
                                    <select required disabled={!adminPushData.targetUid} value={adminPushData.targetShelfId} onChange={e => setAdminPushData({...adminPushData, targetShelfId: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 outline-none focus:bg-white focus:border-amber-500 disabled:opacity-50">
                                        <option value="" disabled>{adminPushData.targetUid ? 'Selecteer een schap...' : 'Kies eerst een gebruiker'}</option>
                                        {adminPushShelves.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {adminPushData.type === 'shelf' && (
                                <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <label className="flex items-center gap-2 text-sm font-bold text-blue-900 cursor-pointer">
                                        <input type="checkbox" checked={adminPushData.includeBooks} onChange={e => setAdminPushData({...adminPushData, includeBooks: e.target.checked})} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                        Kopieer ook alle boeken in dit schap mee
                                    </label>
                                    <p className="text-xs text-blue-700 mt-2 ml-7">Als je dit uitvinkt, wordt alleen een leeg schap (met de naam, beschrijving en kleur) gepusht.</p>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setAdminPushData({ isOpen: false, type: 'book', item: null, targetUid: '', targetShelfId: '', includeBooks: true })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" disabled={!adminPushData.targetUid || (adminPushData.type === 'book' && !adminPushData.targetShelfId)} className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 disabled:opacity-50">Push</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Retroactive Calendar Log Modal - INCLUSIEF BEWERKEN */}
            {calendarLogData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-stone-50 border-b border-stone-100 flex-shrink-0">
                            <h3 className="text-xl font-black flex items-center gap-2"><CalendarDays size={20} className="text-amber-500"/> Kalender Logboek</h3>
                            <p className="text-sm text-stone-500 mt-1">Datum: {calendarLogData.dateStr}</p>
                        </div>
                        
                        <div className="p-6 overflow-y-auto hide-scrollbar">
                            {(() => {
                                const dayLogs = readingLogs.filter(l => l.date === calendarLogData.dateStr);
                                if (dayLogs.length > 0) {
                                    return (
                                        <div className="mb-6 pb-6 border-b border-stone-100">
                                            <label className="block text-sm font-bold text-stone-700 mb-3">Gelezen op deze dag:</label>
                                            <div className="space-y-2">
                                                {dayLogs.map(log => (
                                                    <div key={log.id} className="flex justify-between items-center bg-stone-50 p-2 pr-3 rounded-xl border border-stone-200">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            {log.cover ? <img src={log.cover} className="w-8 h-10 object-cover rounded shadow-sm flex-shrink-0" /> : <div className="w-8 h-10 bg-white border border-stone-200 flex items-center justify-center rounded shadow-sm flex-shrink-0"><Book size={12} className="text-stone-300"/></div>}
                                                            <div>
                                                                <span className="font-bold text-sm text-stone-700 truncate block">{log.title}</span>
                                                                {log._owner && <span className="text-[10px] text-purple-600 font-bold">Van {log._owner}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button type="button" onClick={() => setCalendarLogData({...calendarLogData, bookId: log.bookId || '', pagesRead: books.find(b => b.id === log.bookId)?.pagesRead || ''})} className="p-2 text-stone-500 hover:bg-stone-200 bg-white rounded-lg border border-stone-200 transition-colors shadow-sm flex-shrink-0"><Edit3 size={16}/></button>
                                                            <button type="button" onClick={() => handleDeleteLog(log.id, log._ownerUid)} className="p-2 text-red-500 hover:bg-red-100 bg-white rounded-lg border border-red-100 transition-colors shadow-sm flex-shrink-0"><Trash2 size={16}/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <form onSubmit={handleRetroactiveLog}>
                                {books.length === 0 ? <p className="text-red-500 font-bold mb-4">Je hebt nog geen boeken in je bibliotheek.</p> : (
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Boek toevoegen of voortgang wijzigen:</label>
                                        <select required value={calendarLogData.bookId} onChange={e => {
                                            const selectedId = e.target.value;
                                            const book = books.find(b => b.id === selectedId);
                                            setCalendarLogData({...calendarLogData, bookId: selectedId, pagesRead: book ? book.pagesRead : ''});
                                        }} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 outline-none focus:bg-white focus:border-amber-500">
                                            <option value="" disabled>Selecteer een boek...</option>
                                            <optgroup label="Mijn Boeken">
                                                {myBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                            </optgroup>
                                            {impBooks.length > 0 && (
                                                <optgroup label={`Boeken van ${impersonatedUser.name}`}>
                                                    {impBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>
                                )}

                                {calendarLogData.bookId && (
                                    <div className="mb-6 animate-fade-in">
                                        <label className="block text-sm font-bold text-stone-700 mb-2">Tot welke pagina (of minuut) was je op deze dag?</label>
                                        <div className="flex items-center gap-3">
                                            <input type="number" required value={calendarLogData.pagesRead} onChange={e => setCalendarLogData({...calendarLogData, pagesRead: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 font-bold bg-stone-50 outline-none focus:bg-white focus:border-amber-500 text-xl" />
                                            <span className="text-stone-500 font-bold whitespace-nowrap">van {books.find(b => b.id === calendarLogData.bookId)?.totalPages || '?'}</span>
                                        </div>
                                        <p className="text-xs text-stone-500 mt-2">Dit past direct de huidige leesvoortgang aan in je bibliotheek!</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setCalendarLogData({ isOpen: false, dateStr: '', bookId: '', pagesRead: '' })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Sluiten</button>
                                    <button type="submit" disabled={books.length === 0 || !calendarLogData.bookId} className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 disabled:opacity-50">Log Opslaan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Library Modal */}
            {isLibraryModalOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-stone-50 flex-shrink-0"><h3 className="text-2xl font-black">Nieuwe Bibliotheek</h3></div>
                        <form onSubmit={handleAddLibrary} className="p-6 overflow-y-auto hide-scrollbar">
                            <label className="block text-sm font-bold text-stone-700 mb-1">Naam van Bieb / Locatie</label>
                            <input type="text" required value={newLibrary.name} onChange={e => setNewLibrary({...newLibrary, name: e.target.value})} className="w-full border-2 rounded-xl px-4 py-3 mb-4 font-bold bg-stone-50" placeholder="Bijv. Bieb Bekkevoort" />
                            <label className="block text-sm font-bold text-stone-700 mb-2">Kleur voor label op boeken</label>
                            <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto hide-scrollbar p-1">
                                {SHELF_COLORS.map(c => (
                                    <button type="button" key={c} onClick={() => setNewLibrary({...newLibrary, color: c})} className={`w-8 h-8 rounded-full ${c} border-2 transition-transform ${newLibrary.color === c ? 'border-stone-900 scale-125 shadow-md' : 'border-stone-200 hover:scale-110 hover:border-stone-300'}`}></button>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3 mt-auto">
                                <button type="button" onClick={() => setIsLibraryModalOpen(false)} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button>
                                <button type="submit" className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg">Aanmaken</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Library Modal */}
            {editLibraryData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-stone-50 border-b border-stone-100 flex-shrink-0"><h3 className="text-2xl font-black">Bibliotheek Bewerken</h3></div>
                        <form onSubmit={handleUpdateLibrary} className="p-6 overflow-y-auto hide-scrollbar">
                            <label className="block text-sm font-bold text-stone-700 mb-1">Naam van Bieb / Locatie</label>
                            <input type="text" required value={editLibraryData.name} onChange={e => setEditLibraryData({...editLibraryData, name: e.target.value})} className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 mb-4 font-bold bg-stone-50" />
                            <label className="block text-sm font-bold text-stone-700 mb-2">Kleur voor label op boeken</label>
                            <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto hide-scrollbar p-1">
                                {SHELF_COLORS.map(c => (
                                    <button type="button" key={c} onClick={() => setEditLibraryData({...editLibraryData, color: c})} className={`w-8 h-8 rounded-full ${c} border-2 transition-transform ${editLibraryData.color === c ? 'border-stone-900 scale-125 shadow-md' : 'border-stone-200 hover:scale-110 hover:border-stone-300'}`}></button>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3 mt-auto"><button type="button" onClick={() => setEditLibraryData({ isOpen: false, id: '', name: '', color: 'bg-blue-500', _ownerUid: '' })} className="px-5 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl">Annuleren</button><button type="submit" className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg">Opslaan</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Shelf Modal (Push) */}
            {shareShelfData.isOpen && (
                <div className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 bg-stone-50 border-b border-stone-100">
                            <h3 className="text-2xl font-black flex items-center gap-2"><Share2 size={24} className="text-amber-500"/> Schap Push / Delen</h3>
                            <p className="text-sm text-stone-500 mt-1">Kopieer "{shareShelfData.shelfName}" geforceerd naar een andere gebruiker.</p>
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
                <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-[130] backdrop-blur-sm"><div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center mx-4"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="text-red-500" size={32}/></div><h3 className="text-xl font-bold text-stone-800 mb-2">Weet je het zeker?</h3><p className="text-stone-500 font-medium mb-6">{confirmDialog.text}</p><div className="flex gap-3"><button onClick={() => setConfirmDialog({ isOpen: false, text: '', action: null })} className="flex-1 px-4 py-3 bg-stone-100 font-bold rounded-xl">Annuleren</button><button onClick={executeConfirm} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl">Bevestigen</button></div></div></div>
            )}
            
            {/* Camera Scanner Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4 z-[100] backdrop-blur-md"><div className="w-full max-w-md bg-stone-900 rounded-3xl overflow-hidden border border-stone-800"><div className="p-5 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Camera size={20}/> Scan Barcode</h3><button onClick={() => setIsScannerOpen(false)} className="p-2 rounded-full hover:bg-stone-800"><X size={24}/></button></div><div id="reader" className="w-full bg-black min-h-[300px]"></div></div></div>
            )}

            {/* Toasts / Notificaties UI */}
            {toast.show && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[200] transition-all duration-300">
                    <div className={`px-5 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 text-white border ${toast.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-stone-800 border-stone-700'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={18}/> : <Info size={18}/>}
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}

function BookList({ books, onSelect, isDragMode, onDragStart, allLibraries }) {
    return (
        <React.Fragment>
            {books.map(book => {
                const progress = book.totalPages > 0 ? Math.min(100, Math.round((book.pagesRead / book.totalPages) * 100)) : 0;
                const isFinished = progress === 100 && book.totalPages > 0;
                
                // Bibliotheek Label Logica
                const library = book.borrowedLibraryId && allLibraries ? allLibraries.find(l => l.id === book.borrowedLibraryId) : null;
                const badgeColor = library ? library.color : 'bg-blue-500';
                const badgeText = library ? library.name : (book.borrowedPerson ? `Van ${book.borrowedPerson}` : 'Geleend');

                return (
                    <div 
                        key={book.id} 
                        draggable={isDragMode}
                        onDragStart={(e) => isDragMode && onDragStart(e, book.id)}
                        className={`group relative flex flex-col transition-all hover:-translate-y-2 ${isDragMode ? 'cursor-move animate-pulse-slow ring-2 ring-amber-500 rounded-2xl bg-white p-1' : 'cursor-pointer'}`} 
                        onClick={() => !isDragMode && onSelect(book)}
                    >
                        <div className={`aspect-[2/3] rounded-2xl overflow-hidden shadow-md mb-2 relative border ${book._owner ? 'border-purple-300 bg-purple-50' : 'border-stone-200/50 bg-stone-200'}`}>
                            {book.cover && !book.cover.includes('placeholder') ? (<img src={book.cover} alt={book.title} className="w-full h-full object-cover" draggable="false" />) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br p-2 text-center"><Book className="text-stone-300 mb-1" size={24} /></div>)}
                            
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/90 to-transparent p-1 pt-6 transform translate-y-full group-hover:translate-y-0 transition-transform">
                                <p className="text-[9px] sm:text-[10px] text-white font-bold text-center">{book.pagesRead} / {book.totalPages || '?'} {book.format === 'audio' ? 'm.' : 'p.'}</p>
                            </div>
                            
                            {/* DYNAMISCH GELEEND LABEL */}
                            {book.isBorrowed && (
                                <div className={`absolute top-1.5 left-1/2 transform -translate-x-1/2 text-white px-2 py-0.5 rounded-md shadow-md text-[8px] font-black tracking-widest uppercase z-10 flex items-center gap-1 whitespace-nowrap ${badgeColor}`}>
                                    <ArrowDown size={10} strokeWidth={3}/> {badgeText}
                                </div>
                            )}

                            {/* Icoontjes in de linker bovenhoek */}
                            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                                {book.shelfId === 'wishlist' && (<div className="bg-amber-500 text-white p-1.5 rounded-full shadow-md"><Star size={12} fill="white" strokeWidth={0} /></div>)}
                                {book.format === 'audio' && (<div className="bg-purple-500 text-white p-1.5 rounded-full shadow-md"><Headphones size={12} /></div>)}
                                {book.format === 'ebook' && (<div className="bg-blue-500 text-white p-1.5 rounded-full shadow-md"><Tablet size={12} /></div>)}
                            </div>

                            {/* Voltooid / Uitleen Icoontjes rechts */}
                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
                                {isFinished && (<div className="bg-green-500 text-white p-1 rounded-full shadow-md"><Check size={12} strokeWidth={4} /></div>)}
                                {book.lentTo && !isFinished && (<div className="bg-blue-500 text-white p-1 rounded-full shadow-md"><UserCheck size={12} strokeWidth={3} /></div>)}
                            </div>

                            {isDragMode && (<div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center backdrop-blur-[1px]"><GripVertical size={32} className="text-white drop-shadow-md"/></div>)}
                        </div>
                        {!isDragMode && <div className="w-full bg-stone-200/80 rounded-full h-1 mb-1"><div className={`h-full rounded-full ${isFinished ? 'bg-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${progress}%` }}></div></div>}
                        <h4 className="font-bold text-[10px] sm:text-xs text-stone-800 leading-tight line-clamp-2">{book.title}</h4>
                        {book._owner && <p className="text-[9px] text-purple-600 font-bold truncate mt-0.5">👤 Van {book._owner}</p>}
                    </div>
                );
            })}
        </React.Fragment>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<BoekenApp />);
