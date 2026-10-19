import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const TechnologyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (isEdit) {
      api.get(`/technologies/${id}`).then(res => reset(res.data.data)).catch(() => toast.error('Failed to load'));
    }
  }, [id, reset, isEdit]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) await api.put(`/technologies/${id}`, data);
      else await api.post('/technologies', data);
      toast.success('Saved successfully');
      navigate('/technologies');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="container-fluid">
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
          <h2 className="mb-0 fw-bold">{isEdit ? 'Edit' : 'New'} Technology</h2>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Name</label>
              <input {...register('name')} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Slug</label>
              <input {...register('slug')} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea {...register('description')} className="form-control" rows="3" />
            </div>
            <div className="form-check form-switch mb-4">
              <input {...register('active')} className="form-check-input" type="checkbox" id="activeCheck" />
              <label className="form-check-label" htmlFor="activeCheck">Active</label>
            </div>
            <button type="submit" className="btn btn-primary px-4 rounded-3">Save</button>
            <button type="button" onClick={() => navigate('/technologies')} className="btn btn-light ms-2 px-4 rounded-3">Cancel</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TechnologyForm;