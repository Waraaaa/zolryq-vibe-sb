// EXPORT: Creates a .json file for Discord sharing
function exportLibrary() {
    const tx = db.transaction("media", "readonly");
    const store = tx.objectStore("media");
    const request = store.getAll();

    request.onsuccess = () => {
        // Convert the database array to a JSON string
        const data = JSON.stringify(request.result, null, 2); 
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        // Naming it .json so Discord recognizes it as a text/data file
        a.download = `Zolryq_Soundboard_Backup.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
}

// IMPORT: Reads a shared .json file and saves it to iPad
function importLibrary(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const importedData = JSON.parse(ev.target.result);
            const tx = db.transaction("media", "readwrite");
            const store = tx.objectStore("media");

            importedData.forEach(item => {
                // We delete the old 'id' so the new iPad 
                // generates its own unique ID for the sound
                delete item.id; 
                store.add(item);
            });

            tx.oncomplete = () => {
                alert("Library Imported! Your new sounds are ready.");
                loadMedia(); // Refresh the grid
                closeModal('userModal');
            };
        } catch (err) {
            console.error(err);
            alert("Oops! That file doesn't look like a valid Zolryq Soundboard JSON.");
        }
    };
    reader.readAsText(file); // Important: Use readAsText for JSON files
}
