// État de l'application
let sections = [];
let currentSectionId = null;
let autoSaveTimer = null;

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser IndexedDB et demander le stockage persistant
    await initDB();
    await requestPersistentStorage();
    
    // Charger les données (avec migration si nécessaire)
    await loadData();
    
    initializeEventListeners();
    
    // Créer une première section si vide
    if (sections.length === 0) {
        createNewSection();
    } else {
        loadSection(sections[0].id);
    }
});

// Initialiser les écouteurs d'événements
function initializeEventListeners() {
    // Menu
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    
    document.getElementById('closeSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
    
    // Fermer au clic sur l'overlay
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
    
    // Nouvelle section
    document.getElementById('newSectionBtn').addEventListener('click', createNewSection);
    
    // Export des notes sélectionnées
    document.getElementById('exportBtn').addEventListener('click', exportSelectedNotes);
    
    // Import des notes
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    
    document.getElementById('importFileInput').addEventListener('change', importNotes);
    
    // Supprimer section
    document.getElementById('deleteSectionBtn').addEventListener('click', deleteSelectedSections);
    
    // Titre de section
    document.getElementById('sectionTitle').addEventListener('input', updateSectionTitle);
    
    // Barre d'outils
    document.getElementById('boldBtn').addEventListener('click', () => execCommand('bold'));
    document.getElementById('italicBtn').addEventListener('click', () => execCommand('italic'));
    document.getElementById('underlineBtn').addEventListener('click', () => execCommand('underline'));
    document.getElementById('h1Btn').addEventListener('click', () => execCommand('formatBlock', '<h1>'));
    document.getElementById('h2Btn').addEventListener('click', () => execCommand('formatBlock', '<h2>'));
    document.getElementById('ulBtn').addEventListener('click', () => execCommand('insertUnorderedList'));
    
    // Éditeur
    const editor = document.getElementById('editor');
    editor.addEventListener('input', () => {
        if (currentSectionId) {
            const section = sections.find(s => s.id === currentSectionId);
            if (section) {
                section.content = editor.innerHTML;
                section.lastModified = new Date().toISOString();
                updateLastModifiedDisplay(section.lastModified);
                // Sauvegarde automatique avec délai
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    saveData();
                }, 500); // Sauvegarde 500ms après la dernière frappe
            }
        }
    });
    
    // Mettre à jour l'état des boutons lors de la sélection
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('focus', updateToolbarState);
    
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                execCommand('bold');
            } else if (e.key === 'i') {
                e.preventDefault();
                execCommand('italic');
            } else if (e.key === 'u') {
                e.preventDefault();
                execCommand('underline');
            }
        }
    });
}

// Créer une nouvelle section
function createNewSection() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Compter combien de notes existent déjà pour aujourd'hui
    // On compte les notes dont le titre commence par la date d'aujourd'hui
    const todayNotes = sections.filter(s => {
        return s.title && s.title.startsWith(dateStr);
    });
    
    const noteNumber = todayNotes.length + 1;
    const defaultTitle = `${dateStr} note ${noteNumber}`;
    
    const newSection = {
        id: Date.now(),
        title: defaultTitle,
        content: '',
        createdAt: now.toISOString(),
        lastModified: now.toISOString()
    };
    
    sections.push(newSection);
    updateTOC();
    loadSection(newSection.id);
    saveData();
    
    // Fermer le menu sur mobile
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

// Charger une section
function loadSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    currentSectionId = sectionId;
    
    document.getElementById('sectionTitle').value = section.title;
    document.getElementById('editor').innerHTML = section.content;
    updateLastModifiedDisplay(section.lastModified);
    
    // Mettre à jour l'état actif dans la TOC
    document.querySelectorAll('.toc li').forEach(li => {
        li.classList.remove('active');
        if (parseInt(li.dataset.id) === sectionId) {
            li.classList.add('active');
        }
    });
}

// Mettre à jour le titre de la section
function updateSectionTitle() {
    if (!currentSectionId) return;
    
    const section = sections.find(s => s.id === currentSectionId);
    if (section) {
        section.title = document.getElementById('sectionTitle').value || 'Sans titre';
        section.lastModified = new Date().toISOString();
        updateLastModifiedDisplay(section.lastModified);
        updateTOC();
        // Sauvegarde automatique avec délai
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveData();
        }, 500);
    }
}

// Supprimer la section actuelle
function deleteSelectedSections() {
    // Récupérer toutes les checkboxes cochées
    const checkboxes = document.querySelectorAll('.toc input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        alert('Veuillez sélectionner au moins une note à supprimer.');
        return;
    }
    
    if (sections.length === checkboxes.length) {
        alert('Vous ne pouvez pas supprimer toutes les notes !');
        return;
    }
    
    // Récupérer les IDs des notes sélectionnées
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.sectionId));
    
    const message = `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} note(s) ?`;
    if (!confirm(message)) {
        return;
    }
    
    // Supprimer les notes sélectionnées
    sections = sections.filter(s => !selectedIds.includes(s.id));
    
    // Si la note courante a été supprimée, charger une autre note
    if (selectedIds.includes(currentSectionId)) {
        loadSection(sections[0].id);
    }
    
    updateTOC();
    saveData();
}

// Mettre à jour la table des matières
function updateTOC() {
    const tocList = document.getElementById('tocList');
    tocList.innerHTML = '';
    
    sections.forEach(section => {
        const li = document.createElement('li');
        li.dataset.id = section.id;
        
        if (section.id === currentSectionId) {
            li.classList.add('active');
        }
        
        // Créer la checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.sectionId = section.id;
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher de charger la note quand on clique la checkbox
        });
        
        // Créer le span pour le titre
        const span = document.createElement('span');
        span.textContent = section.title;
        span.addEventListener('click', () => {
            loadSection(section.id);
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('show');
        });
        
        li.appendChild(checkbox);
        li.appendChild(span);
        tocList.appendChild(li);
    });
}

// Exécuter une commande d'édition
function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('editor').focus();
    // Mettre à jour l'état des boutons après la commande
    setTimeout(updateToolbarState, 10);
}

// Mettre à jour l'état visuel des boutons de la barre d'outils
function updateToolbarState() {
    // Vérifier l'état de chaque format
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    
    // Mettre à jour les boutons selon l'état du format
    if (document.queryCommandState('bold')) {
        boldBtn.classList.add('active');
    } else {
        boldBtn.classList.remove('active');
    }
    
    if (document.queryCommandState('italic')) {
        italicBtn.classList.add('active');
    } else {
        italicBtn.classList.remove('active');
    }
    
    if (document.queryCommandState('underline')) {
        underlineBtn.classList.add('active');
    } else {
        underlineBtn.classList.remove('active');
    }
    
    // Vérifier si on est dans une liste
    const ulBtn = document.getElementById('ulBtn');
    if (document.queryCommandState('insertUnorderedList')) {
        ulBtn.classList.add('active');
    } else {
        ulBtn.classList.remove('active');
    }
}

// Importer des notes depuis un fichier JSON
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedSections = JSON.parse(e.target.result);
            
            // Vérifier que c'est bien un tableau
            if (!Array.isArray(importedSections)) {
                alert('Format de fichier invalide.');
                return;
            }
            
            // Demander confirmation
            const message = `Voulez-vous importer ${importedSections.length} note(s) ?\n\nCela ajoutera les notes à vos notes existantes.`;
            if (!confirm(message)) {
                return;
            }
            
            // Trouver le plus grand ID existant
            let maxId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) : 0;
            
            // Ajouter les notes importées avec de nouveaux IDs
            importedSections.forEach(section => {
                maxId++;
                sections.push({
                    id: maxId,
                    title: section.title || 'Note importée',
                    content: section.content || '',
                    createdAt: section.createdAt || new Date().toISOString(),
                    lastModified: section.lastModified || new Date().toISOString()
                });
            });
            
            // Sauvegarder et mettre à jour
            saveData();
            updateTOC();
            
            // Charger la première note importée
            loadSection(maxId - importedSections.length + 1);
            
            alert(`${importedSections.length} note(s) importée(s) avec succès !`);
            
        } catch (error) {
            alert('Erreur lors de la lecture du fichier. Assurez-vous qu\'il s\'agit d\'un fichier JSON valide.');
            console.error('Erreur d\'import:', error);
        }
        
        // Réinitialiser l'input file
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Exporter les notes sélectionnées
function exportSelectedNotes() {
    // Récupérer toutes les checkboxes cochées
    const checkboxes = document.querySelectorAll('.toc input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        alert('Veuillez sélectionner au moins une note à exporter.');
        return;
    }
    
    // Récupérer les IDs des notes sélectionnées
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.sectionId));
    
    // Filtrer les sections sélectionnées
    const selectedSections = sections.filter(s => selectedIds.includes(s.id));
    
    // Créer le fichier JSON
    const dataStr = JSON.stringify(selectedSections, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Créer un nom de fichier avec la date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `notes-export-${dateStr}.json`;
    
    // Télécharger le fichier
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Décocher toutes les cases après l'export
    checkboxes.forEach(cb => cb.checked = false);
}

// Mettre à jour l'affichage de la date de modification
function updateLastModifiedDisplay(isoDate) {
    if (!isoDate) return;
    
    const date = new Date(isoDate);
    
    // Formater la date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Toujours afficher date et heure
    const displayText = `${day}/${month}/${year} ${hours}:${minutes}`;
    
    document.getElementById('lastModified').textContent = displayText;
}

// Sauvegarder les données
async function saveData() {
    try {
        await saveAllSections(sections);
    } catch (e) {
        console.error('Erreur de sauvegarde:', e);
    }
}

// Charger les données
async function loadData() {
    try {
        // Vérifier s'il y a des données à migrer depuis localStorage
        const migratedSections = await migrateFromLocalStorage();
        
        // Charger depuis IndexedDB
        const loadedSections = await loadAllSections();
        
        if (loadedSections && loadedSections.length > 0) {
            sections = loadedSections;
            // Ajouter lastModified aux anciennes sections si nécessaire
            sections.forEach(section => {
                if (!section.lastModified) {
                    section.lastModified = section.createdAt || new Date().toISOString();
                }
            });
            updateTOC();
        }
    } catch (e) {
        console.error('Erreur de chargement:', e);
    }
}
