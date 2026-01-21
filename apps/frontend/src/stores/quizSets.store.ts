import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { QuizSet, CreateQuizSetInput, UpdateQuizSetInput, QuizCategory } from '@/types';
import * as quizService from '@/services/quiz.service';
import { useAuthStore } from './auth.store';

/**
 * クイズセットストア
 * クイズセットの状態と操作を管理
 */
export const useQuizSetsStore = defineStore('quizSets', () => {
  const authStore = useAuthStore();

  // State
  const quizSets = ref<QuizSet[]>([]);
  const selectedQuizSet = ref<QuizSet | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const filterCategory = ref<QuizCategory | 'all'>('all');

  // Actions
  /**
   * クイズセット一覧を取得
   */
  async function fetchQuizSets(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await quizService.getQuizSets();
      quizSets.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch quiz sets';
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        authStore.handleAuthError();
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットを取得
   */
  async function fetchQuizSet(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const data = await quizService.getQuizSet(id);
      selectedQuizSet.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch quiz set';
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        authStore.handleAuthError();
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットを作成
   */
  async function createQuizSet(input: CreateQuizSetInput): Promise<QuizSet | null> {
    loading.value = true;
    error.value = null;

    try {
      const newQuizSet = await quizService.createQuizSet(input);
      quizSets.value.unshift(newQuizSet);
      return newQuizSet;
    } catch (err: any) {
      error.value = err.message || 'Failed to create quiz set';
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        authStore.handleAuthError();
      }
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットを更新
   */
  async function updateQuizSet(
    id: number,
    input: UpdateQuizSetInput
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const updatedQuizSet = await quizService.updateQuizSet(id, input);
      
      const index = quizSets.value.findIndex((qs) => qs.id === id);
      if (index !== -1) {
        quizSets.value[index] = updatedQuizSet;
      }

      if (selectedQuizSet.value?.id === id) {
        selectedQuizSet.value = updatedQuizSet;
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to update quiz set';
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        authStore.handleAuthError();
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットを削除
   */
  async function deleteQuizSet(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await quizService.deleteQuizSet(id);
      quizSets.value = quizSets.value.filter((qs) => qs.id !== id);
      
      if (selectedQuizSet.value?.id === id) {
        selectedQuizSet.value = null;
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete quiz set';
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        authStore.handleAuthError();
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットの公開状態を切り替え
   */
  async function togglePublic(id: number, isPublic: boolean): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const updatedQuizSet = await quizService.toggleQuizSetPublic(id, isPublic);
      
      const index = quizSets.value.findIndex((qs) => qs.id === id);
      if (index !== -1) {
        quizSets.value[index] = updatedQuizSet;
      }

      if (selectedQuizSet.value?.id === id) {
        selectedQuizSet.value = updatedQuizSet;
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle public status';
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        authStore.handleAuthError();
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * カテゴリーフィルターを設定
   */
  function setFilterCategory(category: QuizCategory | 'all'): void {
    filterCategory.value = category;
  }

  /**
   * フィルター済みクイズセット一覧を取得
   */
  function getFilteredQuizSets(): QuizSet[] {
    if (filterCategory.value === 'all') {
      return quizSets.value;
    }
    return quizSets.value.filter((qs) => qs.category === filterCategory.value);
  }

  /**
   * エラーをクリア
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 選択されたクイズセットをクリア
   */
  function clearSelectedQuizSet(): void {
    selectedQuizSet.value = null;
  }

  return {
    // State
    quizSets,
    selectedQuizSet,
    loading,
    error,
    filterCategory,

    // Actions
    fetchQuizSets,
    fetchQuizSet,
    createQuizSet,
    updateQuizSet,
    deleteQuizSet,
    togglePublic,
    setFilterCategory,
    getFilteredQuizSets,
    clearError,
    clearSelectedQuizSet,
  };
});
