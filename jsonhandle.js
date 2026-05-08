// EXPORT: Turns your whole database into a downloadable file
function exportLibrary() {
    const tx = db.transaction("media", "readonly");
    const store = tx.objectStore("media");
    const request = store.getAll();

    request.onsuccess = () => {
        const data = JSON.stringify(request.result);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Zolryq_Backup_${new Date().toLocaleDateString()}.zolryq`;
        a.click();
        URL.revokeObjectURL(url);
    };
}

// IMPORT: Takes a .zolryq file and puts it into your IndexedDB
function importLibrary(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const importedData = JSON.parse(ev.target.result);
            const tx = db.transaction("media", "readwrite");
            const store = tx.objectStore("media");

            // Clear current data first? (Optional - remove store.clear() if you want to merge)
            // store.clear(); 

            importedData.forEach(item => {
                // Remove the old ID so IndexedDB generates a new one to avoid conflicts
                delete item.id; 
                store.add(item);
            });

            tx.oncomplete = () => {
                alert("Library Restored Successfully!");
                loadMedia();
                closeModal('userModal');
            };
        } catch (err) {
            alert("Error importing file. Make sure it's a valid .zolryq file!");
        }
    };
    reader.readAsDataURL(file); // Note: Should be readAsText for JSON
    // Change to reader.readAsText(file);
}
