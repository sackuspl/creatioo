# Logo 3D na stronie głównej

Ten folder zawiera źródło sceny 3D z hero strony głównej: znak „oo” z logotypu jako prawdziwy model 3D (wyciągnięty z geometrii logo, bez plików graficznych), tło z kropek reagujące na kursor, animację wejścia i obracanie myszką.

Gotowy plik, który ładuje strona, to `js/hero3d.js`. Jest to zwykły skrypt (nie moduł ES), więc działa także po otwarciu `index.html` bezpośrednio z dysku.

## Kiedy trzeba go zbudować

Tylko po zmianie pliku `src/hero3d.js`. Sama strona nie wymaga żadnego budowania.

## Uruchomienie

Potrzebny jest Node.js 18 lub nowszy.

```
cd tools/3d
npm install
npm run build
```

`npm run watch` przebudowuje plik przy każdym zapisie.

## Co gdzie zmienić

- kolor znaku: brany ze zmiennej `--brand` w `css/home.css`, osobno dla motywu jasnego i ciemnego
- materiał (połysk, metaliczność): `MeshPhysicalMaterial` w `src/hero3d.js`
- odbicia: funkcja `studio()`, czyli paski światła wokół znaku
- tło z kropek: shader `fieldFragment` (gęstość siatki to `cell`, jasność `uDotA`)
- położenie i wielkość znaku: funkcja `layout()`, która dopasowuje znak do wolnego miejsca obok nagłówka

Bez WebGL, przy włączonym ograniczeniu animacji w systemie albo na bardzo słabych urządzeniach strona pokazuje płaski znak SVG.
