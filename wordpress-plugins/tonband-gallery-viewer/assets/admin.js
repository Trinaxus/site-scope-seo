(function ($) {
  'use strict';

  const saved = window.tonbandSaved || {};
  const { ajaxUrl, nonce } = window.tonbandGalleryViewer || {};

  let galleriesByYear = {};

  function updateShortcode() {
    const jahr = $('#tonband_year').val();
    const galerie = $('#tonband_gallery').val();
    const mode = $('#tonband_mode').val();
    const image = $('#tonband_image').val();

    if (!jahr || !galerie) {
      $('#tonband_shortcode').val('');
      $('#tonband_preview').html('');
      return;
    }

    const imageAttr = mode === 'single' && image ? ` image="${image}"` : '';
    const shortcode = `[tonband-gallery jahr="${jahr}" galerie="${galerie}" mode="${mode}"${imageAttr}]`;
    $('#tonband_shortcode').val(shortcode);

    const galleryData = (galleriesByYear[jahr] || []).find((g) => g.galerie === galerie);
    if (galleryData && galleryData.status !== 'public') {
      $('#tonband_preview').html(
        `<p class="tonband-meta-note">${tonbandGalleryViewer.i18n.locked}</p>`
      );
      return;
    }

    let html = '';
    if (mode === 'single' && image) {
      const url = buildImageUrl(jahr, galerie, image);
      html = `<img src="${url}" alt="${galerie}" class="tonband-preview-img">`;
    } else if (galleryData && galleryData.images && galleryData.images.length) {
      html = '<div class="tonband-preview-grid">';
      galleryData.images.slice(0, 6).forEach((img) => {
        html += `<img src="${buildImageUrl(jahr, galerie, img)}" alt="${galerie}">`;
      });
      html += '</div>';
    }
    $('#tonband_preview').html(html);
  }

  function buildImageUrl(year, gallery, file) {
    return (
      'https://tonbandleipzig.de/tonband/server/uploads/' +
      encodeURIComponent(year) +
      '/' +
      encodeURIComponent(gallery) +
      '/' +
      encodeURIComponent(file)
    );
  }

  function loadGalleries() {
    $('#tonband_year, #tonband_gallery, #tonband_image').prop('disabled', true);
    $.ajax({
      url: ajaxUrl,
      type: 'POST',
      data: {
        action: 'tonband_get_galleries',
        nonce: nonce,
      },
      success(response) {
        if (!response.success) {
          return;
        }
        galleriesByYear = response.data || {};

        const $yearSelect = $('#tonband_year').empty().append('<option value="">— wählen —</option>').prop('disabled', false);
        Object.keys(galleriesByYear).sort((a, b) => b - a).forEach((year) => {
          $yearSelect.append(`<option value="${year}">${year}</option>`);
        });

        if (saved.jahr && galleriesByYear[saved.jahr]) {
          $yearSelect.val(saved.jahr).trigger('change');
        }
      },
    });
  }

  function loadImagesForGallery(year, galleryName, selectImage) {
    const $imageSelect = $('#tonband_image').empty().append('<option value="">— wählen —</option>');
    const galleryData = (galleriesByYear[year] || []).find((g) => g.galerie === galleryName);

    if (galleryData && galleryData.images) {
      galleryData.images.forEach((img) => {
        $imageSelect.append(`<option value="${img}">${img}</option>`);
      });
    }

    if (selectImage) {
      $imageSelect.val(selectImage);
    }
  }

  $(document).ready(function () {
    if (!$('#tonband_year').length || !ajaxUrl) {
      return;
    }

    loadGalleries();

    $('#tonband_year').on('change', function () {
      const year = $(this).val();
      const $gallerySelect = $('#tonband_gallery').empty().append('<option value="">— wählen —</option>').prop('disabled', !year);
      $('#tonband_image').empty().append('<option value="">— erst Galerie wählen —</option>');

      if (!year || !galleriesByYear[year]) {
        updateShortcode();
        return;
      }

      galleriesByYear[year].forEach((gallery) => {
        const label = `${gallery.galerie} (${gallery.kategorie || '-'})`;
        $gallerySelect.append(`<option value="${gallery.galerie}">${label}</option>`);
      });

      if (saved.galerie) {
        $gallerySelect.val(saved.galerie).trigger('change');
        saved.galerie = '';
      }
      updateShortcode();
    });

    $('#tonband_gallery').on('change', function () {
      const year = $('#tonband_year').val();
      const galleryName = $(this).val();
      if (year && galleryName) {
        loadImagesForGallery(year, galleryName, saved.image);
        saved.image = '';
      }
      updateShortcode();
    });

    $('#tonband_image, #tonband_mode').on('change', function () {
      updateShortcode();
    });

    $('#tonband_mode').on('change', function () {
      const mode = $(this).val();
      $('#tonband_image_field').toggle(mode === 'single');
      updateShortcode();
    });

    $('#tonband_copy_shortcode').on('click', function () {
      const $input = $('#tonband_shortcode');
      $input.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        navigator.clipboard.writeText($input.val());
      }
      $(this).text(tonbandGalleryViewer.i18n.copied);
      setTimeout(() => $(this).text(tonbandGalleryViewer.i18n.copy), 1500);
    });
  });
})(jQuery);
