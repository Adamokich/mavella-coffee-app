import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { registerSW } from 'virtual:pwa-register';

import App from '@/app/App.vue';
import { router } from '@/app/router';
import '@/app/styles.css';

const splash = document.getElementById('app-splash');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const splashAnimationStartedAt = Number(splash?.dataset.animationStartedAt ?? performance.now());
const splashAnimationDuration = reducedMotion
  ? 0
  : Math.max(0, 2500 - (performance.now() - splashAnimationStartedAt));
let isSplashRemoved = false;

function removeSplash() {
  if (!splash || isSplashRemoved) {
    return;
  }

  isSplashRemoved = true;
  splash.classList.add('app-splash--leaving');
  window.setTimeout(() => splash.remove(), reducedMotion ? 0 : 180);
}

const splashFallbackTimeout = window.setTimeout(removeSplash, 3500);

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount('#app');

void Promise.all([
  router.isReady(),
  new Promise((resolve) => window.setTimeout(resolve, splashAnimationDuration)),
]).then(() => {
  window.clearTimeout(splashFallbackTimeout);
  removeSplash();
});

registerSW({ immediate: true });
