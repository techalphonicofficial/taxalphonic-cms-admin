import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/common/SearchableSelect';
import EditorBar from '../components/common/EditorBar';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';

const StateForm = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    // Fetch Countries
    const { data: countryData } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => { const res = await api.get('/countries', { params: { limit: 1000 } }); return res.data.data; },
    });

    useEffect(() => {
        if (isEdit) {
            const fetchItem = async () => {
                try {
                    const res = await api.get(`/states/${id}`);
                    const item = res.data.data;
                    Object.keys(item).forEach(key => setValue(key, item[key]));
                } catch (error) {
                    toast.error('Failed to load record');
                }
            };
            fetchItem();
        }
    }, [id, isEdit, setValue]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Auto generator
            if (!data.slug) {
                data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }
            if (isEdit) {
                await api.put(`/states/${id}`, data);
                toast.success('State updated successfully');
            } else {
                await api.post('/states', data);
                toast.success('State created successfully');
            }
            navigate('/states');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    const countries = Array.isArray(countryData) ? countryData : (countryData?.data || []);

    return (
        <div className="container-fluid p-0">
            <EditorBar
                title={isEdit ? 'Edit State' : 'Create New State'}
                breadcrumb={[{ label: 'States', link: '/states' }, { label: isEdit ? 'Edit' : 'New' }]}
            >
                <button type="button" className="btn btn-light border" onClick={() => navigate('/states')}>Cancel</button>
                <button type="submit" form="state-form" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null} Save Data
                </button>
            </EditorBar>
            <div className="row justify-content-center">
                <div className="col-12 col-xl-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <form id="state-form" onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-3">
                                    <label className="form-label fw-medium"><span className="text-danger">*</span> Country Master</label>
                                    <input type="hidden" {...register('countryId', { required: 'Country is required' })} />
                                    <SearchableSelect
                                        spaced={false}
                                        error={!!errors.countryId}
                                        value={watch('countryId') || ''}
                                        onChange={v => setValue('countryId', v, { shouldValidate: true, shouldDirty: true })}
                                        placeholder="Select Country"
                                        searchPlaceholder="Search countries..."
                                        options={countries.map(c => ({ value: c.id, label: c.name }))}
                                    />
                                    {errors.countryId && <div className="text-danger small mt-1">{errors.countryId.message}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-medium"><span className="text-danger">*</span> State Name</label>
                                    <input type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`} {...register('name', { required: 'Name is required' })} />
                                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-medium">Slug <span className="text-muted fw-normal">(Leaves empty to auto-generate)</span></label>
                                    <input type="text" className="form-control" {...register('slug')} />
                                </div>
                                <div className="mb-4">
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" id="status" {...register('status')} value="active" defaultChecked={true} />
                                        <label className="form-check-label" htmlFor="status">Active State</label>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default StateForm;
