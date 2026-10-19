import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BlogDashboard = () => {
  const [stats, setStats] = useState({
    blogs: 0,
    categories: 0,
    authors: 0,
    tags: 0
  });
  const [dashboardData, setDashboardData] = useState({
    topPosts: [],
    categoryCounts: [],
    recentPosts: [],
    engagement: { views: 0, likes: 0, comments: { approved: 0, pending: 0, hidden: 0 }, series: [] }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [blogsRes, catsRes, authorsRes, tagsRes, dashboardRes] = await Promise.all([
          api.get('/blogs?limit=1'),
          api.get('/blog-categories?limit=1'),
          api.get('/blog-authors?limit=1'),
          api.get('/blog-tags?limit=1'),
          api.get('/blogs/dashboard-stats')
        ]);

        const getCount = (res) => {
          if (!res || !res.data) return 0;
          if (typeof res.data.total === 'number') return res.data.total;
          if (res.data.pagination && typeof res.data.pagination.total === 'number') return res.data.pagination.total;
          if (res.data.pagination && typeof res.data.pagination.totalItems === 'number') return res.data.pagination.totalItems;
          if (res.data.data && typeof res.data.data.count === 'number') return res.data.data.count;
          if (res.data.data && typeof res.data.data.total === 'number') return res.data.data.total;
          if (Array.isArray(res.data.rows)) return res.data.count || res.data.rows.length;
          if (Array.isArray(res.data.data)) return res.data.data.length;
          if (Array.isArray(res.data)) return res.data.length;
          return 0;
        };

        setStats({
          blogs: getCount(blogsRes),
          categories: getCount(catsRes),
          authors: getCount(authorsRes),
          tags: getCount(tagsRes)
        });

        if (dashboardRes.data && dashboardRes.data.data) {
          setDashboardData((prev) => ({ ...prev, ...dashboardRes.data.data }));
        }
      } catch (error) {
        console.error("Error fetching blog stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Top posts chart: views (left axis) with likes and comments (right axis, usually much smaller numbers)
  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { border: { display: false }, grid: { borderDash: [2, 4], color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Views', color: '#ff5b8f' } },
      y1: { position: 'right', border: { display: false }, grid: { display: false }, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Likes / comments', color: '#ed4956' } },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          callback: function(value) {
            let label = this.getLabelForValue(value);
            if (label && label.length > 15) {
              return label.substr(0, 15) + '...'; // truncate long titles
            }
            return label;
          }
        }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  }), []);

  const lineData = useMemo(() => ({
    labels: dashboardData.topPosts.map(p => p.title),
    datasets: [
      {
        label: 'Views',
        data: dashboardData.topPosts.map(p => p.viewCount || 0),
        borderColor: '#ff5b8f',
        backgroundColor: 'rgba(255, 91, 143, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Likes',
        data: dashboardData.topPosts.map(p => p.likeCount || 0),
        borderColor: '#ed4956',
        backgroundColor: '#ed4956',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointStyle: 'rectRounded',
        tension: 0.4,
        yAxisID: 'y1'
      },
      {
        label: 'Comments',
        data: dashboardData.topPosts.map(p => Number(p.commentCount) || 0),
        borderColor: '#0e96ac',
        backgroundColor: '#0e96ac',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 4,
        pointHoverRadius: 6,
        pointStyle: 'triangle',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }), [dashboardData.topPosts]);

  // Likes and comments per day, last 30 days
  const engagement = dashboardData.engagement || { views: 0, likes: 0, comments: { approved: 0, pending: 0, hidden: 0 }, series: [] };
  const series = useMemo(() => engagement.series || [], [engagement.series]);
  const trendData = useMemo(() => ({
    labels: series.map((d) => new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    datasets: [
      { label: 'Likes', data: series.map((d) => d.likes), backgroundColor: 'rgba(237, 73, 86, 0.85)', borderRadius: 4, maxBarThickness: 14 },
      { label: 'Comments', data: series.map((d) => d.comments), backgroundColor: 'rgba(14, 150, 172, 0.85)', borderRadius: 4, maxBarThickness: 14 }
    ]
  }), [series]);
  const trendOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 }, border: { display: false }, grid: { borderDash: [2, 4], color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }
    }
  }), []);
  const likes30 = series.reduce((n, d) => n + d.likes, 0);
  const trendTotal = series.reduce((n, d) => n + d.likes + d.comments, 0);
  const commentTotal = engagement.comments.approved + engagement.comments.pending;

  // Bar Chart Options
  const barData = {
    labels: dashboardData.categoryCounts.map(c => c.category ? c.category.name : 'Uncategorized'),
    datasets: [
      {
        label: 'Total Posts',
        data: dashboardData.categoryCounts.map(c => c.postCount),
        backgroundColor: '#00c3ff',
        borderRadius: 4,
        barThickness: 20
      }
    ]
  };

  const barOptions = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { display: false, beginAtZero: true },
      x: { grid: { display: false }, border: { display: false } }
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch(e) {
      return 'Recently';
    }
  };

  return (
    <div className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h2 className="fw-bold mb-1">Blog Dashboard</h2>
          <p className="text-muted mb-0">Overview of your blog content and performance.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary bg-white shadow-sm"><i className="bi bi-download me-1"></i> Export Report</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        {[
          { title: 'Total Posts', value: stats.blogs, trend: 'Published & Drafts', isUp: true, icon: 'bi-file-richtext', color: 'primary' },
          { title: 'Categories', value: stats.categories, trend: 'Active', isUp: true, icon: 'bi-grid', color: 'info' },
          { title: 'Authors', value: stats.authors, trend: 'Growing', isUp: true, icon: 'bi-pen', color: 'success' },
          { title: 'Tags', value: stats.tags, trend: 'Used often', isUp: true, icon: 'bi-tags', color: 'warning' }
        ].map((stat, idx) => (
          <div className="col-md-6 col-lg-3" key={idx}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="text-muted fw-semibold" style={{ fontSize: '0.875rem' }}>{stat.title}</div>
                  <div className={`text-${stat.color} bg-${stat.color}-subtle rounded p-2 d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                    <i className={`bi ${stat.icon} fs-5`}></i>
                  </div>
                </div>
                <h3 className="fw-bold mb-2">
                  {isLoading ? <div className="spinner-border spinner-border-sm text-muted"></div> : stat.value}
                </h3>
                <div className="d-flex align-items-center" style={{ fontSize: '0.875rem' }}>
                  <span className={`badge bg-${stat.isUp ? 'success' : 'primary'}-subtle text-${stat.isUp ? 'success' : 'primary'} rounded-pill px-2 py-1`}>
                    <i className={`bi bi-arrow-${stat.isUp ? 'up' : 'right'}-short`}></i> {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement row */}
      <div className="row g-4 mb-4">
        {[
          { title: 'Total Views', value: engagement.views, note: 'All posts', icon: 'bi-eye', color: 'primary' },
          { title: 'Total Likes', value: engagement.likes, note: `${likes30} in the last 30 days`, icon: 'bi-heart-fill', color: 'danger' },
          { title: 'Comments', value: commentTotal, note: `${engagement.comments.approved} live on the website`, icon: 'bi-chat-square-text', color: 'info', to: '/blogs/comments' },
          { title: 'Pending Review', value: engagement.comments.pending, note: engagement.comments.pending ? 'Waiting for approval' : 'Nothing to review', icon: 'bi-hourglass-split', color: 'warning', to: '/blogs/comments?status=pending' }
        ].map((stat) => {
          const body = (
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="text-muted fw-semibold" style={{ fontSize: '0.875rem' }}>{stat.title}</div>
                  <div className={`text-${stat.color} bg-${stat.color}-subtle rounded p-2 d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                    <i className={`bi ${stat.icon} fs-5`}></i>
                  </div>
                </div>
                <h3 className="fw-bold mb-2">
                  {isLoading ? <div className="spinner-border spinner-border-sm text-muted"></div> : Number(stat.value || 0).toLocaleString('en-IN')}
                </h3>
                <small className="text-muted">{stat.note}{stat.to && <i className="bi bi-arrow-right-short ms-1"></i>}</small>
              </div>
            </div>
          );
          return (
            <div className="col-md-6 col-lg-3" key={stat.title}>
              {stat.to ? <Link to={stat.to} className="text-decoration-none text-reset d-block h-100">{body}</Link> : body}
            </div>
          );
        })}
      </div>

      <div className="row g-4">
        {/* Main Chart */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4 d-flex justify-content-between align-items-center mb-2">
              <h5 className="fw-bold mb-0">Top Posts: Views, Likes &amp; Comments</h5>
            </div>
            <div className="card-body" style={{ height: '350px' }}>
              {isLoading ? (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : dashboardData.topPosts.length === 0 ? (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-bar-chart fs-1 mb-2"></i>
                  <p>No views or likes recorded yet.</p>
                </div>
              ) : (
                <Line data={lineData} options={lineOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Side widgets */}
        <div className="col-lg-4 d-flex flex-column gap-4">
          <div className="card border-0 shadow-sm flex-grow-1">
            <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4">
              <h5 className="fw-bold mb-0">Posts by Category</h5>
            </div>
            <div className="card-body" style={{ height: '200px' }}>
              {isLoading ? (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : dashboardData.categoryCounts.length === 0 ? (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-pie-chart fs-1 mb-2"></i>
                  <p>No categories found.</p>
                </div>
              ) : (
                <Bar data={barData} options={barOptions} />
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm flex-grow-1">
            <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4 d-flex justify-content-between align-items-center mb-2">
              <h5 className="fw-bold mb-0">Recent Publishing Activity</h5>
            </div>
            <div className="card-body p-0 pt-3">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="spinner-border spinner-border-sm text-primary"></div>
                </div>
              ) : dashboardData.recentPosts.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <p className="mb-0">No recent posts.</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {dashboardData.recentPosts.map((post) => (
                    <li key={post.id} className="list-group-item px-4 py-3 border-bottom-0">
                      <div className="d-flex align-items-start">
                        <div className="bg-light rounded-circle p-2 me-3 text-muted">
                          <i className={`bi bi-journal-text`}></i>
                        </div>
                        <div>
                          <p className="mb-0 text-dark" style={{ fontSize: '0.875rem' }}>
                            <span className="fw-bold">{post.author ? post.author.name : 'User'}</span> {post.status === 'published' ? 'published' : 'drafted'} <span className="fw-semibold">{post.title}</span>
                          </p>
                          <small className="text-muted">{formatDate(post.createdAt)}</small>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Likes & comments over time */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="fw-bold mb-0">Likes &amp; Comments: Last 30 Days</h5>
              <Link to="/blogs/comments" className="btn btn-sm btn-outline-secondary">Manage comments</Link>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              {isLoading ? (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : trendTotal === 0 ? (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-heart fs-1 mb-2"></i>
                  <p>No likes or comments in the last 30 days.</p>
                </div>
              ) : (
                <Bar data={trendData} options={trendOptions} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDashboard;