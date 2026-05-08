let db, currentType = 'music', pendingDeleteId = null, editingId = null; // Track which song is getting a new image

const req = indexedDB.open("ZolryqDB_Lite", 1);
req.onupgradeneeded = e => {
    e.target.result.createObjectStore("media", { keyPath: "id", autoIncrement: true });
};
req.onsuccess = e => { 
    db = e.target.result; 
    loadMedia(); 

    // Load Name
    const savedName = localStorage.getItem('zolryq_user') || 'Guest';
    document.getElementById('displayUser').innerText = savedName;
    document.getElementById('userInput').value = savedName;

    // Load and Apply Color
    const savedColor = localStorage.getItem('zolryq_accent') || '#ff3e3e';
    document.documentElement.style.setProperty('--accent', savedColor);
    document.getElementById('colorPicker').value = savedColor;
};

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function saveUser() {
    const name = document.getElementById('userInput').value;
    const color = document.getElementById('colorPicker').value;
    
    if(name) {
        localStorage.setItem('zolryq_user', name);
        document.getElementById('displayUser').innerText = name;
    }

    // Save and apply the color
    localStorage.setItem('zolryq_accent', color);
    document.documentElement.style.setProperty('--accent', color);

    closeModal('userModal');
}

function openPicker(type) { currentType = type; document.getElementById('fileInput').click(); }

function processFile(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const tx = db.transaction("media", "readwrite");
        tx.objectStore("media").add({
            originalName: file.name,
            displayName: file.name.split('.')[0],
            data: ev.target.result,
            type: currentType,
            dateAdded: new Date().toLocaleDateString(), // Add this line
            size: file.size,
            image: "https://cdn.discordapp.com/attachments/1502314230592966656/1502325673094680686/4ADA4F22-7C87-46EA-A9E3-4F2BEC1088D9.png?ex=69ff4d50&is=69fdfbd0&hm=c29fb8fa442ae70b69350e3be99442a990f4e0a89f91e9f2b38803130d13cb60&"
        });
        tx.oncomplete = loadMedia;
    };
    reader.readAsDataURL(file);
}

function loadMedia() {
    const sfxGrid = document.getElementById('grid-sfx');
    const musicGrid = document.getElementById('grid-music');
    
    sfxGrid.innerHTML = '';
    musicGrid.innerHTML = '';

    let hasSfx = false;
    let hasMusic = false;

    db.transaction("media").objectStore("media").openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if(cursor) { 
            renderItem(cursor.value); 
            if(cursor.value.type === 'sfx') hasSfx = true;
            if(cursor.value.type === 'music') hasMusic = true;
            cursor.continue(); 
        } else {
            // Check if grids are empty after cursor finishes
            if (!hasSfx) {
                sfxGrid.innerHTML = '<div class="empty-text">There\'s no upload in this category yet.</div>';
            }
            if (!hasMusic) {
                musicGrid.innerHTML = '<div class="empty-text">There\'s no upload in this category yet.</div>';
            }
        }
    };
}

function renderItem(item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.id = `card-${item.id}`;
    div.dataset.playing = "false"; 
    div.dataset.type = item.type; 

    div.innerHTML = `
        <!-- Sphere Loop Button -->
        <div class="card-loop-btn ${item.isLooping ? 'active' : ''}" 
             id="loop-btn-${item.id}" 
             onclick="toggleIndividualLoop(${item.id})">
             <img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502344803306700992/8B23509B-DFD5-4F45-BA2F-AE55C761DEBC.png?ex=69ff5f21&is=69fe0da1&hm=2b2da820308f1b3e015e0fb2ea93d1202dd1ae7358da2dbaebd653502f967380&">
        </div>
             
        <img class="thumb" src="${item.image}" onclick="setImg(${item.id})">
        <div class="card-title-container" onclick="this.querySelector('.card-title').focus()">
            <span class="card-title" contenteditable="true" onblur="updateName(${item.id}, this)">${item.displayName}</span>
            <img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502344369670197338/3CFD3480-0211-417A-8DFD-6F0C82A6FFA8.png?ex=69ff5eb9&is=69fe0d39&hm=9147ca382fb7aad686ef00b242645ba2fa6a95deaa2f5529822ce60cb6a62c12&" class="edit-icon" style="width:12px; height:12px; margin-left:5px;">
        </div>
        <input type="range" id="range-${item.id}" value="0" step="0.1" oninput="doSeek(${item.id})">
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; font-family: monospace; margin-bottom: 5px;">
            <span id="cur-${item.id}">0:00</span>
            <span id="total-${item.id}">0:00</span>
        </div>
        <div class="controls">
            <button class="btn" onclick="showInfo(${item.id})"><img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502341923199909948/FC8A5BCF-C4DD-41A5-AD30-12ABE7AEA63A.png?ex=69ff5c72&is=69fe0af2&hm=4b388b079b5b7c3f8daf8e60c9a282015106072234966a230b2a1763653457fc&" class="icon"></button>
            <button class="btn play-btn" id="play-${item.id}" onclick="pPlay(${item.id})"><img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502341923644637376/FF9E85C5-3C39-4B80-B55D-BE5A935EDCE4.png?ex=69ff5c72&is=69fe0af2&hm=73a568fade8c38ca2ba46351d296196729de0b34f947643f5cab3241c568523d&" class="icon"></button>
            <button class="btn" onclick="delItem(${item.id})"><img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502341922742735038/C5B3F949-F477-4E70-AB33-562E7F4BA78B.png?ex=69ff5c72&is=69fe0af2&hm=313e979928ecf4879f2a549293454b3c56eb44d78cc292d4a3269233db3f4fa4&" class="icon"></button>
        </div>
        <audio id="aud-${item.id}" src="${item.data}" ${item.isLooping ? 'loop' : ''}></audio>
    `;
    document.getElementById(`grid-${item.type}`).appendChild(div);
    
    const a = document.getElementById(`aud-${item.id}`);
    a.onloadedmetadata = () => { 
        document.getElementById(`range-${item.id}`).max = a.duration; 
        document.getElementById(`total-${item.id}`).innerText = fmtTime(a.duration);
    };
    a.ontimeupdate = () => { 
        if(!document.getElementById(`range-${item.id}`).matches(':active')) {
            document.getElementById(`range-${item.id}`).value = a.currentTime;
        }
        document.getElementById(`cur-${item.id}`).innerText = fmtTime(a.currentTime);
    };
    
    // Cleaned up onended logic
    a.onended = () => {
        // Fetch the latest loop status from the button class
        const isLooping = document.getElementById(`loop-btn-${item.id}`).classList.contains('active');
        if(isLooping) {
            a.play();
        } else {
            // Manual Cleanup to move card down
            document.getElementById(`play-${item.id}`).innerHTML = `<img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502341923644637376/FF9E85C5-3C39-4B80-B55D-BE5A935EDCE4.png?ex=69ff5c72&is=69fe0af2&hm=73a568fade8c38ca2ba46351d296196729de0b34f947643f5cab3241c568523d&" class="icon">`;
            div.dataset.playing = "false";
            div.style.border = "1px solid #222";
            div.style.boxShadow = "none";

            const grid = div.parentElement;
            const playingCards = grid.querySelectorAll('.card[data-playing="true"]');
            if (playingCards.length > 0) {
                playingCards[playingCards.length - 1].after(div);
            } else {
                grid.prepend(div);
            }
        }
    };
}

// ADDED FORMATTING FUNCTION FOR HOURS/MINS/SECS
function fmtTime(s) {
    if(!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = Math.floor(s % 60);
    const pad = (n) => n.toString().padStart(2, '0');
    
    if (h > 0) {
        return `${h}:${pad(m)}:${pad(sc)}`;
    }
    return `${m}:${pad(sc)}`;
}

function updateName(id, el) {
    const tx = db.transaction("media", "readwrite");
    const store = tx.objectStore("media");
    store.get(id).onsuccess = e => {
        let d = e.target.result; d.displayName = el.innerText; store.put(d);
    };
}

function toggleIndividualLoop(id) {
    const btn = document.getElementById(`loop-btn-${id}`);
    const aud = document.getElementById(`aud-${id}`);
    const tx = db.transaction("media", "readwrite");
    const store = tx.objectStore("media");
    
    store.get(id).onsuccess = e => {
        const data = e.target.result;
        // Toggle the state
        data.isLooping = !data.isLooping; 
        
        // Save to IndexedDB
        store.put(data);
        
        // Update UI & Audio Engine
        btn.classList.toggle('active', data.isLooping);
        aud.loop = data.isLooping;
    };
}

function delItem(id) {
    pendingDeleteId = id;
    db.transaction("media").objectStore("media").get(id).onsuccess = e => {
        const name = e.target.result.displayName;
        document.getElementById('deleteConfirmText').innerText = `Permanently delete "${name}"?`;
        
        // Link the "Delete" button to the actual action
        document.getElementById('confirmDeleteBtn').onclick = executeDelete;
        openModal('deleteModal');
    };
}

function executeDelete() {
    const id = pendingDeleteId;
    const card = document.getElementById(`card-${id}`);
    const aud = document.getElementById(`aud-${id}`);
    const type = card.dataset.type;

    if(aud) { aud.pause(); aud.src = ""; aud.load(); }

    const tx = db.transaction("media", "readwrite");
    tx.objectStore("media").delete(id);
    tx.oncomplete = () => {
        card.remove();
        closeModal('deleteModal');
        
        // Check if grid is now empty
        const grid = document.getElementById(`grid-${type}`);
        if (grid.children.length === 0) {
            grid.innerHTML = '<div class="empty-text">There\'s no upload in this category yet.</div>';
        }
    };
}

function showInfo(id) {
    db.transaction("media").objectStore("media").get(id).onsuccess = e => {
        const item = e.target.result;
        const aud = document.getElementById(`aud-${id}`);
        
        // Format the duration nicely
        const duration = fmtTime(aud.duration);

        // Helper to format bytes to KB/MB
        const formatBytes = (bytes) => {
            if (!bytes) return "Unknown";
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        document.getElementById('infoContent').innerHTML = `
            <div style="display: grid; gap: 10px;">
                <div>
                    <span style="color: var(--accent); font-weight: bold; font-size: 10px; text-transform: uppercase;">Current Name</span>
                    <div style="color: white; font-size: 16px;">${item.displayName}</div>
                </div>
                <hr style="border: 0; border-top: 1px solid #333; margin: 5px 0;">
                <p style="margin: 2px 0;"><strong>> Original:</strong> ${item.originalName}</p>
                <p style="margin: 2px 0;"><strong>> Duration:</strong> ${duration}</p>
                <p style="margin: 2px 0;"><strong>> Size:</strong> ${formatBytes(item.size)}</p>
                <p style="margin: 2px 0;"><strong>> Uploaded:</strong> ${item.dateAdded || 'Earlier Today'}</p>
                <p style="margin: 2px 0;"><strong>> Internal ID:</strong> #${item.id}</p>
                <p style="margin: 2px 0;"><strong>> Category:</strong> ${item.type.toUpperCase()}</p>
            </div>
        `;
        openModal('infoModal');
    };
}

function pPlay(id) {
    const a = document.getElementById(`aud-${id}`);
    const b = document.getElementById(`play-${id}`);
    const card = document.getElementById(`card-${id}`);
    const grid = card.parentElement;

    if (a.paused) { 
        // START PLAYING
        a.play(); 
        b.innerHTML = `<img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502341923443048478/89F23901-D9B2-4769-B106-663A7461F4B3.png?ex=69ff5c72&is=69fe0af2&hm=b86ee5afcf183c320e50ad0c48bc610001042e33f14d3a32df9f08597742343a&" class="icon">`;
        card.dataset.playing = "true"; // Mark as playing
        
        // Jump to absolute top
        grid.prepend(card); 
        
        card.style.border = "1px solid var(--accent)";
        card.style.boxShadow = "0 0 10px var(--accent)";
    } else { 
        // STOP PLAYING
        a.pause(); 
        b.innerHTML = `<img src="https://cdn.discordapp.com/attachments/1502314230592966656/1502341923644637376/FF9E85C5-3C39-4B80-B55D-BE5A935EDCE4.png?ex=69ff5c72&is=69fe0af2&hm=73a568fade8c38ca2ba46351d296196729de0b34f947643f5cab3241c568523d&" class="icon">`;
        card.dataset.playing = "false"; // Mark as stopped
        
        // Find all cards in this grid that are still playing
        const playingCards = grid.querySelectorAll('.card[data-playing="true"]');
        
        if (playingCards.length > 0) {
            // Place this card immediately after the last playing card
            const lastActive = playingCards[playingCards.length - 1];
            lastActive.after(card);
        } else {
            // Nothing else is playing, so just move to top of the grid
            grid.prepend(card);
        }
        
        card.style.border = "1px solid #222";
        card.style.boxShadow = "none";
    }
}

function doSeek(id) { document.getElementById(`aud-${id}`).currentTime = document.getElementById(`range-${id}`).value; }

function setImg(id) {
    editingId = id;
    openModal('imgModal');
}

function processImg(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        const tx = db.transaction("media", "readwrite");
        const st = tx.objectStore("media");
        
        st.get(editingId).onsuccess = event => {
            let data = event.target.result;
            data.image = ev.target.result; // Save the actual image data
            st.put(data);
            tx.oncomplete = () => {
                loadMedia(); // Refresh UI
                closeModal('imgModal');
            };
        };
    };
    reader.readAsDataURL(file);
}

function toggleSidebar() {
    const side = document.getElementById('sideDrawer');
    const over = document.getElementById('sideOverlay');
    const tab = document.getElementById('sideTab');
    
    side.classList.toggle('active');
    
    if (side.classList.contains('active')) {
        over.style.display = 'block';
        tab.classList.add('hidden');
    } else {
        over.style.display = 'none';
        tab.classList.remove('hidden');
    }
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    const offset = 140; // Height of your sticky header
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = el.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    toggleSidebar(); // Close sidebar after clicking
}

function checkContrast(hex) {
    const warning = document.getElementById('contrastWarning');
    const saveBtn = document.getElementById('saveUserBtn');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    
    // YIQ brightness formula
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Thresholds
    const isTooLight = yiq > 200; // Very close to white
    const isTooDark = yiq < 40;   // Very close to the black background
    
    // Reset state
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    saveBtn.innerText = 'Save Changes';

    if (isTooLight) {
        warning.style.display = 'block';
        warning.style.color = '#ffeb3b'; // Yellow warning
        warning.innerText = '⚠ This color is very bright. Your eyes might hurt.';
    } else if (isTooDark) {
        warning.style.display = 'block';
        warning.style.color = '#ff5722'; // Orange/Red warning
        warning.innerText = '⚠ This color is in fact very dark, or you just love dark mode very much.';
    } else {
        warning.style.display = 'none';
    }
}
