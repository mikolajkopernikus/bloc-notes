// Gestion de la synchronisation Google Drive
// Documentation: https://developers.google.com/drive/api/v3/quickstart/js

// CONFIGURATION - À MODIFIER PAR L'UTILISATEUR
const GOOGLE_CONFIG = {
    // Remplacer par votre propre Client ID obtenu depuis Google Cloud Console
    CLIENT_ID: '672388563946-64esg1rpftprb0i0m79imol5o7a23iui.apps.googleusercontent.com',
    API_KEY: 'AIzaSyADA0UkcUsQq5txXaemO-FaC9w1HMjUXa8',
    // Ne pas modifier ces valeurs
    DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    SCOPES: 'https://www.googleapis.com/auth/drive.file'
};

let tokenClient;
let gapiInited = false;
let gisInited = false;
let isSignedIn = false;
let lastInitError = null;

// Initialiser l'API Google
async function initGoogleDrive() {
    try {
        // Charger les bibliothèques Google
        await loadGoogleAPIs();
        
        // Initialiser GAPI
        await gapiInit();
        
        // Initialiser GIS (Google Identity Services)
        gisInit();
        
        lastInitError = null;
        console.log('Google Drive API initialisée');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de Google Drive:', error);
        lastInitError = error.message || String(error);
        showSyncStatus('❌ Erreur: ' + lastInitError, 'error');
    }
}

// Charger les bibliothèques Google
function loadGoogleAPIs() {
    return new Promise((resolve, reject) => {
        // Vérifier si les scripts sont déjà chargés
        if (window.gapi && window.google) {
            resolve();
            return;
        }
        
        // Charger gapi
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
            // Charger gis
            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.onload = resolve;
            gisScript.onerror = reject;
            document.body.appendChild(gisScript);
        };
        gapiScript.onerror = reject;
        document.body.appendChild(gapiScript);
    });
}

// Initialiser GAPI
async function gapiInit() {
    await new Promise(resolve => gapi.load('client', resolve));
    await gapi.client.init({
        apiKey: GOOGLE_CONFIG.API_KEY,
        discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC]
    });
    gapiInited = true;
}

// Initialiser GIS
function gisInit() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        scope: GOOGLE_CONFIG.SCOPES,
        callback: (response) => {
            if (response.error !== undefined) {
                throw response;
            }
            isSignedIn = true;
            updateSyncButton();
            showSyncStatus('✓ Connecté à Google Drive', 'success');
        }
    });
    gisInited = true;
}

// Connexion à Google Drive
async function signInGoogleDrive() {
    // Vérifier si les identifiants sont configurés
    if (!GOOGLE_CONFIG.CLIENT_ID || !GOOGLE_CONFIG.API_KEY) {
        alert('Veuillez d\'abord configurer vos identifiants Google Drive dans le fichier google-drive-sync.js');
        return;
    }
    
    // Si l'initialisation n'est pas encore terminée, attendre
    if (!gapiInited || !gisInited) {
        showSyncStatus('⏳ Initialisation Google Drive...', 'loading');
        
        // Attendre jusqu'à 10 secondes maximum
        let attempts = 0;
        while ((!gapiInited || !gisInited) && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        // Si toujours pas initialisé, afficher une erreur détaillée
        if (!gapiInited || !gisInited) {
            const errorDetails = lastInitError || 'Timeout d\'initialisation';
            alert('❌ Erreur d\'initialisation de Google Drive:\n\n' + errorDetails + '\n\nVérifiez :\n1. CLIENT_ID est correct (.apps.googleusercontent.com)\n2. API_KEY est correcte\n3. "Origines JavaScript autorisées" dans Google Cloud Console\n4. Connexion Internet');
            showSyncStatus('❌ ' + errorDetails, 'error');
            return;
        }
        
        showSyncStatus('', 'info');
    }
    
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// Déconnexion
function signOutGoogleDrive() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        isSignedIn = false;
        updateSyncButton();
        showSyncStatus('Déconnecté de Google Drive', 'info');
    }
}

// Synchroniser les notes vers Google Drive
async function syncToGoogleDrive() {
    if (!isSignedIn) {
        alert('Veuillez vous connecter à Google Drive d\'abord');
        return;
    }
    
    showSyncStatus('⏳ Synchronisation en cours...', 'loading');
    
    try {
        // Préparer les données
        const dataToSync = {
            sections: sections,
            lastSync: new Date().toISOString(),
            version: '0.3'
        };
        
        const jsonData = JSON.stringify(dataToSync, null, 2);
        
        // Chercher le fichier existant
        const existingFile = await findNotesFile();
        
        if (existingFile) {
            // Mettre à jour le fichier existant
            await updateFileInDrive(existingFile.id, jsonData);
            showSyncStatus('✓ Notes synchronisées', 'success');
        } else {
            // Créer un nouveau fichier
            await createFileInDrive(jsonData);
            showSyncStatus('✓ Notes sauvegardées sur Drive', 'success');
        }
        
        // Mettre à jour le timestamp de dernière synchro
        localStorage.setItem('lastGoogleDriveSync', new Date().toISOString());
        
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        showSyncStatus('❌ Erreur de synchronisation', 'error');
        alert('Erreur lors de la synchronisation: ' + error.message);
    }
}

// Restaurer les notes depuis Google Drive
async function restoreFromGoogleDrive() {
    if (!isSignedIn) {
        alert('Veuillez vous connecter à Google Drive d\'abord');
        return;
    }
    
    if (!confirm('Cette action remplacera toutes vos notes locales par celles de Google Drive. Continuer ?')) {
        return;
    }
    
    showSyncStatus('⏳ Restauration en cours...', 'loading');
    
    try {
        const existingFile = await findNotesFile();
        
        if (!existingFile) {
            alert('Aucune sauvegarde trouvée sur Google Drive');
            showSyncStatus('❌ Aucune sauvegarde trouvée', 'error');
            return;
        }
        
        // Télécharger le fichier
        const response = await gapi.client.drive.files.get({
            fileId: existingFile.id,
            alt: 'media'
        });
        
        const data = JSON.parse(response.body);
        
        // Restaurer les sections
        if (data.sections && Array.isArray(data.sections)) {
            sections = data.sections;
            await saveData();
            updateTOC();
            
            if (sections.length > 0) {
                loadSection(sections[0].id);
            }
            
            showSyncStatus('✓ Notes restaurées depuis Drive', 'success');
            alert(`${sections.length} note(s) restaurée(s) depuis Google Drive`);
        } else {
            throw new Error('Format de données invalide');
        }
        
    } catch (error) {
        console.error('Erreur de restauration:', error);
        showSyncStatus('❌ Erreur de restauration', 'error');
        alert('Erreur lors de la restauration: ' + error.message);
    }
}

// Chercher le fichier de notes sur Drive
async function findNotesFile() {
    try {
        const response = await gapi.client.drive.files.list({
            q: "name='bloc-notes-backup.json' and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name, modifiedTime)'
        });
        
        const files = response.result.files;
        return files && files.length > 0 ? files[0] : null;
    } catch (error) {
        console.error('Erreur lors de la recherche du fichier:', error);
        throw error;
    }
}

// Créer un nouveau fichier sur Drive
async function createFileInDrive(content) {
    const file = new Blob([content], { type: 'application/json' });
    const metadata = {
        name: 'bloc-notes-backup.json',
        mimeType: 'application/json'
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
        body: form
    });
    
    return await response.json();
}

// Mettre à jour un fichier existant sur Drive
async function updateFileInDrive(fileId, content) {
    const file = new Blob([content], { type: 'application/json' });
    
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: new Headers({ 
            'Authorization': 'Bearer ' + gapi.client.getToken().access_token,
            'Content-Type': 'application/json'
        }),
        body: file
    });
    
    return await response.json();
}

// Mettre à jour le bouton de synchronisation
function updateSyncButton() {
    const syncBtn = document.getElementById('googleDriveSyncBtn');
    const signInBtn = document.getElementById('googleDriveSignInBtn');
    const signOutBtn = document.getElementById('googleDriveSignOutBtn');
    const restoreBtn = document.getElementById('googleDriveRestoreBtn');
    
    if (isSignedIn) {
        if (syncBtn) syncBtn.disabled = false;
        if (restoreBtn) restoreBtn.disabled = false;
        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'inline-block';
    } else {
        if (syncBtn) syncBtn.disabled = true;
        if (restoreBtn) restoreBtn.disabled = true;
        if (signInBtn) signInBtn.style.display = 'inline-block';
        if (signOutBtn) signOutBtn.style.display = 'none';
    }
}

// Afficher le statut de synchronisation
function showSyncStatus(message, type) {
    const statusEl = document.getElementById('syncStatus');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'sync-status ' + type;
    
    // Cacher après 5 secondes sauf si erreur
    if (type !== 'error') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'sync-status';
        }, 5000);
    }
}

// Synchronisation automatique toutes les 5 minutes
let autoSyncInterval = null;

function startAutoSync() {
    if (autoSyncInterval) return;
    
    autoSyncInterval = setInterval(() => {
        if (isSignedIn && sections.length > 0) {
            syncToGoogleDrive();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
}
