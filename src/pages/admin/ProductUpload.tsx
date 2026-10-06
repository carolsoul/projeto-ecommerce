import { useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { productRowSchema } from '../../schemas/productSchema';
import { BRAND_BG, BRAND_BG_HOVER, BRAND, CARD, DANGER, DISABLED_PINK } from '../../lib/theme';

interface RowResult {
  rowNumber: number;
  data: Record<string, unknown>;
  success: boolean;
  errors: string[];
}

/** O SKU vira o id do documento, então precisa ser estável e sem espaço. */
function sanitizeSku(sku: unknown): string {
  return String(sku).trim().toLowerCase().replace(/\s+/g, '-');
}

export default function ProductUpload() {
  const [results, setResults] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportDone(false);
    setResults([]);
    setParseError(null);
    setImportError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const validated: RowResult[] = parsed.data.map((row, index) => {
          const parseResult = productRowSchema.safeParse(row);

          if (parseResult.success) {
            return { rowNumber: index + 2, data: parseResult.data, success: true, errors: [] };
          }

          const errors = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
          return { rowNumber: index + 2, data: row as Record<string, unknown>, success: false, errors };
        });

        setResults(validated);
      },
      error: (error) => {
        console.error('Falha ao ler o CSV:', error);
        setParseError('Não foi possível ler o arquivo. Confira se é um CSV válido.');
      },
    });
  };

  const validRows = results.filter((r) => r.success);
  const invalidCount = results.length - validRows.length;

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);
    setImportError(null);

    try {
      const existingSnap = await getDocs(collection(db, 'products'));
      const existingIds = new Set(existingSnap.docs.map((d) => d.id));

      const chunkSize = 500;
      const chunks: RowResult[][] = [];
      for (let i = 0; i < validRows.length; i += chunkSize) {
        chunks.push(validRows.slice(i, i + chunkSize));
      }

      let processed = 0;

      for (const chunk of chunks) {
        const batch = writeBatch(db);

        chunk.forEach((row) => {
          const sanitizedSku = sanitizeSku(row.data.sku);
          const productRef = doc(db, 'products', sanitizedSku);

          batch.set(
            productRef,
            {
              ...row.data,
              sku: sanitizedSku,
              ...(existingIds.has(sanitizedSku) ? {} : { createdAt: serverTimestamp() }),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        });

        await batch.commit();
        processed += chunk.length;
        setImportProgress(processed);
      }

      setImportDone(true);
    } catch (error) {
      console.error('Falha ao importar os produtos:', error);
      setImportError(
        'A importação falhou. Confira sua conexão e se o seu uid está na coleção admins/.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className={`text-2xl font-bold mb-4 ${BRAND}`}>Importar produtos via CSV</h1>

      <p className="mb-4 text-sm">
        Colunas esperadas: <code>sku</code>, <code>name</code>, <code>imageUrl</code>,{' '}
        <code>description</code>, <code>features</code>, <code>price</code>, <code>mrp</code>,{' '}
        <code>rating</code>, <code>reviewCount</code>, <code>category</code>, <code>stock</code>.
        Em <code>features</code>, separe cada característica com <code>|</code>.
      </p>

      <label className={`mt-6 inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-white cursor-pointer ${BRAND_BG} ${BRAND_BG_HOVER}`}>
        <span>Selecionar arquivo .CSV</span>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {parseError && <p className={`mt-4 font-medium ${DANGER}`}>{parseError}</p>}

      {results.length > 0 && (
        <>
          <p className="my-4 font-medium">
            {validRows.length} de {results.length} linhas válidas
            {invalidCount > 0 && <span className={`${DANGER}`}> — {invalidCount} com erro</span>}
          </p>

          <div className="overflow-x-auto border rounded-md max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className={`${CARD} sticky top-0`}>
                <tr>
                  <th className="text-left p-2">Linha</th>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Preço</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Características</th>
                  <th className="text-left p-2">Erros</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.rowNumber} className={row.success ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2">{String(row.data.name ?? '—')}</td>
                    <td className="p-2">{String(row.data.price ?? '—')}</td>
                    <td className="p-2">{String(row.data.sku ?? '—')}</td>
                    {/* Descrição e características são longas: truncar mantém a
                        conferência legível em vez de esticar a tabela. */}
                    <td className="p-2 max-w-[24ch] truncate">{String(row.data.description ?? '—')}</td>
                    <td className="p-2 max-w-[24ch] truncate">
                      {Array.isArray(row.data.features)
                        ? row.data.features.join(', ')
                        : String(row.data.features ?? '—')}
                    </td>
                    <td className="p-2 text-red-700">{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            className={`mt-6 ${BRAND_BG} ${DISABLED_PINK} disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium`}
          >
            {importing
              ? `Importando ${importProgress}/${validRows.length}...`
              : `Importar ${validRows.length} produtos`}
          </button>

          {importError && <p className={`mt-4 font-medium ${DANGER}`}>{importError}</p>}

          {importDone && (
            <p className="mt-4 text-green-700 font-medium">Importação concluída com sucesso!</p>
          )}
        </>
      )}
    </div>
  );
}
