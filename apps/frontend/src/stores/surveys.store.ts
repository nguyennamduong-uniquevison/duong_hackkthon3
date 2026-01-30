import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  surveyService, 
  type SurveyWithStats, 
  type SurveyWithQuestions,
  type CreateSurveyRequest,
  type UpdateSurveyRequest,
  type CreateQuestionRequest,
  type UpdateQuestionRequest,
  type SurveyTemplate,
  type ResponseWithAnswers,
  type SurveyStats
} from '@/services/surveys.service';

export const useSurveyStore = defineStore('survey', () => {
  // State
  const surveys = ref<SurveyWithStats[]>([]);
  const currentSurvey = ref<SurveyWithQuestions | null>(null);
  const currentSurveyResponses = ref<ResponseWithAnswers[]>([]);
  const currentSurveyStats = ref<SurveyStats | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const surveyCount = computed(() => surveys.value.length);
  const publicSurveys = computed(() => surveys.value.filter(s => s.is_public));
  const privateSurveys = computed(() => surveys.value.filter(s => !s.is_public));

  // Actions
  async function fetchSurveys() {
    isLoading.value = true;
    error.value = null;
    try {
      surveys.value = await surveyService.getSurveys();
    } catch (e: any) {
      error.value = e.message || 'アンケート一覧の取得に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSurvey(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      currentSurvey.value = await surveyService.getSurvey(id);
    } catch (e: any) {
      error.value = e.message || 'アンケートの取得に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function createSurvey(data: CreateSurveyRequest) {
    isLoading.value = true;
    error.value = null;
    try {
      const newSurvey = await surveyService.createSurvey(data);
      await fetchSurveys(); // Refresh list
      return newSurvey;
    } catch (e: any) {
      error.value = e.message || 'アンケートの作成に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function createSurveyFromTemplate(template: SurveyTemplate) {
    isLoading.value = true;
    error.value = null;
    try {
      const newSurvey = await surveyService.createSurveyFromTemplate(template);
      await fetchSurveys(); // Refresh list
      return newSurvey;
    } catch (e: any) {
      error.value = e.message || 'テンプレートからアンケートの作成に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSurvey(id: string, data: UpdateSurveyRequest) {
    isLoading.value = true;
    error.value = null;
    try {
      await surveyService.updateSurvey(id, data);
      await fetchSurveys(); // Refresh list
      if (currentSurvey.value?.id === id) {
        await fetchSurvey(id); // Refresh current survey
      }
    } catch (e: any) {
      error.value = e.message || 'アンケートの更新に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteSurvey(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await surveyService.deleteSurvey(id);
      surveys.value = surveys.value.filter(s => s.id !== id);
      if (currentSurvey.value?.id === id) {
        currentSurvey.value = null;
      }
    } catch (e: any) {
      error.value = e.message || 'アンケートの削除に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function createQuestion(surveyId: string, data: CreateQuestionRequest) {
    isLoading.value = true;
    error.value = null;
    try {
      const newQuestion = await surveyService.createQuestion(surveyId, data);
      if (currentSurvey.value?.id === surveyId) {
        await fetchSurvey(surveyId); // Refresh current survey
      }
      return newQuestion;
    } catch (e: any) {
      error.value = e.message || '質問の作成に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateQuestion(surveyId: string, questionId: string, data: UpdateQuestionRequest) {
    isLoading.value = true;
    error.value = null;
    try {
      await surveyService.updateQuestion(surveyId, questionId, data);
      if (currentSurvey.value?.id === surveyId) {
        await fetchSurvey(surveyId); // Refresh current survey
      }
    } catch (e: any) {
      error.value = e.message || '質問の更新に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteQuestion(surveyId: string, questionId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await surveyService.deleteQuestion(surveyId, questionId);
      if (currentSurvey.value?.id === surveyId) {
        currentSurvey.value.questions = currentSurvey.value.questions.filter(q => q.id !== questionId);
      }
    } catch (e: any) {
      error.value = e.message || '質問の削除に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSurveyResponses(surveyId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      currentSurveyResponses.value = await surveyService.getSurveyResponses(surveyId);
    } catch (e: any) {
      error.value = e.message || '回答一覧の取得に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSurveyStats(surveyId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      currentSurveyStats.value = await surveyService.getSurveyStats(surveyId);
    } catch (e: any) {
      error.value = e.message || '統計情報の取得に失敗しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentSurvey() {
    currentSurvey.value = null;
    currentSurveyResponses.value = [];
    currentSurveyStats.value = null;
  }

  return {
    // State
    surveys,
    currentSurvey,
    currentSurveyResponses,
    currentSurveyStats,
    isLoading,
    error,
    
    // Getters
    surveyCount,
    publicSurveys,
    privateSurveys,
    
    // Actions
    fetchSurveys,
    fetchSurvey,
    createSurvey,
    createSurveyFromTemplate,
    updateSurvey,
    deleteSurvey,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchSurveyResponses,
    fetchSurveyStats,
    clearError,
    clearCurrentSurvey
  };
});
