import type { ContentChangeType, ContentStatus, ListedAsset } from '@/services/content-items';
import type { CreateStructureNodeDto, StructureNode, UpdateStructureNodeDto } from '@/services/structure';

export type TreeNode = StructureNode & {
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
};

export type ModalMode = 'create' | 'edit';

export type ModalState = {
  open: boolean;
  mode: ModalMode;
  node?: TreeNode;
  parentId?: string;
};

export type EditorState = {
  title: string;
  summary: string;
  status: ContentStatus;
  bodyMarkdown: string;
  changeNote: string;
  changeType: ContentChangeType;
};

export type DocCreateState = {
  title: string;
  summary: string;
};

export type NodeSubmitPayload = {
  node: CreateStructureNodeDto | UpdateStructureNodeDto;
  docCreate?: DocCreateState;
};

export type DocEditorPanelProps = {
  node: TreeNode;
  editorState: EditorState;
  loading: boolean;
  error: string;
  draftInfo: string;
  isDirty: boolean;
  isAutosaving: boolean;
  lastDraftSavedAt: string;
  autosaveError: string;
  assets: ListedAsset[];
  assetsLoading: boolean;
  actionMessage: string;
  onEditorChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  onReload: () => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onCommitContent: () => Promise<void>;
  onPublishContent: () => Promise<void>;
  onUnpublishContent: () => Promise<void>;
  onUploadAsset: (file: File) => Promise<void>;
  onInsertAsset: (path: string) => void;
};

export const EMPTY_EDITOR_STATE: EditorState = {
  title: '',
  summary: '',
  status: 'staged',
  bodyMarkdown: '',
  changeNote: 'Update content',
  changeType: 'patch',
};

export const EMPTY_DOC_CREATE_STATE: DocCreateState = {
  title: '',
  summary: '',
};
