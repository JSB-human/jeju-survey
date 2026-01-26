import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '제주 감귤 현장조사',
    short_name: '감귤 현장조사',
    description: '제주도 감귤 현장조사 시스템',
    start_url: '/',
    display: 'standalone', // 👈 이게 중요! 주소창을 없애고 앱처럼 보이게 함
    background_color: '#fbfbfa',
    theme_color: '#fbfbfa',
    icons: [
      {
        src: '/jeju-symbol.png', // public 폴더에 아이콘 넣어두세요
        sizes: '100x100',
        type: 'image/png',
      },
      {
        src: '/jeju-symbol.png',
        sizes: '200x200',
        type: 'image/png',
      },
    ],
  };
}