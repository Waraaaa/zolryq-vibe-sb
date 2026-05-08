// EXPORT: Creates a .json file for Discord sharing
async function exportLibrary() {
    const tx = db.transaction("media", "readonly");
    const store = tx.objectStore("media");
    const request = store.getAll();

    request.onsuccess = async () => {
        const username = localStorage.getItem('zolryq_user') || 'Guest';
        const safeUsername = username.replace(/[^a-z0-9]/gi, '_');

        const data = JSON.stringify(request.result);
        
        // --- COMPRESSION START ---
        const blob = new Blob([data], { type: "application/json" });
        const compressedStream = blob.stream().pipeThrough(new CompressionStream("gzip"));
        const compressedResponse = new Response(compressedStream);
        const compressedBlob = await compressedResponse.blob();
        // --- COMPRESSION END ---

        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        // We name it .json.gz so it's clear it's a compressed JSON
        a.download = `Zolryq_SB_${safeUsername}_backup.json.gz`;
        a.click();
        URL.revokeObjectURL(url);
    };
}

// IMPORT: Reads a shared .json file and saves it to iPad
async function importLibrary(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // --- DECOMPRESSION START ---
        const ds = file.stream().pipeThrough(new DecompressionStream("gzip"));
        const response = new Response(ds);
        const blob = await response.blob();
        const jsonText = await blob.text();
        // --- DECOMPRESSION END ---

        const importedData = JSON.parse(jsonText);
        const tx = db.transaction("media", "readwrite");
        const store = tx.objectStore("media");

        importedData.forEach(item => {
            delete item.id;
            store.add(item);
        });

        tx.oncomplete = () => {
            alert("Library Decompressed & Imported!");
            loadMedia();
            closeModal('userModal');
        };
    } catch (err) {
        console.error(err);
        alert("Error: This file might not be compressed correctly or is corrupted.");
    }
}
