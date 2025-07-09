import { createRouter, createWebHistory } from 'vue-router'

import MainView from '../views/MainView.vue'
import AddRecordView from '../views/add-record/AddRecordView.vue'
import WalletView from '../views/wallet/WalletView.vue'
import HistoryView from '../views/HistoryView.vue'
import AddRecordLayout from "../views/add-record/AddRecordLayout.vue";
import WalletLayout from "../views/wallet/WalletLayout.vue";
import AddWallet from "../views/wallet/AddWallet.vue";
import AddTransactionView from "../views/add-record/AddTransactionView.vue";
import SettingsView from "../views/settings/SettingsView.vue";
import AnalyticsView from "../views/AnalyticsView.vue";
import SettingsLayout from "../views/settings/SettingsLayout.vue";
import CategoriesView from "@/views/settings/CategoriesView.vue";

const routes = [
  {
    path: '/',
    component: MainView,
    meta: {
      hideNav: true
    }
  },
  {
    path: '/add-record',
    component: AddRecordLayout,
    children: [
      { path: '', component: AddRecordView },
      {
        path: 'add-transaction/:type',
        name: 'AddTransaction',
        component: AddTransactionView
      }
    ]
  },
  {
    path: '/wallet',
    component: WalletLayout,
    children: [
      { path: '', component: WalletView },
      { path: 'add-wallet', component: AddWallet }
    ]
  },
  { path: '/history', component: HistoryView },
  {
    path: '/settings',
    component: SettingsLayout,
    children: [
      { path: '', component: SettingsView },
      {
        path: '/categories/:type',
        name: 'CategoriesByType',
        component: CategoriesView,
        props: true,
      }
    ]
  },
  { path: '/analytics', component: AnalyticsView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router