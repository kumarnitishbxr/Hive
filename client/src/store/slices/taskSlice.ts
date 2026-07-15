import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TaskActivityType {
  _id: string;
  taskId: string;
  userId: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
  };
  actionType: 'StatusChange' | 'Comment' | 'Approval' | 'Rejection' | 'RequestChanges';
  comment?: string;
  attachmentUrl?: string;
  details?: string;
  createdAt: string;
}

export interface WorkforceTaskType {
  _id: string;
  workspaceId: string;
  projectId: {
    _id: string;
    name: string;
  };
  title: string;
  description?: string;
  status: 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Not Started' | 'Under Review' | 'Completed' | 'Rejected' | 'Blocked' | 'Need Help';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignees: string[];
  assignedTo?: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  assignedBy?: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
  };
  reporter: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  reviewFeedback?: string;
  attachments: {
    name: string;
    url: string;
    uploadedBy: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  myTasks: WorkforceTaskType[];
  activities: Record<string, TaskActivityType[]>; // taskId -> activities list
  isLoading: boolean;
}

const initialState: TaskState = {
  myTasks: [],
  activities: {},
  isLoading: false
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setMyTasksAndActivities: (
      state,
      action: PayloadAction<{ tasks: WorkforceTaskType[]; activities: TaskActivityType[] }>
    ) => {
      state.myTasks = action.payload.tasks;
      
      // Group activities by taskId
      const group: Record<string, TaskActivityType[]> = {};
      for (const act of action.payload.activities) {
        if (!group[act.taskId]) {
          group[act.taskId] = [];
        }
        group[act.taskId].push(act);
      }
      state.activities = group;
    },
    updateTaskLocal: (state, action: PayloadAction<WorkforceTaskType>) => {
      const idx = state.myTasks.findIndex(t => t._id === action.payload._id);
      if (idx !== -1) {
        state.myTasks[idx] = action.payload;
      } else {
        state.myTasks.push(action.payload);
      }
    },
    addTaskActivityLocal: (state, action: PayloadAction<TaskActivityType>) => {
      const act = action.payload;
      if (!state.activities[act.taskId]) {
        state.activities[act.taskId] = [];
      }
      // Avoid duplicate logs
      if (!state.activities[act.taskId].some(a => a._id === act._id)) {
        state.activities[act.taskId].unshift(act);
      }
    },
    setTaskLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const { 
  setMyTasksAndActivities, 
  updateTaskLocal, 
  addTaskActivityLocal, 
  setTaskLoading 
} = taskSlice.actions;

export default taskSlice.reducer;
