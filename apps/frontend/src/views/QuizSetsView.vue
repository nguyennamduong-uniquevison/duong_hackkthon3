<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <header class="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex-between">
        <div class="flex items-center gap-6">
          <h1 class="text-2xl font-bold">サンプルシステム</h1>
          <nav class="hidden sm:flex items-center gap-1">
            <Button variant="default" size="sm" class="gap-2">
              <FileQuestion class="size-4" />
              クイズ
            </Button>
            <Button variant="ghost" size="sm" class="gap-2" @click="router.push('/images')">
              <ImageIcon class="size-4" />
              画像
            </Button>
          </nav>
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
        <!-- Header -->
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold">クイズセット一覧</h3>
            <p class="text-sm text-muted-foreground mt-1">
          学習用のクイズセットを管理します
        </p>
      </div>
      
      <Button @click="openCreateDialog" class="w-full md:w-auto">
        <Plus class="mr-2 h-4 w-4" />
        クイズセット追加
      </Button>
    </div>

    <!-- Category Filter -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="cat in categories"
          :key="cat.value"
          :variant="filterCategory === cat.value ? 'default' : 'outline'"
          size="sm"
          @click="setFilter(cat.value)"
        >
          {{ cat.label }}
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Error Message -->
    <ErrorMessage v-else-if="error" :message="error" @close="clearError" />

    <!-- Quiz Sets Grid -->
    <div v-else-if="filteredQuizSets.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="quizSet in filteredQuizSets"
        :key="quizSet.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewQuizSet(quizSet)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <CardTitle class="text-lg">{{ quizSet.title }}</CardTitle>
              <div class="flex items-center gap-2 mt-2">
                <Badge v-if="quizSet.category" variant="secondary" class="text-xs">
                  {{ getCategoryLabel(quizSet.category) }}
                </Badge>
                <Badge v-if="!quizSet.is_public" variant="outline" class="text-xs">
                  <Lock class="h-3 w-3 mr-1" />
                  非公開
                </Badge>
              </div>
            </div>
            
            <!-- Actions Buttons (only for creator) -->
            <div v-if="isCreator(quizSet)" class="flex gap-1" @click.stop>
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="openEditDialog(quizSet)" title="編集">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="togglePublicStatus(quizSet)" :title="quizSet.is_public ? '非公開にする' : '公開する'">
                <Eye class="h-4 w-4" v-if="!quizSet.is_public" />
                <EyeOff class="h-4 w-4" v-else />
              </Button>
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive" @click="confirmDelete(quizSet)" title="削除">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p v-if="quizSet.description" class="text-sm text-muted-foreground line-clamp-2 mb-4">
            {{ quizSet.description }}
          </p>
          
          <div class="flex flex-col gap-2 text-sm">
            <div class="flex items-center gap-2">
              <User class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">{{ quizSet.creator_name }}</span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <FileQuestion class="h-4 w-4 text-muted-foreground" />
                <span>{{ quizSet.question_count }} 問</span>
              </div>
              
              <div class="flex items-center gap-1">
                <Users class="h-4 w-4 text-muted-foreground" />
                <span>{{ quizSet.participant_count }} 人</span>
              </div>
              
              <div v-if="quizSet.average_rating" class="flex items-center gap-1">
                <Star class="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{{ quizSet.average_rating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else class="p-12">
      <div class="text-center">
        <FileQuestion class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">クイズセットがありません</h3>
        <p class="text-sm text-muted-foreground mb-4">
          {{ filterCategory === 'all' 
            ? '新しいクイズセットを作成してください' 
            : 'このカテゴリーにはクイズセットがありません' 
          }}
        </p>
        <Button @click="openCreateDialog" v-if="filterCategory === 'all'">
          <Plus class="mr-2 h-4 w-4" />
          クイズセット追加
        </Button>
      </div>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editingQuizSet ? 'クイズセット編集' : '新しいクイズセット' }}
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="title">タイトル *</Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="クイズセットのタイトル"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="description">説明</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="クイズセットの説明（任意）"
              rows="3"
            />
          </div>

          <div class="space-y-2">
            <Label for="category">カテゴリー</Label>
            <Select v-model="formData.category">
              <SelectTrigger>
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cat in categoryOptions"
                  :key="cat.value"
                  :value="cat.value"
                >
                  {{ cat.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeDialog">
            キャンセル
          </Button>
          <Button 
            @click="saveQuizSet" 
            :disabled="!formData.title || loading"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ editingQuizSet ? '更新' : '作成' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>クイズセットを削除しますか？</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-muted-foreground">
            この操作は取り消せません。クイズセット「{{ deletingQuizSet?.title }}」とすべての関連する質問が完全に削除されます。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false">
            キャンセル
          </Button>
          <Button
            variant="destructive"
            @click="handleDelete"
          >
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  FileQuestion,
  User,
  Users,
  Star,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  ImageIcon as ImageIconImport
} from 'lucide-vue-next';
import DarkModeToggle from '@/components/common/DarkModeToggle.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { useQuizSetsStore, useAuthStore } from '@/stores';
import type { QuizSet, QuizCategory } from '@/types';

const ImageIcon = ImageIconImport;

const router = useRouter();
const quizSetsStore = useQuizSetsStore();
const authStore = useAuthStore();

// State
const isDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const editingQuizSet = ref<QuizSet | null>(null);
const deletingQuizSet = ref<QuizSet | null>(null);
const formData = ref({
  title: '',
  description: '',
  category: '' as QuizCategory | ''
});

// Computed
const loading = computed(() => quizSetsStore.loading);
const error = computed(() => quizSetsStore.error);
const filterCategory = computed(() => quizSetsStore.filterCategory);
const filteredQuizSets = computed(() => quizSetsStore.getFilteredQuizSets());
const currentUserId = computed(() => authStore.currentUser?.id);

// Category definitions
const categoryOptions: { value: QuizCategory; label: string }[] = [
  { value: 'general', label: '一般知識' },
  { value: 'science', label: '科学' },
  { value: 'history', label: '歴史' },
  { value: 'geography', label: '地理' },
  { value: 'sports', label: 'スポーツ' },
  { value: 'entertainment', label: 'エンターテイメント' },
  { value: 'technology', label: 'テクノロジー' },
  { value: 'other', label: 'その他' },
];

const categories = [
  { value: 'all' as const, label: 'すべて' },
  ...categoryOptions
];

// Methods
function getCategoryLabel(category: QuizCategory): string {
  return categoryOptions.find(c => c.value === category)?.label || category;
}

function isCreator(quizSet: QuizSet): boolean {
  return quizSet.creator_id === currentUserId.value;
}

function setFilter(category: QuizCategory | 'all'): void {
  quizSetsStore.setFilterCategory(category);
}

function viewQuizSet(quizSet: QuizSet): void {
  router.push(`/quiz-sets/${quizSet.id}`);
}

function openCreateDialog(): void {
  editingQuizSet.value = null;
  formData.value = {
    title: '',
    description: '',
    category: ''
  };
  isDialogOpen.value = true;
}

function openEditDialog(quizSet: QuizSet): void {
  editingQuizSet.value = quizSet;
  formData.value = {
    title: quizSet.title,
    description: quizSet.description || '',
    category: quizSet.category || ''
  };
  isDialogOpen.value = true;
}

function closeDialog(): void {
  isDialogOpen.value = false;
  editingQuizSet.value = null;
  formData.value = {
    title: '',
    description: '',
    category: ''
  };
}

async function saveQuizSet(): Promise<void> {
  if (!formData.value.title) return;

  const input = {
    title: formData.value.title,
    description: formData.value.description || undefined,
    category: formData.value.category || undefined
  };

  let success = false;

  if (editingQuizSet.value) {
    success = await quizSetsStore.updateQuizSet(editingQuizSet.value.id, input);
  } else {
    const result = await quizSetsStore.createQuizSet(input);
    success = result !== null;
  }

  if (success) {
    closeDialog();
  }
}

function confirmDelete(quizSet: QuizSet): void {
  deletingQuizSet.value = quizSet;
  isDeleteDialogOpen.value = true;
}

async function handleDelete(): Promise<void> {
  if (!deletingQuizSet.value) return;

  const success = await quizSetsStore.deleteQuizSet(deletingQuizSet.value.id);
  
  if (success) {
    isDeleteDialogOpen.value = false;
    deletingQuizSet.value = null;
  }
}

async function togglePublicStatus(quizSet: QuizSet): Promise<void> {
  await quizSetsStore.togglePublic(quizSet.id, !quizSet.is_public);
}

function clearError(): void {
  quizSetsStore.clearError();
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  router.push('/login');
}

// Lifecycle
onMounted(() => {
  quizSetsStore.fetchQuizSets();
});
</script>
