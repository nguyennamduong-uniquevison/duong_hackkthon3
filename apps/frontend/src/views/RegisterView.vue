<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- ヘッダー -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold">サンプルシステム</h1>
        <p class="text-muted-foreground">
          アカウントを作成してシステムを利用開始
        </p>
      </div>

      <!-- 登録フォーム -->
      <Card>
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage v-if="error" :message="error" @close="error = ''" />

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="space-y-2">
              <Label for="name">お名前</Label>
              <Input 
                id="name" 
                v-model="name" 
                type="text" 
                placeholder="山田 太郎" 
                required 
              />
              <p v-if="name && !isNameValid" class="text-sm text-destructive">
                名前は2文字以上で入力してください
              </p>
            </div>

            <div class="space-y-2">
              <Label for="email">メールアドレス</Label>
              <Input 
                id="email" 
                v-model="email" 
                type="email" 
                placeholder="example@email.com" 
                required 
              />
              <p v-if="email && !isEmailValid" class="text-sm text-destructive">
                有効なメールアドレスを入力してください
              </p>
            </div>

            <div class="space-y-2">
              <Label for="password">パスワード</Label>
              <Input 
                id="password" 
                v-model="password" 
                type="password" 
                placeholder="6文字以上のパスワード" 
                required 
              />
              <p v-if="password && !isPasswordValid" class="text-sm text-destructive">
                パスワードは6文字以上で入力してください
              </p>
            </div>

            <div class="space-y-2">
              <Label for="confirmPassword">パスワード確認</Label>
              <Input 
                id="confirmPassword" 
                v-model="confirmPassword" 
                type="password" 
                placeholder="パスワードを再入力" 
                required 
              />
              <p v-if="confirmPassword && !isPasswordMatch" class="text-sm text-destructive">
                パスワードが一致しません
              </p>
            </div>

            <Button 
              type="submit" 
              class="w-full" 
              :disabled="!isFormValid || loading"
            >
              <template v-if="loading">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </template>
              <template v-else>
                アカウント作成
              </template>
            </Button>
          </form>

          <!-- ログインリンク -->
          <div class="mt-6 text-center">
            <p class="text-sm text-muted-foreground">
              既にアカウントをお持ちですか？
              <router-link 
                to="/login" 
                class="text-primary hover:underline font-medium"
              >
                ログイン
              </router-link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-vue-next';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

// フォームの状態
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

// バリデーション
const isNameValid = computed(() => name.value.length >= 2);
const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
);
const isPasswordValid = computed(() => password.value.length >= 6);
const isPasswordMatch = computed(() => 
  password.value === confirmPassword.value
);
const isFormValid = computed(() => 
  isNameValid.value && 
  isEmailValid.value && 
  isPasswordValid.value && 
  isPasswordMatch.value
);

// フォーム送信処理
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    const success = await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value
    });

    if (success) {
      // 登録成功時はクイズセット管理画面にリダイレクト
      name.value = '';
      email.value = '';
      password.value = '';
      confirmPassword.value = '';
      router.push('/quiz-sets');
    } else {
      error.value = authStore.error || '登録に失敗しました。もう一度お試しください。';
    }
  } catch (err: any) {
    if (err.message?.includes('already registered')) {
      error.value = 'このメールアドレスは既に登録されています。';
    } else {
      error.value = '登録に失敗しました。もう一度お試しください。';
    }
  } finally {
    loading.value = false;
  }
};
</script>
