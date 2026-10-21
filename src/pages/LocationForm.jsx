import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/common/SearchableSelect';
import EditorBar from '../components/common/EditorBar';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';

const LocationForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  // Watch country to filter states remotely 
  const selectedCountry = watch('countryId');

  const { data: cData, isLoading: cLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => { const res = await api.get('/countries', { params: { limit: 1000 } }); return res.data.data; },
  });

  const { data: sData, isLoading: sLoading } = useQuery({
    queryKey: ['states'],
    queryFn: async () => { const res = await api.get('/states', { params: { limit: 1000, sortBy: 'name', sortOrder: 'ASC' } }); return res.data.data; },
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/locations/${id}`).then(res => {
        reset(res.data.data);
      }).catch(() => toast.error('Failed to load'));
    }
  }, [id, reset, isEdit]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) await api.put(`/locations/${id}`, data);
      else await api.post('/locations', data);
      toast.success('Saved successfully');
      navigate('/locations');
    } catch {
      toast.error('Failed to save');
    }
  };

  const countries = Array.isArray(cData) ? cData : (cData?.data || []);
  const statesRaw = Array.isArray(sData) ? sData : (sData?.data || []);

  // Filter states by selected country
  const filteredStates = selectedCountry ? statesRaw.filter(s => s.countryId === selectedCountry) : [];

  return (
    <div className="container-fluid">
      <EditorBar
        title={`${isEdit ? 'Edit' : 'New'} Location`}
        breadcrumb={[{ label: 'Locations', link: '/locations' }, { label: isEdit ? 'Edit' : 'New' }]}
      >
        <button type="button" onClick={() => navigate('/locations')} className="btn btn-light border px-4 rounded-3">Cancel</button>
        <button type="submit" form="location-form" className="btn btn-primary px-4 rounded-3">Save Location</button>
      </EditorBar>
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          <form id="location-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Country Master</label>
                <input type="hidden" {...register('countryId', { required: 'Required' })} />
                <SearchableSelect
                  spaced={false}
                  loading={cLoading}
                  error={!!errors.countryId}
                  value={selectedCountry || ''}
                  onChange={v => { setValue('countryId', v, { shouldValidate: true, shouldDirty: true }); setValue('stateId', ''); }}
                  placeholder="Select Country..."
                  searchPlaceholder="Search countries..."
                  options={countries.map(c => ({ value: c.id, label: c.name }))}
                />
                {errors.countryId && <span className="text-danger small">{errors.countryId.message}</span>}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">State Master</label>
                <input type="hidden" {...register('stateId', { required: 'Required' })} />
                <SearchableSelect
                  spaced={false}
                  loading={sLoading}
                  disabled={!selectedCountry}
                  error={!!errors.stateId}
                  value={watch('stateId') || ''}
                  onChange={v => setValue('stateId', v, { shouldValidate: true, shouldDirty: true })}
                  placeholder={selectedCountry ? 'Select State...' : 'Select a country first'}
                  searchPlaceholder="Search states..."
                  options={filteredStates.map(s => ({ value: s.id, label: s.name }))}
                />
                {errors.stateId && <span className="text-danger small">{errors.stateId.message}</span>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Name (City/Target)</label>
                <input {...register('name', { required: 'Required' })} className="form-control" />
                {errors.name && <span className="text-danger small">{errors.name.message}</span>}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Slug</label>
                <input {...register('slug', { required: 'Required' })} className="form-control" />
                {errors.slug && <span className="text-danger small">{errors.slug.message}</span>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Geographic Description</label>
              <textarea {...register('description')} className="form-control" rows="3" />
            </div>
            <div className="form-check form-switch mb-4">
              <input {...register('active')} className="form-check-input" type="checkbox" id="activeCheck" />
              <label className="form-check-label" htmlFor="activeCheck">Active</label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationForm;