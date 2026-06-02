import { useState, type ChangeEvent, type FormEvent } from 'react';

interface Errors {
  [key: string]: string | undefined;
}

type ValidateFn<T> = (values: T) => Errors;

export function useForm<T extends Record<string, any>>(
  initialValues: T = {} as T,
  validate: ValidateFn<T> | null = null
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setValues((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = (newValues?: T) => {
    setValues(newValues ?? initialValues);
    setErrors({});
  };

  const handleSubmit = (onSubmit: (values: T) => Promise<void>) => async (e: FormEvent) => {
    e.preventDefault();
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }
    setErrors({});
    await onSubmit(values);
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    resetForm,
    setValues,
  };
}
