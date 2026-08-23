import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from 'react';
import type { ScrollView } from 'react-native';
import type {
  Application,
  ApplicationStatus,
} from '../../domain/entities/Application';
import { applicationStatuses } from '../viewmodels/useApplicationsViewModel';

type ApplicationCollection = {
  items: Application[];
};

type Point = { x: number; y: number };
type MoveApplication = (
  application: Application,
  status: ApplicationStatus,
  targetIndex?: number,
) => Promise<void>;

type UseApplicationsDragAndDropOptions = {
  pages: Record<ApplicationStatus, ApplicationCollection>;
  viewportHeight: number;
  onMove: MoveApplication;
  onExpand: (status: ApplicationStatus) => void;
};

type Layout = { y: number; height: number };
type BoardLayout = Layout & { x: number; width: number };

export function useApplicationsDragAndDrop({
  pages,
  viewportHeight,
  onMove,
  onExpand,
}: UseApplicationsDragAndDropOptions) {
  const [dragging, setDragging] = useState<Application | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const [dropPreview, setDropPreview] = useState<{
    status: ApplicationStatus;
    index: number;
  } | null>(null);
  const [listScrollOffset, setListScrollOffset] = useState(0);
  const listRef = useRef<ScrollView>(null);
  const boardRef = useRef<ScrollView>(null);
  const listScrollOffsetRef = useRef(0);
  const boardScrollOffsetRef = useRef(0);
  const listLayouts = useRef<Partial<Record<ApplicationStatus, Layout>>>({});
  const boardLayouts = useRef<Partial<Record<ApplicationStatus, BoardLayout>>>(
    {},
  );
  const cardLayouts = useRef<
    Partial<Record<ApplicationStatus, Record<string, Layout>>>
  >({});

  const clearDrag = useCallback(() => {
    setDragging(null);
    setHoveredStatus(null);
    setDropPreview(null);
  }, []);

  const getTargetIndex = useCallback(
    (status: ApplicationStatus, position: number, applicationId: string) => {
      const items = pages[status].items.filter(
        (item) => item.id !== applicationId,
      );
      const layouts = cardLayouts.current[status] ?? {};
      const index = items.findIndex((item) => {
        const card = layouts[item.id];
        return card ? position < card.y + card.height / 2 : false;
      });
      return index < 0 ? items.length : index;
    },
    [pages],
  );

  const getListTarget = useCallback(
    (position: number) =>
      applicationStatuses.find((status) => {
        const layout = listLayouts.current[status];
        return (
          layout && position >= layout.y && position <= layout.y + layout.height
        );
      }),
    [],
  );

  const previewListDrop = useCallback(
    (position: number) => {
      const target = getListTarget(position);
      if (!target || !dragging) return;
      setHoveredStatus(target);
      setDropPreview({
        status: target,
        index: getTargetIndex(target, position, dragging.id),
      });
      onExpand(target);
    },
    [dragging, getListTarget, getTargetIndex, onExpand],
  );

  const autoScroll = useCallback(
    (
      ref: RefObject<ScrollView | null>,
      offset: MutableRefObject<number>,
      position: number,
    ) => {
      const edge = 96;
      if (position < edge) {
        ref.current?.scrollTo({
          y: Math.max(0, offset.current - 24),
          animated: false,
        });
      } else if (position > viewportHeight - edge) {
        ref.current?.scrollTo({ y: offset.current + 24, animated: false });
      }
    },
    [viewportHeight],
  );

  const onListDragMove = useCallback(
    (position: number) => {
      previewListDrop(position);
      autoScroll(listRef, listScrollOffsetRef, position);
    },
    [autoScroll, previewListDrop],
  );

  const onBoardDragMove = useCallback(
    (point: Point) => {
      autoScroll(boardRef, boardScrollOffsetRef, point.y);
      const target = applicationStatuses.find((status) => {
        const board = boardLayouts.current[status];
        return (
          board &&
          point.x >= board.x &&
          point.x <= board.x + board.width &&
          point.y >= board.y &&
          point.y <= board.y + board.height
        );
      });
      setHoveredStatus(target ?? null);
      if (target && dragging) {
        setDropPreview({
          status: target,
          index: getTargetIndex(target, point.y, dragging.id),
        });
      } else {
        setDropPreview(null);
      }
    },
    [autoScroll, dragging, getTargetIndex],
  );

  const onListDrop = useCallback(
    (application: Application, position: number) => {
      const target = getListTarget(position);
      if (!target) {
        clearDrag();
        return;
      }
      onExpand(target);
      void onMove(
        application,
        target,
        getTargetIndex(target, position, application.id),
      ).finally(clearDrag);
    },
    [clearDrag, getListTarget, getTargetIndex, onExpand, onMove],
  );

  const onBoardDrop = useCallback(
    (application: Application, point: Point) => {
      const target = applicationStatuses.find((status) => {
        const board = boardLayouts.current[status];
        return (
          board &&
          point.x >= board.x &&
          point.x <= board.x + board.width &&
          point.y >= board.y &&
          point.y <= board.y + board.height
        );
      });
      if (!target) {
        clearDrag();
        return;
      }
      void onMove(
        application,
        target,
        getTargetIndex(target, point.y, application.id),
      ).finally(clearDrag);
    },
    [clearDrag, getTargetIndex, onMove],
  );

  const onDrag = useCallback((application: Application | null) => {
    setDragging(application);
    if (!application) {
      setHoveredStatus(null);
      setDropPreview(null);
    }
  }, []);

  return {
    dragging,
    hoveredStatus,
    dropPreview,
    listScrollOffset,
    listRef,
    boardRef,
    clearDrag,
    onDrag,
    onListDragMove,
    onBoardDragMove,
    onListDrop,
    onBoardDrop,
    onListScroll: (offset: number) => {
      listScrollOffsetRef.current = offset;
      setListScrollOffset(offset);
    },
    onBoardScroll: (offset: number) => {
      boardScrollOffsetRef.current = offset;
    },
    onListLayout: (status: ApplicationStatus, y: number, height: number) => {
      listLayouts.current[status] = { y, height };
    },
    onBoardLayout: (
      status: ApplicationStatus,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      boardLayouts.current[status] = { x, y, width, height };
    },
    onCardLayout: (
      status: ApplicationStatus,
      applicationId: string,
      y: number,
      height: number,
    ) => {
      cardLayouts.current[status] = {
        ...cardLayouts.current[status],
        [applicationId]: { y, height },
      };
    },
  };
}
