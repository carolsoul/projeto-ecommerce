import { useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { productRowSchema } from '../../schemas/productSchema';

interface RowResult {
  rowNumber: number;
  data: Record<string, unknown>;
  success: boolean;
  errors: string[];
}

export default function ProductUpload() {
  const [results, setResults] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportDone(false);
    setResults([]);

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
    });
  };

  const validRows = results.filter((r) => r.success);
  const invalidCount = results.length - validRows.length;

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);

    const chunkSize = 500;
    const chunks: RowResult[][] = [];
    for (let i = 0; i < validRows.length; i += chunkSize) {
      chunks.push(validRows.slice(i, i + chunkSize));
    }

    let processed = 0;

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      
      chunk.forEach((row) => {
        const sanitizedSku = (row.data.sku as string).trim().toLowerCase().replace(/\s+/g, '-');
        const productRef = doc(db, 'products', sanitizedSku);
        batch.set(productRef, { ...row.data, createdAt: serverTimestamp() }, { merge: true });
      });

      await batch.commit();
      processed += chunk.length;
      setImportProgress(processed);
    }

    setImporting(false);
    setImportDone(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Importar produtos via CSV</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-6 block"
      />

      {results.length > 0 && (
        <>
          <p className="mb-4 font-medium">
            {validRows.length} de {results.length} linhas válidas
            {invalidCount > 0 && <span className="text-red-600"> — {invalidCount} com erro</span>}
          </p>

          <div className="overflow-x-auto border rounded-md max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-2">Linha</th>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Preço</th>
                  <th className="text-left p-2">Erros</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.success ? 'bg-green-50' : 'bg-red-50'}
                  >
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2">{String(row.data.name ?? '—')}</td>
                    <td className="p-2">{String(row.data.price ?? '—')}</td>
                    <td className="p-2 text-red-700">{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
           
            className="mt-6 bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-md font-medium"
          >
            {importing
              ? `Importando ${importProgress}/${validRows.length}...`
              : `Importar ${validRows.length} produtos`}
          </button>

          {importDone && (
            <p className="mt-4 text-green-700 font-medium">
              Importação concluída com sucesso!
            </p>
          )}
        </>
      )}
    </div>
  );
}