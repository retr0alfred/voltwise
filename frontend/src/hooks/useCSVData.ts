import { useEffect, useState } from "react";
import Papa, { ParseError, ParseResult } from "papaparse";

interface CSVState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
}

const buildParseError = (error: ParseError | undefined): string => {
  if (!error) {
    return "Unknown CSV parsing error.";
  }

  const rowInfo = typeof error.row === "number" ? ` at row ${error.row}` : "";
  return `${error.message}${rowInfo}`;
};

const toAbsoluteCsvUrl = (path: string): string => {
  if (/^(https?:)?\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(normalizedPath, baseUrl).toString();
};

export const useCSVData = <TRaw extends object, TParsed>(
  path: string,
  parser: (row: TRaw) => TParsed,
): CSVState<TParsed> => {
  const [data, setData] = useState<TParsed[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let hasFinished = false;
    let currentMode: "worker" | "fallback" = "worker";
    let watchdogTimer: number | undefined;

    const resolvedPath = toAbsoluteCsvUrl(path);

    const finishWithError = (message: string): void => {
      if (isCancelled || hasFinished) {
        return;
      }

      hasFinished = true;
      if (watchdogTimer) {
        window.clearTimeout(watchdogTimer);
      }
      setError(message);
      setData([]);
      setIsLoading(false);
    };

    const finishWithData = (results: ParseResult<TRaw>): void => {
      if (isCancelled || hasFinished) {
        return;
      }

      hasFinished = true;
      if (watchdogTimer) {
        window.clearTimeout(watchdogTimer);
      }

      if (results.errors.length > 0) {
        setError(buildParseError(results.errors[0]));
      }

      const parsedRows = results.data.map((row) => parser(row));
      setData(parsedRows);
      setIsLoading(false);
    };

    const parseCSV = (useWorker: boolean): void => {
      currentMode = useWorker ? "worker" : "fallback";

      try {
        Papa.parse<TRaw>(resolvedPath, {
          download: true,
          header: true,
          worker: useWorker,
          skipEmptyLines: true,
          complete: finishWithData,
          error: (parseError) => {
            if (isCancelled || hasFinished) {
              return;
            }

            if (useWorker) {
              parseCSV(false);
              return;
            }

            finishWithError(parseError.message || "Failed to parse CSV file.");
          },
        });
      } catch (error) {
        if (useWorker) {
          parseCSV(false);
          return;
        }

        const fallbackMessage = error instanceof Error ? error.message : "Failed to parse CSV file.";
        finishWithError(fallbackMessage);
      }
    };

    setIsLoading(true);
    setError(null);

    parseCSV(true);

    watchdogTimer = window.setTimeout(() => {
      if (!isCancelled && !hasFinished && currentMode === "worker") {
        parseCSV(false);
      }
    }, 30000);

    return () => {
      isCancelled = true;
      if (watchdogTimer) {
        window.clearTimeout(watchdogTimer);
      }
    };
  }, [path, parser]);

  return { data, isLoading, error };
};
