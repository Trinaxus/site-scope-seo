<?php
/**
 * Plugin Name: Site Scope – REST API Control
 * Description: Schaltet WordPress REST API Endpoints für anonyme Aufrufe gezielt frei oder sperrt sie. Ideal für Headless-Setups.
 * Version: 1.0.0
 * Author: Site Scope
 * License: GPL-2.0-or-later
 * Text Domain: site-scope-api-control
 */

if (!defined('ABSPATH')) {
    exit;
}

class Site_Scope_REST_API_Control {
    private const OPTION_KEY = 'site_scope_api_control_settings';
    private const ENDPOINT_KEYS = [
        'posts',
        'pages',
        'media',
        'taxonomies',
        'types',
        'users',
        'comments',
        'plugins',
        'themes',
        'search',
        'blocks',
        'settings',
    ];

    private const DEFAULTS = [
        'disable_rest_api' => false,
        'require_auth_public' => true,
        'require_auth_authenticated' => false,
        'allow_public_posts' => false,
        'allow_public_pages' => false,
        'allow_public_media' => false,
        'allow_public_taxonomies' => false,
        'allow_public_types' => false,
        'allow_public_users' => false,
        'allow_public_comments' => false,
        'allow_public_plugins' => false,
        'allow_public_themes' => false,
        'allow_public_search' => false,
        'allow_public_blocks' => false,
        'allow_public_settings' => false,
        'allow_auth_posts' => true,
        'allow_auth_pages' => true,
        'allow_auth_media' => true,
        'allow_auth_taxonomies' => true,
        'allow_auth_types' => true,
        'allow_auth_users' => true,
        'allow_auth_comments' => true,
        'allow_auth_plugins' => false,
        'allow_auth_themes' => false,
        'allow_auth_search' => true,
        'allow_auth_blocks' => true,
        'allow_auth_settings' => false,
    ];

    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_filter('rest_authentication_errors', [$this, 'maybe_disable_rest_api'], 1);
        add_filter('rest_endpoints', [$this, 'filter_endpoints'], 99);
    }

    public function add_admin_menu(): void {
        add_options_page(
            __('REST API Control', 'site-scope-api-control'),
            __('REST API Control', 'site-scope-api-control'),
            'manage_options',
            'site-scope-api-control',
            [$this, 'render_admin_page']
        );
    }

    public function register_settings(): void {
        register_setting(
            'site_scope_api_control_group',
            self::OPTION_KEY,
            [
                'type' => 'array',
                'sanitize_callback' => [$this, 'sanitize_settings'],
                'default' => self::DEFAULTS,
            ]
        );
    }

    public function sanitize_settings(array $input): array {
        $output = self::DEFAULTS;

        foreach (array_keys(self::DEFAULTS) as $key) {
            $output[$key] = !empty($input[$key]);
        }

        // Migration from older versions that used 'allow_{key}' without prefix.
        foreach (self::ENDPOINT_KEYS as $key) {
            $legacy = 'allow_' . $key;
            if (isset($input[$legacy])) {
                $output['allow_public_' . $key] = !empty($input[$legacy]);
            }
        }

        return $output;
    }

    public function enqueue_admin_assets(string $hook): void {
        if ($hook !== 'settings_page_site-scope-api-control') {
            return;
        }
        wp_enqueue_style(
            'site-scope-api-control-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.css',
            [],
            '1.0.0'
        );
    }

    public function maybe_disable_rest_api($result) {
        $settings = $this->get_settings();

        if (empty($settings['disable_rest_api'])) {
            return $result;
        }

        if (!empty($result)) {
            return $result;
        }

        if (is_user_logged_in()) {
            return $result;
        }

        return new WP_Error(
            'rest_disabled',
            __('Die REST API ist deaktiviert.', 'site-scope-api-control'),
            ['status' => 401]
        );
    }

    public function filter_endpoints(array $endpoints): array {
        if (is_user_logged_in()) {
            return $endpoints;
        }

        $settings = $this->get_settings();
        $is_authenticated = $this->is_authenticated_request();

        $public_filter_active = !empty($settings['require_auth_public']);
        $auth_filter_active = $is_authenticated && !empty($settings['require_auth_authenticated']);

        if (!$public_filter_active && !$auth_filter_active) {
            return $endpoints;
        }

        $prefix = $is_authenticated ? 'allow_auth_' : 'allow_public_';
        $allowed_routes = [
            '/wp/v2', // discovery / index
        ];

        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'posts', [
            '/wp/v2/posts',
            '/wp/v2/posts/(?P<id>[\d]+)',
            '/wp/v2/posts/(?P<parent>[\d]+)/revisions',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'pages', [
            '/wp/v2/pages',
            '/wp/v2/pages/(?P<id>[\d]+)',
            '/wp/v2/pages/(?P<parent>[\d]+)/revisions',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'media', [
            '/wp/v2/media',
            '/wp/v2/media/(?P<id>[\d]+)',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'taxonomies', [
            '/wp/v2/categories',
            '/wp/v2/categories/(?P<id>[\d]+)',
            '/wp/v2/tags',
            '/wp/v2/tags/(?P<id>[\d]+)',
            '/wp/v2/taxonomies',
            '/wp/v2/taxonomies/(?P<taxonomy>[a-zA-Z0-9_-]+)',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'types', [
            '/wp/v2/types',
            '/wp/v2/types/(?P<type>[a-zA-Z0-9_-]+)',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'users', [
            '/wp/v2/users',
            '/wp/v2/users/(?P<id>[\d]+)',
            '/wp/v2/users/me',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'comments', [
            '/wp/v2/comments',
            '/wp/v2/comments/(?P<id>[\d]+)',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'plugins', [
            '/wp/v2/plugins',
            '/wp/v2/plugins/(?P<plugin>[^/]+)',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'themes', [
            '/wp/v2/themes',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'search', [
            '/wp/v2/search',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'blocks', [
            '/wp/v2/blocks',
            '/wp/v2/blocks/(?P<id>[\d]+)',
            '/wp/v2/blocks/(?P<id>[\d]+)/autosaves',
            '/wp/v2/block-types',
        ]);
        $this->add_routes_if_allowed($allowed_routes, $settings, $prefix, 'settings', [
            '/wp/v2/settings',
        ]);

        return array_filter(
            $endpoints,
            static function (string $route) use ($allowed_routes): bool {
                if (strpos($route, '/wp/v2/') !== 0 && $route !== '/wp/v2') {
                    return true;
                }

                foreach ($allowed_routes as $allowed) {
                    if ($route === $allowed) {
                        return true;
                    }
                }
                return false;
            },
            ARRAY_FILTER_USE_KEY
        );
    }

    private function add_routes_if_allowed(array &$allowed_routes, array $settings, string $prefix, string $key, array $routes): void {
        if (!empty($settings[$prefix . $key])) {
            array_push($allowed_routes, ...$routes);
        }
    }

    private function get_settings(): array {
        return wp_parse_args(
            get_option(self::OPTION_KEY, []),
            self::DEFAULTS
        );
    }

    private function is_authenticated_request(): bool {
        // We only treat requests as "authenticated for API filtering" when they send
        // an Authorization header (Bearer/JWT, Basic, etc.). Logged-in WordPress users
        // via cookie keep full access so the admin interface and Gutenberg keep working.
        if (function_exists('getallheaders')) {
            foreach (getallheaders() as $name => $value) {
                if (strtolower($name) === 'authorization' && !empty($value)) {
                    return true;
                }
            }
        }

        $keys = ['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION', 'PHP_AUTH_DIGEST', 'PHP_AUTH_USER'];
        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                return true;
            }
        }

        return false;
    }

    public function render_admin_page(): void {
        $settings = $this->get_settings();
        $icons = $this->get_icons();
        $fields = $this->get_endpoint_fields();
        ?>
        <div class="wrap site-scope-api-control">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <p class="site-scope-api-control__intro">
                <?php esc_html_e('Steuere, welche WordPress Core REST Endpoints unter /wp-json/wp/v2/ erreichbar sind. Du kannst getrennt festlegen, was anonyme und was authentifizierte Aufrufe (Token, Application Password, Cookie) sehen dürfen. Custom Endpoints anderer Plugins (z. B. JWT Auth) bleiben unverändert.', 'site-scope-api-control'); ?>
            </p>

            <form method="post" action="options.php">
                <?php
                settings_fields('site_scope_api_control_group');
                do_settings_sections('site_scope_api_control_group');
                ?>

                <div class="ssa-card ssa-card--warning">
                    <h2 class="ssa-card__title">
                        <?php echo $icons['shield']; ?>
                        <?php esc_html_e('REST API komplett deaktivieren', 'site-scope-api-control'); ?>
                    </h2>
                    <p class="ssa-card__description">
                        <?php esc_html_e('Wenn aktiviert, wird die gesamte WordPress REST API mit 401 blockiert. Das überschreibt alle anderen Einstellungen und macht Headless-Betrieb unmöglich.', 'site-scope-api-control'); ?>
                    </p>
                    <div class="ssa-master-toggle">
                        <div class="ssa-toggle-row">
                            <div class="ssa-toggle-row__info">
                                <div class="ssa-toggle-row__icon"><?php echo $icons['lock']; ?></div>
                                <div>
                                    <div class="ssa-toggle-row__label"><?php esc_html_e('REST API vollständig abschalten', 'site-scope-api-control'); ?></div>
                                    <div class="ssa-toggle-row__hint"><?php esc_html_e('Nur aktivieren, wenn Headless / REST API nicht benötigt wird.', 'site-scope-api-control'); ?></div>
                                </div>
                            </div>
                            <label class="ssa-switch">
                                <input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[disable_rest_api]" value="1" <?php checked($settings['disable_rest_api']); ?>>
                                <span class="ssa-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="ssa-grid">
                    <div class="ssa-card">
                        <h2 class="ssa-card__title">
                            <?php echo $icons['globe']; ?>
                            <?php esc_html_e('Öffentliche Aufrufe', 'site-scope-api-control'); ?>
                        </h2>
                        <p class="ssa-card__description">
                            <?php esc_html_e('Gilt für Aufrufe ohne Token oder Login.', 'site-scope-api-control'); ?>
                        </p>

                        <div class="ssa-master-toggle">
                            <div class="ssa-toggle-row">
                                <div class="ssa-toggle-row__info">
                                    <div class="ssa-toggle-row__icon"><?php echo $icons['shield']; ?></div>
                                    <div>
                                        <div class="ssa-toggle-row__label"><?php esc_html_e('Filter aktiv', 'site-scope-api-control'); ?></div>
                                        <div class="ssa-toggle-row__hint"><?php esc_html_e('Nur freigeschaltete Endpoints sind öffentlich.', 'site-scope-api-control'); ?></div>
                                    </div>
                                </div>
                                <label class="ssa-switch">
                                    <input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[require_auth_public]" value="1" <?php checked($settings['require_auth_public']); ?>>
                                    <span class="ssa-slider"></span>
                                </label>
                            </div>
                        </div>

                        <?php foreach ($fields as $key => $label) : ?>
                            <div class="ssa-toggle-row">
                                <div class="ssa-toggle-row__info">
                                    <div class="ssa-toggle-row__icon"><?php echo $icons[$key] ?? $icons['globe']; ?></div>
                                    <div>
                                        <div class="ssa-toggle-row__label"><?php echo esc_html($label); ?></div>
                                        <div class="ssa-toggle-row__hint">
                                            <?php echo $settings['require_auth_public'] && !empty($settings['allow_public_' . $key])
                                                ? '<span class="ssa-status ssa-status--public">' . $icons['check'] . ' ' . esc_html__('öffentlich', 'site-scope-api-control') . '</span>'
                                                : '<span class="ssa-status ssa-status--protected">' . $icons['lock'] . ' ' . esc_html__('geschützt', 'site-scope-api-control') . '</span>';
                                            ?>
                                        </div>
                                    </div>
                                </div>
                                <label class="ssa-switch">
                                    <input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[<?php echo esc_attr('allow_public_' . $key); ?>]" value="1" <?php checked($settings['allow_public_' . $key]); ?>>
                                    <span class="ssa-slider"></span>
                                </label>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="ssa-card">
                        <h2 class="ssa-card__title">
                            <?php echo $icons['key']; ?>
                            <?php esc_html_e('Authentifizierte Aufrufe', 'site-scope-api-control'); ?>
                        </h2>
                        <p class="ssa-card__description">
                            <?php esc_html_e('Gilt für Token / Application Password. Admin-Cookies sind ausgenommen.', 'site-scope-api-control'); ?>
                        </p>

                        <div class="ssa-master-toggle">
                            <div class="ssa-toggle-row">
                                <div class="ssa-toggle-row__info">
                                    <div class="ssa-toggle-row__icon"><?php echo $icons['shield']; ?></div>
                                    <div>
                                        <div class="ssa-toggle-row__label"><?php esc_html_e('Filter aktiv', 'site-scope-api-control'); ?></div>
                                        <div class="ssa-toggle-row__hint"><?php esc_html_e('Auch Token-Requests auf freigeschaltete Endpoints beschränken.', 'site-scope-api-control'); ?></div>
                                    </div>
                                </div>
                                <label class="ssa-switch">
                                    <input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[require_auth_authenticated]" value="1" <?php checked($settings['require_auth_authenticated']); ?>>
                                    <span class="ssa-slider"></span>
                                </label>
                            </div>
                        </div>

                        <?php foreach ($fields as $key => $label) : ?>
                            <div class="ssa-toggle-row">
                                <div class="ssa-toggle-row__info">
                                    <div class="ssa-toggle-row__icon"><?php echo $icons[$key] ?? $icons['globe']; ?></div>
                                    <div>
                                        <div class="ssa-toggle-row__label"><?php echo esc_html($label); ?></div>
                                        <div class="ssa-toggle-row__hint">
                                            <?php echo $settings['require_auth_authenticated'] && !empty($settings['allow_auth_' . $key])
                                                ? '<span class="ssa-status ssa-status--public">' . $icons['check'] . ' ' . esc_html__('erlaubt', 'site-scope-api-control') . '</span>'
                                                : '<span class="ssa-status ssa-status--protected">' . $icons['lock'] . ' ' . esc_html__('gesperrt', 'site-scope-api-control') . '</span>';
                                            ?>
                                        </div>
                                    </div>
                                </div>
                                <label class="ssa-switch">
                                    <input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[<?php echo esc_attr('allow_auth_' . $key); ?>]" value="1" <?php checked($settings['allow_auth_' . $key]); ?>>
                                    <span class="ssa-slider"></span>
                                </label>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="ssa-submit">
                    <?php submit_button(__('Einstellungen speichern', 'site-scope-api-control'), 'primary', 'submit', false); ?>
                </div>
            </form>

            <div class="ssa-card">
                <h2 class="ssa-card__title"><?php echo $icons['info']; ?> <?php esc_html_e('Tipps für Headless', 'site-scope-api-control'); ?></h2>
                <p class="ssa-card__description">
                    <?php esc_html_e('Für reines Headless reichen meist Posts, Pages, Media, Taxonomies und Types. Users, Plugins, Themes, Comments und Settings sollten in der Regel nicht öffentlich sein.', 'site-scope-api-control'); ?>
                </p>
            </div>
        </div>
        <?php
    }

    private function get_endpoint_fields(): array {
        return [
            'posts' => __('Posts / Beiträge', 'site-scope-api-control'),
            'pages' => __('Pages / Seiten', 'site-scope-api-control'),
            'media' => __('Media / Medien', 'site-scope-api-control'),
            'taxonomies' => __('Taxonomien (Categories, Tags)', 'site-scope-api-control'),
            'types' => __('Post Types', 'site-scope-api-control'),
            'users' => __('Users / Benutzer', 'site-scope-api-control'),
            'comments' => __('Comments / Kommentare', 'site-scope-api-control'),
            'plugins' => __('Plugins', 'site-scope-api-control'),
            'themes' => __('Themes', 'site-scope-api-control'),
            'search' => __('Search / Suche', 'site-scope-api-control'),
            'blocks' => __('Blocks / Block-Types', 'site-scope-api-control'),
            'settings' => __('Settings / Einstellungen', 'site-scope-api-control'),
        ];
    }

    private function get_icons(): array {
        return [
            'globe' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
            'shield' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
            'key' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 0 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
            'info' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            'check' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            'lock' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
            'posts' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>',
            'pages' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
            'media' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
            'taxonomies' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
            'types' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            'users' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            'comments' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
            'plugins' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
            'themes' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
            'search' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
            'blocks' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
            'settings' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
        ];
    }
}

new Site_Scope_REST_API_Control();
