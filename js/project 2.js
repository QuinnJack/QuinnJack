import { ready } from './lifecycle.js';

const lightboxContainer = document.createElement('div');
lightboxContainer.classList.add('lightbox', 'minimizable');
document.body.appendChild(lightboxContainer);

ready(() => {
  const galleryItems = document.querySelectorAll('section.gallery figure a');

  galleryItems.forEach((galleryItem) => {
    galleryItem.addEventListener('click', (event) => {
      event.preventDefault();

      const content = galleryItem.querySelector('picture, video');
      if (!content) return;

      openLightbox(content.cloneNode(true));
    });
  });

  lightboxContainer.addEventListener('click', () => {
    closeLightbox();
  });

  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  })
});

function openLightbox(content) {
  lightboxContainer.textContent = '';
  lightboxContainer.appendChild(content);
  lightboxContainer.classList.add('open');
}

function closeLightbox() {
  lightboxContainer.classList.remove('open');
}