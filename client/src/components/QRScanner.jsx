import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess, onScanFailure }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1.0,
        supportedScanTypes: [] // Use defaults
      },
      false
    );

    const handleScan = (decodedText, decodedResult) => {
      onScanSuccess(decodedText, decodedResult);
      scanner.clear().catch(err => console.error("Could not stop scanner", err));
    };

    scanner.render(handleScan, onScanFailure);

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="qr-scanner-wrapper">
      <div id="qr-reader" />
    </div>
  );
}
