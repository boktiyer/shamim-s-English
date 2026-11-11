import type { AdminCourse } from "@/lib/admin/data";
import { Checkbox, Field, Select, TextArea, TextInput, categoryOptions, courseStatusOptions } from "@/components/admin/fields";

/** Shared fields for the create and edit course forms. */
export function CourseFields({ course }: { course?: AdminCourse }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {course && <input type="hidden" name="id" value={course.id} />}
      <Field label="Title" className="sm:col-span-2">
        <TextInput name="title" defaultValue={course?.title} required placeholder="HSC 2028 Regular Batch" />
      </Field>
      <Field label="Subtitle" className="sm:col-span-2">
        <TextInput name="subtitle" defaultValue={course?.subtitle ?? ""} placeholder="Short one-line summary" />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue={course?.category ?? "hsc_1st"} options={categoryOptions} />
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={course?.status ?? "draft"} options={courseStatusOptions} />
      </Field>
      <Field label="Price (৳)">
        <TextInput name="price" type="number" min={0} step="1" defaultValue={course?.price ?? 0} />
      </Field>
      <Field label="Original price (৳, optional)">
        <TextInput name="original_price" type="number" min={0} step="1" defaultValue={course?.original_price ?? ""} />
      </Field>
      <Field label="Duration (weeks)">
        <TextInput name="duration_weeks" type="number" min={1} defaultValue={course?.duration_weeks ?? ""} />
      </Field>
      <Field label="URL slug (optional)">
        <TextInput name="slug" defaultValue={course?.slug ?? ""} placeholder="made from the title" />
      </Field>
      <Field label="Thumbnail image URL (optional)" className="sm:col-span-2">
        <TextInput name="thumbnail_url" type="url" defaultValue={course?.thumbnail_url ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <TextArea name="description" defaultValue={course?.description ?? ""} />
      </Field>
      <Checkbox name="is_featured" label="Featured course" defaultChecked={course?.is_featured} />
    </div>
  );
}
