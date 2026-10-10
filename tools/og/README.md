# Podglądy linków (Open Graph) dla creatioo.pl

Ten folder generuje obrazki, które pojawiają się przy udostępnianiu linków (Facebook, Discord, X, LinkedIn, Messenger), oraz pasujące do nich tagi w sekcji head. Wszystkie teksty i ustawienia są w jednym pliku: `config.json`.

## Co powstaje

- `assets/images/og/og-home.png`, `og-gallery.png`, `og-privacy.png`, `og-404.png` (wersje polskie)
- `assets/images/og/og-*-en.png` (wersje angielskie)
- tagi `og:*` i `twitter:*` w `index.html`, `gallery/index.html`, `privacy-policy/index.html` i `404.html` (między komentarzami `og:start` i `og:end`), razem z `<title>` i `description`
- `en/index.html`, `en/gallery/index.html`, `en/privacy-policy/index.html`: małe strony z angielskim podglądem. Odbiorca jest od razu przekierowany na właściwą stronę w języku angielskim, więc angielski link do udostępniania to `https://creatioo.pl/en/`

## Uruchomienie

Potrzebny jest Node.js 18 lub nowszy.

```
cd tools/og
npm install
npx playwright install chromium
npm run build
```

Pozostałe polecenia: `npm run images` (tylko obrazki), `npm run meta` (tylko tagi i strony `en/`).
Opcje: `node build.mjs --page gallery --lang pl --theme dark`.

## Jak zmienić tekst lub obrazek

1. Otwórz `config.json`, popraw `headline`, `subtitle`, `description` itd. w sekcji `pl` lub `en`.
2. Zdjęcia na obrazku to pliki z `assets/images/featured/` (pole `image` lub `images`).
3. Zwiększ `imageVersion` o jeden, żeby serwisy społecznościowe pobrały nowy obrazek zamiast starego z pamięci podręcznej.
4. Uruchom `npm run build` i wgraj zmienione pliki.

Po zmianie odśwież podgląd w Facebook Sharing Debugger, LinkedIn Post Inspector, a na Discordzie wystarczy wkleić link z nowym numerem wersji.

## Dodanie nowej strony

Dodaj wpis w `pages` w `config.json` (pola `file`, `path`, `layout`: `home`, `gallery`, `document` lub `error`) i uruchom `npm run build`.

Foldery `tools/og/node_modules` i cały folder `tools` nie są potrzebne na serwerze, możesz ich nie wgrywać.
