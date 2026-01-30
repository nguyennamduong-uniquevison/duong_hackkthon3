import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores';

// 遅延読み込みコンポーネント（Webpackマジックコメント付き）
const LoginView = () => import(
  /* webpackChunkName: "login" */
  /* webpackPrefetch: true */
  '@/views/LoginView.vue'
);

const RegisterView = () => import(
  /* webpackChunkName: "register" */
  /* webpackPrefetch: true */
  '@/views/RegisterView.vue'
);

const SurveysView = () => import(
  /* webpackChunkName: "surveys" */
  /* webpackPrefetch: true */
  '@/views/SurveysView.vue'
);

const SurveyEditView = () => import(
  /* webpackChunkName: "survey-edit" */
  '@/views/SurveyEditView.vue'
);

const SurveyResultsView = () => import(
  /* webpackChunkName: "survey-results" */
  '@/views/SurveyResultsView.vue'
);

const AnswerSurveyView = () => import(
  /* webpackChunkName: "answer-survey" */
  '@/views/AnswerSurveyView.vue'
);

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresGuest: true,
      title: 'ログイン'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: {
      requiresGuest: true,
      title: '新規登録'
    }
  },
  {
    path: '/surveys',
    name: 'Surveys',
    component: SurveysView,
    meta: {
      requiresAuth: true,
      title: 'アンケート一覧'
    }
  },
  {
    path: '/surveys/:id',
    name: 'SurveyEdit',
    component: SurveyEditView,
    meta: {
      requiresAuth: true,
      title: 'アンケート編集'
    }
  },
  {
    path: '/surveys/:id/results',
    name: 'SurveyResults',
    component: SurveyResultsView,
    meta: {
      requiresAuth: true,
      title: '回答結果'
    }
  },
  {
    path: '/answer/:publicUrl',
    name: 'AnswerSurvey',
    component: AnswerSurveyView,
    meta: {
      title: 'アンケート回答'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // スクロール動作の最適化
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  }
});

// ナビゲーションガード
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // 認証状態の復元が完了するまで待機
  if (!authStore.isInitialized) {
    await authStore.restoreAuthState();
  }

  const isLoggedIn = authStore.isLoggedIn;


  // 認証が必要なルートのガード
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login');
    return;
  }

  // ゲスト専用ルートのガード（ログイン済みユーザーがログインページにアクセスするのを防ぐ）
  if (to.meta.requiresGuest && isLoggedIn) {
    next('/surveys');
    return;
  }

  // ページタイトルの設定
  if (to.meta.title) {
    document.title = `${ to.meta.title } - かんたんアンケート`;
  } else {
    document.title = 'かんたんアンケート';
  }

  next();
});

export default router;