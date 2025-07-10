<script setup>

import BarChart from "@/components/BarChart.vue";
import MainHeader from "@/components/MainHeader.vue";
</script>

<template>
  <div>
    <MainHeader title="Аналитика"/>

    <div style="height: 50vh">
      <BarChart />
    </div>
  </div>
</template>