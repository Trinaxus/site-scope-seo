(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tonband-unlock-form').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var container = form.closest('[data-tonband-year]');
        var jahr = container.getAttribute('data-tonband-year');
        var galerie = container.getAttribute('data-tonband-gallery');
        var password = form.querySelector('[name="tonband_password"]').value;
        var messageEl = form.querySelector('.tonband-unlock-message');
        var button = form.querySelector('button');

        button.disabled = true;
        messageEl.textContent = '';

        var data = new FormData();
        data.append('action', 'tonband_unlock_gallery');
        data.append('nonce', tonbandGalleryFrontend.nonce);
        data.append('jahr', jahr);
        data.append('galerie', galerie);
        data.append('password', password);

        fetch(tonbandGalleryFrontend.ajaxUrl, {
          method: 'POST',
          body: data,
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (json) {
            if (json.success) {
              window.location.reload();
            } else {
              messageEl.textContent = json.data || 'Fehler';
              button.disabled = false;
            }
          })
          .catch(function () {
            messageEl.textContent = 'Netzwerkfehler.';
            button.disabled = false;
          });
      });
    });
  });
})();
