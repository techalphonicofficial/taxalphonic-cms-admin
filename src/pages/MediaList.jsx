import React from 'react';
import { MediaLibraryProvider } from '../context/MediaLibraryContext';
import MediaSidebar from '../components/media/MediaSidebar';
import MediaToolbar from '../components/media/MediaToolbar';
import MediaGrid from '../components/media/MediaGrid';
import Breadcrumb from '../components/common/Breadcrumb';

const MediaListContent = () => {
  return (
    <div className="d-flex flex-column h-100" style={{ height: 'calc(100vh - 70px)' }}>
      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom-0 ">
        <div>
          <Breadcrumb items={[{ label: 'Media Library' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Enterprise Media</h2>
        </div>
      </div>

      <div className="flex-grow-1 d-flex overflow-hidden bg-white border rounded shadow-sm mx-4 mb-4">
        {/* Left Sidebar: Folder Tree */}
        <MediaSidebar />

        {/* Main Content Area */}
        <div className="flex-grow-1 d-flex flex-column overflow-hidden">
          <MediaToolbar />
          <MediaGrid />
        </div>
      </div>
    </div>
  );
};

const MediaList = () => (
  <MediaLibraryProvider>
    <MediaListContent />
  </MediaLibraryProvider>
);

export default MediaList;
