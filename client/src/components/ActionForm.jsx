import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../store/useAppStore';
import { photosAPI } from '../api';

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
  };

  const onSubmit = async (data) => {
    let photoId;
    if (photoFile) {
      setUploading(true);
      try { const photo = await photosAPI.upload(photoFile); photoId = photo.id; }
      catch (e) { console.warn('Photo upload failed:', e); }
      finally { setUploading(false); }
    }
    await addAction({ ...data, photoId });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-row">
        <div className="form-group">
          <label>Category *</label>
          <select {...register('category')}>
            <option value="">Select category...</option>
            {['transport','food','energy','waste','water'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
            ))}
          </select>
          {errors.category && <span className="error">{errors.category.message}</span>}
        </div>
        <div className="form-group">
          <label>Action Type *</label>
          <select {...register('type')} disabled={!category}>
            <option value="">Select action...</option>
            {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.type && <span className="error">{errors.type.message}</span>}
        </div>
      </div>

      {selectedType && (
        <div className="co2-preview">
          🌿 Carbon saved: <strong>{selectedType.co2} kg CO₂</strong>
        </div>
      )}

      <div className="form-group">
        <label>Notes</label>
        <textarea {...register('description')} placeholder="Any additional context..." rows={3} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date *</label>
          <input type="date" {...register('date')} />
        </div>
      </div>

      <div className="form-group">
        <label>Photo (optional)</label>
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoPreview && <img src={photoPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', marginTop: 8 }} />}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? 'Saving...' : 'Save Action ✓'}
        </button>
      </div>
    </form>
  );
}
