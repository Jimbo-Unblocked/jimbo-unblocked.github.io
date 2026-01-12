const originalFetch = window.fetch;

// Create an array of URLs for the split files
function getParts(file, start, end) {
    let parts = [];
    for (let i = start; i <= end; i++) {
        parts.push(`https://cdn.jsdelivr.net/gh/Jimbo-Unblocked/jimbo-unblocked@v1.0.1/buckshot/${file}.part${i}`);
    }
    return parts;
}

// Merge split files into a single Blob
function mergeFiles(fileParts) {
    return new Promise((resolve, reject) => {
        let buffers = [];

        function fetchPart(index) {
            if (index >= fileParts.length) {
                let mergedBlob = new Blob(buffers);
                let mergedFileUrl = URL.createObjectURL(mergedBlob);
                resolve(mergedFileUrl);
                return;
            }
            fetch(fileParts[index])
                .then((response) => {
                    if (!response.ok) throw new Error("Missing part: " + fileParts[index]);
                    return response.arrayBuffer();
                })
                .then((data) => {
                    buffers.push(data);
                    fetchPart(index + 1);
                })
                .catch(reject);
        }
        fetchPart(0);
    });
}

// Merge the .pck and .wasm files
Promise.all([
    mergeFiles(getParts("buckshot-roulette.pck", 1, 17)),
    mergeFiles(getParts("buckshot-roulette.wasm", 1, 3))
]).then(([pckUrl, wasmUrl]) => {
    // Override fetch to serve the merged blobs
    window.fetch = async function (url, ...args) {
        if (url.endsWith("buckshot-roulette.pck")) {
            return originalFetch(pckUrl, ...args);
        } else if (url.endsWith("buckshot-roulette.wasm")) {
            return originalFetch(wasmUrl, ...args);
        } else {
            return originalFetch(url, ...args);
        }
    };
    // Start the Godot game
    window.godotRunStart();
});
