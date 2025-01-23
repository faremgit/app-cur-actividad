// Elimina la declaración anterior y usa directamente
function exportToExcel() {
    const XLSX = window.XLSX; // Mover la declaración aquí
    
    // ... resto del código de exportToExcel
}

// O mejor aún, verifica si ya existe
if(!window.XLSX) {
    console.error('La librería XLSX no está cargada');
}

// Función para exportar a Excel
async function exportToExcel() {
    try {
        const XLSX = window.XLSX;
        const snapshot = await eventsCollection.orderBy('createdAt', 'desc').get();
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if(events.length === 0) {
            alert('No hay eventos para exportar.');
            return;
        }

        // Preparar datos
        const data = [
            ['Título', 'Fecha de actividad', 'Ubicación', 'Descripción', 'Fecha de Creación']
        ];

        events.forEach(event => {
            data.push([
                event.title,
                formatExcelDate(event.date),
                event.location,
                event.description,
                formatExcelTimestamp(event.createdAt)
            ]);
        });

        // Crear hoja de cálculo
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Actividades');

        // Auto-ajustar columnas
        const wscols = [
            {wch: 25}, // Título
            {wch: 20}, // Fecha
            {wch: 25}, // Ubicación
            {wch: 40}, // Descripción
            {wch: 20}  // Fecha creación
        ];
        ws['!cols'] = wscols;

        // Generar archivo
        XLSX.writeFile(wb, `Actividades_${new Date().toISOString().slice(0,10)}.xlsx`);

    } catch (error) {
        console.error('Error exportando:', error);
        alert('Error al generar el archivo Excel');
    }
}

// Formateador de fechas para Excel
function formatExcelDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Formateador de timestamps de Firebase
function formatExcelTimestamp(timestamp) {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date();
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }) + ` (${date.toISOString().slice(0,16)})`;
}

// Event listener para el botón
document.getElementById('exportExcel').addEventListener('click', exportToExcel);



//**********************************************************************
let allEvents = [];

// Firebase Configuration (Replace with your own)
const firebaseConfig = {
    apiKey: "AIzaSyDAsM3rpnG4Duqw-vOREhOOOWeH-7fSD-0",
    authDomain: "my-events-cur.firebaseapp.com",
    projectId: "my-events-cur",
    storageBucket: "my-events-cur.firebasestorage.app",
    messagingSenderId: "956882017525",
    appId: "1:956882017525:web:45ba422323eb7dcede79bc"
  };

/// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const eventsCollection = db.collection('events');

// Elementos del DOM
const formContainer = document.getElementById('formContainer');
const eventsContainer = document.getElementById('eventsContainer');
const eventForm = document.getElementById('eventForm');
const toggleFormBtn = document.getElementById('toggleForm');
const cancelBtn = document.getElementById('cancelBtn');

let editingEventId = null;

// Event Listeners
toggleFormBtn.addEventListener('click', () => {
    formContainer.classList.toggle('hidden');
});

cancelBtn.addEventListener('click', resetForm);

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (editingEventId) {
            await eventsCollection.doc(editingEventId).update(eventData);
        } else {
            await eventsCollection.add(eventData);
        }
        resetForm();
    } catch (error) {
        console.error("Error saving event:", error);
    }
});

// Función para renderizar eventos
// Modifica la función renderEvents
function renderEvents() {
    eventsCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        allEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Pre-formatear valores para búsqueda
                searchableDate: formatDate(data.date).toLowerCase(),
                searchableText: `${data.title} ${data.location} ${data.description}`.toLowerCase()
            };
        });
        
        applyFilter(); // Aplicar filtro al cargar
    });
}

// Función de filtrado
function applyFilter() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    const filteredEvents = allEvents.filter(event => {
        return event.searchableText.includes(searchTerm) || 
               event.searchableDate.includes(searchTerm);
    });
    
    displayEvents(filteredEvents);
}

// Función separada para mostrar eventos
function displayEvents(events) {
    eventsContainer.innerHTML = events.map(event => `
        <div class="event-card">
            <h3>${event.title}</h3>
            <div class="date">${formatDate(event.date)}</div>
            <div class="location">${event.location}</div>
            <p>${event.description}</p>
            <div class="actions">
                <button class="action-btn edit-btn" onclick="editEvent('${event.id}')" aria-label="Editar evento">
                    <svg class="btn-icon" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    <span>Editar</span>
                </button>
                
                <button class="action-btn delete-btn" onclick="deleteEvent('${event.id}')" aria-label="Eliminar evento">
                    <svg class="btn-icon" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    <span>Eliminar</span>
                </button>
            </div>
        </div>
    `).join('');
}

// Añade debounce para búsquedas frecuentes
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilter, 300);
});
// Escuchador de evento para el buscador
document.getElementById('searchInput').addEventListener('input', applyFilter);

// Función para editar evento
window.editEvent = async (eventId) => {
    const doc = await eventsCollection.doc(eventId).get();
    const event = doc.data();
    
    document.getElementById('title').value = event.title;
    document.getElementById('date').value = event.date;
    document.getElementById('location').value = event.location;
    document.getElementById('description').value = event.description;
    
    editingEventId = eventId;
    formContainer.classList.remove('hidden');
};

// Función para eliminar evento
window.deleteEvent = async (eventId) => {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
        try {
            await eventsCollection.doc(eventId).delete();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    }
};

// Función para resetear el formulario
function resetForm() {
    eventForm.reset();
    editingEventId = null;
    formContainer.classList.add('hidden');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    
    return date.toLocaleDateString('es-ES', options)
               .replace(/(^\w{1})|(\s+\w{1})/g, letra => letra.toUpperCase())
               .replace(',', ' ');
}

// Inicializar la aplicación
renderEvents();
