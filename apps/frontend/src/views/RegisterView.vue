<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- ヘッダー -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold">新規登録</h1>
        <p class="text-muted-foreground">
          アカウント情報を入力してください
        </p>
      </div>

      <!-- 登録フォーム -->
      <Card>
        <CardHeader>
          <CardTitle>新規アカウント作成</CardTitle>
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
                placeholder="お名前を入力" 
                required 
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-200': nameError && nameTouched,
                  'border-green-500 focus:border-green-500 focus:ring-green-200': isNameValid && nameTouched
                }"
                @blur="nameTouched = true"
                @input="nameTouched = true"
              />
              <p v-if="nameError && nameTouched" class="text-sm text-red-600 dark:text-red-400 mt-1">
                {{ nameError }}
              </p>
            </div>

            <div class="space-y-2">
              <Label for="email">メールアドレス</Label>
              <Input 
                id="email" 
                v-model="email" 
                type="email" 
                placeholder="メールアドレスを入力" 
                required 
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-200': emailError && emailTouched,
                  'border-green-500 focus:border-green-500 focus:ring-green-200': isEmailValid && emailTouched
                }"
                @blur="emailTouched = true"
                @input="emailTouched = true"
              />
              <p v-if="emailError && emailTouched" class="text-sm text-red-600 dark:text-red-400 mt-1">
                {{ emailError }}
              </p>
            </div>

            <div class="space-y-2">
              <Label for="password">パスワード</Label>
              <Input 
                id="password" 
                v-model="password" 
                type="password" 
                placeholder="パスワードを入力（6文字以上）" 
                required 
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-200': passwordError && passwordTouched,
                  'border-green-500 focus:border-green-500 focus:ring-green-200': isPasswordValid && passwordTouched
                }"
                @blur="passwordTouched = true"
                @input="passwordTouched = true"
              />
              <p v-if="passwordError && passwordTouched" class="text-sm text-red-600 dark:text-red-400 mt-1">
                {{ passwordError }}
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
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-200': confirmPasswordError && confirmPasswordTouched,
                  'border-green-500 focus:border-green-500 focus:ring-green-200': isPasswordConfirmed && confirmPasswordTouched
                }"
                @blur="confirmPasswordTouched = true"
                @input="confirmPasswordTouched = true"
              />
              <p v-if="confirmPasswordError && confirmPasswordTouched" class="text-sm text-red-600 dark:text-red-400 mt-1">
                {{ confirmPasswordError }}
              </p>
            </div>

            <Button type="submit" class="w-full" :disabled="!isFormValid || loading">
              <template v-if="loading">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </template>
              <template v-else>
                アカウント作成
              </template>
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- ログインリンク -->
      <div class="text-center">
        <p class="text-sm text-muted-foreground">
          すでにアカウントをお持ちですか？
          <Button variant="link" class="p-0 h-auto font-medium text-primary" @click="goToLogin">
            ログイン
          </Button>
        </p>
      </div>
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

// バリデーション状態
const nameTouched = ref(false);
const emailTouched = ref(false);
const passwordTouched = ref(false);
const confirmPasswordTouched = ref(false);

// バリデーション
const isNameValid = computed(() => name.value.trim().length > 0);
const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
);
const isPasswordValid = computed(() => password.value.length >= 6);
const isPasswordConfirmed = computed(() => 
  password.value === confirmPassword.value && confirmPassword.value.length > 0
);
const isFormValid = computed(() => 
  isNameValid.value && 
  isEmailValid.value && 
  isPasswordValid.value && 
  isPasswordConfirmed.value
);

// バリデーションエラーメッセージ
const nameError = computed(() => {
  if (!nameTouched.value) return '';
  if (name.value.trim().length === 0) return 'お名前を入力してください';
  return '';
});

const emailError = computed(() => {
  if (!emailTouched.value) return '';
  if (email.value.length === 0) return 'メールアドレスを入力してください';
  if (!isEmailValid.value) return '有効なメールアドレス形式で入力してください';
  return '';
});

const passwordError = computed(() => {
  if (!passwordTouched.value) return '';
  if (password.value.length === 0) return 'パスワードを入力してください';
  if (!isPasswordValid.value) return 'パスワードは6文字以上で入力してください';
  return '';
});

const confirmPasswordError = computed(() => {
  if (!confirmPasswordTouched.value) return '';
  if (confirmPassword.value.length === 0) return 'パスワード確認を入力してください';
  if (password.value !== confirmPassword.value) return 'パスワードが一致しません';
  return '';
});

// フォーム送信処理
const handleSubmit = async () => {
  // すべてのフィールドをtouchedにしてバリデーションエラーを表示
  nameTouched.value = true;
  emailTouched.value = true;
  passwordTouched.value = true;
  confirmPasswordTouched.value = true;
  
  if (!isFormValid.value) {
    error.value = '入力内容に誤りがあります。赤字のエラーメッセージをご確認ください。';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const success = await authStore.register({
      name: name.value.trim(),
      email: email.value,
      password: password.value
    });

    if (success) {
      // 登録成功時はログイン画面にリダイレクトして成功メッセージを表示
      router.push('/login?registered=true');
    } else {
      const authError = authStore.error || '登録に失敗しました。';
      if (authError.includes('email') || authError.includes('メール')) {
        error.value = 'このメールアドレスはすでに使用されています。';
      } else {
        error.value = '登録に失敗しました。入力内容を確認してください。';
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('409')) {
      error.value = 'このメールアドレスはすでに使用されています。';
    } else {
      error.value = '登録処理中にエラーが発生しました。しばらくしてから再試行してください。';
    }
  } finally {
    loading.value = false;
  }
};

/**
 * ログイン画面に遷移
 */
const goToLogin = () => {
  router.push('/login');
};
</script>