<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <header class="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex-between">
        <div class="flex items-center gap-6">
          <h1 class="text-2xl font-bold">かんたんアンケート</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-muted-foreground hidden sm:inline">
            {{ authStore.currentUser?.email }}
          </span>
          <DarkModeToggle />
          <Button variant="outline" @click="handleLogout" class="gap-2">
            <LogOut class="size-4" />
            <span class="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="container mx-auto px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- ヘッダーセクション -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold mb-2">アンケート一覧</h2>
          <p class="text-muted-foreground">
            作成したアンケートを管理できます
          </p>
        </div>

        <!-- アクションボタン -->
        <div class="flex flex-wrap gap-4 mb-8">
          <Button @click="showCreateDialog = true" class="gap-2">
            <Plus class="size-4" />
            白紙から作成
          </Button>
          <Button variant="outline" @click="showTemplateDialog = true" class="gap-2">
            <FileText class="size-4" />
            テンプレートから作成
          </Button>
        </div>

        <!-- エラー表示 -->
        <Alert v-if="surveyStore.error" variant="destructive" class="mb-6">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{{ surveyStore.error }}</AlertDescription>
        </Alert>

        <!-- ローディング -->
        <div v-if="surveyStore.isLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>

        <!-- アンケート一覧 -->
        <div v-else-if="surveyStore.surveys.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="survey in surveyStore.surveys" :key="survey.id" class="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <CardTitle class="line-clamp-2 mb-2">{{ survey.title }}</CardTitle>
                  <CardDescription class="line-clamp-2">
                    {{ survey.description || '説明なし' }}
                  </CardDescription>
                </div>
                <div class="ml-2">
                  <Badge :variant="survey.is_public ? 'default' : 'secondary'">
                    {{ survey.is_public ? '公開中' : '非公開' }}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <!-- 統計情報 -->
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <MessageSquare class="size-4" />
                    <span>{{ survey.response_count }}件の回答</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Calendar class="size-4" />
                    <span>{{ formatDate(survey.created_at) }}</span>
                  </div>
                </div>

                <!-- アクションボタン -->
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" @click="router.push(`/surveys/${survey.id}`)">
                    編集
                  </Button>
                  <Button variant="outline" size="sm" @click="router.push(`/surveys/${survey.id}/results`)">
                    結果
                  </Button>
                  <Button variant="outline" size="sm" @click="copyPublicUrl(survey.public_url)">
                    <LinkIcon class="size-4" />
                  </Button>
                  <Button variant="destructive" size="sm" @click="confirmDelete(survey.id, survey.title)">
                    <Trash2 class="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- 空の状態 -->
        <Card v-else class="p-12">
          <div class="text-center">
            <FileText class="size-16 mx-auto mb-4 text-muted-foreground" />
            <h3 class="text-xl font-semibold mb-2">アンケートがありません</h3>
            <p class="text-muted-foreground mb-6">
              新しいアンケートを作成して、回答を集めましょう
            </p>
            <div class="flex justify-center gap-4">
              <Button @click="showCreateDialog = true" class="gap-2">
                <Plus class="size-4" />
                白紙から作成
              </Button>
              <Button variant="outline" @click="showTemplateDialog = true" class="gap-2">
                <FileText class="size-4" />
                テンプレートから作成
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>

    <!-- 白紙作成ダイアログ -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいアンケートを作成</DialogTitle>
          <DialogDescription>
            タイトルと説明を入力してアンケートを作成します
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="title">タイトル *</Label>
            <Input id="title" v-model="newSurvey.title" placeholder="例: イベント出欠確認" />
          </div>
          <div class="space-y-2">
            <Label for="description">説明（任意）</Label>
            <Textarea id="description" v-model="newSurvey.description" placeholder="アンケートの説明を入力" rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">キャンセル</Button>
          <Button @click="handleCreateSurvey" :disabled="!newSurvey.title">作成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- テンプレート選択ダイアログ -->
    <Dialog v-model:open="showTemplateDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>テンプレートを選択</DialogTitle>
          <DialogDescription>
            用途に合わせたテンプレートを選んでアンケートを作成します
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <Card 
            v-for="template in templates" 
            :key="template.value"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="handleCreateFromTemplate(template.value)"
          >
            <CardHeader>
              <CardTitle class="text-lg">{{ template.title }}</CardTitle>
              <CardDescription>{{ template.description }}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 削除確認ダイアログ -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アンケートを削除しますか?</AlertDialogTitle>
          <AlertDialogDescription>
            「{{ deleteTarget.title }}」を削除します。この操作は取り消せません。
            すべての質問と回答も削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" class="bg-destructive hover:bg-destructive/90">
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, Plus, FileText, MessageSquare, Calendar, LinkIcon, Trash2, AlertCircle } from 'lucide-vue-next';
import DarkModeToggle from '@/components/common/DarkModeToggle.vue';
import { useAuthStore, useSurveyStore } from '@/stores';
import { useToast } from '@/components/ui/toast';
import type { SurveyTemplate } from '@/services/surveys.service';

const router = useRouter();
const authStore = useAuthStore();
const surveyStore = useSurveyStore();
const { toast } = useToast();

const showCreateDialog = ref(false);
const showTemplateDialog = ref(false);
const showDeleteDialog = ref(false);

const newSurvey = ref({
  title: '',
  description: ''
});

const deleteTarget = ref({
  id: '',
  title: ''
});

const templates = [
  {
    value: 'event_attendance' as SurveyTemplate,
    title: 'イベント出欠確認',
    description: '出欠、参加人数、コメントを確認'
  },
  {
    value: 'customer_satisfaction' as SurveyTemplate,
    title: '顧客満足度調査',
    description: '総合満足度、各項目評価、改善要望'
  },
  {
    value: 'course_evaluation' as SurveyTemplate,
    title: '授業・セミナー評価',
    description: '理解度、満足度、自由コメント'
  },
  {
    value: 'schedule_coordination' as SurveyTemplate,
    title: '日程調整',
    description: '候補日の選択、備考'
  },
  {
    value: 'opinion_poll' as SurveyTemplate,
    title: '意見募集',
    description: 'テーマへの賛否、理由、その他意見'
  }
];

onMounted(async () => {
  await surveyStore.fetchSurveys();
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const handleCreateSurvey = async () => {
  try {
    const survey = await surveyStore.createSurvey({
      title: newSurvey.value.title,
      description: newSurvey.value.description || undefined
    });
    showCreateDialog.value = false;
    newSurvey.value = { title: '', description: '' };
    toast({
      title: '作成しました',
      description: 'アンケートを作成しました'
    });
    router.push(`/surveys/${survey.id}`);
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: 'アンケートの作成に失敗しました'
    });
  }
};

const handleCreateFromTemplate = async (template: SurveyTemplate) => {
  try {
    const survey = await surveyStore.createSurveyFromTemplate(template);
    showTemplateDialog.value = false;
    toast({
      title: '作成しました',
      description: 'テンプレートからアンケートを作成しました'
    });
    router.push(`/surveys/${survey.id}`);
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: 'アンケートの作成に失敗しました'
    });
  }
};

const confirmDelete = (id: string, title: string) => {
  deleteTarget.value = { id, title };
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  try {
    await surveyStore.deleteSurvey(deleteTarget.value.id);
    showDeleteDialog.value = false;
    toast({
      title: '削除しました',
      description: 'アンケートを削除しました'
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'エラー',
      description: 'アンケートの削除に失敗しました'
    });
  }
};

const copyPublicUrl = async (publicUrl: string) => {
  const url = `${window.location.origin}/answer/${publicUrl}`;
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
};
</script>
