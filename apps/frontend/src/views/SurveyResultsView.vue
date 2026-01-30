<template>
  <div class="min-h-screen bg-background">
    <header class="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex-between">
        <div class="flex items-center gap-6">
          <Button variant="ghost" size="sm" @click="router.push('/surveys')">
            <ArrowLeft class="size-4" />
          </Button>
          <h1 class="text-2xl font-bold">回答結果</h1>
        </div>
        <DarkModeToggle />
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div v-if="surveyStore.isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="stats" class="max-w-6xl mx-auto space-y-6">
        <!-- サマリー -->
        <Card>
          <CardHeader>
            <CardTitle>{{ survey?.title }}</CardTitle>
            <CardDescription>総回答数: {{ stats.total_responses }}件</CardDescription>
          </CardHeader>
        </Card>

        <!-- 質問別統計 -->
        <div v-for="questionStat in stats.questions" :key="questionStat.question_id" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">{{ questionStat.question_text }}</CardTitle>
              <CardDescription>回答数: {{ questionStat.total_responses }}件</CardDescription>
            </CardHeader>
            <CardContent>
              <!-- 選択肢の統計 -->
              <div v-if="questionStat.choice_stats" class="space-y-2">
                <div v-for="(count, choice) in questionStat.choice_stats" :key="choice" class="flex items-center gap-4">
                  <div class="w-32 text-sm">{{ choice }}</div>
                  <div class="flex-1">
                    <div class="bg-primary/20 rounded-full h-8 flex items-center px-3">
                      <div 
                        class="bg-primary rounded-full h-6 flex items-center justify-center text-xs text-primary-foreground px-2"
                        :style="{width: `${(count / questionStat.total_responses) * 100}%`}"
                      >
                        {{ count }}
                      </div>
                    </div>
                  </div>
                  <div class="w-16 text-sm text-right">{{ ((count / questionStat.total_responses) * 100).toFixed(1) }}%</div>
                </div>
              </div>

              <!-- スケールの統計 -->
              <div v-if="questionStat.scale_stats" class="space-y-4">
                <div class="text-center">
                  <div class="text-3xl font-bold">{{ questionStat.scale_stats.average?.toFixed(2) }}</div>
                  <div class="text-sm text-muted-foreground">平均値</div>
                </div>
                <div v-if="questionStat.scale_stats.distribution" class="space-y-2">
                  <div v-for="(count, value) in questionStat.scale_stats.distribution" :key="value" class="flex items-center gap-4">
                    <div class="w-16 text-sm">{{ value }}</div>
                    <div class="flex-1">
                      <div class="bg-primary/20 rounded-full h-8 flex items-center px-3">
                        <div 
                          class="bg-primary rounded-full h-6 flex items-center justify-center text-xs text-primary-foreground px-2"
                          :style="{width: `${(count / questionStat.total_responses) * 100}%`}"
                        >
                          {{ count }}
                        </div>
                      </div>
                    </div>
                    <div class="w-16 text-sm text-right">{{ ((count / questionStat.total_responses) * 100).toFixed(1) }}%</div>
                  </div>
                </div>
              </div>

              <!-- 自由記述 -->
              <div v-if="questionStat.text_responses && questionStat.text_responses.length > 0" class="space-y-2">
                <div v-for="(text, index) in questionStat.text_responses" :key="index" class="p-3 bg-muted rounded-md text-sm">
                  {{ text }}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-vue-next';
import DarkModeToggle from '@/components/common/DarkModeToggle.vue';
import { useSurveyStore } from '@/stores';

const router = useRouter();
const route = useRoute();
const surveyStore = useSurveyStore();

const surveyId = route.params.id as string;
const survey = computed(() => surveyStore.currentSurvey);
const stats = computed(() => surveyStore.currentSurveyStats);

onMounted(async () => {
  await surveyStore.fetchSurvey(surveyId);
  await surveyStore.fetchSurveyStats(surveyId);
});
</script>
