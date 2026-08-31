import Quagga, { QuaggaJSResultObject } from "@ericblade/quagga2";

const READERS = [
  "code_128_reader",
  "ean_reader",
  "ean_8_reader",
  "code_39_reader",
  "codabar_reader",
  "upc_reader",
];

type VideoConstraints = MediaTrackConstraints;

function quaggaConfig(target: HTMLElement, constraints: VideoConstraints) {
  return {
    inputStream: {
      type: "LiveStream" as const,
      target,
      constraints,
    },
    locator: {
      patchSize: "medium" as const,
      halfSample: true,
    },
    numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 4),
    decoder: { readers: READERS },
    locate: true,
    frequency: 10,
  };
}

function initOnce(
  target: HTMLElement,
  constraints: VideoConstraints
): Promise<void> {
  return new Promise((resolve, reject) => {
    Quagga.init(quaggaConfig(target, constraints), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Start a rear-camera barcode scanner. Android Chrome is strict about
 * getUserMedia constraints (min width/height often fail), so we prefer
 * facingMode only, then fall back to any camera.
 */
export async function startBarcodeScanner(
  target: HTMLElement,
  onDetected: (code: string) => void
): Promise<() => void> {
  const attempts: VideoConstraints[] = [
    { facingMode: { ideal: "environment" } },
    { facingMode: "environment" },
    {},
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      await initOnce(target, constraints);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      try {
        Quagga.stop();
      } catch {
        /* ignore failed stop between retries */
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  const handleDetected = (result: QuaggaJSResultObject) => {
    const code = result?.codeResult?.code;
    if (code) onDetected(code);
  };

  Quagga.onDetected(handleDetected);
  Quagga.start();

  return () => {
    Quagga.offDetected(handleDetected);
    try {
      Quagga.stop();
    } catch {
      /* already stopped */
    }
  };
}
