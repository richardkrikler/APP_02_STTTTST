import { createApp } from 'vue'
import App from './App.vue'

import './index.css'

import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";
// Vue.component("v-select", vSelect);

createApp(App).component("v-select", vSelect).mount('#app')
