import { useState } from 'react';
import type { StructureNode } from '@/services/structure';
import NoteContent from './components/NoteContent';
import NoteNavigator from './components/NoteNavigator';

const NotePage = () => {
  const [activeNode, setActiveNode] = useState<StructureNode | null>(null);

  return (
    <div className="flex h-full">
      <NoteNavigator onActiveNodeChange={setActiveNode} />
      <NoteContent activeNode={activeNode} />
    </div>
  );
};

export default NotePage;
