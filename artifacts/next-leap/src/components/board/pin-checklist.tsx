import React from 'react';
import { Check, X } from 'lucide-react';
import {
  NlPin,
  NlTask,
  useUpdateLeapPinTask,
  useDeleteLeapPinTask,
  getGetLeapBoardQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

/** Keep-style tick list hanging off one pin. */
export const PinChecklist = ({
  token,
  pin,
  tasks,
  onBlocked,
}: {
  token: string;
  pin: NlPin;
  tasks: NlTask[];
  onBlocked: () => void;
}) => {
  const queryClient = useQueryClient();
  const updateTask = useUpdateLeapPinTask();
  const deleteTask = useDeleteLeapPinTask();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });

  if (tasks.length === 0) return null;
  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="bg-card border border-border rounded-[20px] p-5">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Checklist
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          {doneCount}/{tasks.length}
        </span>
      </div>
      <div>
        {tasks.map(task => (
          <div key={task.id} className="group flex items-center gap-3 py-2">
            <button
              onClick={() =>
                updateTask.mutate(
                  { token, pinId: pin.id, taskId: task.id, data: { done: !task.done } },
                  { onSuccess: invalidate, onError: onBlocked },
                )
              }
              className={`w-[22px] h-[22px] shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.done
                  ? 'bg-[#10B981] border-[#10B981] text-white'
                  : 'border-border hover:border-[#10B981]'
              }`}
              aria-label={task.done ? 'Mark not done' : 'Mark done'}
            >
              {task.done && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>
            <span
              className={`flex-1 font-sans text-[15px] leading-snug ${
                task.done ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {task.label}
            </span>
            <button
              onClick={() =>
                deleteTask.mutate(
                  { token, pinId: pin.id, taskId: task.id },
                  { onSuccess: invalidate, onError: onBlocked },
                )
              }
              className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1.5 text-muted-foreground hover:text-[#BE123C] transition-all"
              aria-label="Remove task"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
