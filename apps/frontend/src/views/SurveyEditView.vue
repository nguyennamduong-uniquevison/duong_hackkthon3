<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <header class="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex-between">
        <div class="flex items-center gap-6">
          <Button variant="ghost" size="sm" @click="router.push('/surveys')">
            <ArrowLeft class="size-4" />
          </Button>
          <h1 class="text-2xl font-bold">{{ survey?.title || 'アンケート編集' }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <Button variant="outline" @click="copyPublicUrl" v-if="survey">
            <LinkIcon class="size-4 mr-2" />
            URLをコピー
          </Button>
          <DarkModeToggle />
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="container mx-auto px-4 py-8">
      <div v-if="surveyStore.isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="survey" class="max-w-4xl mx-auto space-y-6">
        <!-- アンケート基本情報 -->
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>タイトル</Label>
              <Input v-model="editingSurvey.title" />
            </div>
            <div class="space-y-2">
              <Label>説明</Label>
              <Textarea v-model="editingSurvey.description" rows="3" />
            </div>
            <div class="flex items-center space-x-2">
              <Switch v-model:checked="editingSurvey.is_public" id="public" />
              <Label for="public">公開する</Label>
            </div>
            <Button @click="handleUpdateSurvey">保存</Button>
          </CardContent>
        </Card>

        <!-- 質問一覧 -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle>質問</CardTitle>
              <Button @click="showAddQuestionDialog = true">
                <Plus class="size-4 mr-2" />
                質問を追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="survey.questions.length === 0" class="text-center py-8 text-muted-foreground">
              質問がありません。質問を追加してください。
            </div>
            <div v-else class="space-y-4">
              <Card v-for="(question, index) in survey.questions" :key="question.id" class="p-4">
                <div class="space-y-2">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <Badge>{{ index + 1 }}</Badge>
                        <Badge variant="outline">{{ getQuestionTypeLabel(question.question_type) }}</Badge>
                        <Badge v-if="question.is_required" variant="destructive">必須</Badge>
                      </div>
                      <p class="font-medium">{{ question.question_text }}</p>
                    </div>
                    <div class="flex gap-2">
                      <Button variant="ghost" size="sm" @click="editQuestion(question)">
                        <Edit class="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" @click="confirmDeleteQuestion(question.id)">
                        <Trash2 class="size-4" />
                      </Button>
                    </div>
                  </div>

                  <!-- 選択肢表示 -->
                  <div v-if="question.options?.choices" class="pl-8 space-y-1">
                    <div v-for="choice in question.options.choices" :key="choice" class="text-sm text-muted-foreground">
                      • {{ choice }}
                    </div>
                  </div>

                  <!-- スケール表示 -->
                  <div v-if="question.scale_config" class="pl-8 text-sm text-muted-foreground">
                    {{ question.scale_config.min }} - {{ question.scale_config.max }}
                    ({{ question.scale_config.minLabel }} 〜 {{ question.scale_config.maxLabel }})
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>

    <!-- 質問追加/編集ダイアログ -->
    <Dialog v-model:open="showAddQuestionDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingQuestion ? '質問を編集' : '質問を追加' }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>質問文 *</Label>
            <Textarea v-model="newQuestion.question_text" rows="2" />
          </div>
          <div class="space-y-2">
            <Label>質問タイプ *</Label>
            <Select v-model="newQuestion.question_type">
              <SelectTrigger>
                <SelectValue placeholder="タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_choice">単一選択</SelectItem>
                <SelectItem value="multiple_choice">複数選択</SelectItem>
                <SelectItem value="free_text">自由記述</SelectItem>
                <SelectItem value="scale">スケール</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 選択肢 -->
          <div v-if="newQuestion.question_type === 'single_choice' || newQuestion.question_type === 'multiple_choice'" class="space-y-2">
            <Label>選択肢</Label>
            <div v-for="(choice, index) in newQuestion.choices" :key="index" class="flex gap-2">
              <Input v-model="newQuestion.choices[index]" />
              <Button variant="ghost" size="sm" @click="removeChoice(index)" v-if="newQuestion.choices.length > 2">
                <X class="size-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" @click="addChoice">
              <Plus class="size-4 mr-2" />
              選択肢を追加
            </Button>
          </div>

          <!-- スケール -->
          <div v-if="newQuestion.question_type === 'scale'" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>最小値</Label>
                <Input v-model.number="newQuestion.scale_min" type="number" min="1" max="10" />
              </div>
              <div class="space-y-2">
                <Label>最大値</Label>
                <Input v-model.number="newQuestion.scale_max" type="number" min="1" max="10" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>最小ラベル</Label>
                <Input v-model="newQuestion.scale_min_label" placeholder="例: 不満" />
              </div>
              <div class="space-y-2">
                <Label>最大ラベル</Label>
                <Input v-model="newQuestion.scale_max_label" placeholder="例: 満足" />
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <Switch v-model:checked="newQuestion.is_required" id="required" />
            <Label for="required">必須回答にする</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeQuestionDialog">キャンセル</Button>
          <Button @click="handleSaveQuestion">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 削除確認 -->
    <AlertDialog v-model:open="showDeleteQuestionDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>質問を削除しますか?</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。この質問への回答もすべて削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction @click="handleDeleteQuestion" class="bg-destructive hover:bg-destructive/90">
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LinkIcon, Plus, Edit, Trash2, X } from 'lucide-vue-next';
import DarkModeToggle from '@/components/common/DarkModeToggle.vue';
import { useSurveyStore } from '@/stores';
import { useToast } from '@/components/ui/toast';
import type { Question } from '@/services/surveys.service';

const router = useRouter();
const route = useRoute();
const surveyStore = useSurveyStore();
const { toast } = useToast();

const surveyId = route.params.id as string;
const survey = computed(() => surveyStore.currentSurvey);

const editingSurvey = ref({
  title: '',
  description: '',
  is_public: true
});

const showAddQuestionDialog = ref(false);
const showDeleteQuestionDialog = ref(false);
const editingQuestion = ref<Question | null>(null);
const deleteQuestionId = ref('');

const newQuestion = ref({
  question_text: '',
  question_type: 'single_choice' as 'single_choice' | 'multiple_choice' | 'free_text' | 'scale',
  is_required: false,
  choices: ['', ''],
  scale_min: 1,
  scale_max: 5,
  scale_min_label: '',
  scale_max_label: ''
});

onMounted(async () => {
  await surveyStore.fetchSurvey(surveyId);
  if (survey.value) {
    editingSurvey.value = {
      title: survey.value.title,
      description: survey.value.description || '',
      is_public: survey.value.is_public
    };
  }
});

const handleUpdateSurvey = async () => {
  try {
    await surveyStore.updateSurvey(surveyId, editingSurvey.value);
    toast({
      title: '保存しました',
      description: 'アンケート情報を更新しました'
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: '保存に失敗しました'
    });
  }
};

const addChoice = () => {
  newQuestion.value.choices.push('');
};

const removeChoice = (index: number) => {
  newQuestion.value.choices.splice(index, 1);
};

const editQuestion = (question: Question) => {
  editingQuestion.value = question;
  newQuestion.value = {
    question_text: question.question_text,
    question_type: question.question_type,
    is_required: question.is_required,
    choices: question.options?.choices || ['', ''],
    scale_min: question.scale_config?.min || 1,
    scale_max: question.scale_config?.max || 5,
    scale_min_label: question.scale_config?.minLabel || '',
    scale_max_label: question.scale_config?.maxLabel || ''
  };
  showAddQuestionDialog.value = true;
};

const closeQuestionDialog = () => {
  showAddQuestionDialog.value = false;
  editingQuestion.value = null;
  newQuestion.value = {
    question_text: '',
    question_type: 'single_choice',
    is_required: false,
    choices: ['', ''],
    scale_min: 1,
    scale_max: 5,
    scale_min_label: '',
    scale_max_label: ''
  };
};

const handleSaveQuestion = async () => {
  try {
    const data: any = {
      question_text: newQuestion.value.question_text,
      is_required: newQuestion.value.is_required
    };

    if (newQuestion.value.question_type === 'single_choice' || newQuestion.value.question_type === 'multiple_choice') {
      data.options = { choices: newQuestion.value.choices.filter(c => c.trim()) };
    } else if (newQuestion.value.question_type === 'scale') {
      data.scale_config = {
        min: newQuestion.value.scale_min,
        max: newQuestion.value.scale_max,
        minLabel: newQuestion.value.scale_min_label,
        maxLabel: newQuestion.value.scale_max_label
      };
    }

    if (editingQuestion.value) {
      await surveyStore.updateQuestion(surveyId, editingQuestion.value.id, data);
      toast({
        title: '更新しました',
        description: '質問を更新しました'
      });
    } else {
      data.question_type = newQuestion.value.question_type;
      data.order_index = survey.value?.questions.length || 0;
      await surveyStore.createQuestion(surveyId, data);
      toast({
        title: '追加しました',
        description: '質問を追加しました'
      });
    }

    closeQuestionDialog();
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: '保存に失敗しました'
    });
  }
};

const confirmDeleteQuestion = (questionId: string) => {
  deleteQuestionId.value = questionId;
  showDeleteQuestionDialog.value = true;
};

const handleDeleteQuestion = async () => {
  try {
    await surveyStore.deleteQuestion(surveyId, deleteQuestionId.value);
    showDeleteQuestionDialog.value = false;
    toast({
      title: '削除しました',
      description: '質問を削除しました'
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: '削除に失敗しました'
    });
  }
};

const copyPublicUrl = async () => {
  if (!survey.value) return;
  const url = `${window.location.origin}/answer/${survey.value.public_url}`;
  try {
    await navigator.clipboard.writeText(url);
    toast({
      title: 'コピーしました',
      description: '公開URLをクリップボードにコピーしました'
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: 'URLのコピーに失敗しました'
    });
  }
};

const getQuestionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    single_choice: '単一選択',
    multiple_choice: '複数選択',
    free_text: '自由記述',
    scale: 'スケール'
  };
  return labels[type] || type;
};
</script>
