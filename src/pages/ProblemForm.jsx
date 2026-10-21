import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import EditorBar from '../components/common/EditorBar';

const ProblemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (isEdit) {
      api.get(`/problems/${id}`).then(res => reset(res.data.data)).catch(() => toast.error('Failed to load'));
    }
  }, [id, reset, isEdit]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) await api.put(`/problems/${id}`, data);
      else await api.post('/problems', data);
      toast.success('Saved successfully');
      navigate('/problems');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="container-fluid">
      <EditorBar
        title={`${isEdit ? 'Edit' : 'New'} Problem`}
        breadcrumb={[{ label: 'Problems', link: '/problems' }, { label: isEdit ? 'Edit' : 'New' }]}
      >
        <button type="button" onClick={() => navigate('/problems')} className="btn btn-light border px-4 rounded-3">Cancel</button>
        <button type="submit" form="problems-form" className="btn btn-primary px-4 rounded-3">Save</button>
      </EditorBar>
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          <form id="problems-form" onSubmit={handleSubmit(onSubmit)}>
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProblemForm;