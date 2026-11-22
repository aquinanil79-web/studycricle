"use client";

import { ActionForm, SelectField, TextAreaField, TextField } from "@/components/ui/action-form";
import { ImageUpload } from "@/components/ui/file-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProfile } from "@/lib/actions/profile";
import { DEPARTMENTS, YEARS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

/** Edit form for the signed-in user's own profile. Field names match profileSchema in lib/validation.ts. */
export function ProfileForm({ profile }: { profile: Profile }) {
  return (
    <ActionForm action={updateProfile} className="space-y-5 p-5 sm:p-6">
      {/* The avatars storage policy only allows uploads into a folder named after the user's id. */}
      <ImageUpload
        name="avatar_url"
        label="Profile photo"
        bucket="avatars"
        folder={profile.id}
        shape="round"
        defaultValue={profile.avatar_url}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Full name"
          name="full_name"
          defaultValue={profile.full_name}
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
        />
        {/* Disabled inputs are not submitted, and the email column is not updatable anyway (schema.sql grants). */}
        <TextField
          label="Email"
          name="email"
          type="email"
          defaultValue={profile.email}
          disabled
          hint="This is your login, so it cannot be changed here."
        />
        <TextField
          label="Student ID"
          name="student_id"
          defaultValue={profile.student_id ?? ""}
          required
          pattern="[A-Za-z0-9]{4,15}"
          title="4-15 letters or digits"
          maxLength={15}
          className="uppercase"
        />
        <SelectField
          label="Year"
          name="year"
          options={YEARS}
          placeholder="Not applicable (staff)"
          defaultValue={profile.year ?? ""}
        />
      </div>

      <SelectField
        label="Department"
        name="department"
        options={DEPARTMENTS}
        placeholder="Select your department"
        defaultValue={profile.department ?? ""}
        required
      />
      <TextAreaField
        label="Bio"
        name="bio"
        defaultValue={profile.bio ?? ""}
        maxLength={500}
        placeholder="Your interests, skills or what you would like to learn."
        hint="Optional, up to 500 characters."
      />

      <div className="flex justify-end border-t border-line pt-5">
        <SubmitButton>Save changes</SubmitButton>
      </div>
    </ActionForm>
  );
}
