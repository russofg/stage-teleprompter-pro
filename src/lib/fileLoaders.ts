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

// Función loadFromUrl REMOVIDA - funcionalidad obsoleta

export async function loadFile(file: File): Promise<FileData> {
  // Validación de seguridad para producción
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
  
  if (!file) {
    throw new Error('No se seleccionó ningún archivo');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo es demasiado grande. Máximo permitido: 10MB`);
  }
  
  if (file.size === 0) {
    throw new Error('El archivo está vacío');
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    throw new Error('El archivo no tiene extensión');
  }
  
  switch (extension) {
    case 'txt':
      return loadTextFile(file);
    case 'docx':
      return loadDocxFile(file);
    default:
      throw new Error(`Tipo de archivo no soportado: ${extension}. Solo se permiten .txt y .docx`);
  }
}
