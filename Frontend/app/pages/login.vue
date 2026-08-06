<template>
  <UPageCard>
    <UAuthForm
      :schema="schema"
      title="Login"
      description="Enter your credentials to access your account."
      :fields="fields"
      @submit="onSubmit"
    />

    <div class="text-sm">
      Don't have an account?
      <NuxtLink to="/register" class="text-primary-500 hover:underline">
        Register here
      </NuxtLink>
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { definePageMeta } from "#imports";
import { useUserStore } from "~/stores/user";
import { navigateTo } from "#app";

definePageMeta({
  layout: "auth",
});

const userStore = useUserStore();
const toast = useToast();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "remember",
    label: "Remember me",
    type: "checkbox",
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  userStore
    .login(payload.data)
    .then(async (user) => {
      if (user) {
        await navigateTo("/dashboard");
        toast.add({
          title: "Signed in",
          description: `Welcome back, ${payload.data.email}`,
          color: "success",
        });
      }
    })
    .catch((error) => {
      toast.add({
        title: "Login failed",
        description: error.message || "An error occurred during login.",
        color: "error",
      });
    });
}
</script>
