<template>
  <div class="app-shell min-vh-100 flex flex-column">
    <header class="bb b--black-10 pa3 flex items-center justify-between">
      <NuxtLink to="/home" class="link dim near-black f4 b">
        Finance Tracker
      </NuxtLink>
    </header>

    <UMain class="flex-auto">
      <slot />
    </UMain>
  </div>
</template>
