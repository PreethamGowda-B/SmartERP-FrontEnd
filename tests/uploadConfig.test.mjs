import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL, FILE_SIZE_ERROR_MESSAGE, isFileSizeValid, formatFileSize } from '../lib/uploadConfig.ts';

test('Frontend Upload Configuration (uploadConfig.ts)', async (t) => {
  await t.test('MAX_FILE_SIZE is exactly 5 MiB', () => {
    assert.equal(MAX_FILE_SIZE, 5 * 1024 * 1024);
    assert.equal(MAX_FILE_SIZE_LABEL, '5 MB');
    assert.match(FILE_SIZE_ERROR_MESSAGE, /5 MB/);
  });

  await t.test('isFileSizeValid accepts <= 5 MB and rejects > 5 MB', () => {
    const makeFakeFile = (size) => ({ size, name: 'test.jpg' });

    assert.equal(isFileSizeValid(makeFakeFile(500 * 1024)), true, '500 KB should be accepted');
    assert.equal(isFileSizeValid(makeFakeFile(1024 * 1024)), true, '1 MB should be accepted');
    assert.equal(isFileSizeValid(makeFakeFile(3 * 1024 * 1024)), true, '3 MB should be accepted');
    assert.equal(isFileSizeValid(makeFakeFile(5 * 1024 * 1024)), true, 'Exactly 5 MiB should be accepted');
    assert.equal(isFileSizeValid(makeFakeFile(5 * 1024 * 1024 + 1)), false, '5 MiB + 1 byte should be rejected');
    assert.equal(isFileSizeValid(makeFakeFile(6 * 1024 * 1024)), false, '6 MB should be rejected');
    assert.equal(isFileSizeValid(makeFakeFile(10 * 1024 * 1024)), false, '10 MB should be rejected');
    assert.equal(isFileSizeValid(makeFakeFile(20 * 1024 * 1024)), false, '20 MB should be rejected');
  });

  await t.test('formatFileSize formats sizes appropriately', () => {
    assert.equal(formatFileSize(500), '500 B');
    assert.equal(formatFileSize(512 * 1024), '512.0 KB');
    assert.equal(formatFileSize(5 * 1024 * 1024), '5.00 MB');
  });
});
