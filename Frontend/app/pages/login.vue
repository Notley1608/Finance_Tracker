<template>
  <UPageCard>
    <UAuthForm
      :schema="schema"
      title="Login"
      description="Enter your credentials to access your account."
      :fields="fields"
      @submit="onSubmit"
    />
  </UPageCard>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { definePageMeta } from "#imports";

definePageMeta({
  layout: "auth",
});

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

function onSubmit(payload: FormSubmitEvent<Schema>) {
  toast.add({
    title: "Signed in",
    description: `Welcome back, ${payload.data.email}`,
    color: "success",
  });
}
</script>
