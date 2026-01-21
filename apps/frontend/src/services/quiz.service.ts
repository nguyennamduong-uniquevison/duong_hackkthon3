/**
 * Quiz Service
 * Handles all quiz-related API calls
 */
import { api, ApiError } from './api';
import type { 
  QuizSet, 
  CreateQuizSetInput, 
  UpdateQuizSetInput,
  ApiResponse 
} from '@/types';

/**
 * Get all quiz sets
 */
export async function getQuizSets(): Promise<QuizSet[]> {
  try {
    const response = await api<ApiResponse<QuizSet[]>>('/quiz-sets', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError('Failed to get quiz sets');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to get quiz sets');
  }
}

/**
 * Get quiz set by ID
 */
export async function getQuizSet(id: number): Promise<QuizSet> {
  try {
    const response = await api<ApiResponse<QuizSet>>(`/quiz-sets/${id}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError('Failed to get quiz set');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to get quiz set');
  }
}

/**
 * Create new quiz set
 */
export async function createQuizSet(input: CreateQuizSetInput): Promise<QuizSet> {
  try {
    const response = await api<ApiResponse<QuizSet>>('/quiz-sets', {
      method: 'POST',
      body: input,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError('Failed to create quiz set');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create quiz set');
  }
}

/**
 * Update quiz set
 */
export async function updateQuizSet(
  id: number,
  input: UpdateQuizSetInput
): Promise<QuizSet> {
  try {
    const response = await api<ApiResponse<QuizSet>>(`/quiz-sets/${id}`, {
      method: 'PUT',
      body: input,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError('Failed to update quiz set');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update quiz set');
  }
}

/**
 * Delete quiz set
 */
export async function deleteQuizSet(id: number): Promise<void> {
  try {
    const response = await api<ApiResponse>(`/quiz-sets/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new ApiError('Failed to delete quiz set');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete quiz set');
  }
}

/**
 * Toggle quiz set public status
 */
export async function toggleQuizSetPublic(id: number, isPublic: boolean): Promise<QuizSet> {
  return updateQuizSet(id, { is_public: isPublic });
}
