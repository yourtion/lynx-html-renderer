import '@lynx-js/react/debug';
import { root } from '@lynx-js/react';
import { CorrectnessCases } from './CorrectnessCases';

root.render(<CorrectnessCases />);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
