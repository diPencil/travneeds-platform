/**
 * TravNeeds Modular Platform — Rich Text & Sanitizer Security Unit Tests
 *
 * Runs standalone via Node.js / tsx without writing to database.
 */

import {
  sanitizeRichText,
  isHtmlContent,
  stripHtmlToPlainText,
} from './rich-text';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Running TravNeeds Rich Text Sanitizer & Renderer Tests ---\n');

// 1. Plain text detection
assert(!isHtmlContent('Simple plain text string'), 'Plain text is not detected as HTML');
assert(!isHtmlContent('Line 1\nLine 2\nLine 3'), 'Multiline plain text is not detected as HTML');
assert(isHtmlContent('<p>Paragraph</p>'), 'Simple HTML paragraph is detected as HTML');
assert(isHtmlContent('Tour with <b>bold</b> word'), 'Inline HTML is detected as HTML');

// 2. Allowed Tags & Attributes
const cleanHtml = '<p style="text-align: center;">Welcome to <b>Egypt</b>. Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">Cairo</a>.</p>';
const sanitized = sanitizeRichText(cleanHtml);
assert(sanitized.includes('text-align:center') || sanitized.includes('text-align: center'), 'Safe text-align is preserved');
assert(sanitized.includes('<b>Egypt</b>'), 'Safe <b> tag is preserved');
assert(sanitized.includes('rel="noopener noreferrer"'), 'Safe external link rel is preserved');

// 3. XSS & Malicious Script Injection Rejection
const xssPayloads = [
  '<script>alert("xss")</script><p>Hello</p>',
  '<img src="x" onerror="alert(1)" />',
  '<a href="javascript:alert(1)">Click Me</a>',
  '<p onmouseover="alert(1)">Hover</p>',
  '<iframe src="https://evil.com"></iframe>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Payload</a>',
];

for (const payload of xssPayloads) {
  const result = sanitizeRichText(payload);
  assert(!result.includes('<script>'), `Malicious script stripped from: ${payload.slice(0, 30)}`);
  assert(!result.includes('onerror'), `Event handler onerror stripped from: ${payload.slice(0, 30)}`);
  assert(!result.includes('javascript:'), `JavaScript protocol stripped from: ${payload.slice(0, 30)}`);
  assert(!result.includes('onmouseover'), `onmouseover stripped from: ${payload.slice(0, 30)}`);
  assert(!result.includes('<iframe'), `iframe stripped from: ${payload.slice(0, 30)}`);
  assert(!result.includes('data:'), `data: URI stripped from: ${payload.slice(0, 30)}`);
}

// 4. Strip HTML to Clean Plain Text (for PDFs, Text Exports & JSON-LD)
const complexHtml = '<h2>Day 1: Arrival</h2><p>Welcome to Cairo! Enjoy <b>Khan El Khalili</b> &amp; pyramids.<br/>Next step.</p><ul><li>Airport pickup</li><li>Hotel check-in</li></ul>';
const plain = stripHtmlToPlainText(complexHtml);
assert(!plain.includes('<h2>'), 'HTML tags removed from plain text');
assert(!plain.includes('<p>'), 'Paragraph tags removed');
assert(!plain.includes('<li>'), 'List tags removed');
assert(plain.includes('Day 1: Arrival'), 'Headings content preserved');
assert(plain.includes('Khan El Khalili & pyramids.'), 'HTML entities decoded correctly');
assert(plain.includes('Airport pickup'), 'List text preserved');

// 5. Empty / Null / Undefined Safety
assert(sanitizeRichText(null) === '', 'null returns empty string');
assert(sanitizeRichText(undefined) === '', 'undefined returns empty string');
assert(sanitizeRichText('   ') === '', 'whitespace only returns empty string');
assert(stripHtmlToPlainText(null) === '', 'null text returns empty string');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (process.exitCode === 1) {
  console.error('Test suite failed!');
  process.exit(1);
} else {
  console.log('All Rich Text sanitizer & renderer tests passed successfully!\n');
}

