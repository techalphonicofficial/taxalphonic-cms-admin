// Tailwind CSS (v3) utility class names for the code editor's class="" autocomplete.
// Generated from the default scales; variants (md:, hover:, ...) are added by the completion provider.

const SPACING = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'];
const COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const FRACTIONS = ['1/2', '1/3', '2/3', '1/4', '2/4', '3/4', '1/5', '2/5', '3/5', '4/5', '1/6', '5/6'];
const SIZES = ['auto', 'full', 'screen', 'min', 'max', 'fit'];

const out = new Map(); // class → group
const add = (group, ...names) => names.flat().forEach((n) => { if (!out.has(n)) out.set(n, group); });

// Layout
add('Layout', 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden', 'contents', 'table', 'flow-root');
add('Layout', 'container', 'static', 'relative', 'absolute', 'fixed', 'sticky', 'isolate', 'overflow-hidden', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto', 'overflow-visible');
add('Layout', ['0', '1', '2', '4', '8', 'auto', 'full'].flatMap((v) => [`inset-${v}`, `top-${v}`, `right-${v}`, `bottom-${v}`, `left-${v}`]));
add('Layout', ['0', '10', '20', '30', '40', '50', 'auto'].map((v) => `z-${v}`));
add('Layout', 'object-cover', 'object-contain', 'object-center', 'aspect-square', 'aspect-video', 'aspect-auto');

// Flex & grid
add('Flex & Grid', 'flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse', 'flex-wrap', 'flex-nowrap', 'flex-1', 'flex-auto', 'flex-none', 'grow', 'grow-0', 'shrink', 'shrink-0');
add('Flex & Grid', ['start', 'end', 'center', 'between', 'around', 'evenly'].map((v) => `justify-${v}`));
add('Flex & Grid', ['start', 'end', 'center', 'baseline', 'stretch'].map((v) => `items-${v}`));
add('Flex & Grid', ['start', 'end', 'center', 'stretch', 'auto'].map((v) => `self-${v}`));
add('Flex & Grid', ['start', 'end', 'center', 'between'].map((v) => `content-${v}`), 'place-items-center', 'place-content-center');
add('Flex & Grid', Array.from({ length: 12 }, (_, i) => `grid-cols-${i + 1}`), 'grid-cols-none', Array.from({ length: 6 }, (_, i) => `grid-rows-${i + 1}`));
add('Flex & Grid', Array.from({ length: 12 }, (_, i) => `col-span-${i + 1}`), 'col-span-full', Array.from({ length: 6 }, (_, i) => `row-span-${i + 1}`));
add('Flex & Grid', Array.from({ length: 12 }, (_, i) => `order-${i + 1}`), 'order-first', 'order-last');

// Spacing
const spaceProps = ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'gap', 'gap-x', 'gap-y', 'space-x', 'space-y'];
spaceProps.forEach((prop) => add('Spacing', SPACING.map((v) => `${prop}-${v}`)));
['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'].forEach((prop) => add('Spacing', `${prop}-auto`));

// Sizing
['w', 'h', 'min-w', 'min-h', 'max-h'].forEach((prop) => add('Sizing', SPACING.map((v) => `${prop}-${v}`), SIZES.map((v) => `${prop}-${v}`)));
add('Sizing', FRACTIONS.map((f) => `w-${f}`), 'w-screen', 'h-screen', 'min-h-screen', 'size-full');
add('Sizing', ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full', 'prose', 'none', 'screen-sm', 'screen-md', 'screen-lg', 'screen-xl'].map((v) => `max-w-${v}`));

// Typography
add('Typography', ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'].map((v) => `text-${v}`));
add('Typography', ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'].map((v) => `font-${v}`), 'font-sans', 'font-serif', 'font-mono');
add('Typography', ['left', 'center', 'right', 'justify', 'start', 'end'].map((v) => `text-${v}`));
add('Typography', ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose', '3', '4', '5', '6', '7', '8', '9', '10'].map((v) => `leading-${v}`));
add('Typography', ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'].map((v) => `tracking-${v}`));
add('Typography', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'italic', 'not-italic', 'underline', 'line-through', 'no-underline', 'underline-offset-4', 'truncate', 'text-ellipsis', 'whitespace-nowrap', 'whitespace-normal', 'whitespace-pre-line', 'break-words', 'break-all', 'antialiased');
add('Typography', ['1', '2', '3', '4', '5', '6', 'none'].map((v) => `line-clamp-${v}`));
add('Typography', 'list-disc', 'list-decimal', 'list-none', 'list-inside', 'list-outside', 'prose', 'prose-sm', 'prose-lg', 'prose-xl', 'max-w-none');

// Colours
const colorProps = ['text', 'bg', 'border', 'ring', 'from', 'via', 'to', 'divide', 'placeholder', 'fill', 'stroke', 'outline', 'decoration', 'accent', 'shadow'];
colorProps.forEach((prop) => {
  add('Colours', [`${prop}-white`, `${prop}-black`, `${prop}-transparent`, `${prop}-current`, `${prop}-inherit`]);
  COLORS.forEach((c) => add('Colours', SHADES.map((s) => `${prop}-${c}-${s}`)));
});
add('Backgrounds', ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'].map((d) => `bg-gradient-to-${d}`), 'bg-none', 'bg-cover', 'bg-contain', 'bg-center', 'bg-no-repeat', 'bg-fixed');
add('Opacity', ['0', '5', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '90', '95', '100'].map((v) => `opacity-${v}`));

// Borders & effects
add('Borders', 'border', 'border-0', 'border-2', 'border-4', 'border-8', 'border-t', 'border-r', 'border-b', 'border-l', 'border-x', 'border-y', 'border-t-2', 'border-b-2', 'border-l-4', 'border-r-4', 'border-solid', 'border-dashed', 'border-dotted', 'border-none');
add('Borders', ['none', 'sm', '', 'md', 'lg', 'xl', '2xl', '3xl', 'full'].map((v) => (v ? `rounded-${v}` : 'rounded')));
add('Borders', ['t', 'r', 'b', 'l', 'tl', 'tr', 'bl', 'br'].flatMap((s) => ['', 'md', 'lg', 'xl', '2xl'].map((v) => (v ? `rounded-${s}-${v}` : `rounded-${s}`))));
add('Borders', 'ring', 'ring-0', 'ring-1', 'ring-2', 'ring-4', 'ring-inset', 'divide-x', 'divide-y', 'outline-none');
add('Effects', ['sm', '', 'md', 'lg', 'xl', '2xl', 'inner', 'none'].map((v) => (v ? `shadow-${v}` : 'shadow')));
add('Effects', 'blur', 'blur-sm', 'blur-md', 'backdrop-blur', 'backdrop-blur-sm', 'backdrop-blur-md', 'grayscale', 'mix-blend-multiply');

// Transitions & interactivity
add('Transitions', 'transition', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-transform', 'transition-shadow', 'transition-none', ['75', '100', '150', '200', '300', '500', '700', '1000'].map((v) => `duration-${v}`), 'ease-in', 'ease-out', 'ease-in-out', 'ease-linear', 'animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce');
add('Transforms', ['0', '50', '75', '90', '95', '100', '105', '110', '125', '150'].map((v) => `scale-${v}`), ['0', '1', '2', '3', '6', '12', '45', '90', '180'].map((v) => `rotate-${v}`), ['0', '0.5', '1', '2', '4', 'full'].flatMap((v) => [`translate-x-${v}`, `translate-y-${v}`, `-translate-y-${v}`]));
add('Interactivity', 'cursor-pointer', 'cursor-default', 'cursor-not-allowed', 'select-none', 'pointer-events-none', 'pointer-events-auto', 'scroll-smooth', 'snap-x', 'snap-start', 'resize', 'resize-none', 'appearance-none', 'sr-only', 'not-sr-only', 'group', 'peer');

export const TAILWIND_CLASSES = [...out.entries()].map(([name, group]) => ({ name, group }));

export const TAILWIND_VARIANTS = ['sm:', 'md:', 'lg:', 'xl:', '2xl:', 'hover:', 'focus:', 'active:', 'group-hover:', 'focus-visible:', 'disabled:', 'first:', 'last:', 'odd:', 'even:', 'dark:', 'before:', 'after:', 'placeholder:'];
