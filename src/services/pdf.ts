import { pdfjs } from 'react-pdf';

export const MAX_PDF_SIZE = 100 * 1024 * 1024;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export function describePdfError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  const detail = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (name === 'PasswordException' || detail.includes('password')) {
    return 'PDF được bảo vệ bằng mật khẩu. Hãy gỡ mật khẩu rồi thử lại.';
  }
  if (name === 'InvalidPDFException' || detail.includes('invalid pdf') || detail.includes('corrupt')) {
    return 'PDF bị hỏng hoặc có định dạng không hợp lệ.';
  }
  if (name === 'MissingPDFException' || detail.includes('missing pdf')) {
    return 'Không tìm thấy dữ liệu PDF trong tệp.';
  }
  if (detail.includes('worker') || detail.includes('404') || detail.includes('failed to fetch')) {
    return 'Không tải được bộ xử lý PDF. Hãy tải lại trang rồi thử lại.';
  }
  if (name === 'UnknownErrorException' && detail.includes('memory')) {
    return 'Không đủ bộ nhớ để xử lý PDF này.';
  }
  return 'PDF không tương thích hoặc trình duyệt không thể phân tích tệp này.';
}

export async function inspectPdf(file: File): Promise<{ buffer: ArrayBuffer; totalPages: number }> {
  if (file.size > MAX_PDF_SIZE) {
    throw new Error('PDF_SIZE_LIMIT');
  }

  const buffer = await file.arrayBuffer();
  let document: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']> | undefined;

  try {
    document = await pdfjs.getDocument({ data: buffer.slice(0) }).promise;
    return { buffer, totalPages: document.numPages };
  } finally {
    await document?.destroy();
  }
}

export function describeUploadError(error: unknown): string {
  if (error instanceof Error && error.message === 'PDF_SIZE_LIMIT') {
    return 'PDF vượt quá giới hạn 100 MB.';
  }
  return describePdfError(error);
}
