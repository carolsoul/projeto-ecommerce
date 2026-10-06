import { MUTED, STAR_OFF, STAR_ON } from '../lib/theme';
const STAR_PATH =
  'm23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z';

interface StarRatingProps {
  rating: number;
  reviewCount: number;
}

export default function StarRating({ rating, reviewCount }: StarRatingProps) {
  const filledStars = Math.round(rating);

  return (
    <div className="flex items-center flex-wrap gap-3 mt-2">
      <div className="flex justify-center gap-2" role="img" aria-label={`Avaliação ${rating} de 5 estrelas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            className={`size-3.5 ${i < filledStars ? `${STAR_ON}` : `${STAR_OFF}`}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
      </div>
      <p className={`text-sm font-medium ${MUTED}`}>({reviewCount})</p>
    </div>
  );
}