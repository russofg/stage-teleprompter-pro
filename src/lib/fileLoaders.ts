import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import type { FileData } from '../types';

export async function loadTextFile(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve({
        name: file.name,
        content: DOMPurify.sanitize(content),
        type: 'txt'
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function loadDocxFile(file: File): Promise<FileData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      name: file.name,
      content: DOMPurify.sanitize(result.value),
      type: 'docx'
    };
  } catch (error) {
    throw new Error(`Failed to load DOCX file: ${error}`);
  }
}

export async function loadFromUrl(url: string): Promise<FileData> {
  try {
    let fetchUrl = url;
    let filename = 'url-content';
    
    // Detectar y convertir URLs de Google Docs a formato de exportación
    if (url.includes('docs.google.com/document')) {
      // Extraer el ID del documento de la URL
      const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      if (docIdMatch) {
        const docId = docIdMatch[1];
        // Usar formato de texto plano pero mejorado para párrafos
        fetchUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
        filename = 'google-doc.txt';
      }
    }
    // Detectar URLs de Google Sheets
    else if (url.includes('docs.google.com/spreadsheets')) {
      const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1];
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        filename = 'google-sheet.csv';
      }
    }
    
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let content = await response.text();
    
    // Si es texto de Google Docs, mejorar el formato
    if (filename === 'google-doc.txt') {
      content = improveTextFormat(content);
    }
    // Si recibimos HTML inesperado, extraer texto
    else if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      content = doc.body?.textContent || doc.textContent || 'Error: No se pudo extraer el texto del documento';
    }
    
    return {
      name: filename,
      content: DOMPurify.sanitize(content),
      type: 'url'
    };
  } catch (error) {
    throw new Error(`Failed to load URL: ${error}`);
  }
}

// Función para mejorar el formato del texto plano de Google Docs
function improveTextFormat(text: string): string {
  return text
    // Normalizar saltos de línea
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Mantener párrafos (doble salto de línea)
    .replace(/\n\s*\n/g, '\n\n')
    // Limpiar espacios extra pero mantener estructura
    .replace(/[ \t]+/g, ' ')
    // Eliminar espacios al inicio y final de líneas
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    // Asegurar que no haya más de 2 saltos consecutivos
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function loadFile(file: File): Promise<FileData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'txt':
      return loadTextFile(file);
    case 'docx':
      return loadDocxFile(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
