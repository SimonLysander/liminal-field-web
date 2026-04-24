import { useState } from 'react';
import type { StructureNode } from '@/services/structure';
import NoteContent from './components/NoteContent';
import NoteNavigator from './components/NoteNavigator';

const tocItems = [
  '一、Published reading',
  '二、Formal version only',
  '三、Draft stays in admin',
  '四、Public room keeps quiet',
];

const NotePage = () => {
  const [activeNode, setActiveNode] = useState<StructureNode | null>(null);

  return (
    <div className="notes-view flex h-full flex-1 gap-[1.25rem] overflow-hidden px-[1.5rem] pb-[1.5rem] pt-[1rem]">
      <NoteNavigator onActiveNodeChange={setActiveNode} />
      <NoteContent activeNode={activeNode} />
      <div className="notes-right flex w-[17rem] shrink-0 flex-col justify-between rounded-[1.125rem] px-[1.25rem] py-[1.125rem]">
        <div>
          <div className="panel-label">Structure</div>
          <div className="mt-[0.75rem] flex flex-col gap-[0.5rem]">
            {tocItems.map((item, index) => (
              <div key={item} className={`toc-item ${index === 0 ? 'active' : ''}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="ai-panel mt-[1rem] rounded-[1rem] px-[1rem] py-[1rem]">
          <div className="panel-label">AI</div>
          <div className="ai-hint mt-[0.75rem]">
            这个房间只读当前公开版本。草稿创建、Commit、Publish 与版本切换全部留在 admin 工作区。
          </div>
          <div className="ai-input-row mt-[1rem]">
            <input type="text" placeholder="Ask about this note..." readOnly />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotePage;
