import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';

const FaqForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      question: '',
      answer: '',
      category: '',
      displayOrder: 0,
      status: 'published'
    }
  });

  useEffect(() => {
    if (isEditMode) {
      fetchFaq();
    }
  }, [id]);

  const fetchFaq = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/faqs/${id}`);
      const t = response.data.data;
      reset({
        question: t.question,
        answer: t.answer,
        category: t.category || '',
        displayOrder: t.displayOrder || 0,
        status: t.status
      });
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      toast.error('Failed to load FAQ data.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/faqs/${id}`, data);
        toast.success('FAQ updated successfully.');
      } else {
        await api.post('/faqs', data);
        toast.success('FAQ created successfully.');
        navigate('/cms/faqs');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error(error.response?.data?.message || 'Failed to save FAQ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'FAQs', link: '/cms/faqs' },
            { label: isEditMode ? 'Edit' : 'Add' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit FAQ' : 'Add New FAQ'}</h2>
          </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/cms/faqs" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
          <button 
            type="button" 
            className="premium-btn-primary flex-grow-1 flex-md-grow-0" 
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
            ) : (
              <><i className="bi bi-save me-2"></i> Save</>
            )}
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">FAQ Content</h5>
            </div>
            <div className="card-body p-4">
              <form id="faqForm" onSubmit={handleSubmit(onSubmit)}>
                
                <div className="mb-4">
                  <label className="form-label fw-medium">Question <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.question ? 'is-invalid' : ''}`}
                    placeholder="e.g. How does your pricing work?"
                    {...register('question', { 
                      required: 'Question is required',
                      maxLength: { value: 500, message: 'Max 500 characters' }
                    })} 
                  />
                  {errors.question && <div className="invalid-feedback">{errors.question.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Answer <span className="text-danger">*</span></label>
                  <textarea 
                    className={`form-control ${errors.answer ? 'is-invalid' : ''}`} 
                    rows="5"
                    placeholder="Write the detailed answer here..."
                    {...register('answer', { required: 'Answer is required' })} 
                  ></textarea>
                  {errors.answer && <div className="invalid-feedback">{errors.answer.message}</div>}
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Category</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Pricing, Support, General"
                      {...register('category', { maxLength: { value: 100, message: 'Max 100 characters' } })} 
                    />
                    {errors.category && <div className="text-danger small mt-1">{errors.category.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Display Order</label>
                    <input 
                      type="number" 
                      className="form-control"
                      {...register('displayOrder', { valueAsNumber: true })} 
                    />
                    <div className="form-text">Lower numbers appear first.</div>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">Publishing Options</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="form-label fw-medium">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FaqForm;
