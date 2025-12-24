// Gestion de la base de données IndexedDB
const DB_NAME = 'BlocNotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'sections';

let db = null;

// Initialiser la base de données
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Erreur lors de l\'ouverture de la base de données');
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('Base de données ouverte avec succès');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Créer l'object store si nécessaire
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('lastModified', 'lastModified', { unique: false });
                console.log('Object store créé');
            }
        };
    });
}

// Vérifier le statut du stockage persistant
async function checkPersistentStorage() {
    if (navigator.storage && navigator.storage.persisted) {
        const isPersisted = await navigator.storage.persisted();
        console.log(`Statut actuel du stockage persistant: ${isPersisted ? 'accordé' : 'refusé'}`);
        
        // Afficher le statut visuellement
        const statusEl = document.getElementById('storageStatus');
        if (statusEl) {
            if (isPersisted) {
                statusEl.textContent = '🔒';
                statusEl.title = 'Données protégées contre la suppression';
                statusEl.style.color = '#4CAF50';
            } else {
                statusEl.textContent = '⚠️';
                statusEl.title = 'ATTENTION: Données non protégées ! Exportez régulièrement.';
                statusEl.style.color = '#ff9800';
            }
        }
        
        return isPersisted;
    }
    return false;
}

// Demander le stockage persistant
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log(`Demande de stockage persistant: ${isPersisted ? 'accordé' : 'refusé'}`);
        
        // Vérifier le statut après la demande
        await checkPersistentStorage();
        
        return isPersisted;
    }
    return false;
}

// Sauvegarder toutes les sections
async function saveAllSections(sections) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        // Vider le store
        const clearRequest = objectStore.clear();
        
        clearRequest.onsuccess = () => {
            // Ajouter toutes les sections
            sections.forEach(section => {
                objectStore.add(section);
            });
        };
        
        transaction.oncomplete = () => {
            console.log('Toutes les sections sauvegardées');
            resolve();
        };
        
        transaction.onerror = () => {
            console.error('Erreur lors de la sauvegarde');
            reject(transaction.error);
        };
    });
}

// Charger toutes les sections
async function loadAllSections() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();
        
        request.onsuccess = () => {
            console.log(`${request.result.length} sections chargées`);
            resolve(request.result);
        };
        
        request.onerror = () => {
            console.error('Erreur lors du chargement');
            reject(request.error);
        };
    });
}

// Migrer les données de localStorage vers IndexedDB
async function migrateFromLocalStorage() {
    try {
        const localData = localStorage.getItem('bloc-notes-sections');
        if (localData) {
            const sections = JSON.parse(localData);
            console.log(`Migration de ${sections.length} sections depuis localStorage`);
            
            // Sauvegarder dans IndexedDB
            await saveAllSections(sections);
            
            // Supprimer de localStorage après migration réussie
            localStorage.removeItem('bloc-notes-sections');
            console.log('Migration terminée, localStorage nettoyé');
            
            return sections;
        }
    } catch (e) {
        console.error('Erreur lors de la migration:', e);
    }
    return null;
}
