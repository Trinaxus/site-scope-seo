<?php
/**
 * Plugin Name: Tonband Galerien Viewer
 * Description: Zeigt Galerien von tonbandleipzig.de im WordPress Admin an.
 * Version: 1.0.0
 * Author: SiteScope
 * License: GPL-2.0-or-later
 * Text Domain: tonband-gallery-viewer
 */

if (!defined('ABSPATH')) {
    exit;
}

class Tonband_Gallery_Viewer {
    private const API_URL = 'https://tonbandleipzig.de/tonband/server/api/gallery-api/list-galleries.php';
    private const CACHE_KEY = 'tonband_galleries_cache';
    private const CACHE_TIME = HOUR_IN_SECONDS;

    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('save_post', [$this, 'save_meta_box'], 10, 2);
        add_action('admin_init', [$this, 'save_passwords']);
        add_action('wp_ajax_tonband_get_galleries', [$this, 'ajax_get_galleries']);
        add_action('wp_ajax_tonband_get_images', [$this, 'ajax_get_images']);
        add_action('wp_ajax_tonband_unlock_gallery', [$this, 'ajax_unlock_gallery']);
        add_action('wp_ajax_nopriv_tonband_unlock_gallery', [$this, 'ajax_unlock_gallery']);
        add_shortcode('tonband-gallery', [$this, 'render_shortcode']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
    }

    public function add_admin_menu(): void {
        add_menu_page(
            __('Tonband Galerien', 'tonband-gallery-viewer'),
            __('Tonband Galerien', 'tonband-gallery-viewer'),
            'manage_options',
            'tonband-gallery-viewer',
            [$this, 'render_page'],
            'dashicons-format-gallery',
            30
        );
        add_submenu_page(
            'tonband-gallery-viewer',
            __('Passwörter verwalten', 'tonband-gallery-viewer'),
            __('Passwörter', 'tonband-gallery-viewer'),
            'manage_options',
            'tonband-gallery-passwords',
            [$this, 'render_passwords_page']
        );
    }

    public function enqueue_assets(string $hook): void {
        $pluginCss = plugin_dir_url(__FILE__) . 'assets/admin.css';
        $pluginJs = plugin_dir_url(__FILE__) . 'assets/admin.js';
        $version = '1.0.0';

        if ($hook === 'toplevel_page_tonband-gallery-viewer' || $hook === 'tonband-galerien_page_tonband-gallery-passwords') {
            wp_enqueue_style('tonband-gallery-viewer-admin', $pluginCss, [], $version);
        }

        $screen = get_current_screen();
        if ($screen && $screen->base === 'post') {
            wp_enqueue_style('tonband-gallery-viewer-admin', $pluginCss, [], $version);
            wp_enqueue_script(
                'tonband-gallery-viewer-admin',
                $pluginJs,
                ['jquery'],
                $version,
                true
            );
            wp_localize_script('tonband-gallery-viewer-admin', 'tonbandGalleryViewer', [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('tonband_gallery_viewer_nonce'),
                'i18n' => [
                    'locked' => esc_js(__('Diese Galerie ist nicht öffentlich.', 'tonband-gallery-viewer')),
                    'copy' => esc_js(__('Kopieren', 'tonband-gallery-viewer')),
                    'copied' => esc_js(__('Kopiert!', 'tonband-gallery-viewer')),
                ],
            ]);
        }
    }

    public function enqueue_frontend_assets(): void {
        wp_enqueue_style(
            'tonband-gallery-viewer',
            plugin_dir_url(__FILE__) . 'assets/frontend.css',
            [],
            '1.0.0'
        );
        wp_enqueue_script(
            'tonband-gallery-viewer',
            plugin_dir_url(__FILE__) . 'assets/frontend.js',
            [],
            '1.0.0',
            true
        );
        wp_localize_script('tonband-gallery-viewer', 'tonbandGalleryFrontend', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('tonband_gallery_viewer_nonce'),
        ]);
    }

    private function fetch_galleries(): array {
        $cached = get_transient(self::CACHE_KEY);
        if (is_array($cached)) {
            return $cached;
        }

        $response = wp_remote_post(self::API_URL, [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode((object) []),
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            return ['error' => $response->get_error_message()];
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!is_array($data)) {
            return ['error' => __('Ungültige API-Antwort.', 'tonband-gallery-viewer')];
        }

        set_transient(self::CACHE_KEY, $data, self::CACHE_TIME);
        return $data;
    }

    private function resolve_status(array $gallery): string {
        $accessType = $gallery['accessType'] ?? 'public';
        $protected = $gallery['protected'] ?? false;

        if ($protected || $accessType === 'password') {
            return 'password';
        }
        if ($accessType === 'locked') {
            return 'locked';
        }
        if ($accessType === 'internal' || $accessType === 'private') {
            return 'internal';
        }
        if ($accessType === 'blocked' || $accessType === 'disabled') {
            return 'blocked';
        }
        return 'public';
    }

    private function status_label(string $status): string {
        $labels = [
            'public' => __('öffentlich', 'tonband-gallery-viewer'),
            'password' => __('Passwortgeschützt', 'tonband-gallery-viewer'),
            'locked' => __('gesperrt (locked)', 'tonband-gallery-viewer'),
            'internal' => __('intern', 'tonband-gallery-viewer'),
            'blocked' => __('gesperrt', 'tonband-gallery-viewer'),
        ];
        return $labels[$status] ?? $status;
    }

    private function image_url(array $gallery, string $filename): string {
        $year = rawurlencode($gallery['jahr'] ?? '');
        $name = rawurlencode($gallery['galerie'] ?? '');
        $file = rawurlencode($filename);
        return "https://tonbandleipzig.de/tonband/server/uploads/{$year}/{$name}/{$file}";
    }

    public function render_page(): void {
        $galleries = $this->fetch_galleries();
        ?>
        <div class="wrap tonband-gallery-viewer">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <form method="post" class="tonband-cache-form">
                <?php wp_nonce_field('tonband_refresh_cache', 'tonband_refresh_nonce'); ?>
                <?php submit_button(__('Cache leeren & neu laden', 'tonband-gallery-viewer'), 'secondary', 'tonband_refresh_cache', false); ?>
            </form>

            <?php
            if (isset($_POST['tonband_refresh_cache']) && check_admin_referer('tonband_refresh_cache', 'tonband_refresh_nonce')) {
                delete_transient(self::CACHE_KEY);
                $galleries = $this->fetch_galleries();
                echo '<div class="notice notice-success inline"><p>' . esc_html__('Galerien wurden neu geladen.', 'tonband-gallery-viewer') . '</p></div>';
            }

            if (isset($galleries['error'])) {
                echo '<div class="notice notice-error inline"><p>' . esc_html($galleries['error']) . '</p></div>';
                return;
            }
            ?>

            <?php
            $categories = [];
            $years = [];
            foreach ($galleries as $gallery) {
                $cat = $gallery['kategorie'] ?? __('Unkategorisiert', 'tonband-gallery-viewer');
                $year = $gallery['jahr'] ?? __('Unbekannt', 'tonband-gallery-viewer');
                if ($cat) {
                    $categories[$cat] = true;
                }
                $years[$year] = true;
            }
            ksort($categories);
            krsort($years);

            $selectedCategory = isset($_GET['tvg_category']) ? sanitize_text_field(wp_unslash($_GET['tvg_category'])) : '';
            $selectedYear = isset($_GET['tvg_year']) ? sanitize_text_field(wp_unslash($_GET['tvg_year'])) : '';
            ?>

            <div class="tonband-stats">
                <div class="tonband-stat">
                    <span class="tonband-stat__value"><?php echo esc_html((string) count($galleries)); ?></span>
                    <span class="tonband-stat__label"><?php esc_html_e('Galerien', 'tonband-gallery-viewer'); ?></span>
                </div>
                <div class="tonband-stat">
                    <span class="tonband-stat__value"><?php echo esc_html((string) count($categories)); ?></span>
                    <span class="tonband-stat__label"><?php esc_html_e('Kategorien', 'tonband-gallery-viewer'); ?></span>
                </div>
                <div class="tonband-stat">
                    <span class="tonband-stat__value"><?php echo esc_html((string) count($years)); ?></span>
                    <span class="tonband-stat__label"><?php esc_html_e('Jahre', 'tonband-gallery-viewer'); ?></span>
                </div>
                <div class="tonband-stat">
                    <span class="tonband-stat__value"><?php echo esc_html((string) array_sum(array_column($galleries, 'mediaCount'))); ?></span>
                    <span class="tonband-stat__label"><?php esc_html_e('Bilder gesamt', 'tonband-gallery-viewer'); ?></span>
                </div>
            </div>

            <form method="get" class="tonband-filters">
                <input type="hidden" name="page" value="tonband-gallery-viewer">

                <div class="tonband-filter-group tonband-filter-group--categories">
                    <span class="tonband-filter-group__label"><?php esc_html_e('Kategorie', 'tonband-gallery-viewer'); ?></span>
                    <div class="tonband-chips">
                        <a href="<?php echo esc_url(add_query_arg(['tvg_category' => false, 'tvg_year' => $selectedYear ?: false], admin_url('admin.php?page=tonband-gallery-viewer'))); ?>"
                           class="tonband-chip <?php echo $selectedCategory === '' ? 'tonband-chip--active' : ''; ?>">
                            <?php esc_html_e('Alle', 'tonband-gallery-viewer'); ?>
                            <span class="tonband-chip__count"><?php echo esc_html((string) count($galleries)); ?></span>
                        </a>
                        <?php foreach (array_keys($categories) as $category) :
                            $count = count(array_filter($galleries, static fn($g) => ($g['kategorie'] ?? '') === $category));
                            ?>
                            <a href="<?php echo esc_url(add_query_arg(['tvg_category' => $category, 'tvg_year' => $selectedYear ?: false], admin_url('admin.php?page=tonband-gallery-viewer'))); ?>"
                               class="tonband-chip <?php echo $selectedCategory === $category ? 'tonband-chip--active' : ''; ?>">
                                <?php echo esc_html($category); ?>
                                <span class="tonband-chip__count"><?php echo esc_html((string) $count); ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="tonband-filter-group tonband-filter-group--year">
                    <label>
                        <span class="tonband-filter-group__label"><?php esc_html_e('Jahr', 'tonband-gallery-viewer'); ?></span>
                        <select name="tvg_year" onchange="this.form.submit()">
                            <option value=""><?php esc_html_e('Alle Jahre', 'tonband-gallery-viewer'); ?></option>
                            <?php foreach (array_keys($years) as $year) : ?>
                                <option value="<?php echo esc_attr($year); ?>" <?php selected($selectedYear, $year); ?>>
                                    <?php echo esc_html($year); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                </div>

                <?php if ($selectedCategory || $selectedYear) : ?>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=tonband-gallery-viewer')); ?>" class="button tonband-reset">
                        <?php esc_html_e('Filter zurücksetzen', 'tonband-gallery-viewer'); ?>
                    </a>
                <?php endif; ?>
            </form>

            <?php
            $grouped = [];
            foreach ($galleries as $gallery) {
                $year = $gallery['jahr'] ?? __('Unbekannt', 'tonband-gallery-viewer');
                $cat = $gallery['kategorie'] ?? __('Unkategorisiert', 'tonband-gallery-viewer');

                if ($selectedYear && $year !== $selectedYear) {
                    continue;
                }
                if ($selectedCategory && $cat !== $selectedCategory) {
                    continue;
                }

                $grouped[$year][$cat][] = $gallery;
            }
            krsort($grouped);
            ?>

            <?php foreach ($grouped as $year => $categoriesInYear) : ?>
                <section class="tonband-year">
                    <h2 class="tonband-year__title">
                        <?php echo esc_html($year); ?>
                        <span class="tonband-year__count"><?php echo esc_html((string) array_sum(array_map('count', $categoriesInYear))); ?></span>
                    </h2>

                    <?php foreach ($categoriesInYear as $category => $categoryGalleries) : ?>
                        <div class="tonband-category">
                            <h3 class="tonband-category__title"><?php echo esc_html($category); ?></h3>
                            <div class="tonband-grid">
                                <?php foreach ($categoryGalleries as $gallery) :
                                    $status = $this->resolve_status($gallery);
                                    $statusLabel = $this->status_label($status);
                                    $previewImage = $gallery['images'][0] ?? null;
                                    ?>
                                    <div class="tonband-card tonband-card--<?php echo esc_attr($status); ?>">
                                        <div class="tonband-card__header">
                                            <span class="tonband-badge tonband-badge--<?php echo esc_attr($status); ?>"><?php echo esc_html($statusLabel); ?></span>
                                        </div>
                                        <h2 class="tonband-card__title"><?php echo esc_html($gallery['galerie'] ?? ''); ?></h2>
                                        <div class="tonband-card__meta">
                                            <span><?php esc_html_e('Bilder:', 'tonband-gallery-viewer'); ?> <?php echo esc_html((string) ($gallery['mediaCount'] ?? count($gallery['images'] ?? []))); ?></span>
                                            <span><?php esc_html_e('Datum:', 'tonband-gallery-viewer'); ?> <?php echo esc_html($gallery['uploadDate'] ?? '-'); ?></span>
                                        </div>
                                        <?php if ($previewImage) : ?>
                                            <div class="tonband-card__preview">
                                                <img src="<?php echo esc_url($this->image_url($gallery, $previewImage)); ?>"
                                                     alt="<?php echo esc_attr($gallery['galerie'] ?? ''); ?>"
                                                     loading="lazy"
                                                     width="400"
                                                     height="260">
                                                <?php if ($status !== 'public') : ?>
                                                    <div class="tonband-card__overlay">
                                                        <span><?php echo esc_html($statusLabel); ?></span>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        <?php endif; ?>
                                        <div class="tonband-card__tags">
                                            <?php foreach ($gallery['tags'] ?? [] as $tag) : ?>
                                                <span class="tonband-tag"><?php echo esc_html($tag); ?></span>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </section>
            <?php endforeach; ?>

            <?php if (empty($grouped)) : ?>
                <p class="tonband-empty"><?php esc_html_e('Keine Galerien für die gewählten Filter gefunden.', 'tonband-gallery-viewer'); ?></p>
            <?php endif; ?>
        </div>
        <?php
    }

    public function add_meta_boxes(): void {
        foreach (['post', 'page'] as $postType) {
            add_meta_box(
                'tonband_gallery_selector',
                __('Tonband Galerie', 'tonband-gallery-viewer'),
                [$this, 'render_meta_box'],
                $postType,
                'side',
                'default'
            );
        }
    }

    public function render_meta_box(WP_Post $post): void {
        wp_nonce_field('tonband_gallery_meta', 'tonband_gallery_meta_nonce');
        $saved = get_post_meta($post->ID, '_tonband_gallery', true);
        $saved = is_array($saved) ? $saved : [];
        $savedYear = $saved['jahr'] ?? '';
        $savedGallery = $saved['galerie'] ?? '';
        $savedImage = $saved['image'] ?? '';
        $savedMode = $saved['mode'] ?? 'gallery';
        ?>
        <div class="tonband-meta-box">
            <p>
                <label><?php esc_html_e('Modus', 'tonband-gallery-viewer'); ?></label><br>
                <select id="tonband_mode" name="tonband_mode">
                    <option value="gallery" <?php selected($savedMode, 'gallery'); ?>><?php esc_html_e('Ganze Galerie', 'tonband-gallery-viewer'); ?></option>
                    <option value="single" <?php selected($savedMode, 'single'); ?>><?php esc_html_e('Einzelbild', 'tonband-gallery-viewer'); ?></option>
                </select>
            </p>
            <p>
                <label for="tonband_year"><?php esc_html_e('Jahr', 'tonband-gallery-viewer'); ?></label><br>
                <select id="tonband_year" name="tonband_year">
                    <option value=""><?php esc_html_e('— wählen —', 'tonband-gallery-viewer'); ?></option>
                </select>
            </p>
            <p>
                <label for="tonband_gallery"><?php esc_html_e('Galerie', 'tonband-gallery-viewer'); ?></label><br>
                <select id="tonband_gallery" name="tonband_gallery" disabled>
                    <option value=""><?php esc_html_e('— zuerst Jahr wählen —', 'tonband-gallery-viewer'); ?></option>
                </select>
            </p>
            <p id="tonband_image_field" style="display: <?php echo $savedMode === 'single' ? 'block' : 'none'; ?>;">
                <label for="tonband_image"><?php esc_html_e('Bild', 'tonband-gallery-viewer'); ?></label><br>
                <select id="tonband_image" name="tonband_image">
                    <option value=""><?php esc_html_e('— erst Galerie wählen —', 'tonband-gallery-viewer'); ?></option>
                </select>
            </p>
            <p>
                <label><?php esc_html_e('Kurzwahlnummer', 'tonband-gallery-viewer'); ?></label><br>
                <input type="text" id="tonband_shortcode" readonly class="widefat" value="">
                <button type="button" id="tonband_copy_shortcode" class="button button-small"><?php esc_html_e('Kopieren', 'tonband-gallery-viewer'); ?></button>
            </p>
            <div id="tonband_preview"></div>
        </div>
        <script>
            window.tonbandSaved = <?php echo wp_json_encode([
                'jahr' => $savedYear,
                'galerie' => $savedGallery,
                'image' => $savedImage,
                'mode' => $savedMode,
            ]); ?>;
        </script>
        <?php
    }

    public function save_meta_box(int $postId): void {
        if (!isset($_POST['tonband_gallery_meta_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['tonband_gallery_meta_nonce'])), 'tonband_gallery_meta')) {
            return;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        if (!current_user_can('edit_post', $postId)) {
            return;
        }

        $jahr = isset($_POST['tonband_year']) ? sanitize_text_field(wp_unslash($_POST['tonband_year'])) : '';
        $galerie = isset($_POST['tonband_gallery']) ? sanitize_text_field(wp_unslash($_POST['tonband_gallery'])) : '';
        $image = isset($_POST['tonband_image']) ? sanitize_text_field(wp_unslash($_POST['tonband_image'])) : '';
        $mode = isset($_POST['tonband_mode']) && $_POST['tonband_mode'] === 'single' ? 'single' : 'gallery';

        if ($jahr && $galerie) {
            update_post_meta($postId, '_tonband_gallery', [
                'jahr' => $jahr,
                'galerie' => $galerie,
                'image' => $image,
                'mode' => $mode,
            ]);
        } else {
            delete_post_meta($postId, '_tonband_gallery');
        }
    }

    public function ajax_get_galleries(): void {
        check_ajax_referer('tonband_gallery_viewer_nonce', 'nonce');
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('permission denied', 403);
        }

        $galleries = $this->fetch_galleries();
        if (isset($galleries['error'])) {
            wp_send_json_error($galleries['error']);
        }

        $byYear = [];
        foreach ($galleries as $gallery) {
            $year = $gallery['jahr'] ?? '0';
            $byYear[$year][] = [
                'galerie' => $gallery['galerie'] ?? '',
                'kategorie' => $gallery['kategorie'] ?? '',
                'accessType' => $gallery['accessType'] ?? '',
                'protected' => $gallery['protected'] ?? false,
                'status' => $this->resolve_status($gallery),
                'images' => $gallery['images'] ?? [],
            ];
        }
        krsort($byYear);
        wp_send_json_success($byYear);
    }

    public function ajax_get_images(): void {
        check_ajax_referer('tonband_gallery_viewer_nonce', 'nonce');
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('permission denied', 403);
        }

        $jahr = isset($_GET['jahr']) ? sanitize_text_field(wp_unslash($_GET['jahr'])) : '';
        $galerie = isset($_GET['galerie']) ? sanitize_text_field(wp_unslash($_GET['galerie'])) : '';
        if (!$jahr || !$galerie) {
            wp_send_json_error('missing parameters');
        }

        $galleries = $this->fetch_galleries();
        if (isset($galleries['error'])) {
            wp_send_json_error($galleries['error']);
        }

        foreach ($galleries as $gallery) {
            if (($gallery['jahr'] ?? '') === $jahr && ($gallery['galerie'] ?? '') === $galerie) {
                wp_send_json_success([
                    'images' => $gallery['images'] ?? [],
                    'status' => $this->resolve_status($gallery),
                ]);
            }
        }
        wp_send_json_error('not found');
    }

    public function render_shortcode(array $atts): string {
        $atts = shortcode_atts([
            'jahr' => '',
            'galerie' => '',
            'image' => '',
            'mode' => 'gallery',
            'blur' => 'true',
        ], $atts, 'tonband-gallery');

        if (!$atts['jahr'] || !$atts['galerie']) {
            return '<p class="tonband-error">' . esc_html__('Jahr und Galerie müssen angegeben werden.', 'tonband-gallery-viewer') . '</p>';
        }

        $galleries = $this->fetch_galleries();
        if (isset($galleries['error'])) {
            return '<p class="tonband-error">' . esc_html($galleries['error']) . '</p>';
        }

        $gallery = null;
        foreach ($galleries as $g) {
            if (($g['jahr'] ?? '') === $atts['jahr'] && ($g['galerie'] ?? '') === $atts['galerie']) {
                $gallery = $g;
                break;
            }
        }

        if (!$gallery) {
            return '<p class="tonband-error">' . esc_html__('Galerie nicht gefunden.', 'tonband-gallery-viewer') . '</p>';
        }

        $status = $this->resolve_status($gallery);
        $isUnlocked = $this->is_gallery_unlocked($atts['jahr'], $atts['galerie'], $status);

        if ($status !== 'public' && !$isUnlocked) {
            $statusLabel = $this->status_label($status);
            $blur = filter_var($atts['blur'], FILTER_VALIDATE_BOOLEAN);
            $previewHtml = '';

            if ($blur && ($gallery['images'][0] ?? null)) {
                $url = $this->image_url($gallery, $gallery['images'][0]);
                $previewHtml = '<div class="tonband-locked-preview"><img src="' . esc_url($url) . '" alt="" loading="lazy"></div>';
            }

            return '<div class="tonband-gallery tonband-gallery--locked" data-tonband-year="' . esc_attr($atts['jahr']) . '" data-tonband-gallery="' . esc_attr($atts['galerie']) . '">' .
                $previewHtml .
                '<p>' . esc_html(sprintf(__('Diese Galerie ist %s. Gib das Passwort ein, um sie zu entsperren.', 'tonband-gallery-viewer'), $statusLabel)) . '</p>' .
                '<form class="tonband-unlock-form" method="post">' .
                '<input type="password" name="tonband_password" placeholder="' . esc_attr__('Passwort', 'tonband-gallery-viewer') . '" required>' .
                '<button type="submit">' . esc_html__('Entsperren', 'tonband-gallery-viewer') . '</button>' .
                '<span class="tonband-unlock-message"></span>' .
                '</form>' .
                '</div>';
        }

        if ($atts['mode'] === 'single' && $atts['image']) {
            $url = $this->image_url($gallery, $atts['image']);
            return '<figure class="tonband-single-image"><img src="' . esc_url($url) . '" alt="' . esc_attr($gallery['galerie']) . '" loading="lazy"></figure>';
        }

        $output = '<div class="tonband-gallery-grid">';
        foreach ($gallery['images'] ?? [] as $image) {
            $url = $this->image_url($gallery, $image);
            $output .= '<a class="tonband-gallery-item" href="' . esc_url($url) . '" target="_blank" rel="noopener">';
            $output .= '<img src="' . esc_url($url) . '" alt="' . esc_attr($gallery['galerie']) . '" loading="lazy">';
            $output .= '</a>';
        }
        $output .= '</div>';
        return $output;
    }

    private function get_gallery_password(string $jahr, string $galerie): ?string {
        $passwords = get_option('tonband_gallery_passwords', []);
        $key = sanitize_key($jahr . '-' . $galerie);
        return $passwords[$key] ?? null;
    }

    private function is_gallery_unlocked(string $jahr, string $galerie, string $status): bool {
        if ($status === 'public') {
            return true;
        }
        $expected = $this->get_gallery_password($jahr, $galerie);
        if (!$expected) {
            return false;
        }
        $key = 'tvg_unlock_' . sanitize_key($jahr . '-' . $galerie);
        return isset($_COOKIE[$key]) && hash_equals(hash('sha256', $expected), $_COOKIE[$key]);
    }

    public function ajax_unlock_gallery(): void {
        check_ajax_referer('tonband_gallery_viewer_nonce', 'nonce');

        $jahr = isset($_POST['jahr']) ? sanitize_text_field(wp_unslash($_POST['jahr'])) : '';
        $galerie = isset($_POST['galerie']) ? sanitize_text_field(wp_unslash($_POST['galerie'])) : '';
        $password = isset($_POST['password']) ? sanitize_text_field(wp_unslash($_POST['password'])) : '';

        if (!$jahr || !$galerie || !$password) {
            wp_send_json_error(__('Fehlende Daten.', 'tonband-gallery-viewer'));
        }

        $expected = $this->get_gallery_password($jahr, $galerie);
        if (!$expected) {
            wp_send_json_error(__('Für diese Galerie wurde kein Passwort hinterlegt.', 'tonband-gallery-viewer'));
        }

        if (!hash_equals($expected, $password)) {
            wp_send_json_error(__('Falsches Passwort.', 'tonband-gallery-viewer'));
        }

        $key = 'tvg_unlock_' . sanitize_key($jahr . '-' . $galerie);
        $value = hash('sha256', $expected);
        setcookie($key, $value, time() + DAY_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);

        wp_send_json_success(__('Galerie entsperrt.', 'tonband-gallery-viewer'));
    }

    public function save_passwords(): void {
        if (!isset($_POST['tonband_save_passwords']) || !check_admin_referer('tonband_save_passwords', 'tonband_passwords_nonce')) {
            return;
        }
        if (!current_user_can('manage_options')) {
            return;
        }

        $passwords = [];
        if (isset($_POST['tonband_passwords']) && is_array($_POST['tonband_passwords'])) {
            foreach ($_POST['tonband_passwords'] as $key => $password) {
                $password = sanitize_text_field(wp_unslash($password));
                if ($password !== '') {
                    $passwords[sanitize_key($key)] = $password;
                }
            }
        }
        update_option('tonband_gallery_passwords', $passwords);
    }

    public function render_passwords_page(): void {
        $galleries = $this->fetch_galleries();
        $passwords = get_option('tonband_gallery_passwords', []);
        ?>
        <div class="wrap tonband-gallery-viewer">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <p class="tonband-intro">
                <?php esc_html_e('Hier kannst du Passwörter für geschützte Galerien hinterlegen. Besucher können diese Galerien im Frontend mit dem Passwort entsperren.', 'tonband-gallery-viewer'); ?>
            </p>

            <?php if (isset($galleries['error'])) : ?>
                <div class="notice notice-error inline"><p><?php echo esc_html($galleries['error']); ?></p></div>
            <?php else : ?>
                <form method="post" class="tonband-passwords-form">
                    <?php wp_nonce_field('tonband_save_passwords', 'tonband_passwords_nonce'); ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php esc_html_e('Jahr', 'tonband-gallery-viewer'); ?></th>
                                <th><?php esc_html_e('Galerie', 'tonband-gallery-viewer'); ?></th>
                                <th><?php esc_html_e('Status', 'tonband-gallery-viewer'); ?></th>
                                <th><?php esc_html_e('Passwort', 'tonband-gallery-viewer'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($galleries as $gallery) :
                                $status = $this->resolve_status($gallery);
                                $key = sanitize_key(($gallery['jahr'] ?? '') . '-' . ($gallery['galerie'] ?? ''));
                                if ($status === 'public') {
                                    continue;
                                }
                                ?>
                                <tr>
                                    <td><?php echo esc_html($gallery['jahr'] ?? ''); ?></td>
                                    <td><?php echo esc_html($gallery['galerie'] ?? ''); ?></td>
                                    <td><?php echo esc_html($this->status_label($status)); ?></td>
                                    <td>
                                        <input type="text"
                                               name="tonband_passwords[<?php echo esc_attr($key); ?>]"
                                               value="<?php echo esc_attr($passwords[$key] ?? ''); ?>"
                                               placeholder="<?php esc_attr_e('Passwort', 'tonband-gallery-viewer'); ?>">
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php submit_button(__('Passwörter speichern', 'tonband-gallery-viewer'), 'primary', 'tonband_save_passwords'); ?>
                </form>
            <?php endif; ?>
        </div>
        <?php
    }
}

new Tonband_Gallery_Viewer();
