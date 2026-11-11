import React, { useMemo } from 'react';
import { Button, Modal } from 'react-bootstrap';
import ServicePreviewPane from './ServicePreviewPane';
import { isLandingRegion } from './landingBlocks';
import { sampleSection } from './blockSamples';

/*
 * Popup preview of one Page Builder block (eye button on every block in PageBuilder.jsx): the block
 * alone, rendered with the website's own components like Live Preview (unsaved edits included,
 * nothing saved). Landing pages keep their Header block so the page theme's colours apply.
 */
const KIND = { home: 'home', journey: 'journey', tool: 'tool', landing: 'landing', blog: 'blog' };

export const previewKindOf = (blockSet) => KIND[blockSet] || 'page';

/** The draft that shows one block alone. */
export const singleBlockDraft = (section, sections, blockSet) => {
  const kind = previewKindOf(blockSet);
  let list = [section];
  if (kind === 'landing' && !isLandingRegion(section.type)) {
    const header = sections.find((s) => s.type === 'LandingHeader');
    if (header) list = [header, section];
  }
  // A page without a Hero block shows its title as the hero ("Untitled page" in a preview): an
  // invisible title keeps that hero empty, so only the block shows.
  // Blog: the block alone, without the post's title, author and comments.
  if (kind === 'blog') return { single: true, title: '', sections: list };
  return kind === 'home' ? { sections: list } : { title: '\u200b', slug: '', content: '', sections: list };
};

export default function BlockPreviewModal({ section, sections = [], blockSet = 'default', label = '', note, footer, onHide }) {
  const kind = previewKindOf(blockSet);
  const draft = useMemo(() => (section ? singleBlockDraft(section, sections, blockSet) : null), [section, sections, blockSet]);

  return (
    <Modal show={Boolean(section)} onHide={onHide} size="xl" centered scrollable dialogClassName="pb-block-preview-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6"><i className="bi bi-eye me-2 text-primary"></i>Preview: {label}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {draft && <ServicePreviewPane kind={kind} draft={draft} />}
        <div className="small text-muted px-3 pb-3">{note || 'Only this block, as it looks on the website (unsaved changes included). Use Live Preview for the whole page.'}</div>
      </Modal.Body>
      {footer && <Modal.Footer>{footer}</Modal.Footer>}
    </Modal>
  );
}

/**
 * Eye button in Available Blocks: a block that is not on the page yet, filled with sample content
 * (blockSamples.js), including a sample form and sample module records. Nothing is added or saved.
 */
export function PaletteBlockPreviewModal({ type, payload, sections, blockSet, label, onAdd, onHide }) {
  const section = useMemo(() => (type ? sampleSection(type, payload) : null), [type, payload]);

  return (
    <BlockPreviewModal
      section={section}
      sections={sections}
      blockSet={blockSet}
      label={label}
      note="Sample content, only for this preview. The block is added with its normal starting content, and its CMS module's records show on the website."
      footer={<Button variant="primary" size="sm" onClick={onAdd}><i className="bi bi-plus-lg me-1"></i>Add this block</Button>}
      onHide={onHide}
    />
  );
}
