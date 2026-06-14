import { useNavigate } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useCompareStore } from '../stores/compareStore';

export default function CompareBar() {
  const { rooms, remove, clear } = useCompareStore();
  const navigate = useNavigate();

  if (rooms.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
          So sánh ({rooms.length}/3):
        </span>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {rooms.map(room => (
            <div
              key={room.id}
              className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5 shrink-0"
            >
              {room.imageUrls[0] && (
                <img src={room.imageUrls[0]} alt="" className="w-8 h-8 rounded object-cover" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-200 max-w-[120px] truncate">{room.title}</span>
              <button
                onClick={() => remove(room.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {rooms.length < 3 && (
            <div className="flex items-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg px-4 py-1.5 shrink-0">
              <span className="text-xs text-gray-400">+ Thêm phòng</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clear}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1"
          >
            Xóa tất cả
          </button>
          <button
            onClick={() => navigate('/compare')}
            disabled={rooms.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            So sánh
          </button>
        </div>
      </div>
    </div>
  );
}
