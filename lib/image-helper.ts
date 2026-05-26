export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  isFallback: boolean;
}

/**
 * 브라우저 클라이언트 사이드에서 이미지 파일을 리사이징하고 WebP로 자동 압축하는 헬퍼 함수
 * 
 * @param file 원본 이미지 파일
 * @param isMain 대표 이미지 여부 (대표 이미지는 최대 1600px, 썸네일/갤러리는 최대 800px)
 * @returns 압축 완료된 CompressResult 객체
 */
export async function compressImage(
  file: File,
  isMain: boolean
): Promise<CompressResult> {
  // 1. HEIC/HEIF 파일 탐색 및 원천 차단
  const lowerName = file.name.toLowerCase();
  const isHEIC = 
    file.type === 'image/heic' || 
    file.type === 'image/heif' || 
    lowerName.endsWith('.heic') || 
    lowerName.endsWith('.heif');

  if (isHEIC) {
    throw new Error('HEIC_NOT_SUPPORTED');
  }

  return new Promise((resolve, reject) => {
    // 이미지 타입이 아닌 경우 예외 처리
    if (!file.type.startsWith('image/')) {
      reject(new Error('INVALID_FILE_TYPE'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = isMain ? 1600 : 800;

          // 종횡비 유지 리사이징
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('CANVAS_CONTEXT_NULL');
          }

          ctx.drawImage(img, 0, 0, width, height);

          // WebP 포맷 변환 및 품질 82% 압축 적용
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('CANVAS_COMPRESSION_FAILED'));
                return;
              }
              
              // 파일 확장자를 .webp로 통일하여 새 파일 객체 생성
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFile = new File([blob], `${nameWithoutExt}.webp`, {
                type: 'image/webp',
                lastModified: Date.now()
              });

              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                width,
                height,
                isFallback: false
              });
            },
            'image/webp',
            0.82
          );
        } catch (err) {
          // Canvas 드로잉 및 변환 실패 시 Fallback 에러 반환
          reject(new Error('CANVAS_COMPRESSION_FAILED'));
        }
      };

      img.onerror = () => {
        reject(new Error('IMAGE_LOAD_FAILED'));
      };
    };

    reader.onerror = () => {
      reject(new Error('FILE_READ_FAILED'));
    };
  });
}
