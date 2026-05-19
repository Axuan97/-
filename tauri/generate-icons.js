// Generate minimal placeholder icons for Tauri
// Creates valid minimal PNG files programmatically
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, 'src-tauri', 'icons');

// CRC32 for PNG chunks
function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

// Creates a solid-color PNG of given size
function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw image data with filter byte 0 per row
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter: none
    for (let x = 0; x < width; x++) {
      rawRows.push(r, g, b);
    }
  }
  const raw = Buffer.from(rawRows);

  // Compress with zlib (deflate)
  const compressed = deflateSync(raw);

  // IEND
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Create .ico file (wraps PNG in ICO format)
function createICO(pngData) {
  const numImages = 1;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(numImages, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(pngData.length > 256 ? 0 : Math.min(pngData.length, 256), 0); // width
  entry.writeUInt8(pngData.length > 256 ? 0 : Math.min(pngData.length, 256), 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngData.length, 8); // size
  entry.writeUInt32LE(6 + 16, 12); // offset

  return Buffer.concat([header, entry, pngData]);
}

// Generate icons
const purple = [94, 92, 230]; // #5e5ce6

function main() {
  // 32x32 PNG
  const png32 = createPNG(32, 32, ...purple);
  writeFileSync(join(iconsDir, '32x32.png'), png32);

  // 128x128 PNG
  const png128 = createPNG(128, 128, ...purple);
  writeFileSync(join(iconsDir, '128x128.png'), png128);

  // 128x128@2x (256x256) PNG
  const png256 = createPNG(256, 256, ...purple);
  writeFileSync(join(iconsDir, '128x128@2x.png'), png256);

  // icon.ico (from 256x256 PNG)
  const ico = createICO(png256);
  writeFileSync(join(iconsDir, 'icon.ico'), ico);

  // icon.png (copy of 128x128)
  writeFileSync(join(iconsDir, 'icon.png'), png128);

  console.log('Icons generated successfully!');
}

main();
