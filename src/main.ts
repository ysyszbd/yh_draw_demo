/*
 * @LastEditTime: 2024-04-07 13:58:13
 * @Description: 
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setRem } from '@/utils'

const app = createApp(App);
app.mount('#app');
setRem()