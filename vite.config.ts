import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드 → GitHub Pages(https://아이디.github.io/저장소이름/), Vercel, 아무 폴더에서나 그대로 동작
  base: './',
  server: {
    // 같은 Wi-Fi에 있는 스마트폰에서 http://PC의IP:5173 으로 접속 가능
    host: true,
    // 클라우드 개발 환경의 미리보기 주소 허용 (GitHub Codespaces).
    // 다른 서비스(ngrok 등)를 쓰면 그 도메인을 '.example.com' 형태로 추가하세요.
    allowedHosts: ['.app.github.dev'],
  },
  preview: {
    host: true,
    allowedHosts: ['.app.github.dev'],
  },
});
