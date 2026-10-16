import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, postJson } from '../lib/api';
import { reviewSchema, type ReviewFormData } from '../schemas/reviewSchema';
import {
  ACCENT,
  BORDER,
  BRAND,
  CARD,
  DANGER,
  FOCUS,
  MUTED,
  PRIMARY_BUTTON,
  STAR_OFF,
  STAR_ON,
  SUBTLE,
} from '../lib/theme';

const STAR_PATH =
  'm23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z';

const COMMENT_MAX = 240;
const TITLE_MAX = 50;

interface ReviewFormProps {
  sku: string;
  onCreated: () => void;
}

const FIELD = `w-full rounded-md border ${BORDER} ${CARD} ${BRAND} px-3 py-2 text-sm ${FOCUS}`;

export default function ReviewForm({ sku, onCreated }: ReviewFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { sku, rating: 0, title: '', comment: '' },
  });

  const rating = watch('rating');
  const comment = watch('comment');

  const onSubmit = async (data: ReviewFormData) => {
    setSubmitError(null);

    try {
      await postJson('/api/reviews', data);
      reset({ sku, rating: 0, title: '', comment: '' });
      onCreated();
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      console.error('Falha ao enviar a avaliação:', error);
      setSubmitError('Não foi possível enviar sua avaliação. Tente novamente.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`rounded-lg border ${BORDER} ${CARD} p-6`}
      noValidate
    >
      <h3 className={`text-base font-semibold ${BRAND}`}>Avaliar este produto</h3>

      <input type="hidden" {...register('sku')} />

      <fieldset className="mt-4">
        <legend className={`text-sm font-medium ${MUTED}`}>Sua nota</legend>

        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={`cursor-pointer p-1 rounded ${FOCUS}`}
              title={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
            >
              <input
                type="radio"
                value={value}
                checked={rating === value}
                onChange={() => setValue('rating', value, { shouldValidate: true })}
                className={`sr-only ${ACCENT}`}
                name="rating-visual"
              />
              <span className="sr-only">
                {value} {value === 1 ? 'estrela' : 'estrelas'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`size-6 ${value <= rating ? STAR_ON : STAR_OFF}`}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d={STAR_PATH} />
              </svg>
            </label>
          ))}
        </div>

        {errors.rating && <p className={`mt-2 text-sm ${DANGER}`}>{errors.rating.message}</p>}
      </fieldset>

      <div className="mt-4">
        <label htmlFor="review-title" className={`block text-sm font-medium ${MUTED}`}>
          Título <span className={SUBTLE}>(opcional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          maxLength={TITLE_MAX}
          className={`mt-1 ${FIELD}`}
          {...register('title')}
        />
        {errors.title && <p className={`mt-1 text-sm ${DANGER}`}>{errors.title.message}</p>}
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className={`block text-sm font-medium ${MUTED}`}>
          Comentário
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={COMMENT_MAX}
          className={`mt-1 ${FIELD}`}
          {...register('comment')}
        />
        <div className="mt-1 flex flex-wrap justify-between gap-2">
          {errors.comment ? (
            <p className={`text-sm ${DANGER}`}>{errors.comment.message}</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ${SUBTLE}`}>
            {comment ? comment.length : 0}/{COMMENT_MAX}
          </p>
        </div>
      </div>

      {submitError !== null && <p className={`mt-4 text-sm ${DANGER}`}>{submitError}</p>}

      <button type="submit" disabled={isSubmitting} className={`mt-6 ${PRIMARY_BUTTON}`}>
        {isSubmitting ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </form>
  );
}
