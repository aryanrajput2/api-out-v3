// Simple and reliable image zoom functionality
(function() {
  'use strict';

  // Global variables
  window.galleryImages = [];
  
  // Create image zoom modal
  function openImageZoom(imageUrl) {
    console.log('Opening image zoom for:', imageUrl);
    
    // Remove existing modal if any
    closeImageZoom();
    
    const modal = document.createElement("div");
    modal.id = "image-zoom-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
      backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
      <div style="position: relative; max-width: 95vw; max-height: 95vh; display: flex; align-items: center; justify-content: center;">
        <img src="${imageUrl}" alt="Hotel Image" style="max-width: 100%; max-height: 95vh; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: zoomIn 0.4s ease-out;">
        
        <!-- Close Button -->
        <button onclick="closeImageZoom()" style="position: absolute; top: -50px; right: -50px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; border-radius: 50%; width: 50px; height: 50px; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4); transition: all 0.3s ease; z-index: 10001;">
          <i class="ph ph-x" style="font-weight: bold;"></i>
        </button>
        
        <!-- Image Info Badge -->
        <div style="position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 12px; font-size: 0.9rem; color: #334155; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px;">
          <i class="ph ph-info" style="color: var(--primary); font-size: 1.1rem;"></i>
          Click outside or press ESC to close
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.onclick = (e) => {
      if (e.target === modal) closeImageZoom();
    };
    
    // Close on ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeImageZoom();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  // Close image zoom modal
  function closeImageZoom() {
    const modal = document.getElementById("image-zoom-modal");
    if (modal) {
      modal.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  }

  // Initialize image gallery functionality
  function initializeImageGallery() {
    console.log('Initializing image gallery...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeImageGallery);
      return;
    }
    
    // Use event delegation for dynamic content
    document.addEventListener('click', function(e) {
      console.log('Document click detected:', e.target);
      
      // Check if clicked element is a gallery image container
      const galleryMain = e.target.closest('.gallery-main');
      const galleryThumb = e.target.closest('.gallery-thumb');
      
      if (galleryMain) {
        console.log('Gallery main clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const idx = parseInt(galleryMain.getAttribute('data-idx'), 10) || 0;
        console.log('Main gallery index:', idx);
        console.log('Available gallery images:', window.galleryImages);
        
        if (window.galleryImages && window.galleryImages[idx]) {
          console.log('Opening image:', window.galleryImages[idx]);
          openImageZoom(window.galleryImages[idx]);
        } else {
          console.warn('No image found at index:', idx);
        }
        return;
      }
      
      if (galleryThumb) {
        console.log('Gallery thumb clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const idx = parseInt(galleryThumb.getAttribute('data-idx'), 10) || 0;
        console.log('Thumb gallery index:', idx);
        console.log('Available gallery images:', window.galleryImages);
        
        if (window.galleryImages && window.galleryImages[idx]) {
          // Update main image if it exists
          const mainImg = document.getElementById('main-gallery-image');
          if (mainImg) {
            mainImg.src = window.galleryImages[idx];
            const mainContainer = mainImg.closest('.gallery-main');
            if (mainContainer) {
              mainContainer.setAttribute('data-idx', idx);
            }
          }
          
          // Update thumbnail borders
          document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
            thumb.style.borderColor = i === idx ? 'var(--primary)' : 'transparent';
          });
          
          // Open zoom
          console.log('Opening image:', window.galleryImages[idx]);
          openImageZoom(window.galleryImages[idx]);
        } else {
          console.warn('No image found at index:', idx);
        }
        return;
      }
    });
  }

  // Make functions globally available
  window.openImageZoom = openImageZoom;
  window.closeImageZoom = closeImageZoom;
  window.initializeImageGallery = initializeImageGallery;

  // Auto-initialize
  initializeImageGallery();

})();