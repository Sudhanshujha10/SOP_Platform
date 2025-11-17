/**
 * Document Parser Module
 * Handles extraction of text from PDF, DOCX, CSV, and TXT files
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { parse } = require('csv-parse/sync');

/**
 * Extract text from PDF
 */
async function extractFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    let text = data.text;
    
    console.log('📄 Raw PDF text length:', text.length);
    
    // Clean PDF artifacts
    text = text
      // Remove page numbers (various formats)
      .replace(/Page \d+ of \d+/gi, '')
      .replace(/^\d+$/gm, '')
      .replace(/\[\d+\]/g, '')
      // Remove headers/footers (common patterns)
      .replace(/^[A-Z\s]{20,}$/gm, '')
      // Remove form feed characters
      .replace(/\f/g, '\n')
      // Normalize whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    console.log('✅ PDF extracted:', {
      pages: data.numpages,
      rawLength: data.text.length,
      cleanedLength: text.length
    });
    
    return text;
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX
 */
async function extractFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    let text = result.value;
    
    console.log('📄 Raw DOCX text length:', text.length);
    
    // Clean DOCX artifacts
    text = text
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t+/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
    
    console.log('✅ DOCX extracted:', {
      textLength: text.length,
      warnings: result.messages.length
    });
    
    if (result.messages.length > 0) {
      console.log('⚠️ DOCX warnings:', result.messages);
    }
    
    return text;
  } catch (error) {
    console.error('❌ DOCX extraction failed:', error);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Parse CSV
 */
async function extractFromCSV(buffer) {
  try {
    const text = buffer.toString('utf-8');
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });
    
    console.log('📊 CSV parsed:', {
      rows: records.length,
      columns: Object.keys(records[0] || {}).length
    });
    
    if (records.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Convert CSV to structured text for AI
    const structuredText = records.map((row, i) => {
      const entries = Object.entries(row)
        .filter(([key, value]) => value && value.trim())
        .map(([key, value]) => `  ${key}: ${value}`)
        .join('\n');
      
      return `Rule ${i + 1}:\n${entries}`;
    }).join('\n\n');
    
    console.log('✅ CSV converted to structured text:', {
      textLength: structuredText.length
    });
    
    return structuredText;
  } catch (error) {
    console.error('❌ CSV parsing failed:', error);
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

/**
 * Extract text from TXT
 */
async function extractFromTXT(buffer) {
  try {
    const text = buffer.toString('utf-8').trim();
    
    console.log('📝 TXT extracted:', { 
      textLength: text.length 
    });
    
    if (text.length === 0) {
      throw new Error('TXT file is empty');
    }
    
    return text;
  } catch (error) {
    console.error('❌ TXT extraction failed:', error);
    throw new Error(`Failed to extract text from TXT: ${error.message}`);
  }
}

/**
 * Main extraction function - routes to appropriate handler
 */
async function extractText(file) {
  const { buffer, mimetype, originalname } = file;
  
  console.log('📥 Processing file:', {
    name: originalname,
    type: mimetype,
    size: buffer.length
  });
  
  // Validate file size
  if (buffer.length === 0) {
    throw new Error('File is empty');
  }
  
  // Determine file type from extension
  const ext = originalname.split('.').pop().toLowerCase();
  
  let text;
  
  switch (ext) {
    case 'pdf':
      text = await extractFromPDF(buffer);
      break;
    
    case 'docx':
    case 'doc':
      text = await extractFromDOCX(buffer);
      break;
    
    case 'csv':
      text = await extractFromCSV(buffer);
      break;
    
    case 'txt':
      text = await extractFromTXT(buffer);
      break;
    
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported: PDF, DOCX, CSV, TXT`);
  }
  
  if (!text || text.trim().length === 0) {
    throw new Error('No text could be extracted from the document');
  }
  
  return text;
}

/**
 * Segment text into meaningful chunks for rule extraction
 */
function segmentText(text) {
  console.log('📊 Starting text segmentation...');
  
  // Split by double newlines (paragraphs)
  let segments = text.split(/\n\n+/);
  
  console.log(`   - Initial segments: ${segments.length}`);
  
  // Filter out very short segments (likely noise)
  segments = segments.filter(seg => seg.trim().length > 50);
  
  console.log(`   - After filtering short segments: ${segments.length}`);
  
  // Rule-related keywords to identify relevant segments
  const ruleKeywords = [
    // Actions
    'modifier', 'add', 'append', 'remove', 'delete', 'require', 'authorization',
    'prior auth', 'bundle', 'unbundle', 'deny', 'reject', 'swap', 'replace',
    // Codes
    'code', 'cpt', 'icd', 'hcpcs', 'procedure', 'diagnosis',
    // Payers
    'payer', 'insurance', 'medicare', 'medicaid', 'commercial', 'bcbs', 'blue cross',
    'anthem', 'cigna', 'aetna', 'humana', 'united',
    // Documentation
    'documentation', 'chart', 'note', 'record', 'medical necessity',
    // Providers
    'provider', 'physician', 'doctor', 'nurse', 'therapist', 'specialist'
  ];
  
  // Score each segment based on keyword matches
  const scoredSegments = segments.map(seg => {
    const lower = seg.toLowerCase();
    const score = ruleKeywords.reduce((count, keyword) => {
      return count + (lower.includes(keyword) ? 1 : 0);
    }, 0);
    
    return { text: seg, score };
  });
  
  // Sort by score (highest first)
  scoredSegments.sort((a, b) => b.score - a.score);
  
  // Take segments with score > 0, or all if none match
  const ruleSegments = scoredSegments
    .filter(s => s.score > 0)
    .map(s => s.text);
  
  const finalSegments = ruleSegments.length > 0 ? ruleSegments : segments;
  
  console.log('✅ Text segmentation complete:', {
    totalSegments: segments.length,
    ruleSegments: ruleSegments.length,
    finalSegments: finalSegments.length
  });
  
  return finalSegments;
}

module.exports = {
  extractText,
  segmentText
};
