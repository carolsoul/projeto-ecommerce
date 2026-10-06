import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressFormData } from '../schemas/addressSchema';
import { ACCENT, BORDER, BRAND, BRAND_BG, CARD, DANGER, FOCUS, HOVER_BRAND, PINK_HOVER, SUBTLE } from '../lib/theme';

interface AddressFormProps {
  onSubmitSuccess: (data: AddressFormData) => void;
}

interface ViaCEPResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const INPUT_CLASS = `px-3 py-2.5 text-sm ${BRAND} rounded-2xl ${CARD} w-full ${FOCUS}`;
const LABEL_CLASS = `mb-2 ${BRAND} font-medium text-sm inline-block`;
const ERROR_CLASS = `mt-1 text-xs ${DANGER}`;

export function AddressForm({ onSubmitSuccess }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      recipient: '',
      phone: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      isDefault: false,
    },
  });

  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const pendingLookup = useRef<AbortController | null>(null);

  // Preencher o endereço a partir do CEP é um EVENTO. Por isso roda no onBlur e lê o valor com getValues na hora, em vez de um useEffect com watch.
  //
  // O try/catch envolve só a chamada de rede, e toda a decisão fica fora dele:  o babel-plugin-react-compiler desiste de memoizar o componente inteiro se encontrar `finally`, ou `??`/`?.`/ternário dentro de um try/catch.
  const lookupCep = async () => {
    const cep = getValues('cep').replace(/\D/g, '');
    if (cep.length !== 8) return;

    // Respostas de rede não voltam na ordem em que saíram.
    pendingLookup.current?.abort();
    const controller = new AbortController();
    pendingLookup.current = controller;

    setIsLookingUpCep(true);

    let data: ViaCEPResponse | null = null;
    let failed = false;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      });
      data = await response.json();
    } catch {
      failed = true;
    }

    if (controller.signal.aborted) return;

    setIsLookingUpCep(false);

    if (failed || data === null) {
      setError('cep', { type: 'manual', message: 'Erro ao buscar o CEP.' });
      return;
    }

    if (data.erro) {
      setError('cep', { type: 'manual', message: 'CEP não encontrado.' });
      return;
    }

    setValue('street', data.logradouro ?? '');
    setValue('neighborhood', data.bairro ?? '');
    setValue('city', data.localidade ?? '');
    setValue('state', data.uf ?? '');
    clearErrors(['street', 'neighborhood', 'city', 'state', 'cep']);
  };

  // register devolve o próprio onBlur da RHF, que precisa continuar rodando.
  const cepField = register('cep');

  return (
    <form onSubmit={handleSubmit(onSubmitSuccess)}>
      <fieldset>
        <legend className={`${BRAND} text-2xl font-bold mb-6`}>Detalhes da entrega</legend>

        <div className="space-y-6">
          <div>
            <label htmlFor="address-recipient" className={LABEL_CLASS}>
              Destinatário (quem recebe)
            </label>
            <input
              {...register('recipient')}
              id="address-recipient"
              type="text"
              autoComplete="name"
              placeholder="Maria Silva"
              aria-invalid={errors.recipient ? 'true' : undefined}
              aria-describedby={errors.recipient ? 'address-recipient-error' : undefined}
              className={INPUT_CLASS}
            />
            {errors.recipient && (
              <p id="address-recipient-error" className={ERROR_CLASS}>
                {errors.recipient.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="address-phone" className={LABEL_CLASS}>
              Telefone de contato
            </label>
            <input
              {...register('phone')}
              id="address-phone"
              type="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              aria-invalid={errors.phone ? 'true' : undefined}
              aria-describedby={errors.phone ? 'address-phone-error' : undefined}
              className={INPUT_CLASS}
            />
            {errors.phone && (
              <p id="address-phone-error" className={ERROR_CLASS}>
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="address-cep" className={LABEL_CLASS}>
                CEP
              </label>
              <input
                {...cepField}
                onBlur={(e) => {
                  cepField.onBlur(e);
                  void lookupCep();
                }}
                id="address-cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                placeholder="00000-000"
                aria-invalid={errors.cep ? 'true' : undefined}
                aria-describedby={errors.cep ? 'address-cep-error' : undefined}
                className={INPUT_CLASS}
              />
              {isLookingUpCep && <p className={`mt-1 text-xs ${SUBTLE}`}>Buscando endereço...</p>}
              {errors.cep && (
                <p id="address-cep-error" className={ERROR_CLASS}>
                  {errors.cep.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address-street" className={LABEL_CLASS}>
                Rua / Logradouro
              </label>
              <input
                {...register('street')}
                id="address-street"
                type="text"
                autoComplete="address-line1"
                placeholder="Avenida Paulista"
                aria-invalid={errors.street ? 'true' : undefined}
                aria-describedby={errors.street ? 'address-street-error' : undefined}
                className={INPUT_CLASS}
              />
              {errors.street && (
                <p id="address-street-error" className={ERROR_CLASS}>
                  {errors.street.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="address-number" className={LABEL_CLASS}>
                Número
              </label>
              <input
                {...register('number')}
                id="address-number"
                type="text"
                placeholder="1000"
                aria-invalid={errors.number ? 'true' : undefined}
                aria-describedby={errors.number ? 'address-number-error' : undefined}
                className={INPUT_CLASS}
              />
              {errors.number && (
                <p id="address-number-error" className={ERROR_CLASS}>
                  {errors.number.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address-complement" className={LABEL_CLASS}>
                Complemento (opcional)
              </label>
              <input
                {...register('complement')}
                id="address-complement"
                type="text"
                autoComplete="address-line2"
                placeholder="Apto, bloco, referência"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="address-neighborhood" className={LABEL_CLASS}>
                Bairro
              </label>
              <input
                {...register('neighborhood')}
                id="address-neighborhood"
                type="text"
                placeholder="Bela Vista"
                aria-invalid={errors.neighborhood ? 'true' : undefined}
                aria-describedby={errors.neighborhood ? 'address-neighborhood-error' : undefined}
                className={INPUT_CLASS}
              />
              {errors.neighborhood && (
                <p id="address-neighborhood-error" className={ERROR_CLASS}>
                  {errors.neighborhood.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="address-city" className={LABEL_CLASS}>
                Cidade
              </label>
              <input
                {...register('city')}
                id="address-city"
                type="text"
                placeholder="São Paulo"
                aria-invalid={errors.city ? 'true' : undefined}
                aria-describedby={errors.city ? 'address-city-error' : undefined}
                className={INPUT_CLASS}
              />
              {errors.city && (
                <p id="address-city-error" className={ERROR_CLASS}>
                  {errors.city.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="address-state" className={LABEL_CLASS}>
                Estado
              </label>
              <input
                {...register('state')}
                id="address-state"
                type="text"
                maxLength={2}
                placeholder="SP"
                aria-invalid={errors.state ? 'true' : undefined}
                aria-describedby={errors.state ? 'address-state-error' : undefined}
                className={`${INPUT_CLASS} uppercase`}
              />
              {errors.state && (
                <p id="address-state-error" className={ERROR_CLASS}>
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...register('isDefault')}
              id="address-is-default"
              type="checkbox"
              className={`h-4 w-4 rounded border ${BORDER} ${CARD} ${BRAND} ${ACCENT} ${FOCUS}`}
            />
            <label htmlFor="address-is-default" className={`ml-3 text-sm ${BRAND}`}>
              Usar como endereço de entrega padrão
            </label>
          </div>
        </div>
      </fieldset>

      <div className="mt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full px-6 py-2 text-white text-sm font-semibold rounded-4xl cursor-pointer ${BRAND_BG} ${PINK_HOVER} ${HOVER_BRAND} transition-colors ${FOCUS}`}
        >
          {isSubmitting ? 'Salvando...' : 'Continuar'}
        </button>
      </div>
    </form>
  );
}
