import React, { useCallback, useState } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';

const KEYWORDS = [
  'tree',
  'forest',
  'plant',
  'leaf',
  'bike',
  'bicycle',
  'cycle',
  'recycle',
  'recycling',
  'trash',
  'garbage',
  'bin',
  'litter',
  'cleanup',
  'cleaning',
  'compost',
  'solar',
  'panel',
  'solar panel',
];

let mobilenetModelPromise = null;

async function getModel() {
  if (!mobilenetModelPromise) {
    mobilenetModelPromise = mobilenet.load();
  }
  return mobilenetModelPromise;
}

/**
 * Props:
 * - file: File | null
 * - onStatusChange?: (status: 'idle' | 'verifying' | 'verified' | 'invalid' | 'error') => void
 */
export default function SustainabilityImageVerifier({ file, onStatusChange }) {
  const [status, setStatus] = useState('idle');
  const [labels, setLabels] = useState([]);
  const [error, setError] = useState('');

  const updateStatus = useCallback(
    (next) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  const handleVerify = useCallback(async () => {
    if (!file) return;
    try {
      updateStatus('verifying');
      setError('');
      setLabels([]);

      const model = await getModel();

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const predictions = await model.classify(img);
      URL.revokeObjectURL(url);

      const predictedLabels = predictions.map((p) => p.className.toLowerCase());
      setLabels(predictedLabels);

      const joined = predictedLabels.join(' ');
      const isSustainable = KEYWORDS.some((kw) => joined.includes(kw));

      if (isSustainable) {
        updateStatus('verified');
      } else {
        updateStatus('invalid');
      }
    } catch (e) {
      setError('Could not verify this image.');
      updateStatus('error');
    }
  }, [file, updateStatus]);

  if (!file) return null;

  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={handleVerify}
        disabled={status === 'verifying'}
      >
        {status === 'verifying' ? 'Verifying…' : 'Verify photo with AI'}
      </button>
      <div style={{ marginTop: 6 }}>
        {status === 'verified' && (
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            ✅ Verified Sustainability Action
          </span>
        )}
        {status === 'invalid' && (
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
            ⚠️ Not a valid sustainability-related action
          </span>
        )}
        {status === 'error' && (
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        )}
        {status === 'idle' && (
          <span style={{ color: 'var(--text3)' }}>
            Optional: verify that this photo matches your eco action.
          </span>
        )}
      </div>
      {labels.length > 0 && (
        <div style={{ marginTop: 4, color: 'var(--text3)' }}>
          Detected: {labels.join(', ')}
        </div>
      )}
    </div>
  );
}

