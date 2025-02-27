# Cara Build

## Persiapan (hanya sekali)

```bash
npm install javascript-obfuscator --save-dev
```

## Build Normal

```bash
npx electron-packager . rab-bldsp --platform=win32 --arch=x64 --out=dist --overwrite
```

## Build dengan Proteksi Kode

```bash
node obfuscate.js
cd temp
npx electron-packager . rab-bldsp --platform=win32 --arch=x64 --out=../dist2 --overwrite
cd ..
rmdir /S /Q temp
```
