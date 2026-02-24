import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../store/useAppStore';
import SustainabilityImageVerifier from './SustainabilityImageVerifier';

const ACTION_TYPES = {
  transport: [
    { value: 'avoided_car_trip', label: '🚗 Avoided Car Trip', co2: 2.4 },
    { value: 'public_transit', label: '🚌 Public Transit', co2: 0.8 },
    { value: 'cycled', label: '🚲 Cycled', co2: 1.6 },
    { value: 'walked', label: '🚶 Walked', co2: 1.2 },
    { value: 'carpooled', label: '🚗 Carpooled', co2: 1.0 },
  ],
  food: [
    { value: 'vegan_meal', label: '🥦 Vegan Meal', co2: 1.5 },
    { value: 'vegetarian_meal', label: '🥗 Vegetarian Meal', co2: 0.8 },
    { value: 'no_food_waste', label: '🍱 No Food Waste', co2: 0.5 },
    { value: 'local_produce', label: '🌽 Local Produce', co2: 0.6 },
  ],
  energy: [
    { value: 'turned_off_lights', label: '💡 Turned Off Lights', co2: 0.2 },
    { value: 'line_dried', label: '👕 Line Dried', co2: 0.7 },
    { value: 'cold_wash', label: '🫧 Cold Wash', co2: 0.6 },
    { value: 'solar_used', label: '☀️ Solar Energy', co2: 1.8 },
  ],
  waste: [
    { value: 'recycled', label: '♻️ Recycled', co2: 0.3 },
    { value: 'composted', label: '🌱 Composted', co2: 0.5 },
    { value: 'refused_plastic', label: '🛍️ Refused Plastic', co2: 0.2 },
    { value: 'repaired_item', label: '🔧 Repaired Item', co2: 1.5 },
  ],
  water: [
    { value: 'short_shower', label: '🚿 Short Shower', co2: 0.2 },
    { value: 'fixed_leak', label: '🔧 Fixed Leak', co2: 0.8 },
    { value: 'rain_harvested', label: '🌧️ Rainwater', co2: 0.3 },
  ],
};

const schema = z.object({
  category: z.string().min(1, 'Category required'),
  type: z.string().min(1, 'Action type required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date required'),
});

export default function ActionForm({ onSuccess, onCancel }) {
  const addAction = useAppStore((s) => s.addAction);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const category = watch('category');
  const typeValue = watch('type');
  const types = category ? ACTION_TYPES[category] || [] : [];
  const selectedType = types.find((t) => t.value === typeValue);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setVerificationStatus('idle');
  };

  const onSubmit = async (data) => {
    if (!photoFile) {
      // Make photo mandatory for logging an action
      // eslint-disable-next-line no-alert
      alert('Please upload a photo for this action before saving.');
      return;
    }
    // If there is a photo, require it to be verified before saving
    if (photoFile && verificationStatus !== 'verified') {
      // Simple guard; you could show a nicer UI message if needed
      // eslint-disable-next-line no-alert
      alert('Please verify the photo with AI before saving your action.');
      return;
    }
    const co2 = selectedType?.co2 ?? 0.5;
    setUploading(true);
    try {
      await addAction({ ...data, co2 }, photoFile);
      onSuccess?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select className="form-control" {...register('category')}>
            <option value="">Select category...</option>
            <option value="transport">🚗 Transport</option>
            <option value="food">🥗 Food</option>
            <option value="energy">⚡ Energy</option>
            <option value="waste">♻️ Waste</option>
            <option value="water">💧 Water</option>
          </select>
          {errors.category && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.category.message}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Action Type *</label>
          <select className="form-control" {...register('type')} disabled={!category}>
            <option value="">{category ? 'Select action...' : 'Select category first...'}</option>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.type.message}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea
          className="form-control"
          {...register('description')}
          placeholder="Describe what you did, any context..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" {...register('date')} />
        </div>
        <div className="form-group">
          <label className="form-label">Carbon Saved (kg CO₂)</label>
          <input
            type="number"
            className="form-control"
            value={selectedType?.co2 ?? ''}
            placeholder="Auto-calculated"
            readOnly
            style={{ opacity: 0.7 }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Photo *</label>
        <div
          className="photo-drop"
          onClick={() => document.getElementById('actionPhotoInput')?.click()}
        >
          <div className="drop-icon">📷</div>
          <div className="drop-text">Click to upload or drag &amp; drop</div>
          <div className="drop-hint">JPG, PNG up to 10MB</div>
          <input
            id="actionPhotoInput"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
        </div>
        {photoPreview && (
          <div className="photo-preview">
            <img
              src={photoPreview}
              alt="Preview"
              className="photo-thumb"
            />
          </div>
        )}
        <SustainabilityImageVerifier
          file={photoFile}
          onStatusChange={setVerificationStatus}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            isSubmitting ||
            uploading ||
            (photoFile && verificationStatus === 'verifying')
          }
        >
          {isSubmitting || uploading ? 'Saving…' : 'Save Action ✓'}
        </button>
      </div>
    </form>
  );
}
