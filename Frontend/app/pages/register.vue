<template>
  <UPageCard>
    <UAuthForm
      :schema="schema"
      title="Register"
      description="Create an account to start tracking your finances."
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
import { useUserStore } from "~/stores/user";
import { navigateTo } from "#app";

definePageMeta({
  layout: "auth",
});

const userStore = useUserStore();
const toast = useToast();

const fields = <AuthFormField[]>[
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
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm your password",
    required: true,
  },
];

const schema = z
  .object({
    email: z.email("Invalid email"),
    password: z
      .string("Password is required")
      .min(8, "Must be at least 8 characters"),
    confirmPassword: z.string("Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  userStore
    .register(payload.data)
    .then(async (user) => {
      if (user) {
        await navigateTo("/home");
        toast.add({
          title: "Account registered",
          description: `Welcome, ${payload.data.email}`,
          color: "success",
        });
      }
    })
    .catch((error) => {
      toast.add({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        color: "error",
      });
    });
}
</script>
