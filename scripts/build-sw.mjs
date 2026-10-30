// `vite build` 다음에 실행되어 dist/sw.js(서비스 워커)를 만듭니다.
// dist 안의 모든 파일을 미리 저장(precache)하도록 목록을 채우고,
// 파일 내용이 바뀌면 BUILD_ID가 바뀌어서 폰에 설치된 앱도 새 버전으로 업데이트됩니다.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(root, 'dist');
const templatePath = join(root, 'scripts', 'sw-template.js');

if (!existsSync(distDir)) {
  console.error(`✖ ${distDir} 폴더가 없습니다. 먼저 vite build를 실행하세요.`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(distDir)
  .map((full) => relative(distDir, full).split(sep).join('/'))
  .filter((file) => file !== 'sw.js' && !file.endsWith('.map') && !file.split('/').some((part) => part.startsWith('.')))
  .sort();

const hash = createHash('sha256');
for (const file of files) {
  hash.update(file);
  hash.update(readFileSync(join(distDir, file)));
}
const buildId = hash.digest('hex').slice(0, 12);

const urls = ['./', ...files.map((file) => `./${file}`)];
const source = readFileSync(templatePath, 'utf8')
  .replace('__BUILD_ID__', buildId)
  .replace('/*__PRECACHE_URLS__*/ []', JSON.stringify(urls, null, 2));

writeFileSync(join(distDir, 'sw.js'), source);
console.log(`✔ dist/sw.js 생성 (파일 ${files.length}개 precache, 버전 ${buildId})`);
