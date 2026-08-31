import {
  getLectureStatisticsParams,
  readSelectedCenterId,
  useAttendLectureAtCenter,
  useGetCenters,
} from "@/api/centers-api";
import { Button } from "@/components/ui/button";
import {
  getGetLectureStudentsQueryKey,
  getGetLectureStatisticsQueryKey,
} from "@/generated/api";
import { playScanSuccessVoice } from "@/lib/scan-feedback";
import { toast } from "@/lib/utils";
import { startBarcodeScanner } from "@/lib/start-barcode-scanner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2, ScanLine, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const SCAN_COOLDOWN_MS = 2500;

const LectureBarcodeScannerPage = () => {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const scannerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const lastCodeRef = useRef("");
  const lastScanTimeRef = useRef(0);

  const [status, setStatus] = useState<
    "initializing" | "scanning" | "processing" | "success" | "error"
  >("initializing");
  const [feedback, setFeedback] = useState("");
  const [cameraRetry, setCameraRetry] = useState(0);
  const centerId = readSelectedCenterId();
  const { data: centersData } = useGetCenters();
  const centerName =
    centersData?.data?.find((center) => center.id === centerId)?.name ??
    "No center selected";

  const { mutate: attendLecture } = useAttendLectureAtCenter({
    mutation: { throwOnError: false },
  });

  const goBack = () => {
    navigate(`/dashboard/courses/${courseId}/lectures/${lectureId}?view=students`);
  };

  const resumeScanning = useCallback((delay = 1500) => {
    window.setTimeout(() => {
      processingRef.current = false;
      setStatus("scanning");
      setFeedback("Ready for next scan...");
    }, delay);
  }, []);

  const handleScan = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code || !courseId || !lectureId) return;

      if (!centerId) {
        setStatus("error");
        setFeedback("Select an attendance center before scanning.");
        toast({
          title: "No center selected",
          description: "Go back and choose a center first.",
          variant: "destructive",
        });
        resumeScanning(2500);
        return;
      }

      const now = Date.now();
      if (processingRef.current) return;
      if (code === lastCodeRef.current && now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
        return;
      }

      processingRef.current = true;
      lastCodeRef.current = code;
      lastScanTimeRef.current = now;
      setStatus("processing");
      setFeedback(`Processing: ${code}`);

      attendLecture(
        { courseId, lectureId, code, centerId },
        {
          onSuccess: (data) => {
            const message = data.message ?? "Student attended successfully";
            setStatus("success");
            setFeedback(message);
            playScanSuccessVoice("Barcode scanned successfully");
            toast({ title: "Attended", description: message });
            qc.invalidateQueries({
              queryKey: getGetLectureStudentsQueryKey(courseId, lectureId),
            });
            qc.invalidateQueries({
              queryKey: getGetLectureStatisticsQueryKey(
                getLectureStatisticsParams(lectureId, centerId) as any
              ),
            });
            resumeScanning(1200);
          },
          onError: () => {
            setStatus("error");
            setFeedback(`Could not attend student: ${code}`);
            toast({
              title: "Scan failed",
              description: "Student not found or already processed.",
              variant: "destructive",
            });
            resumeScanning(2000);
          },
        }
      );
    },
    [attendLecture, centerId, courseId, lectureId, qc, resumeScanning]
  );

  useEffect(() => {
    const target = scannerRef.current;
    if (!target) return;

    let mounted = true;
    let stop: (() => void) | undefined;

    setStatus("initializing");
    setFeedback("Starting camera...");

    startBarcodeScanner(target, (code) => handleScan(code))
      .then((cleanup) => {
        if (!mounted) {
          cleanup();
          return;
        }
        stop = cleanup;
        setStatus("scanning");
        setFeedback("Point camera at student barcode");
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus("error");
        setFeedback("Could not access camera. Allow camera permission and retry.");
        toast({
          title: "Camera error",
          description: String(err),
          variant: "destructive",
        });
      });

    return () => {
      mounted = false;
      stop?.();
    };
  }, [handleScan, cameraRetry]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/90 px-3 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Center Attendance Scanner</p>
          <p className="truncate text-xs text-white/60">
            {centerName} · Scan → attend → scan next
          </p>
        </div>
        <ScanLine className="h-5 w-5 shrink-0 text-color2" />
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={scannerRef} className="absolute inset-0 [&_canvas]:hidden" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-28 w-[min(80vw,320px)] rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-white/10 bg-black/90 p-4">
        <div className="flex min-h-[2.5rem] items-center justify-center gap-2 text-sm">
          {status === "initializing" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting camera...
            </>
          )}
          {status === "processing" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {feedback}
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-400">{feedback}</span>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{feedback}</span>
            </>
          )}
          {status === "scanning" && (
            <span className="text-white/70">{feedback}</span>
          )}
        </div>
        {status === "error" && (
          <Button
            className="w-full bg-color2 text-black hover:bg-color2/90"
            onClick={() => {
              setStatus("initializing");
              setFeedback("Starting camera...");
              setCameraRetry((n) => n + 1);
            }}
          >
            Retry camera
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={goBack}
        >
          Back to Students List
        </Button>
      </footer>
    </div>
  );
};

export default LectureBarcodeScannerPage;
