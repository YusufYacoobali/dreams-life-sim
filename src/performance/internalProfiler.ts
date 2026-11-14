import { isCommandProfilingEnabled } from '../access/buildAccess';
import { createPerformanceRecorder } from './recorder';

export const commandProfiler = createPerformanceRecorder(isCommandProfilingEnabled);
