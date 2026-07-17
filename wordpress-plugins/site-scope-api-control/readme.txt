=== Site Scope – REST API Control ===
Contributors: Site Scope
Tags: rest api, headless, security, jwt, application passwords
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later

Steuert, welche WordPress REST API Endpoints für anonyme Aufrufe erreichbar sind.

== Beschreibung ==
Dieses Plugin erlaubt es, die WordPress REST API für nicht authentifizierte Aufrufe komplett oder teilweise zu sperren.
Es eignet sich besonders für Headless-Setups, bei denen nur bestimmte Endpoints (z. B. Posts, Pages, Media) öffentlich sein sollen, während sensible Daten wie Users, Plugins oder Themes geschützt bleiben.

Authentifizierte Requests (z. B. via JWT, Application Password oder eingeloggter WordPress-Benutzer) werden nicht blockiert.

== Installation ==
1. Den Ordner `site-scope-api-control` nach `/wp-content/plugins/` hochladen.
2. Plugin im WordPress Admin unter „Plugins“ aktivieren.
3. Unter „Einstellungen → REST API Control“ die gewünschten Endpoints freigeben.

== Verwendung ==
- „Authentifizierung erforderlich“ aktivieren, um alle Endpoints für anonyme Aufrufe zu sperren.
- Einzelne Endpoints (Posts, Pages, Media, Taxonomies, …) explizit für anonyme Aufrufe freischalten.
- Alle anderen Endpoints geben dann den HTTP-Status 401 zurück.

== FAQ ==
= Kann ich das Plugin auch als MU-Plugin nutzen? =
Ja. Kopiere dazu die Datei `site-scope-api-control.php` direkt nach `/wp-content/mu-plugins/`. Das Admin-Menü funktioniert auch dort.

= Funktioniert es mit JWT-Auth Plugins? =
Ja, solange der Request einen `Authorization`-Header mit dem Token sendet, wird er nicht blockiert.
