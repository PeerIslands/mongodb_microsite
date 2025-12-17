/**
 * Validation utilities
 */

import { FILE_UPLOAD } from '@/constants';

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Slug validation (alphanumeric and hyphens only)
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

// File type validation
export const isValidImageFile = (file: File): boolean => {
  return (FILE_UPLOAD.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
};

export const isValidPdfFile = (file: File): boolean => {
  return (FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type);
};

export const isValidVideoFile = (file: File): boolean => {
  return (FILE_UPLOAD.ALLOWED_VIDEO_TYPES as readonly string[]).includes(file.type);
};

// File size validation
export const isValidImageSize = (file: File): boolean => {
  return file.size <= FILE_UPLOAD.MAX_IMAGE_SIZE;
};

export const isValidPdfSize = (file: File): boolean => {
  return file.size <= FILE_UPLOAD.MAX_PDF_SIZE;
};

export const isValidVideoSize = (file: File): boolean => {
  return file.size <= FILE_UPLOAD.MAX_VIDEO_SIZE;
};

// Generic file validation
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
};

// String validations
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// Number validations
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

export const isBetween = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

