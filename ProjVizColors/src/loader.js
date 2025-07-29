// loader.js
export function createLoader() {
    // Create loader HTML with spinner
    const loaderHTML = `
        <div id="loader">
            <div class="loader-content">
                <div class="spinner"></div>
                <div class="loader-title">Loading Experience</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
                <div class="loader-percentage" id="loader-percentage">0%</div>
                <div class="loader-text" id="loader-text">Loading assets...</div>
            </div>
        </div>
    `;
    
    // Insert loader into body
    document.body.insertAdjacentHTML('afterbegin', loaderHTML);
    
    // Return loader elements
    return {
        loader: document.getElementById('loader'),
        progressBar: document.getElementById('progress-bar'),
        loaderPercentage: document.getElementById('loader-percentage'),
        loaderText: document.getElementById('loader-text')
    };
}

export function setupLoadingManager(loadingManager, loaderElements, callbacks) {
    const { loader, progressBar, loaderPercentage, loaderText } = loaderElements;
    
    // Track all resources
    const resources = {
        textures: 0,
        models: 0,
        hdri: 0,
        total: 0,
        loaded: 0
    };
    
    loadingManager.onStart = function(url, itemsLoaded, itemsTotal) {
        console.log('Started loading:', url);
        resources.total = itemsTotal;
        
        // Identify resource type
        if (url.includes('.hdr')) {
            resources.hdri++;
            loaderText.textContent = 'Loading environment...';
        } else if (url.includes('.gltf') || url.includes('.glb')) {
            resources.models++;
            loaderText.textContent = 'Loading 3D models...';
        } else if (url.includes('.png') || url.includes('.jpg')) {
            resources.textures++;
            loaderText.textContent = 'Loading textures...';
        }
    };
    
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        resources.loaded = itemsLoaded;
        const progress = (itemsLoaded / itemsTotal) * 100;
        
        // Update progress bar
        progressBar.style.width = progress + '%';
        loaderPercentage.textContent = Math.round(progress) + '%';
        
        // Update text based on what's loading
        const fileName = url.split('/').pop();
        loaderText.textContent = `Loading: ${fileName}`;
        
        console.log(`Loading: ${itemsLoaded}/${itemsTotal} - ${fileName}`);
    };
    
    loadingManager.onLoad = function() {
        console.log('All resources loaded!');
        
        // Add a small delay to ensure everything is rendered
        setTimeout(() => {
            // Fade out loader
            loader.classList.add('fade-out');
            
            // Remove loader after fade
            setTimeout(() => {
                loader.style.display = 'none';
                // Call the onComplete callback
                if (callbacks.onComplete) {
                    callbacks.onComplete();
                }
            }, 500);
        }, 500);
    };
    
    loadingManager.onError = function(url) {
        console.error('Error loading:', url);
        loaderText.textContent = `Error loading: ${url.split('/').pop()}`;
        loaderText.style.color = '#ff4444';
    };
    
    return resources;
}