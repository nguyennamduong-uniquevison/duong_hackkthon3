<template>
  <div class="min-h-screen bg-background">
    <main class="container mx-auto px-4 py-12">
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="survey" class="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">{{ survey.title }}</CardTitle>
            <CardDescription v-if="survey.description">{{ survey.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- 質問 -->
            <div v-for="(question, index) in survey.questions" :key="question.id" class="space-y-3">
              <div>
                <Label class="text-base">
                  {{ index + 1 }}. {{ question.question_text }}
                  <Badge v-if="question.is_required" variant="destructive" class="ml-2">必須</Badge>
                </Label>
              </div>

              <!-- 単一選択 -->
              <div v-if="question.question_type === 'single_choice'" class="space-y-2">
                <div v-for="choice in question.options?.choices" :key="choice" class="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    :id="`${question.id}-${choice}`" 
                    :name="`question-${question.id}`"
                    :value="choice"
                    v-model="answers[question.id]"
                    class="w-4 h-4"
                  />
                  <Label :for="`${question.id}-${choice}`">{{ choice }}</Label>
                </div>
              </div>

              <!-- 複数選択 -->
              <div v-if="question.question_type === 'multiple_choice'" class="space-y-2">
                <div v-for="choice in question.options?.choices" :key="choice" class="flex items-center space-x-2">
                  <Checkbox 
                    :id="`${question.id}-${choice}`"
                    :checked="(answers[question.id] || []).includes(choice)"
                    @update:checked="(checked) => toggleChoice(question.id, choice, checked)"
                  />
                  <Label :for="`${question.id}-${choice}`">{{ choice }}</Label>
                </div>
              </div>

              <!-- 自由記述 -->
              <Textarea 
                v-if="question.question_type === 'free_text'"
                v-model="answers[question.id]"
                rows="4"
                placeholder="回答を入力してください"
              />

              <!-- スケール -->
              <div v-if="question.question_type === 'scale'" class="space-y-4">
                <Input 
                  type="range"
                  v-model.number="answers[question.id]"
                  :min="question.scale_config?.min || 1"
                  :max="question.scale_config?.max || 5"
                  :step="1"
                  class="w-full"
                />
                <div class="flex justify-between text-sm text-muted-foreground">
                  <span>{{ question.scale_config?.minLabel }}</span>
                  <span class="font-medium">{{ answers[question.id] || question.scale_config?.min || 1 }}</span>
                  <span>{{ question.scale_config?.maxLabel }}</span>
                </div>
              </div>
            </div>

            <!-- エラー -->
            <Alert v-if="error" variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <!-- 送信ボタン -->
            <Button @click="handleSubmit" class="w-full" :disabled="isSubmitting">
              {{ isSubmitting ? '送信中...' : '回答を送信' }}
            </Button>
          </CardContent>
        </Card>

        <!-- 送信完了 -->
        <Card v-if="submitted" class="mt-8">
          <CardContent class="pt-6 text-center">
            <CheckCircle2 class="size-16 mx-auto mb-4 text-green-500" />
            <h2 class="text-2xl font-bold mb-2">回答ありがとうございました</h2>
            <p class="text-muted-foreground">回答を送信しました</p>
          </CardContent>
        </Card>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-xl text-muted-foreground">アンケートが見つかりません</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { surveyService } from '@/services/surveys.service';
import type { SurveyWithQuestions } from '@/services/surveys.service';

const route = useRoute();
const publicUrl = route.params.publicUrl as string;

const survey = ref<SurveyWithQuestions | null>(null);
const answers = ref<Record<string, any>>({});
const isLoading = ref(true);
const isSubmitting = ref(false);
const submitted = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    survey.value = await surveyService.getPublicSurvey(publicUrl);
    // Initialize scale answers
    survey.value.questions.forEach(q => {
      if (q.question_type === 'scale') {
        answers.value[q.id] = q.scale_config?.min || 1;
      } else if (q.question_type === 'multiple_choice') {
        answers.value[q.id] = [];
      }
    });
  } catch (e: any) {
    error.value = 'アンケートの読み込みに失敗しました';
  } finally {
    isLoading.value = false;
  }
});

const toggleChoice = (questionId: string, choice: string, checked: boolean) => {
  if (!answers.value[questionId]) {
    answers.value[questionId] = [];
  }
  if (checked) {
    if (!answers.value[questionId].includes(choice)) {
      answers.value[questionId].push(choice);
    }
  } else {
    answers.value[questionId] = answers.value[questionId].filter((c: string) => c !== choice);
  }
};

const handleSubmit = async () => {
  error.value = '';
  
  // Validate required questions
  if (survey.value) {
    const requiredQuestions = survey.value.questions.filter(q => q.is_required);
    for (const q of requiredQuestions) {
      const answer = answers.value[q.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        error.value = '必須の質問に回答してください';
        return;
      }
    }
  }

  isSubmitting.value = true;
  
  try {
    const submitData = survey.value!.questions.map(q => {
      const answer: any = { question_id: q.id };
      const value = answers.value[q.id];

      if (q.question_type === 'free_text') {
        answer.answer_text = value || '';
      } else if (q.question_type === 'single_choice') {
        answer.answer_choices = value ? [value] : [];
      } else if (q.question_type === 'multiple_choice') {
        answer.answer_choices = value || [];
      } else if (q.question_type === 'scale') {
        answer.answer_scale = value || q.scale_config?.min || 1;
      }

      return answer;
    });

    await surveyService.submitResponse(publicUrl, { answers: submitData });
    submitted.value = true;
  } catch (e: any) {
    error.value = '送信に失敗しました。もう一度お試しください。';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
