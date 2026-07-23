import { describe, expect, it } from 'vitest';
import { describePdfError, describeUploadError } from './pdf';

describe('PDF error messages', () => {
  it('describes password-protected files', () => {
    const error = Object.assign(new Error('Password required'), { name: 'PasswordException' });
    expect(describePdfError(error)).toContain('mật khẩu');
  });

  it('describes invalid files', () => {
    const error = Object.assign(new Error('Invalid PDF structure'), { name: 'InvalidPDFException' });
    expect(describePdfError(error)).toContain('không hợp lệ');
  });

  it('describes worker failures', () => {
    expect(describePdfError(new Error('Setting up fake worker failed: 404'))).toContain('bộ xử lý PDF');
  });

  it('describes the upload size limit', () => {
    expect(describeUploadError(new Error('PDF_SIZE_LIMIT'))).toContain('100 MB');
  });
});
